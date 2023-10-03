import { BaseNode } from "./ast";
import { Identifier, UnannType } from "./classes";

export type BlockStatement = LocalVariableDeclarationStatement;
export interface LocalVariableDeclarationStatement extends BaseNode {
  localVariableType: LocalVariableType;
  variableDeclarationList: VariableDeclarator;
}

export type LocalVariableType = UnannType;

export interface VariableDeclarator {
  variableDeclaratorId: VariableDeclaratorId;
  variableInitializer: VariableInitializer;
}
export type VariableDeclaratorId = Identifier;
export type VariableInitializer = Expression;
export type Expression = Literal | BinaryExpression;

export type Literal =
  | IntegerLiteral
  | FloatingPointLiteral
  | BooleanLiteral
  | CharacterLiteral
  | StringLiteral
  | TextBlock
  | NullLiteral;
export type IntegerLiteral =
  | DecimalIntegerLiteral
  | HexIntegerLiteral
  | OctalIntegerLiteral
  | BinaryIntegerLiteral;
export interface DecimalIntegerLiteral extends BaseNode {
  value: number;
}
export interface HexIntegerLiteral extends BaseNode {
  value: string;
}
export interface OctalIntegerLiteral extends BaseNode {
  value: string;
}
export interface BinaryIntegerLiteral extends BaseNode {
  value: string;
}
export type FloatingPointLiteral =
  | DecimalFloatingPointLiteral
  | HexadecimalFloatingPointLiteral;
export interface DecimalFloatingPointLiteral extends BaseNode {
  value: string;
}
export interface HexadecimalFloatingPointLiteral extends BaseNode {
  value: string;
}
export interface BooleanLiteral extends BaseNode {
  value: boolean;
}
export interface CharacterLiteral extends BaseNode {
  value: string;
}
export interface StringLiteral extends BaseNode {
  value: string;
}
export interface TextBlock extends BaseNode {
  value: string;
}
export interface NullLiteral extends BaseNode {}

export interface BinaryExpression extends BaseNode {
  operator: string;
  left: Expression;
  right: Expression;
}
