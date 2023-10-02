import { check, Result } from "../";
import { ExpressionCstNode } from "java-parser";

export const checkExpression = (node: ExpressionCstNode): Result => {
  const binaryExpression =
    node.children.ternaryExpression![0].children.binaryExpression[0];
  return check(binaryExpression);
};
