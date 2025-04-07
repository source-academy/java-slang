import { Node } from "../ast/types/ast";
import { Expression, SwitchCase } from '../ast/types/blocks-and-statements'
import { EnvNode } from "./components";
import {
  AssmtInstr,
  BinOpInstr,
  Class, CondInstr,
  DerefInstr,
  EnvInstr,
  EvalVarInstr,
  Instr,
  InstrType,
  InvInstr,
  MarkerInstr,
  NewInstr,
  ResConOverloadInstr,
  ResInstr,
  ResOverloadInstr,
  ResOverrideInstr,
  ResTypeContInstr,
  ResTypeInstr, SwitchInstr
} from './types'

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

export const newInstr = (
  c: Class,
  srcNode: Node,
): NewInstr => ({
  instrType: InstrType.NEW,
  srcNode,
  c,
});

export const resTypeInstr = (
  value: Expression | Class,
  srcNode: Node,
): ResTypeInstr => ({
  instrType: InstrType.RES_TYPE,
  srcNode,
  value,
});

export const resTypeContInstr = (
  name: string,
  srcNode: Node,
): ResTypeContInstr => ({
  instrType: InstrType.RES_TYPE_CONT,
  srcNode,
  name,
});

export const resOverloadInstr = (
  name: string,
  arity: number,
  srcNode: Node,
): ResOverloadInstr => ({
  instrType: InstrType.RES_OVERLOAD,
  srcNode,
  name,
  arity,
});

export const resOverrideInstr = (
  srcNode: Node,
): ResOverrideInstr => ({
  instrType: InstrType.RES_OVERRIDE,
  srcNode,
});

export const resConOverloadInstr = (
  arity: number,
  srcNode: Node,
): ResConOverloadInstr => ({
  instrType: InstrType.RES_CON_OVERLOAD,
  srcNode,
  arity,
});

export const condInstr = (
  trueExpr: Expression,
  falseExpr: Expression,
  srcNode: Node,
): CondInstr => ({
  instrType: InstrType.COND,
  trueExpr,
  falseExpr,
  srcNode
});

export const switchInstr = (
  cases: Array<SwitchCase>,
  expr: Expression,
  srcNode: Node
): SwitchInstr => ({
  instrType: InstrType.SWITCH,
  cases,
  expr,
  srcNode,
});
