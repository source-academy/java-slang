import { BaseNode } from "./ast";
import { Identifier, UnannType } from "./classes";

export interface Block extends BaseNode {
  kind: "Block";
  blockStatements: Array<BlockStatement>;
}
export type BlockStatement =
  LocalVariableDeclarationStatement
  | Statement
  | ExplicitConstructorInvocation;

export interface ExplicitConstructorInvocation extends BaseNode {
  kind: "ExplicitConstructorInvocation";
  thisOrSuper: "this" | "super";
  argumentList: ArgumentList
}

export interface LocalVariableDeclarationStatement extends BaseNode {
  kind: "LocalVariableDeclarationStatement";
  localVariableType: LocalVariableType;
  variableDeclaratorList: Array<VariableDeclarator>;
}

export type Statement = StatementWithoutTrailingSubstatement | IfStatement | WhileStatement | ForStatement;

export interface IfStatement extends BaseNode {
  kind: "IfStatement";
  condition: Expression;
  consequent: Statement;
  alternate: Statement;
}

export interface WhileStatement extends BaseNode {
  kind: "WhileStatement";
  condition: Expression;
  body: Statement;
}

export interface DoStatement extends BaseNode {
  kind: "DoStatement";
  condition: Expression;
  body: Statement;
}

export type ForStatement = BasicForStatement | EnhancedForStatement;
export interface BasicForStatement extends BaseNode {
  kind: "BasicForStatement";
  forInit: Array<ExpressionStatement> | LocalVariableDeclarationStatement;
  condition: Expression;
  forUpdate: Array<ExpressionStatement>;
  body: Statement;
}

export interface EnhancedForStatement extends BaseNode {
  kind: "EnhancedForStatement";
}

export type StatementWithoutTrailingSubstatement = Block | ExpressionStatement | DoStatement | ReturnStatement | BreakStatement | ContinueStatement;

export interface ExpressionStatement extends BaseNode {
  kind: "ExpressionStatement";
  stmtExp: StatementExpression
}

export type StatementExpression = MethodInvocation | Assignment;

export interface MethodInvocation extends BaseNode {
  kind: "MethodInvocation";
  identifier: Identifier;
  argumentList: ArgumentList;
}

export type ArgumentList = Array<Expression>;

export type LocalVariableType = UnannType;

export interface VariableDeclarator {
  kind: "VariableDeclarator";
  variableDeclaratorId: VariableDeclaratorId;
  dims?: string;
  variableInitializer?: VariableInitializer;
}

export type VariableDeclaratorId = Identifier;
export type VariableInitializer = Expression | ArrayInitializer;

export type ArrayInitializer = Array<VariableInitializer>;

export interface ArrayAccess extends BaseNode {
  kind: "ArrayAccess";
  primary: Primary;
  expression: Expression;
}

export interface ReturnStatement extends BaseNode {
  kind: "ReturnStatement";
  exp: Expression;
}

export type Expression = Primary | BinaryExpression | UnaryExpression | Void;

export interface Void extends BaseNode {
  kind: "Void";
}

export type Primary =
  Literal
  | ExpressionName
  | Assignment
  | MethodInvocation
  | ArrayAccess
  | ClassInstanceCreationExpression;

export interface ClassInstanceCreationExpression extends BaseNode {
  kind: "ClassInstanceCreationExpression",
  identifier: Identifier;
  argumentList: ArgumentList;
}

export interface Literal extends BaseNode {
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

export type BinaryOperator = "+" | "-" | "*" | "/" | "%" | "|" | "&" | "^" | "<<" | ">>" | ">>>" | "==" | "!=" | "<" | "<=" | ">" | ">=" | "&&" | "||";
export interface BinaryExpression extends BaseNode {
  kind: "BinaryExpression";
  operator: BinaryOperator;
  left: Expression;
  right: Expression;
}

export interface ExpressionName extends BaseNode {
  kind: "ExpressionName";
  name: string;
}

export interface Assignment extends BaseNode {
  kind: "Assignment";
  left: LeftHandSide;
  operator: "=" | "+=" | "-=" | "*=" | "/=" | "%=" | "|=" | "&=" | "^=" | "<<=" | ">>=" | ">>>=";
  right: Expression;
}

export type LeftHandSide = ExpressionName | ArrayAccess;
export type UnaryExpression = PrefixExpression | PostfixExpression;

export interface PrefixExpression extends BaseNode {
  kind: "PrefixExpression";
  operator: "-" | "+" | "++" | "--" | "!" | "~";
  expression: Expression;
}

export interface PostfixExpression extends BaseNode {
  kind: "PostfixExpression";
  operator: "++" | "--";
  expression: Expression;
}

export interface BreakStatement extends BaseNode {
  kind: "BreakStatement";
  identifier?: Identifier;
}

export interface ContinueStatement extends BaseNode {
  kind: "ContinueStatement";
  identifier?: Identifier;
}
