import { BaseNode } from "./ast";
import { Identifier, UnannType } from "./classes";
import { LiteralType, NodeType } from "./node-types";

export type BlockStatement = LocalVariableDeclarationStatement;
export interface LocalVariableDeclarationStatement extends BaseNode {
  kind: NodeType.LocalVariableDeclarationStatement;
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

export interface Literal extends BaseNode {
  kind: NodeType.Literal;
  literalType:
    | IntegerLiteral
    | FloatingPointLiteral
    | BooleanLiteral
    | CharacterLiteral
    | TextBlockLiteral
    | StringLiteral
    | NullLiteral;
}

export type IntegerLiteral =
  | DecimalIntegerLiteral
  | HexIntegerLiteral
  | OctalIntegerLiteral
  | BinaryIntegerLiteral;
export interface DecimalIntegerLiteral {
  kind: LiteralType.DecimalIntegerLiteral;
  value: string;
}
export interface HexIntegerLiteral {
  kind: LiteralType.HexIntegerLiteral;
  value: string;
}
export interface OctalIntegerLiteral {
  kind: LiteralType.OctalIntegerLiteral;
  value: string;
}
export interface BinaryIntegerLiteral {
  kind: LiteralType.BinaryIntegerLiteral;
  value: string;
}

export type FloatingPointLiteral =
  | DecimalFloatingPointLiteral
  | HexadecimalFloatingPointLiteral;
export interface DecimalFloatingPointLiteral {
  kind: LiteralType.DecimalFloatingPointLiteral;
  value: string;
}
export interface HexadecimalFloatingPointLiteral {
  kind: LiteralType.HexadecimalFloatingPointLiteral;
  value: string;
}

export interface BooleanLiteral {
  kind: LiteralType.BooleanLiteral;
  value: "true" | "false";
}

export interface CharacterLiteral {
  kind: LiteralType.CharacterLiteral;
  value: string;
}

export type TextBlockLiteral = StringLiteral;
export interface StringLiteral {
  kind: LiteralType.StringLiteral;
  value: string;
}

export interface NullLiteral {
  kind: LiteralType.NullLiteral;
  value: "null";
}

export enum Operator {
  PLUS = "+",
  MINUS = "-",
  TIMES = "*",
  DIVIDE = "/",
}

export interface BinaryExpression extends BaseNode {
  kind: NodeType.BinaryExpression;
  operator: Operator;
  left: Expression;
  right: Expression;
}
