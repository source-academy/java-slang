import { BaseNode } from "./ast";
import { Identifier, UnannType } from "./classes";

export interface Block extends BaseNode {
  blockStatements: Array<BlockStatement>
}
export type BlockStatement = LocalVariableDeclarationStatement | Statement;
export interface LocalVariableDeclarationStatement extends BaseNode {
  localVariableType: LocalVariableType;
  variableDeclaratorList: Array<VariableDeclarator>;
}

export type Statement = StatementWithoutTrailingSubstatement | IfStatement;
export interface IfStatement extends BaseNode {
  test: Expression;
  consequent: Statement;
  alternate: Statement;
}
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

export interface Assignment extends BaseNode {
  left: LeftHandSide;
  operator: string;
  right: Expression;
}

export type LeftHandSide = ExpressionName;