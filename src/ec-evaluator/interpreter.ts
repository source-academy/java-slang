import { 
  Assignment,
  BinaryExpression,
  Block,
  Expression,
  ExpressionName,
  ExpressionStatement,
  Literal,
  LocalVariableDeclarationStatement,
  LocalVariableType,
  MethodInvocation,
  ReturnStatement,
  VariableDeclarator,
  Void,
} from "../ast/types/blocks-and-statements";
import {
  ConstructorDeclaration,
  FieldDeclaration,
  FormalParameter,
  Identifier,
  MethodBody,
  MethodDeclaration,
  UnannType,
} from "../ast/types/classes";
import { CompilationUnit } from "../ast/types/packages-and-modules";
import { Control, Stash } from "./components";
import { STEP_LIMIT } from "./constants";
import * as instr from './instrCreator';
import * as node from './nodeCreator';
import {
  ControlItem,
  AssmtInstr,
  BinOpInstr,
  Context,
  Instr,
  InstrType,
  InvInstr,
  Closure,
  EnvInstr,
  ResetInstr,
  EvalVarInstr,
  Variable,
  VarValue,
} from "./types";
import { 
  defaultValues,
  evaluateBinaryExpression,
  getDescriptor,
  handleSequence,
  isNode,
} from "./utils";

type CmdEvaluator = (
  command: ControlItem,
  context: Context,
  control: Control,
  stash: Stash,
) => void

export const evaluate = (context: Context, targetStep: number = STEP_LIMIT): VarValue => {
  const control = context.control;
  const stash = context.stash;

  let step = 1;

  let command = control.peek();
  
  while (command) {
    if (step === targetStep) {
      return stash.peek();
    }

    control.pop();
    if (isNode(command)) {
      cmdEvaluators[command.kind](command, context, control, stash);
    } else {
      cmdEvaluators[command.instrType](command, context, control, stash);
    }

    command = control.peek();
    step += 1;
  }

  context.totalSteps = step;
  return stash.peek();
}

const cmdEvaluators: { [type: string]: CmdEvaluator } = {
  CompilationUnit: (
    command: CompilationUnit,
    context: Context,
    control: Control,
    stash: Stash,
  ) => {
    // TODO eval class declarations
    control.push(node.mainMtdInvExpStmtNode());
    control.push(...handleSequence(command.topLevelClassOrInterfaceDeclarations[0].classBody));
  },

  Block: (
    command: Block,
    context: Context,
    control: Control,
    stash: Stash,
  ) => {
    // Save current environment before extending.
    control.push(instr.envInstr(context.environment.current, command));
    control.push(...handleSequence(command.blockStatements));

    context.environment.extendEnv(context.environment.current, "block");
  },

  ConstructorDeclaration: (
    command: ConstructorDeclaration,
    context: Context,
    control: Control,
    stash: Stash,
  ) => {
    // Use constructor descriptor as key.
    const conDescriptor: string = getDescriptor(command);
    const conClosure = {
      kind: "Closure",
      mtdOrCon: command,
      env: context.environment.current,
    } as Closure;
    context.environment.defineMtdOrCon(conDescriptor, conClosure);
  },

  MethodDeclaration: (
    command: MethodDeclaration,
    context: Context,
    control: Control,
    stash: Stash,
  ) => {
    // Add empty ReturnStatement if absent
    const methodBody: MethodBody = command.methodBody;
    if (methodBody.blockStatements.length === 0 ||
      // TODO deep search
      methodBody.blockStatements.filter(stmt => stmt.kind === "ReturnStatement").length === 0) {
      methodBody.blockStatements.push(node.emptyReturnStmtNode());
    }
    
    // Use method descriptor as key.
    const mtdDescriptor: string = getDescriptor(command);
    const mtdClosure = {
      kind: "Closure",
      mtdOrCon: command,
      env: context.environment.current,
    } as Closure;
    context.environment.defineMtdOrCon(mtdDescriptor, mtdClosure);
  },

  FieldDeclaration: (
    command: FieldDeclaration,
    context: Context,
    control: Control,
    stash: Stash,
  ) => {
    // FieldDeclaration to be evaluated are always static fields.
    // Instance fields are transformed into Assignment ExpressionStatement inserted into constructors.

    const type: UnannType = command.fieldType;
    const declaration: VariableDeclarator = command.variableDeclaratorList[0];
    const id: Identifier = declaration.variableDeclaratorId;
    // Fields are always initialized to default value if initializer is absent.
    const init: Expression = declaration?.variableInitializer || defaultValues.get(type)!;
    
    context.environment.declareVariable(id);

    control.push(instr.popInstr(command));
    control.push(instr.assmtInstr(command));
    control.push(init);
    control.push(instr.evalVarInstr(id, command));
  },

  LocalVariableDeclarationStatement: (
    command: LocalVariableDeclarationStatement,
    context: Context,
    control: Control,
    stash: Stash,
  ) => {
    const type: LocalVariableType = command.localVariableType;
    const declaration: VariableDeclarator = command.variableDeclaratorList[0];
    const id: Identifier = declaration.variableDeclaratorId;

    // Break down LocalVariableDeclarationStatement with VariableInitializer into
    // LocalVariableDeclarationStatement without VariableInitializer and Assignment.
    const init: Expression | undefined = declaration?.variableInitializer;
    if (init) {
      control.push(node.expStmtAssmtNode(id, init));
      control.push(node.localVarDeclNoInitNode(type, id));
      return;
    }

    // Evaluating LocalVariableDeclarationStatement just declares the variable.
    context.environment.declareVariable(id);
  },

  ExpressionStatement: (
    command: ExpressionStatement,
    context: Context,
    control: Control,
    stash: Stash,
  ) => {
    control.push(instr.popInstr(command));
    control.push(command.stmtExp);
  },

  ReturnStatement: (
    command: ReturnStatement,
    context: Context,
    control: Control,
    stash: Stash,
  ) => {
    control.push(instr.resetInstr(command));
    control.push(command.exp);
  },

  Assignment: (
    command: Assignment,
    context: Context,
    control: Control,
    stash: Stash,
  ) => {
    control.push(instr.assmtInstr(command));
    control.push(command.right);
    control.push(instr.evalVarInstr(command.left.name, command));
  },
  
  MethodInvocation: (
    command: MethodInvocation,
    context: Context,
    control: Control,
    stash: Stash,
  ) => {
    control.push(instr.invInstr(command.argumentList.length, command));
    control.push(...handleSequence(command.argumentList));
    control.push(command.identifier);
  },

  Literal: (
    command: Literal,
    context: Context,
    control: Control,
    stash: Stash,
  ) => {
    stash.push(command);
  },

  Void: (
    command: Void,
    context: Context,
    control: Control,
    stash: Stash,
  ) => {
    stash.push(command);
  },

  ExpressionName: (
    command: ExpressionName,
    context: Context,
    control: Control,
    stash: Stash,
  ) => {
    // TODO add DEREF instr and standardize ExpressionName eval to Variable
    const value: VarValue = context.environment.getValue(command.name);
    stash.push(value);
  },


  BinaryExpression: (
    command: BinaryExpression,
    context: Context,
    control: Control,
    stash: Stash
  ) => {
    control.push(instr.binOpInstr(command.operator, command));
    control.push(command.right);
    control.push(command.left);
  },

  [InstrType.POP]: (
    command: Instr,
    context: Context,
    control: Control,
    stash: Stash,
  ) => {
    stash.pop();
  },
  
  [InstrType.ASSIGNMENT]: (
    command: AssmtInstr,
    context: Context,
    control: Control,
    stash: Stash,
  ) => {
    // value is popped before variable becuase value is evaluated later than variable.
    const value: VarValue = stash.pop()! as Literal;
    const variable: Variable = stash.pop()! as Variable;
    variable.value = value;
    stash.push(value);
  },

  [InstrType.BINARY_OP]: (
    command: BinOpInstr,
    context: Context,
    control: Control,
    stash: Stash,
  ) => {
    const right = stash.pop()! as Literal;
    const left = stash.pop()! as Literal;
    stash.push(evaluateBinaryExpression(command.symbol, left, right));
  },

  [InstrType.INVOCATION]: (
    command: InvInstr,
    context: Context,
    control: Control,
    stash: Stash,
    ) => {
    // Save current environment to be restored after method returns.
    control.push(instr.envInstr(context.environment.current, command.srcNode));

    // Mark end of method in case method returns halfway.
    control.push(instr.markerInstr(command.srcNode));

    // Retrieve arguments and method to be invoked in reversed order.
    const args: Literal[] = [];
    for (let i = 0; i < command.arity; i++) {
      args.push(stash.pop()! as Literal);
    }
    args.reverse();
    const closure: Closure = stash.pop()! as Closure;

    // Extend method's environment by binding arguments to corresponding parameters.
    context.environment.extendEnv(closure.env, closure.method.methodHeader.identifier);
    const params: FormalParameter[] = closure.method.methodHeader.formalParameterList;
    params.forEach(param => {
      context.environment.declareVariable(param.identifier);
    });
    for (let i = 0; i < command.arity; i++) {
      context.environment.defineVariable(params[i].identifier, args[i]);
    }

    // Push method body
    control.push(closure.method.methodBody);
  },

  [InstrType.ENV]: (
    command: EnvInstr,
    context: Context,
    control: Control,
    stash: Stash, 
  ) => {
    context.environment.restoreEnv(command.env);
  },

  [InstrType.RESET]: (
    command: ResetInstr,
    context: Context,
    control: Control,
    stash: Stash, 
  ) => {
    // Continue popping ControlItem until Marker is found.
    const next: ControlItem | undefined = control.pop();
    if (next && (isNode(next) || next.instrType !== InstrType.MARKER)) {
      control.push(instr.resetInstr(command.srcNode));
    }
  },

  [InstrType.EVAL_VAR]: (
    command: EvalVarInstr,
    context: Context,
    control: Control,
    stash: Stash,
  ) => {
    stash.push(context.environment.getVariable(command.symbol));
  },
};
