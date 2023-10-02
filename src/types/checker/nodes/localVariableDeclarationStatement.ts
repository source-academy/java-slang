import { coalesceResults, Result } from "../";
import { LocalVariableDeclarationStatementCstNode } from "java-parser";

export const checkLocalVariableDeclarationStatement = (
  node: LocalVariableDeclarationStatementCstNode
): Result => {
  return coalesceResults(node.children.localVariableDeclaration);
};
