import { Node } from "../ast/types/ast";
import { EnvNode } from "./components";
import {
  AssmtInstr,
  BinOpInstr,
  DerefInstr,
  EnvInstr,
  EvalVarInstr,
  Instr,
  InstrType,
  InvInstr,
  MarkerInstr,
  ResInstr,
} from "./types";

export const assmtInstr = (
  srcNode: Node,
): AssmtInstr => ({
  instrType: InstrType.ASSIGNMENT,
  srcNode,
});

export const binOpInstr = (
  symbol: string,
  srcNode: Node,
): BinOpInstr => ({
  instrType: InstrType.BINARY_OP,
  symbol,
  srcNode,
});

export const popInstr = (
  srcNode: Node,
): Instr => ({
  instrType: InstrType.POP,
  srcNode,
});

export const invInstr = (
  arity: number,
  srcNode: Node,
): InvInstr => ({
  instrType: InstrType.INVOCATION,
  arity,
  srcNode,
});

export const envInstr = (
  env: EnvNode,
  srcNode: Node,
): EnvInstr => ({
  instrType: InstrType.ENV,
  env,
  srcNode,
});

export const markerInstr = (
  srcNode: Node,
): MarkerInstr => ({
  instrType: InstrType.MARKER,
  srcNode,
});

export const resetInstr = (
  srcNode: Node,
): Instr => ({
  instrType: InstrType.RESET,
  srcNode,
});

export const evalVarInstr = (
  symbol: string,
  srcNode: Node,
): EvalVarInstr => ({
  instrType: InstrType.EVAL_VAR,
  srcNode,
  symbol,
});

export const resInstr = (
  name: string,
  srcNode: Node,
): ResInstr => ({
  instrType: InstrType.RES,
  srcNode,
  name,
});

export const derefInstr = (
  srcNode: Node,
): DerefInstr => ({
  instrType: InstrType.DEREF,
  srcNode,
});
