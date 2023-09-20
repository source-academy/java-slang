import { 
  BinaryExpression,
  Literal, 
  LocalVariableDeclarationStatement 
} from "../types/blocks-and-statements";
import { Identifier } from "../types/classes";
import { CompilationUnit } from "../types/packages-and-modules";

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
