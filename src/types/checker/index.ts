import { checkBinaryExpression } from "./nodes/binaryExpression";
import { checkBlockStatement } from "./nodes/blockStatement";
import { checkBlockStatements } from "./nodes/blockStatements";
import { checkCompilationUnit } from "./nodes/compilationUnit";
import { checkExpression } from "./nodes/expression";
import { checkLocalVariableDeclaration } from "./nodes/localVariableDeclaration";
import { checkLocalVariableDeclarationStatement } from "./nodes/localVariableDeclarationStatement";
import { checkUnaryExpression } from "./nodes/unaryExpression";
import { Type } from "../types";
import {
  CstNode,
  BinaryExpressionCstNode,
  BlockStatementCstNode,
  BlockStatementsCstNode,
  CompilationUnitCstNode,
  LocalVariableDeclarationCstNode,
  LocalVariableDeclarationStatementCstNode,
  UnaryExpressionCstNode,
  ExpressionCstNode,
} from "java-parser";

export type Result = {
  currentType: Type | null;
  errors: Error[];
};

export const coalesceResults = (nodes: CstNode[]): Result =>
  nodes.reduce<Result>(
    (previousResult, node) => {
      const currentResult = check(node);
      return {
        currentType: null,
        errors: previousResult.errors.concat(...currentResult.errors),
      };
    },
    { currentType: null, errors: [] }
  );

export const check = (node: CstNode): Result => {
  const { name } = node;
  switch (name) {
    case "binaryExpression":
      return checkBinaryExpression(node as BinaryExpressionCstNode);
    case "blockStatement":
      return checkBlockStatement(node as BlockStatementCstNode);
    case "blockStatements":
      return checkBlockStatements(node as BlockStatementsCstNode);
    case "compilationUnit":
      return checkCompilationUnit(node as CompilationUnitCstNode);
    case "expression":
      return checkExpression(node as ExpressionCstNode);
    case "localVariableDeclaration":
      return checkLocalVariableDeclaration(
        node as LocalVariableDeclarationCstNode
      );
    case "localVariableDeclarationStatement":
      return checkLocalVariableDeclarationStatement(
        node as LocalVariableDeclarationStatementCstNode
      );
    case "unaryExpression":
      return checkUnaryExpression(node as UnaryExpressionCstNode);
    default:
      throw new Error(`Cannot recognize AST node: ${name}.`);
  }
};
