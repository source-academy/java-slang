import { CompilationUnit } from './packages-and-modules'
import {
  Assignment,
  Block,
  BlockStatement,
  ClassInstanceCreationExpression,
  ExplicitConstructorInvocation,
  Expression,
  ExpressionStatement,
  MethodInvocation,
  ReturnStatement
} from './blocks-and-statements'
import {
  ConstructorDeclaration,
  FieldDeclaration,
  MethodDeclaration,
  NormalClassDeclaration
} from './classes'

interface NodeMap {
  CompilationUnit: CompilationUnit
  MethodDeclaration: MethodDeclaration
  FieldDeclaration: FieldDeclaration
  Block: Block
  BlockStatement: BlockStatement
  Expression: Expression
  Assignment: Assignment
  ExpressionStatement: ExpressionStatement
  MethodInvocation: MethodInvocation
  ReturnStatement: ReturnStatement
  NormalClassDeclaration: NormalClassDeclaration
  ClassInstanceCreationExpression: ClassInstanceCreationExpression
  ConstructorDeclaration: ConstructorDeclaration
  ExplicitConstructorInvocation: ExplicitConstructorInvocation
}

export type Node = NodeMap[keyof NodeMap]

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
