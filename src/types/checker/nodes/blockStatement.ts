import { BlockStatementCstNode } from "java-parser";
import { coalesceResults, Result } from "../";

export const checkBlockStatement = (node: BlockStatementCstNode): Result => {
  const { children } = node;
  const childrenNodes = Object.values(children).flat();
  return coalesceResults(childrenNodes);
};
