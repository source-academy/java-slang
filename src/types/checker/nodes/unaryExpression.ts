import { check, Result } from "../";
import { Type } from "../../types";
import { UnaryExpressionCstNode } from "java-parser";

export const checkUnaryExpression = (node: UnaryExpressionCstNode): Result => {
  const primaryPrefixCtx =
    node.children.primary[0].children.primaryPrefix[0].children;

  if (primaryPrefixCtx.parenthesisExpression) {
    const expression =
      primaryPrefixCtx.parenthesisExpression[0].children.expression[0];
    return check(expression);
  }

  if (!primaryPrefixCtx.literal)
    throw new Error("Unary Expression is not a literal.");
  const literal = primaryPrefixCtx.literal![0];
  if (literal.children.integerLiteral)
    return { currentType: Type.Integer, errors: [] };
  if (literal.children.StringLiteral)
    return { currentType: Type.String, errors: [] };
  throw new Error("Unary Expression is neither integer nor string literal.");
};
