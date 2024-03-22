import { cloneDeep } from "lodash";

import { 
  Assignment,
  BinaryExpression,
  Block,
  ClassInstanceCreationExpression,
  ExplicitConstructorInvocation,
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
import { Control, EnvNode, Stash } from "./components";
import { STEP_LIMIT } from "./constants";
import * as errors from "./errors";
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
  NewInstr,
  Object,
  Class,
  ResTypeInstr,
  ResOverloadInstr,
  StashItem,
  ResInstr,
  DerefInstr,
  Type,
  ResConOverloadInstr,
  ResOverrideInstr,
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
  isInstance,
  appendOrReplaceReturn,
  appendEmtpyReturn,
  searchMainMtdClass,
  prependExpConInvIfNeeded,
  isStatic,
  resOverload,
  resOverride,
  resConOverload,
} from "./utils";
// import { astToString } from "../ast/utils/utils";

type CmdEvaluator = (
  command: ControlItem,
  context: Context,
  control: Control,
  stash: Stash,
) => void

/**
 * Evaluate program in context within limited number of steps.
 * @throws {errors.RuntimeError} Throw error if program is semantically invalid.
 */
export const evaluate = (context: Context, targetStep: number = STEP_LIMIT): StashItem | undefined => {
  const control = context.control;
  const stash = context.stash;

  context.totalSteps = 1;

  let command = control.peek();
  
  while (command) {
    if (context.totalSteps === targetStep) {
      return stash.peek();
    }

    control.pop();
    // console.log(isNode(command) ? astToString(command) : command.instrType)
    if (isNode(command)) {
      cmdEvaluators[command.kind](command, context, control, stash);
    } else {
      cmdEvaluators[command.instrType](command, context, control, stash);
    }
    // console.log("env", context.environment.current);
    // console.log("control", control.getStack())
    // console.log("stash", stash.getStack())

    command = control.peek();
    context.totalSteps += 1;
  }

  return stash.peek();
}

const cmdEvaluators: { [type: string]: CmdEvaluator } = {
  CompilationUnit: (
    command: CompilationUnit,
    context: Context,
    control: Control,
    stash: Stash,
  ) => {
    // Get first class that defines the main method according to program order.
    const className = searchMainMtdClass(command.topLevelClassOrInterfaceDeclarations);
    if (!className) {
      throw new errors.NoMainMtdError();
    }

    control.push(node.mainMtdInvExpStmtNode(className));
    control.push(...handleSequence(command.topLevelClassOrInterfaceDeclarations));
    control.push(node.objClassDeclNode());
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
      const defaultConstructor = node.defaultConstructorDeclNode(className, command);
      constructors.push(defaultConstructor);
    }
    // Prepend instance fields initialization at start of constructor body.
    constructors.forEach(c => prependInstanceFieldsInit(c, instanceFields));
    // Prepend super() if needed before instance fields initialization.
    constructors.forEach(c => prependExpConInvIfNeeded(c, command));
    // Append ReturnStatement with this keyword at end of constructor body.
    constructors.forEach(c => appendOrReplaceReturn(c));

    // To restore current (global) env for next NormalClassDeclarations evaluation.
    control.push(instr.envInstr(context.environment.current, command));
    
    // TODO why NormalClassDeclaration node not modified?
    let superclass: Class | undefined = undefined;
    let fromEnv: EnvNode;
    if (className === "Object") {
      fromEnv = context.environment.global;
    } else {
      // Class that doesn't explicitly inherit another class implicitly inherit Object.
      const superclassName = command.sclass = command.sclass ?? "Object";
      superclass = context.environment.getClass(superclassName);
      fromEnv = superclass.frame;
    }
    context.environment.extendEnv(fromEnv, className);

    const c = {
      kind: "Class",
      frame: context.environment.current,
      constructors: constructors,
      instanceFields,
      instanceMethods,
      staticFields,
      staticMethods,
      superclass,
    } as Class;
    context.environment.defineClass(className, c);

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
    const init = (declaration?.variableInitializer ||
      defaultValues.get(type) ||
      node.nullLitNode(command)) as Expression;
    
    context.environment.declareVariable(id, type);

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
    const init: Expression | undefined = declaration?.variableInitializer as Expression;
    if (init) {
      control.push(node.expStmtAssmtNode(id, init, command));
      control.push(node.localVarDeclNoInitNode(type, id, command));
      return;
    }

    // Evaluating LocalVariableDeclarationStatement just declares the variable.
    context.environment.declareVariable(id, type);
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
    control.push(instr.evalVarInstr((command.left as ExpressionName).name, command));
  },
  
  MethodInvocation: (
    command: MethodInvocation,
    context: Context,
    control: Control,
    stash: Stash,
  ) => {
    // TODO can only handle MethodInvocation Identifier with two parts
    const nameParts = command.identifier.split(".");
    const target = nameParts[0];
    const identifier = nameParts[1];
    
    // Arity may be incremented by 1 if the resolved method to be invoked is an instance method.
    control.push(instr.invInstr(command.argumentList.length, command));
    control.push(...handleSequence(command.argumentList));
    control.push(instr.resOverrideInstr(command));
    control.push(node.exprNameNode(target, command));
    control.push(instr.resOverloadInstr(identifier, command.argumentList.length, command));
    // TODO: only Integer and ExpressionName are allowed as args
    control.push(...handleSequence(command.argumentList.map(a => instr.resTypeInstr(a, command))));
    control.push(instr.resTypeInstr(node.exprNameNode(target, command), command));
  },

  ClassInstanceCreationExpression: (
    command: ClassInstanceCreationExpression,
    context: Context,
    control: Control,
    stash: Stash,
  ) => {
    const c: Class = context.environment.getClass(command.identifier);

    control.push(instr.invInstr(command.argumentList.length + 1, command));
    control.push(...handleSequence(command.argumentList));
    control.push(instr.newInstr(c, command))
    control.push(instr.resConOverloadInstr(command.argumentList.length, command));
    control.push(...handleSequence(command.argumentList.map(a => instr.resTypeInstr(a, command))));
    control.push(instr.resTypeInstr(c, command));
  },

  ExplicitConstructorInvocation: (
    command: ExplicitConstructorInvocation,
    context: Context,
    control: Control,
    stash: Stash,
  ) => {
    control.push(instr.popInstr(command));
    control.push(instr.invInstr(command.argumentList.length + 1, command));
    control.push(...handleSequence(command.argumentList));
    control.push(node.exprNameNode(command.thisOrSuper, command));
    control.push(instr.resConOverloadInstr(command.argumentList.length, command));
    control.push(...handleSequence(command.argumentList.map(a => instr.resTypeInstr(a, command))));
    control.push(instr.resTypeInstr(node.exprNameNode(command.thisOrSuper, command), command));
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

    // Retrieve method/constructor to be invoked and args in reversed order.
    const args: (Literal | Object)[] = [];
    for (let i = 0; i < command.arity; i++) {
      args.push(stash.pop()! as Literal | Object);
    }
    args.reverse();
    const closure: Closure = stash.pop()! as Closure;

    const params: FormalParameter[] = closure.mtdOrCon.kind === "MethodDeclaration"
      ? cloneDeep(closure.mtdOrCon.methodHeader.formalParameterList)
      : cloneDeep(closure.mtdOrCon.constructorDeclarator.formalParameterList);

    // Extend method/constructor's environment.
    const isInstanceMtdOrCon = args.length == params.length + 1;
    const mtdOrConDescriptor = getDescriptor(closure.mtdOrCon);
    if (isInstanceMtdOrCon) {
      // Throw NullPointerException if method to be invoked is instance method/constructor
      // but instance is null.
      if (args[0].kind === "Literal" && args[0].literalType.kind === "NullLiteral") {
        throw new errors.NullPointerException();
      }

      // Extend env from obj frame.
      context.environment.extendEnv((args[0] as Object).frame, mtdOrConDescriptor);

      // Append implicit FormalParameter and arg super if needed.
      if (closure.env.parent.name !== "global") {
        params.unshift(
          {
            kind: "FormalParameter",
            unannType: closure.env.parent.name,
            identifier: "super",
          },
        );
        args.unshift(args[0]);
      }

      // Append implicit FormalParameter this.
      params.unshift(
        {
          kind: "FormalParameter",
          unannType: closure.env.name,
          identifier: "this",
        },
      );
    } else {
      // Extend env from class frame.
      context.environment.extendEnv(closure.env, mtdOrConDescriptor);
    }

    // Bind arguments to corresponding FormalParameters.
    for (let i = 0; i < args.length; i++) {
      context.environment.defineVariable(params[i].identifier, params[i].unannType, args[i]);
    }

    // Push method/constructor body.
    const body = closure.mtdOrCon.kind === "MethodDeclaration"
      ? closure.mtdOrCon.methodBody
      : closure.mtdOrCon.constructorBody;
    control.push(body);
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
    const varOrClass = stash.pop()! as Variable | Class;
    const value = varOrClass.kind === "Class" ? varOrClass : varOrClass.value as Literal | Object;
    stash.push(value);
  },

  [InstrType.NEW]: (
    command: NewInstr,
    context: Context,
    control: Control,
    stash: Stash,
  ) => {
    // To be restore after extending curr env to declare instance fields in obj frame.
    const currEnv = context.environment.current;
    context.environment.extendEnv(command.c.frame, "object");

    // Declare declared and inherited instance fields.
    let currClass: Class | undefined = command.c;
    while (currClass) {
      currClass.instanceFields.forEach(i => {
        const id = i.variableDeclaratorList[0].variableDeclaratorId;
        const type = i.fieldType;
        context.environment.declareVariable(id, type);
      });
      currClass = currClass.superclass;
    }

    // Push obj on stash.
    const obj = {
      kind: "Object",
      frame: context.environment.current,
    } as Object;
    stash.push(obj);

    // Restore env.
    context.environment.restoreEnv(currEnv);
  },

  [InstrType.RES_TYPE]: (
    command: ResTypeInstr,
    context: Context,
    control: Control,
    stash: Stash,
  ) => {
    // TODO need to handle all type of arg expressions
    const value: Expression | Class = command.value;

    // TODO cleaner way to do this?
    let type: UnannType;
    if (value.kind === "Literal") {
      if (value.literalType.kind === "DecimalIntegerLiteral") {
        type = "int";
      } else if (value.literalType.kind === "StringLiteral") {
        // TODO remove hardcoding
        type = "String[]";
      }
    } else if (value.kind === "ExpressionName") {
      const v = context.environment.getName(value.name);
      if (v.kind === "Variable") {
        if (v.value.kind === "Literal") {
          type = "int";
        } else if (v.value.kind === "Object") {
          // Type of object is name of parent frame
          type = v.type;
        }
      } else /*if (v.kind === "Class")*/ {
        type = v.frame.name;
      }
    } else if (value.kind === "Class") {
      type = value.frame.name;
    }
    
    stash.push({
      kind: "Type",
      type: type!,
    } as Type);
  },

  [InstrType.RES_OVERLOAD]: (
    command: ResOverloadInstr,
    context: Context,
    control: Control,
    stash: Stash,
  ) => {
    // Retrieve arg types in reversed order for method overloading resolution.
    const argTypes: Type[] = [];
    for (let i = 0; i < command.arity; i++) {
      argTypes.push(stash.pop()! as Type);
    }
    argTypes.reverse();

    // Retrieve target type for method overloading resolution.
    const targetType: Type = stash.pop()! as Type;
    const classToSearchIn: Class = context.environment.getClass(targetType.type);

    // Method overloading resolution.
    const classStore: EnvNode = context.environment.global;
    const closure: Closure = resOverload(classToSearchIn, command.name, argTypes, classStore);
    stash.push(closure);

    // Post-processing required if overload resolved method is instance method.
    if (isInstance(closure.mtdOrCon as MethodDeclaration)) {
      // Increment arity of InvInstr on control.
      let n = 1;
      while (control.peekN(n) && (isNode(control.peekN(n)!) || (control.peekN(n)! as Instr).instrType !== InstrType.INVOCATION)) {
        n++;
      }
      (control.peekN(n)! as ResOverloadInstr).arity++;
    };
  },

  [InstrType.RES_OVERRIDE]: (
    command: ResOverrideInstr,
    context: Context,
    control: Control,
    stash: Stash,
  ) => {
    const target = stash.pop()! as Object | Class;
    const overloadResolvedClosure = stash.pop()! as Closure;

    if (isStatic(overloadResolvedClosure.mtdOrCon as MethodDeclaration)) {
      // No method overriding resolution is required if resolved method is a static method.
      stash.push(overloadResolvedClosure);
      return;
    }

    // Retrieve class to search in for method overriding resolution.
    const classToSearchIn: Class = context.environment.getClass(target.frame.parent.name);

    // Method overriding resolution.
    const overrideResolvedClosure: Closure = resOverride(classToSearchIn, overloadResolvedClosure);
    stash.push(overrideResolvedClosure);

    // Push target as implicit FormalParameter this.
    stash.push(target);
  },

  [InstrType.RES_CON_OVERLOAD]: (
    command: ResConOverloadInstr,
    context: Context,
    control: Control,
    stash: Stash,
  ) => {
    // Retrieve arg types in reversed order for constructor resolution.
    const argTypes: Type[] = [];
    for (let i = 0; i < command.arity; i++) {
      argTypes.push(stash.pop()! as Type);
    }
    argTypes.reverse();

    // Retrieve class to search in for method resolution.
    const className: Identifier = (stash.pop()! as Type).type;
    const classToSearchIn: Class = context.environment.getClass(className);

    // Constructor overloading resolution.
    const closure: Closure = resConOverload(classToSearchIn, className, argTypes);
    stash.push(closure);

    // No post-processing required for constructor.
  },
};
