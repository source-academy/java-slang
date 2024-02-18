import { Node } from "../ast/types/ast";
import { Control, Environment, Stash } from "./interpreter";
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

export type ControlItem = Node | Instr;

export type Value = any;
export type Name = string;

export interface Error {
  status: 'error';
}

export interface Finished {
  status: 'finished';
  context: Context;
  value: Value;
}

export type Result = Finished | Error;
