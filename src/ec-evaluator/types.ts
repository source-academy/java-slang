import { Node } from "../ast/types/ast";
import { Expression, Literal, Void, MethodDescriptor } from "../ast/types/blocks-and-statements";
import {
  ConstructorDeclaration,
  FieldDeclaration,
  MethodDeclaration,
  NormalClassDeclaration,
  UnannType,
} from "../ast/types/classes";
import { Control, EnvNode, Environment, Stash } from "./components";
import { SourceError } from "./errors";

export interface Context {
  errors: SourceError[],

  control: Control,
  stash: Stash,
  environment: Environment,

  totalSteps: number,
};

/**
 * Instructions
 */
export enum InstrType {
  ASSIGNMENT = 'Assign',
  BINARY_OP = 'BinaryOperation',
  POP = 'Pop',
  INVOCATION = 'Invocation',
  RESET = 'Reset',
  ENV = 'Env',
  MARKER = 'Marker',
  EVAL_VAR = 'EvalVariable',
  RES = 'Res',
  DEREF = 'Deref',
  NEW = 'New',
  RES_TYPE = 'ResType',
  RES_TYPE_CONT = 'ResTypeCont',
  RES_OVERLOAD = 'ResOverload',
  RES_OVERRIDE = 'ResOverride',
  RES_CON_OVERLOAD = 'ResConOverload',
}

interface BaseInstr {
  instrType: InstrType;
  srcNode: Node;
}

export interface AssmtInstr extends BaseInstr {}

export interface BinOpInstr extends BaseInstr {
  symbol: string;
}

export interface PopInstr extends BaseInstr {}

export interface InvInstr extends BaseInstr {
  arity: number;
}

export interface EnvInstr extends BaseInstr {
  env: EnvNode;
}

export interface MarkerInstr extends BaseInstr {}

export interface ResetInstr extends BaseInstr {}

export interface EvalVarInstr extends BaseInstr {
  symbol: string;
}

export interface NewInstr extends BaseInstr {
  c: Class;
}

export interface ResTypeInstr extends BaseInstr {
  value: Expression | Class;
}

export interface ResTypeContInstr extends BaseInstr {
  name: string;
}

export interface ResOverloadInstr extends BaseInstr {
  name: string;
  arity: number;
}

export interface ResOverrideInstr extends BaseInstr {}

export interface ResConOverloadInstr extends BaseInstr {
  arity: number;
}

export interface ResInstr extends BaseInstr {
  name: string;
}

export interface DerefInstr extends BaseInstr {}

export type Instr =
  | AssmtInstr
  | BinOpInstr
  | PopInstr
  | InvInstr
  | EnvInstr
  | MarkerInstr
  | ResetInstr
  | EvalVarInstr
  | ResInstr
  | DerefInstr
  | NewInstr
  | ResTypeInstr
  | ResTypeContInstr
  | ResOverloadInstr
  | ResConOverloadInstr;

/**
 * Components
 */
export type ControlItem = Node | Instr;
export type StashItem = Primitive | Reference | Value | Void | Type | MethodDescriptor;

export type Name = string;
export type Value = Variable | Closure | Class;

export type VarValue = Primitive | Reference | Symbol | Variable;

export type Primitive = Literal;
export type Reference = Object;

/**
 * Structs
 */
export enum StructType {
  VARIABLE = "Variable",
  SYMBOL = "Symbol",
  OBJECT = "Object",
  CLOSURE = "Closure",
  CLASS = "Class",
  TYPE = "Type",
}

export interface Variable {
  kind: StructType.VARIABLE;
  type: UnannType;
  name: Name;
  value: VarValue;
}

export interface Symbol {
  kind: StructType.SYMBOL;
  value: string;
}

export interface Object {
  kind: StructType.OBJECT;
  frame: EnvNode;
  class: Class;
}

export interface Closure {
  kind: StructType.CLOSURE;
  mtdOrCon: MethodDeclaration | ConstructorDeclaration;
  env: EnvNode;
}

export interface Class {
  kind: StructType.CLASS;
  frame: EnvNode;
  classDecl: NormalClassDeclaration;
  constructors: ConstructorDeclaration[];
  instanceFields: FieldDeclaration[];
  instanceMethods: MethodDeclaration[];
  staticFields: FieldDeclaration[];
  staticMethods: MethodDeclaration[];
  superclass?: Class;
}

export interface Type {
  kind: StructType.TYPE;
  type: UnannType;
}

/**
 * Execution results
 */
export interface Error {
  status: 'error';
  context: Context;
}

export interface Finished {
  status: 'finished';
  context: Context;
  value: Value;
}

export type Result = Finished | Error;
