import { Node } from "./ast/types/ast";
import { check } from "./types/checker";

export type TypeCheckResult = { hasTypeErrors: boolean };

export const typeCheck = (ast: Node): TypeCheckResult => {
  const result = check(ast);
  return { hasTypeErrors: result.errors.length > 0 };
};
