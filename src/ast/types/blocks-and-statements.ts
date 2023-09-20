import { Identifier, UnannType } from "./classes";

export type BlockStatement = LocalVariableDeclarationStatement;
export interface LocalVariableDeclarationStatement {
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

export type Literal = number;

export interface BinaryExpression {
  operator: string;
  left: Expression;
  right: Expression;
}
