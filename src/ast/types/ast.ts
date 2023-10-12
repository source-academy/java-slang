import { CompilationUnit } from "./packages-and-modules";
import { NodeType } from "./node-types";
import {
  BinaryExpression,
  Literal,
  LocalVariableDeclarationStatement,
  UnaryExpression,
} from "./blocks-and-statements";

export interface ExpressionMap {
  BinaryExpression: BinaryExpression;
  Literal: Literal;
  UnaryExpression: UnaryExpression;
}

type Expression = ExpressionMap[keyof ExpressionMap];

interface NodeMap {
  CompilationUnit: CompilationUnit;
  LocalVariableDeclarationStatement: LocalVariableDeclarationStatement;
  Expression: Expression;
}

export type Node = NodeMap[keyof NodeMap];

export interface BaseNode {
  kind: NodeType;
}
