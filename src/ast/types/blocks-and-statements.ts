import { BaseNode } from "./ast";
import { Identifier, UnannType } from "./classes";

export interface Block extends BaseNode {
  blockStatements: Array<BlockStatement>
}
export type BlockStatement = LocalVariableDeclarationStatement | Statement;
export interface LocalVariableDeclarationStatement extends BaseNode {
  localVariableType: LocalVariableType;
  variableDeclarationList: VariableDeclarator;
}

export type Statement = StatementWithoutTrailingSubstatement;
export type StatementWithoutTrailingSubstatement = ExpressionStatement;
export type ExpressionStatement = MethodInvocation;
export interface MethodInvocation extends BaseNode {
  identifier: Identifier
  argumentList: ArgumentList;
}

export type ArgumentList = Array<Expression>;

export type LocalVariableType = UnannType;

export interface VariableDeclarator {
  variableDeclaratorId: VariableDeclaratorId;
  variableInitializer: VariableInitializer;
}
export type VariableDeclaratorId = Identifier;
export type VariableInitializer = Expression;
export type Expression = BinaryExpression | Primary;

export interface BinaryExpression extends BaseNode {
  operator: string;
  left: Expression;
  right: Expression;
}

export type Primary = Literal | ExpressionName;

export interface Literal extends BaseNode {
  value: string
};

export interface ExpressionName extends BaseNode {
  name: string;
}