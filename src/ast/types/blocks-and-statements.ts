import { Identifier, UnannType } from "./classes";

export interface Block {
  kind: "Block";
  blockStatements: Array<BlockStatement>;
}
export type BlockStatement = LocalVariableDeclarationStatement | Statement;

export interface LocalVariableDeclarationStatement {
  kind: "LocalVariableDeclarationStatement";
  localVariableType: LocalVariableType;
  variableDeclaratorList: Array<VariableDeclarator>;
}

export type Statement = StatementWithoutTrailingSubstatement | IfStatement | WhileStatement | ForStatement;

export interface IfStatement {
  kind: "IfStatement";
  condition: Expression;
  consequent: Statement;
  alternate: Statement;
}

export interface WhileStatement {
  kind: "WhileStatement";
  condition: Expression;
  body: Statement;
}

export interface DoStatement {
  kind: "DoStatement";
  condition: Expression;
  body: Statement;
}

export type ForStatement = BasicForStatement | EnhancedForStatement;
export interface BasicForStatement {
  kind: "BasicForStatement";
  forInit: Array<ExpressionStatement> | LocalVariableDeclarationStatement;
  condition: Expression;
  forUpdate: Array<ExpressionStatement>;
  body: Statement;
}

export interface EnhancedForStatement {
  kind: "EnhancedForStatement";
}

export type StatementWithoutTrailingSubstatement = Block | ExpressionStatement | DoStatement;

export type ExpressionStatement = MethodInvocation | Assignment;

export interface MethodInvocation {
  kind: "MethodInvocation";
  identifier: Identifier
  argumentList: ArgumentList;
}

export type ArgumentList = Array<Expression>;

export type LocalVariableType = UnannType;

export interface VariableDeclarator {
  kind: "VariableDeclarator";
  variableDeclaratorId: VariableDeclaratorId;
  variableInitializer: VariableInitializer;
}

export type VariableDeclaratorId = Identifier;
export type VariableInitializer = Expression;

export type Expression = Primary | BinaryExpression | UnaryExpression;
export type Primary = Literal | ExpressionName | Assignment;

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
  operator: "+" | "-" | "*" | "/" | "%" | "|" | "&" | "^" | "<<" | ">>" | ">>>" | "==" | "!=" | "<" | "<=" | ">" | ">=" | "&&" | "||";
  left: Expression;
  right: Expression;
}

export interface ExpressionName {
  kind: "ExpressionName";
  name: string;
}

export interface Assignment {
  kind: "Assignment";
  left: LeftHandSide;
  operator: string;
  right: Expression;
}

export type LeftHandSide = ExpressionName;
export type UnaryExpression = PrefixExpression | PostfixExpression;

export interface PrefixExpression {
  kind: "PrefixExpression";
  operator: "-" | "+" | "++" | "--" | "!" | "~";
  expression: Expression;
}

export interface PostfixExpression {
  kind: "PostfixExpression";
  operator: "++" | "--";
  expression: Expression;
}