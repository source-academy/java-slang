import { CompilationUnit } from "./packages-and-modules";
import { NodeType } from "./node-types";
import {
  BinaryExpression,
  Literal,
  LocalVariableDeclarationStatement,
} from "./blocks-and-statements";

export interface ExpressionMap {
  BinaryExpression: BinaryExpression;
  Literal: Literal;
}

type Expression = ExpressionMap[keyof ExpressionMap];

interface NodeMap {
  CompilationUnit: CompilationUnit;
  LocalVariableDeclarationStatement: LocalVariableDeclarationStatement;
  Expression: Expression;
  Literal: Literal;
}

export type Node = NodeMap[keyof NodeMap];

export interface BaseNode {
  kind: NodeType;
}
