import { Node } from "../ast/types/ast";
import {
  Assignment,
  ExplicitConstructorInvocation,
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
  srcNode: Node,
): LocalVariableDeclarationStatement => ({
  kind: "LocalVariableDeclarationStatement",
  localVariableType,
  variableDeclaratorList: [
    {
      kind: "VariableDeclarator",
      variableDeclaratorId,
    } as VariableDeclarator,
  ],
  location: srcNode.location,
});

export const expStmtAssmtNode = (
  left: string,
  right: Expression,
  srcNode: Node,
): ExpressionStatement => ({
  kind: "ExpressionStatement",
  stmtExp: {
    kind: "Assignment",
    left: {
      kind: "ExpressionName",
      name: left,
      location: srcNode.location,
    } as LeftHandSide,
    operator: "=",
    right,
    location: srcNode.location,
  } as Assignment,
  location: srcNode.location,
});

export const mainMtdInvExpStmtNode = (className: string): ExpressionStatement => ({
  kind: "ExpressionStatement",
  stmtExp: {
    kind: "MethodInvocation",
    identifier: `${className}.main`,
    argumentList: [
      {
        kind: "Literal",
        literalType: {
          kind: "StringLiteral",
          value: `[""]`,
        },
      },
    ],
  } as MethodInvocation,
});

export const emptyReturnStmtNode = (srcNode: Node): ReturnStatement => ({
  kind: "ReturnStatement",
  exp: {
    kind: "Void",
    location: srcNode.location,
  },
  location: srcNode.location,
});

export const returnThisStmtNode = (srcNode: Node): ReturnStatement => ({
  kind: "ReturnStatement",
  exp: {
    kind: "ExpressionName",
    name: "this",
    location: srcNode.location,
  } as ExpressionName,
  location: srcNode.location,
});

export const defaultConstructorDeclNode = (
  className: string,
  srcNode: Node,
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
    location: srcNode.location,
  } as ConstructorBody,
  location: srcNode.location,
});

export const nullLitNode = (srcNode: Node): Literal => ({
  kind: "Literal",
  literalType: {
    kind: "NullLiteral",
    value: "null",
  },
  location: srcNode.location,
});

export const exprNameNode = (name: string, srcNode: Node): ExpressionName => ({
  kind: "ExpressionName",
  name,
  location: srcNode.location,
});

export const expConInvNode = (srcNode: Node): ExplicitConstructorInvocation => ({
  kind: "ExplicitConstructorInvocation",
  thisOrSuper: "super",
  argumentList: [],
  location: srcNode.location,
});
