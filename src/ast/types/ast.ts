import {
  BinaryExpression,
  Literal,
  LocalVariableDeclarationStatement
} from "./blocks-and-statements";
import { CompilationUnit } from "./packages-and-modules";

export interface ExpressionMap {
  BinaryExpression: BinaryExpression;
  Literal: Literal;
}

type Expression = ExpressionMap[keyof ExpressionMap]

interface NodeMap {
  CompilationUnit: CompilationUnit;
  LocalVariableDeclarationStatement: LocalVariableDeclarationStatement;
  Expression: Expression;
}

export type Node = NodeMap[keyof NodeMap];

export interface BaseNode {
  kind: string;
}
