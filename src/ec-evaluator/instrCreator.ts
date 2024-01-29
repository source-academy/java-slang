import { Node } from "../ast/types/ast";
import { AssmtInstr, BinOpInstr, Instr, InstrType } from "./types";

export const assmtInstr = (
  symbol: string,
  srcNode: Node
): AssmtInstr => ({
  instrType: InstrType.ASSIGNMENT,
  symbol,
  srcNode
})

export const binOpInstr = (symbol: string, srcNode: Node): BinOpInstr => ({
  instrType: InstrType.BINARY_OP,
  symbol,
  srcNode
})

export const popInstr = (srcNode: Node): Instr => ({ instrType: InstrType.POP, srcNode })
