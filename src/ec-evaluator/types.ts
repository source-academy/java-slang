import { Node } from "../ast/types/ast";
import { Expression, Literal, Void } from "../ast/types/blocks-and-statements";
import {
  ConstructorDeclaration,
  FieldDeclaration,
  MethodDeclaration,
  UnannType,
} from "../ast/types/classes";
import { Control, EnvNode, Environment, Stash } from "./components";
import { RuntimeError } from "./errors";

export interface Context {
  errors: RuntimeError[],

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
  RES_OVERLOAD = 'ResOverload',
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

export interface ResOverloadInstr extends BaseInstr {
  name: string;
  arity: number;
}

export interface ResConOverloadInstr extends BaseInstr {
  name: string;
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
  | ResOverloadInstr
  | ResConOverloadInstr;

/**
 * Components
 */
export type ControlItem = Node | Instr;
export type StashItem = Primitive | Reference | Value | Void | Type;

export type Name = string;
export type Value = Variable | Closure | Class;

export interface Variable {
  kind: "Variable";
  type: UnannType;
  name: Name;
  value: VarValue;
}

export type VarValue = Primitive | Reference | Symbol;

export type Primitive = Literal;
export type Reference = Object;

export interface Symbol {
  kind: "Symbol";
  value: string;
}

export interface Object {
  kind: "Object";
  frame: EnvNode;
}

export interface Closure {
  kind: "Closure";
  mtdOrCon: MethodDeclaration | ConstructorDeclaration;
  env: EnvNode;
}

export interface Class {
  kind: "Class";
  frame: EnvNode;
  constructors: ConstructorDeclaration[];
  instanceFields: FieldDeclaration[];
  instanceMethods: MethodDeclaration[];
  staticFields: FieldDeclaration[];
  staticMethods: MethodDeclaration[];
  superclass?: Class;
}

export interface Type {
  kind: "Type";
  type: UnannType;
}

/**
 * Execution results
 */
export interface Error {
  status: 'error';
}

export interface Finished {
  status: 'finished';
  context: Context;
  value: Value;
}

export type Result = Finished | Error;
