import {
  Assignment,
  Expression,
  ExpressionName,
  ExpressionStatement,
  LeftHandSide,
  Literal,
  LocalVariableDeclarationStatement,
  MethodInvocation,
  ReturnStatement,
  VariableDeclarator,
  VariableDeclaratorId,
} from "../ast/types/blocks-and-statements";
import {
  ConstructorBody,
  ConstructorDeclaration,
  ConstructorDeclarator,
  UnannType,
} from "../ast/types/classes";

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
): ExpressionStatement => ({
  kind: "ExpressionStatement",
  stmtExp: {
    kind: "Assignment",
    left: {
      kind: "ExpressionName",
      name: left,
    } as LeftHandSide,
    operator: "=",
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

export const returnThisStmtNode = (): ReturnStatement => ({
  kind: "ReturnStatement",
  exp: {
    kind: "ExpressionName",
    name: "this",
  } as ExpressionName,
});

export const defaultConstructorDeclNode = (
  className: string,
): ConstructorDeclaration => ({
  kind: "ConstructorDeclaration",
  constructorModifier: [],
  constructorDeclarator: {
    identifier: className,
    formalParameterList: [],
  } as ConstructorDeclarator,
  constructorBody: {
    kind: "Block",
    blockStatements: [],
  } as ConstructorBody,
});

export const nullLitNode = (): Literal => ({
  kind: "Literal",
  literalType: {
    kind: "NullLiteral",
    value: "null",
  },
});
