import { Identifier, UnannType } from "./classes";

export type BlockStatement = LocalVariableDeclarationStatement;
export interface LocalVariableDeclarationStatement {
  kind: "LocalVariableDeclarationStatement";
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
export type Expression = Literal | BinaryExpression | UnaryExpression;

export interface Literal {
  kind: "Literal";
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
  kind: "DecimalIntegerLiteral";
  value: string;
}
export interface HexIntegerLiteral {
  kind: "HexIntegerLiteral";
  value: string;
}
export interface OctalIntegerLiteral {
  kind: "OctalIntegerLiteral";
  value: string;
}
export interface BinaryIntegerLiteral {
  kind: "BinaryIntegerLiteral";
  value: string;
}

export type FloatingPointLiteral =
  | DecimalFloatingPointLiteral
  | HexadecimalFloatingPointLiteral;
export interface DecimalFloatingPointLiteral {
  kind: "DecimalFloatingPointLiteral";
  value: string;
}
export interface HexadecimalFloatingPointLiteral {
  kind: "HexadecimalFloatingPointLiteral";
  value: string;
}

export interface BooleanLiteral {
  kind: "BooleanLiteral";
  value: "true" | "false";
}

export interface CharacterLiteral {
  kind: "CharacterLiteral";
  value: string;
}

export type TextBlockLiteral = StringLiteral;
export interface StringLiteral {
  kind: "StringLiteral";
  value: string;
}

export interface NullLiteral {
  kind: "NullLiteral";
  value: "null";
}

export interface BinaryExpression {
  kind: "BinaryExpression";
  operator: "+" | "-" | "*" | "/";
  left: Expression;
  right: Expression;
}

export type UnaryExpression = PrefixExpression;
export interface PrefixExpression {
  kind: "PrefixExpression";
  operator: "-" | "+";
  expression: Expression;
}
