import {
  Assignment,
  Expression,
  ExpressionStatement,
  LeftHandSide,
  LocalVariableDeclarationStatement,
  MethodInvocation,
  ReturnStatement,
  VariableDeclarator,
  VariableDeclaratorId,
} from "../ast/types/blocks-and-statements";
import { UnannType } from "../ast/types/classes";

export const localVarDeclNoInitNode = (
  localVariableType: UnannType,
  variableDeclaratorId: VariableDeclaratorId,
): LocalVariableDeclarationStatement => ({
  kind: "LocalVariableDeclarationStatement",
  localVariableType,
  variableDeclaratorList: [
    {
      kind: "VariableDeclarator",
      variableDeclaratorId,
    } as VariableDeclarator,
  ],
});

export const expStmtAssmtNode = (
  left: string,
  right: Expression,
  operator: string = '=',
): ExpressionStatement => ({
  kind: "ExpressionStatement",
  stmtExp: {
    kind: "Assignment",
    left: {
      kind: "ExpressionName",
      name: left,
    } as LeftHandSide,
    operator,
    right,
  } as Assignment,
});

export const mainMtdInvExpStmtNode = (): ExpressionStatement => ({
  kind: "ExpressionStatement",
  stmtExp: {
    kind: "MethodInvocation",
    identifier: "main",
    argumentList: []
  } as MethodInvocation,
});

export const emptyReturnStmtNode = (): ReturnStatement => ({
  kind: "ReturnStatement",
  exp: {
    kind: "Void",
  },
});
