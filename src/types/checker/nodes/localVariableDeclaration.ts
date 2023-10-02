import { coalesceResults, Result } from "../";
import { LocalVariableDeclarationCstNode } from "java-parser";

export const checkLocalVariableDeclaration = (
  node: LocalVariableDeclarationCstNode
): Result => {
  const { children } = node;
  const childrenNodes = Object.values(children).flat();
  return coalesceResults(childrenNodes);
};
