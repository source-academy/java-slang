import { BlockStatementsCstNode } from "java-parser";
import { coalesceResults, Result } from "../";

export const checkBlockStatements = (node: BlockStatementsCstNode): Result => {
  return coalesceResults(node.children.blockStatement);
};
