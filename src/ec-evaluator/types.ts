import { Node } from "../ast/astExtractor/types";
import { EnvTree } from "./createContext";
import { Agenda, Stash } from "./interpreter"

export interface Context<T = any> {
  /** Runtime Specific state */
  runtime: {
    environmentTree: EnvTree
    environments: Environment[]
    nodes: Node[]
    agenda: Agenda | null
    stash: Stash | null
  }
}

export interface Environment {
  id: string
  name: string
  tail: Environment | null
  head: Frame
}

export interface Frame {
  [name: string]: any
}

export enum InstrType {
  ASSIGNMENT = 'Assignment',
  BINARY_OP = 'BinaryOperation',
  POP = 'Pop',
}

interface BaseInstr {
  instrType: InstrType
  srcNode: Node
}

export interface AssmtInstr extends BaseInstr {
  symbol: string
  constant: boolean
  declaration: boolean
}

export interface BinOpInstr extends BaseInstr {
  symbol: string
}

export type Instr =
  | BaseInstr
  | AssmtInstr
  | BinOpInstr;

export interface BaseNode {
    type: string;
}

export type AgendaItem = Node | Instr

export type Value = any
