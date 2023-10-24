import { BadOperandTypesError, IncompatibleTypesError } from "../errors";
import { Node } from "../../ast/types/ast";
import {
  Boolean,
  Double,
  Float,
  Int,
  Long,
  String,
  Type,
  getFloatType,
  getNumberType,
} from "../types";

export type Result = {
  currentType: Type | null;
  errors: Error[];
};

const OK_RESULT: Result = { currentType: null, errors: [] };

const newResult = (
  currentType: Type | null = null,
  errors: Error[] = []
): Result => ({ currentType, errors });

export const check = (node: Node): Result => {
  switch (node.kind) {
    case "BinaryExpression": {
      const { left, operator, right } = node;
      const { currentType: leftType, errors: leftErrors } = check(left);
      if (leftErrors.length > 0)
        return { currentType: null, errors: leftErrors };
      const { currentType: rightType, errors: rightErrors } = check(right);
      if (rightErrors.length > 0)
        return { currentType: null, errors: rightErrors };

      switch (operator) {
        case "+":
          if (leftType instanceof String && rightType instanceof String)
            return newResult(new String());
        case "-":
          if (leftType instanceof Int && rightType instanceof Int)
            return newResult(new Int());
          if (leftType instanceof Int && rightType instanceof String)
            return newResult(new String());
          if (leftType instanceof String && rightType instanceof Int)
            return newResult(new String());
          return newResult(null, [new BadOperandTypesError()]);
        case "*":
        case "/":
          if (leftType instanceof Int && rightType instanceof Int)
            return newResult(new Int());
          return newResult(null, [new BadOperandTypesError()]);
        default:
          throw new Error(
            `Unrecgonized operator ${operator} found in binary expression.`
          );
      }
    }
    case "CompilationUnit": {
      const blockStatements =
        node.topLevelClassOrInterfaceDeclarations[0].classBody[0].methodBody;
      const errors = blockStatements.flatMap((blockStatement) => {
        return check(blockStatement).errors;
      });
      return { currentType: null, errors };
    }
    case "Literal": {
      const {
        literalType: { kind, value },
      } = node;
      switch (kind) {
        case "BinaryIntegerLiteral":
        case "DecimalIntegerLiteral":
        case "HexIntegerLiteral":
        case "OctalIntegerLiteral": {
          const Type = getNumberType(value) === "long" ? Long : Int;
          const type = Type.from(value);
          return type instanceof Error
            ? newResult(null, [type])
            : newResult(type);
        }
        case "DecimalFloatingPointLiteral":
        case "HexadecimalFloatingPointLiteral": {
          const Type = getFloatType(value) === "float" ? Float : Double;
          const type = Type.from(value);
          return type instanceof Error
            ? newResult(null, [type])
            : newResult(type);
        }
        case "BooleanLiteral":
          return newResult(Boolean.from(value));
        case "CharacterLiteral":
          throw new Error(`Not implemented yet.`);
        case "NullLiteral":
          throw new Error(`Not implemented yet.`);
        case "StringLiteral":
          return newResult(String.from(value));
        default:
          throw new Error(
            `Unrecgonized literal type ${kind} found in literal.`
          );
      }
    }
    case "LocalVariableDeclarationStatement": {
      const { variableInitializer } = node.variableDeclarationList;
      if (!variableInitializer)
        throw new Error("Variable initializer is undefined.");
      const { currentType, errors } = check(variableInitializer);
      if (errors.length > 0) return { currentType: null, errors };
      if (currentType == null)
        throw new Error(
          "Variable initializer in local variable declaration statement should return a type."
        );
      if (currentType.name !== node.localVariableType)
        return newResult(null, [new IncompatibleTypesError()]);
      return OK_RESULT;
    }
    case "PrefixExpression": {
      const { operator, expression } = node;
      switch (operator) {
        case "-": {
          if (
            expression.kind === "Literal" &&
            (expression.literalType.kind === "BinaryIntegerLiteral" ||
              expression.literalType.kind === "DecimalIntegerLiteral" ||
              expression.literalType.kind === "HexIntegerLiteral" ||
              expression.literalType.kind === "OctalIntegerLiteral")
          ) {
            const integerString = "-" + expression.literalType.value;
            const lastCharacter = integerString
              .charAt(integerString.length - 1)
              .toUpperCase();
            const Type = lastCharacter === "L" ? Long : Int;
            const type = Type.from(integerString);
            return type instanceof Error
              ? newResult(null, [type])
              : newResult(type);
          }
        }
        case "+":
          return check(expression);
        default:
          throw new Error(
            `Unrecgonized operator ${operator} found in prefix expression.`
          );
      }
    }
    default:
      throw new Error(
        `Check is not implemented for this type of node. \n${node}`
      );
  }
};
