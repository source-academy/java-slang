import { BlocksAndStatementsNode } from './blocks-and-statements'
import { ClassNode } from './classes'
import { CompilationUnit, ModuleNode } from './modules'

export type Node = BlocksAndStatementsNode | ClassNode | ModuleNode

export type AST = CompilationUnit

export interface Location {
  startOffset: number
  startLine: number
  startColumn?: number
  endOffset?: number
  endLine?: number
  endColumn?: number
}

export interface BaseNode {
  kind: string
  location?: Location
}
