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
  MethodDeclaration,
  NormalClassDeclaration,
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
  Object,
  Class,
  ResInstr,
  DerefInstr,
} from "./types";
import { 
  defaultValues,
  evaluateBinaryExpression,
  getConstructors,
  getInstanceFields,
  getInstanceMethods,
  getDescriptor,
  getStaticFields,
  getStaticMethods,
  handleSequence,
  prependInstanceFieldsInit,
  isNode,
  isQualified,
  makeMtdInvSimpleIdentifierQualified,
  appendOrReplaceReturn,
  appendEmtpyReturn,
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
  
  NormalClassDeclaration: (
    command: NormalClassDeclaration,
    context: Context,
    control: Control,
    stash: Stash,
  ) => {
    const className = command.typeIdentifier;

    const instanceFields = getInstanceFields(command);
    const instanceMethods = getInstanceMethods(command);
    // Make MethodInvocation simple Identifier qualified to facilitate MethodInvocation evaluation.
    instanceMethods.forEach(m => makeMtdInvSimpleIdentifierQualified(m, className));
    instanceMethods.forEach(m => appendEmtpyReturn(m));

    const staticFields = getStaticFields(command);
    const staticMethods = getStaticMethods(command);
    // Make MethodInvocation simple Identifier qualified to facilitate MethodInvocation evaluation.
    staticMethods.forEach(m => makeMtdInvSimpleIdentifierQualified(m, className));
    staticMethods.forEach(m => appendEmtpyReturn(m));

    const constructors = getConstructors(command);
    // Insert default constructor if not overriden.
    if (!constructors.find(c => c.constructorDeclarator.formalParameterList.length === 0)) {
      const defaultConstructor = node.defaultConstructorDeclNode(className);
      constructors.push(defaultConstructor);
    }
    // Prepend instance fields initialization at start of constructor body.
    constructors.forEach(c => prependInstanceFieldsInit(c, instanceFields));
    // Append ReturnStatement with this keyword at end of constructor body.
    constructors.forEach(c => appendOrReplaceReturn(c));

    const c = {
      kind: "Class",
      // frame to be set after extending env.
      constructors: constructors,
      instanceFields,
      instanceMethods,
      staticFields,
      staticMethods,
    } as Class;

    // To restore current (global) env for next NormalClassDeclarations evaluation.
    control.push(instr.envInstr(context.environment.current, command));
    
    context.environment.defineClass(className, c);
    context.environment.extendEnv(context.environment.current, className);
    context.environment.getClass(className).frame = context.environment.current;

    control.push(...handleSequence(instanceMethods));
    control.push(...handleSequence(staticMethods));
    control.push(...handleSequence(constructors));
    control.push(...handleSequence(staticFields));
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
    control.push(instr.derefInstr(command));
    control.push(instr.evalVarInstr(command.name, command));
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
    const value = stash.pop()! as Literal | Object;
    const variable = stash.pop()! as Variable;
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
    if (isQualified(command.symbol)) {
      const nameParts = command.symbol.split(".");
      const name = nameParts.splice(0, nameParts.length - 1).join(".");
      const identifier = nameParts[nameParts.length - 1];
      control.push(instr.resInstr(identifier, command.srcNode));
      control.push(instr.evalVarInstr(name, command.srcNode));
      return;
    }
    stash.push(context.environment.getVariable(command.symbol));
  },

  [InstrType.RES]: (
    command: ResInstr,
    context: Context,
    control: Control,
    stash: Stash,
  ) => {
    // TODO throw NullPointerException if instance field but instance is null
    const varOrClass = stash.pop()! as Variable | Class;
    console.assert(varOrClass.kind !== "Variable" || varOrClass.value.kind === "Object");
    const v = varOrClass.kind === "Variable"
      ? (varOrClass.value as Object).frame.getVariable(command.name)
      : /*varOrClass.kind === "Class" ?*/ varOrClass.frame.getVariable(command.name);
    stash.push(v);
  },

  [InstrType.DEREF]: (
    command: DerefInstr,
    context: Context,
    control: Control,
    stash: Stash,
  ) => {
    const variable = stash.pop()! as Variable;
    stash.push(variable.value as Literal | Object);
  },
};
