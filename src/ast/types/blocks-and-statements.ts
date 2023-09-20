import { BaseNode } from "../../ec-evaluator/types";
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

export interface Literal extends BaseNode {
  value: number
};

export interface BinaryExpression extends BaseNode {
  operator: string;
  left: Expression;
  right: Expression;
}
