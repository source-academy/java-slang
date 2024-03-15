import { Node } from "../ast/types/ast";
import {
  BlockStatement,
  DecimalIntegerLiteral,
  Expression,
  ExpressionStatement,
  Literal,
  MethodInvocation,
  ReturnStatement,
} from "../ast/types/blocks-and-statements";
import {
  ConstructorDeclaration,
  FieldDeclaration,
  Identifier,
  MethodDeclaration,
  NormalClassDeclaration,
  UnannType,
} from "../ast/types/classes";
import { EnvNode } from "./components";
import * as errors from "./errors";
import {
  emptyReturnStmtNode,
  expConInvNode,
  expStmtAssmtNode,
  exprNameNode,
  nullLitNode,
  returnThisStmtNode,
} from "./nodeCreator";
import { ControlItem, Context, Instr, Class, Type, Closure } from "./types";

/**
 * Stack is implemented for agenda and stash registers.
 */
interface IStack<T> {
  push(...items: T[]): void
  pop(): T | undefined
  peek(): T | undefined
  size(): number
  isEmpty(): boolean
  getStack(): T[]
}

export class Stack<T> implements IStack<T> {
  // Bottom of the array is at index 0
  private storage: T[] = []

  public push(...items: T[]): void {
    for (const item of items) {
      this.storage.push(item);
    }
  }

  public pop(): T | undefined {
    return this.storage.pop()
  }

  public peek(): T | undefined {
    if (this.isEmpty()) {
      return undefined
    }
    return this.storage[this.size() - 1]
  }

  public peekN(n: number): T | undefined {
    if (this.isEmpty()) {
      return undefined
    }
    return this.storage[this.size() - n]
  }

  public size(): number {
    return this.storage.length
  }

  public isEmpty(): boolean {
    return this.size() == 0
  }

  public getStack(): T[] {
    // return a copy of the stack's contents
    return [...this.storage]
  }
}

/**
 * Typeguard for Instr to distinguish between program statements and instructions.
 *
 * @param command An ControlItem
 * @returns true if the ControlItem is an instruction and false otherwise.
 */
export const isInstr = (command: ControlItem): command is Instr => {
  return (command as Instr).instrType !== undefined
}

/**
 * Typeguard for esNode to distinguish between program statements and instructions.
 *
 * @param command An ControlItem
 * @returns true if the ControlItem is an esNode and false if it is an instruction.
 */
export const isNode = (command: ControlItem): command is Node => {
  return (command as Node).kind !== undefined
}

/**
 * A helper function for handling sequences of statements.
 * Statements must be pushed in reverse order, and each statement is separated by a pop
 * instruction so that only the result of the last statement remains on stash.
 * Value producing statements have an extra pop instruction.
 *
 * @param seq Array of statements.
 * @returns Array of commands to be pushed into agenda.
 */
export const handleSequence = (seq: ControlItem[]): ControlItem[] => {
  const result: ControlItem[] = []
  for (const command of seq) {
    result.push(command)
  }
  // Push statements in reverse order
  return result.reverse()
}

/**
 * Errors
 */
export const handleRuntimeError = (context: Context, error: errors.RuntimeError) => {
  context.errors.push(error);
  throw error;
}

/**
 * Binary Expressions
 */
export const evaluateBinaryExpression = (operator: string, left: Literal, right: Literal): Literal => {
  switch (operator) {
    case "+":
      return {
        kind: "Literal",
        literalType: {
          kind: left.literalType.kind,
          value: String(Number(left.literalType.value) + Number(right.literalType.value)),
        } as DecimalIntegerLiteral,
      };
    case "-":
      return {
        kind: "Literal",
        literalType: {
          kind: left.literalType.kind,
          value: String(Number(left.literalType.value) - Number(right.literalType.value)),
        } as DecimalIntegerLiteral,
      };
    case "*":
      return {
        kind: "Literal",
        literalType: {
          kind: left.literalType.kind,
          value: String(Number(left.literalType.value) * Number(right.literalType.value)),
        } as DecimalIntegerLiteral,
      };
    case "/":
      return {
        kind: "Literal",
        literalType: {
          kind: left.literalType.kind,
          value: String(Number(left.literalType.value) / Number(right.literalType.value)),
        } as DecimalIntegerLiteral,
      };
    default /* case "%" */:
      return {
        kind: "Literal",
        literalType: {
          kind: left.literalType.kind,
          value: String(Number(left.literalType.value) % Number(right.literalType.value)),
        } as DecimalIntegerLiteral,
      };
  }
}

/**
 * Default values.
 */
export const defaultValues = new Map<UnannType, Literal>([
  ["int", {
    kind: "Literal",
    literalType: {
      kind: "DecimalIntegerLiteral",
      value: "0",
    },
  }],
]);

/**
 * Name
 */
export const getDescriptor = (mtdOrCon: MethodDeclaration | ConstructorDeclaration): string => {
  return mtdOrCon.kind === "MethodDeclaration"
    ? `${mtdOrCon.methodHeader.identifier}(${mtdOrCon.methodHeader.formalParameterList.map(p => p.unannType).join(",")})${mtdOrCon.methodHeader.result}`
    : `${mtdOrCon.constructorDeclarator.identifier}(${mtdOrCon.constructorDeclarator.formalParameterList.map(p => p.unannType).join(",")})`;
}

export const isQualified = (name: string) => {
  return name.includes(".");
}

/**
 * Class
 */
export const getInstanceFields = (c: NormalClassDeclaration): FieldDeclaration[] => {
  return c.classBody.filter(m => m.kind === "FieldDeclaration" && !isStatic(m)) as FieldDeclaration[];
}

export const getInstanceMethods = (c: NormalClassDeclaration): MethodDeclaration[] => {
  return c.classBody.filter(m => m.kind === "MethodDeclaration" && !isStatic(m)) as MethodDeclaration[];
}

export const getStaticFields = (c: NormalClassDeclaration): FieldDeclaration[] => {
  return c.classBody.filter(m => m.kind === "FieldDeclaration" && isStatic(m)) as FieldDeclaration[];
}

export const getStaticMethods = (c: NormalClassDeclaration): MethodDeclaration[] => {
  return c.classBody.filter(m => m.kind === "MethodDeclaration" && isStatic(m)) as MethodDeclaration[];
}

export const getConstructors = (c: NormalClassDeclaration): ConstructorDeclaration[] => {
  return c.classBody.filter(m => m.kind === "ConstructorDeclaration") as ConstructorDeclaration[];
}

export const isStatic = (fieldOrMtd: FieldDeclaration | MethodDeclaration): boolean => {
  return fieldOrMtd.kind === "FieldDeclaration"
    ? fieldOrMtd.fieldModifier.includes("static")
    : fieldOrMtd.methodModifier.includes("static");
}

export const isInstance = (fieldOrMtd: FieldDeclaration | MethodDeclaration): boolean => {
  return !isStatic(fieldOrMtd);
}

const convertFieldDeclToExpStmtAssmt = (fd: FieldDeclaration): ExpressionStatement => {
  const left = `this.${fd.variableDeclaratorList[0].variableDeclaratorId}`;
  // Fields are always initialized to default value if initializer is absent.
  const right = (fd.variableDeclaratorList[0].variableInitializer ||
    defaultValues.get(fd.fieldType) ||
    nullLitNode(fd)) as Expression;
  return expStmtAssmtNode(left, right, fd);
};

export const makeMtdInvSimpleIdentifierQualified = (mtd: MethodDeclaration, className: Identifier) => {
  const qualifier = isStatic(mtd) ? className : "this";

  mtd.methodBody.blockStatements.forEach(blockStatement => {
    // MethodInvocation as ExpressionStatement
    blockStatement.kind === "ExpressionStatement" &&
    blockStatement.stmtExp.kind === "MethodInvocation" &&
    !isQualified(blockStatement.stmtExp.identifier) &&
    (blockStatement.stmtExp.identifier = `${qualifier}.${blockStatement.stmtExp.identifier}`);

    // MethodInvocation as RHS of Assignment ExpressionStatement
    blockStatement.kind === "ExpressionStatement" &&
    blockStatement.stmtExp.kind === "Assignment" &&
    blockStatement.stmtExp.right.kind === "MethodInvocation" &&
    !isQualified(blockStatement.stmtExp.right.identifier) &&
    (blockStatement.stmtExp.right.identifier = `${qualifier}.${blockStatement.stmtExp.right.identifier}`);

    // MethodInvocation as VariableInitializer of LocalVariableDeclarationStatement
    blockStatement.kind === "LocalVariableDeclarationStatement" &&
    blockStatement.variableDeclaratorList[0].variableInitializer &&
    (blockStatement.variableDeclaratorList[0].variableInitializer as Expression).kind === "MethodInvocation" &&
    !isQualified((blockStatement.variableDeclaratorList[0].variableInitializer as MethodInvocation).identifier) &&
    ((blockStatement.variableDeclaratorList[0].variableInitializer as MethodInvocation).identifier = `${qualifier}.${(blockStatement.variableDeclaratorList[0].variableInitializer as MethodInvocation).identifier}`);
  });
}

export const prependExpConInvIfNeeded = (
  constructor: ConstructorDeclaration,
  c: NormalClassDeclaration,
): void => {
  const conBodyBlockStmts = constructor.constructorBody.blockStatements;
  if (c.sclass && !conBodyBlockStmts.some(s => s.kind === "ExplicitConstructorInvocation")) {
    conBodyBlockStmts.unshift(expConInvNode(constructor));
  }
}

export const prependInstanceFieldsInit = (
  constructor: ConstructorDeclaration,
  instanceFields: FieldDeclaration[],
): void => {
  const expStmtAssmts = instanceFields.map(f => convertFieldDeclToExpStmtAssmt(f));
  constructor.constructorBody.blockStatements.unshift(...expStmtAssmts);
}

export const appendOrReplaceReturn = (
  constructor: ConstructorDeclaration,
): void => {
  let conBodyBlockStmts: BlockStatement[] = constructor.constructorBody.blockStatements;
  // TODO deep search
  let returnStmt = conBodyBlockStmts.find(stmt => stmt.kind === "ReturnStatement" && stmt.exp.kind === "Void");
  if (returnStmt) {
    // Replace empty ReturnStatement with ReturnStatement with this keyword.
    (returnStmt as ReturnStatement).exp = exprNameNode("this", constructor);
  } else {
    // Add ReturnStatement with this keyword.
    conBodyBlockStmts.push(returnThisStmtNode(constructor));
  }
}

export const appendEmtpyReturn = (
  method: MethodDeclaration,
): void => {
  const mtdBodyBlockStmts: BlockStatement[] = method.methodBody.blockStatements;
  // TODO deep search
  if (!mtdBodyBlockStmts.find(stmt => stmt.kind === "ReturnStatement")) {
    // Add empty ReturnStatement if absent.
    mtdBodyBlockStmts.push(emptyReturnStmtNode(method));
  }
}

export const searchMainMtdClass = (classes: NormalClassDeclaration[]) => {
  return classes.find(c =>
    c.classBody.some(d =>
      d.kind === "MethodDeclaration"
      && d.methodModifier.includes("public")
      && d.methodModifier.includes("static")
      && d.methodHeader.result === "void"
      && d.methodHeader.identifier === "main"
      && d.methodHeader.formalParameterList.length === 1
      && d.methodHeader.formalParameterList[0].unannType === "String[]"
      && d.methodHeader.formalParameterList[0].identifier === "args"
  ))?.typeIdentifier;
}

/**
 * Method overloading and overriding resolution.
 */
const isSubtype = (
  subtype: UnannType,
  supertype: UnannType,
  classStore: EnvNode,
): boolean => {
  // TODO handle primitive subtyping relation
  if (subtype === "String[]" || subtype === "int") return true;

  let isSubtype = false;
  
  let subclassSuperclass: Class | undefined = classStore.getClass(subtype).superclass;
  const superclass = classStore.getClass(supertype);
  while (subclassSuperclass) {
    if (subclassSuperclass === superclass) {
      isSubtype = true;
      break;
    }
    subclassSuperclass = subclassSuperclass.superclass;
  }
  
  return isSubtype;
}

export const resOverload = (
  classToSearchIn: Class,
  mtdName: string,
  argTypes: Type[],
  classStore: EnvNode,
): Closure => {
  // Identify potentially applicable methods.
  const appClosures: Closure[] = [];
  for (const [closureName, closure] of classToSearchIn.frame.frame.entries()) {
    // Methods contains parantheses and must have return type.
    if (closureName.includes(mtdName + "(") && closureName[closureName.length - 1] !== ")") {
      const params = ((closure as Closure).mtdOrCon as MethodDeclaration).methodHeader.formalParameterList;
      
      if (argTypes.length != params.length) continue;
      
      let match = true;
      for (let i = 0; i < argTypes.length; i++) {
        match &&= (argTypes[i].type === params[i].unannType
          || isSubtype(argTypes[i].type, params[i].unannType, classStore));
        if (!match) break; // short circuit
      }
      
      match && appClosures.push(closure as Closure);
    }
  }
  
  if (appClosures.length === 0) {
    throw new errors.ResOverloadError(mtdName, argTypes);
  }
  
  if (appClosures.length === 1) {
    return appClosures[0];
  }
  
  // Choose most specific method.
  let mostSpecClosure: Closure = appClosures[0];
  for (const appClosure of appClosures) {
    const mostSpecParams = (mostSpecClosure.mtdOrCon as MethodDeclaration).methodHeader.formalParameterList;
    const params = (appClosure.mtdOrCon as MethodDeclaration).methodHeader.formalParameterList;
    for (let i = 0; i < params.length; i++) {
      if (isSubtype(params[i].unannType, mostSpecParams[i].unannType, classStore)) {
        mostSpecClosure = appClosure;
        break;
      }
    }
  }

  // TODO throw method invocation ambiguous erro

  return mostSpecClosure;
};

export const resOverride = (
  classToSearchIn: Class,
  overloadResolvedClosure: Closure,
): Closure => {
  const overloadResolvedMtd = overloadResolvedClosure.mtdOrCon as MethodDeclaration;
  const name = overloadResolvedMtd.methodHeader.identifier;
  const overloadResolvedClosureParams = overloadResolvedMtd.methodHeader.formalParameterList;

  const closures: Closure[] = [];
  for (const [closureName, closure] of classToSearchIn.frame.frame.entries()) {
    // Methods contains parantheses and must have return type.
    if (closureName.includes(name + "(") && closureName[closureName.length - 1] !== ")") {
      closures.push(closure as Closure);
    }
  }

  let overrideResolvedClosure = overloadResolvedClosure;
  for (const closure of closures) {
    const params = (closure.mtdOrCon as MethodDeclaration).methodHeader.formalParameterList;
      
    if (overloadResolvedClosureParams.length != params.length) continue;
    
    let match = true;
    for (let i = 0; i < overloadResolvedClosureParams.length; i++) {
      match &&= (params[i].unannType === overloadResolvedClosureParams[i].unannType);
      if (!match) break; // short circuit
    }
    
    if (match) {
      overrideResolvedClosure = closure;
      break;
    }
  }

  // TODO is there method overriding resolution failure?

  return overrideResolvedClosure;
};

export const resConOverload = (
  classToSearchIn: Class,
  conName: string,
  argTypes: Type[]
): Closure => {
  const closures: Closure[] = [];
  for (const [closureName, closure] of classToSearchIn.frame.frame.entries()) {
    // Constructors contains parantheses and do not have return type.
    if (closureName.includes(conName + "(") && closureName[closureName.length - 1] === ")") {
      closures.push(closure as Closure);
    }
  }

  let resolved: Closure | undefined;
  for (const closure of closures) {
    const params = (closure.mtdOrCon as ConstructorDeclaration).constructorDeclarator.formalParameterList;
      
    if (argTypes.length != params.length) continue;
    
    let match = true;
    for (let i = 0; i < argTypes.length; i++) {
      match &&= (params[i].unannType === argTypes[i].type);
      if (!match) break; // short circuit
    }
    
    if (match) {
      resolved = closure;
      break;
    }
  }

  if (!resolved) {
    throw new errors.ResConOverloadError(conName, argTypes);
  }

  return resolved;
};
