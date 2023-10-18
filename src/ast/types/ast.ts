import { CompilationUnit } from "./packages-and-modules";
import {
  Assignment,
  BinaryExpression,
  Block,
  BlockStatement,
  BooleanLiteral,
  CharacterLiteral,
  ExpressionName,
  FloatingPointLiteral,
  IntegerLiteral,
  Literal,
  LocalVariableDeclarationStatement,
  NullLiteral,
  StringLiteral,
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
  Block: Block;
  BlockStatement: BlockStatement;
  Expression: Expression;
  ExpresssionName: ExpressionName;
  Assignment: Assignment;
  IntegerLiteral: IntegerLiteral;
  FloatingPointLiteral: FloatingPointLiteral;
  BooleanLiteral: BooleanLiteral;
  CharacterLiteral: CharacterLiteral;
  StringLiteral: StringLiteral;
  NullLiteral: NullLiteral;
}

export type Node = NodeMap[keyof NodeMap];
