import { BadOperandTypesError } from "../../errors";
import { check, Result } from "../";
import { Type } from "../../types";
import {
  BinaryExpressionCstNode,
  UnaryExpressionCstNode,
  IToken,
} from "java-parser";

export const checkBinaryExpression = (
  node: BinaryExpressionCstNode
): Result => {
  const unaryExpressions = node.children.unaryExpression;
  const binaryOperators = node.children.BinaryOperator;
  return checkExpression(unaryExpressions, binaryOperators || []);
};

const checkOperatorArguments = (
  operator: string,
  left: Result,
  right: Result
): Result => {
  const leftType = left.currentType;
  const rightType = right.currentType;
  switch (operator) {
    case "+":
    case "-":
      if (leftType === Type.Integer && rightType === Type.Integer)
        return { currentType: Type.Integer, errors: [] };
      if (leftType === Type.Integer && rightType === Type.String)
        return { currentType: Type.String, errors: [] };
      if (leftType === Type.String && rightType === Type.Integer)
        return { currentType: Type.String, errors: [] };
      if (leftType === Type.String && rightType === Type.String)
        return { currentType: Type.String, errors: [] };
      return { currentType: null, errors: [new BadOperandTypesError()] };
    case "*":
    case "/":
      if (leftType === Type.Integer && rightType === Type.Integer)
        return { currentType: Type.Integer, errors: [] };
      return { currentType: null, errors: [new BadOperandTypesError()] };
    default:
      throw new Error(`Unrecgonized operator ${operator} found`);
  }
};

const checkExpression = (
  unaryExpressions: UnaryExpressionCstNode[],
  binaryOperators: IToken[]
): Result => {
  if (unaryExpressions.length === 0) return { currentType: null, errors: [] };
  if (unaryExpressions.length === 1) return check(unaryExpressions.shift()!);
  const leftResult = check(unaryExpressions.shift()!);
  if (leftResult.errors.length > 0) return leftResult;
  const rightResult = check(unaryExpressions.shift()!);
  if (rightResult.errors.length > 0) return rightResult;
  const operator = binaryOperators[0].image;
  return checkOperatorArguments(operator, leftResult, rightResult);
};
