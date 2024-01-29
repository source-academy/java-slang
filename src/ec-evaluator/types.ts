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

export enum InstrType {
  ASSIGNMENT = 'Assign',
  BINARY_OP = 'BinaryOperation',
  POP = 'Pop',
}

interface BaseInstr {
  instrType: InstrType;
  srcNode: Node;
}

export interface AssmtInstr extends BaseInstr {
  symbol: string;
}

export interface BinOpInstr extends BaseInstr {
  symbol: string;
}

export type Instr =
  | BaseInstr
  | AssmtInstr
  | BinOpInstr;

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
