import { Node } from "../ast/types/ast";
import { Literal, Void } from "../ast/types/blocks-and-statements";
import {
  ConstructorDeclaration,
  FieldDeclaration,
  MethodDeclaration,
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

export type Instr =
  | AssmtInstr
  | BinOpInstr
  | PopInstr
  | InvInstr
  | EnvInstr
  | MarkerInstr
  | ResetInstr
  | EvalVarInstr;

/**
 * Components
 */
export type ControlItem = Node | Instr;
export type StashItem = Literal | Closure | Void | Variable;

export type Name = string;
export type Value = Variable | Closure;

export type VarValue = any

export interface Variable {
  kind: "Variable";
  name: Name;
  value: VarValue;
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
