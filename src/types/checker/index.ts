import { BadOperandTypesError, IncompatibleTypesError } from "../errors";
import { Node } from "../../ast/types/ast";
import { String } from "../types/nonPrimitives";
import { Type } from "../types/type";
import {
  Frame,
  GLOBAL_ENVIRONMENT,
  createFrame,
  getEnvironmentType,
  getEnvironmentVariable,
  setEnvironmentVariable,
} from "./environment";
import {
  Boolean,
  Char,
  Double,
  Float,
  Int,
  Long,
  Null,
  getFloatType,
  getNumberType,
} from "../types/primitives";

export type Result = {
  currentType: Type | null;
  errors: Error[];
};

const OK_RESULT: Result = { currentType: null, errors: [] };

const newResult = (
  currentType: Type | null = null,
  errors: Error[] = []
): Result => ({ currentType, errors });

export const check = (
  node: Node,
  environmentFrame: Frame = GLOBAL_ENVIRONMENT
): Result => {
  switch (node.kind) {
    case "Assignment": {
      const { left, right } = node;
      const leftType = getEnvironmentVariable(environmentFrame, left.name);
      if (leftType instanceof Error) return newResult(null, [leftType]);
      const { currentType, errors } = check(right, environmentFrame);
      if (errors.length > 0) return newResult(null, errors);
      if (!currentType)
        throw new Error(
          "Right side of assignment statment should return a type."
        );
      if (!leftType.canBeAssigned(currentType))
        return newResult(null, [new IncompatibleTypesError()]);
      return newResult(null);
    }
    case "BinaryExpression": {
      const { left, operator, right } = node;
      const { currentType: leftType, errors: leftErrors } = check(
        left,
        environmentFrame
      );
      if (leftErrors.length > 0)
        return { currentType: null, errors: leftErrors };
      const { currentType: rightType, errors: rightErrors } = check(
        right,
        environmentFrame
      );
      if (rightErrors.length > 0)
        return { currentType: null, errors: rightErrors };
      if (!leftType || !rightType)
        throw new Error(
          "Left and right of binary expression should have a type."
        );

      const doubleType = new Double();
      switch (operator) {
        case "+":
          if (leftType instanceof String && rightType instanceof String)
            return newResult(new String());
          if (doubleType.canBeAssigned(leftType) && rightType instanceof String)
            return newResult(new String());
          if (leftType instanceof String && doubleType.canBeAssigned(rightType))
            return newResult(new String());
        case "-":
        case "*":
        case "/":
          if (leftType instanceof String && rightType instanceof String)
            return newResult(null, [new BadOperandTypesError()]);
          if (leftType.canBeAssigned(rightType)) return newResult(leftType);
          if (rightType.canBeAssigned(leftType)) return newResult(rightType);
          return newResult(null, [new BadOperandTypesError()]);
        default:
          throw new Error(
            `Unrecgonized operator ${operator} found in binary expression.`
          );
      }
    }
    case "CompilationUnit": {
      const { blockStatements } =
        node.topLevelClassOrInterfaceDeclarations[0].classBody[0].methodBody;
      const newEnvironmentFrame = createFrame({}, environmentFrame);
      const errors = blockStatements.flatMap((blockStatement) => {
        return check(blockStatement, newEnvironmentFrame).errors;
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
        case "BooleanLiteral": {
          const type = Boolean.from(value);
          return type instanceof Error
            ? newResult(null, [type])
            : newResult(type);
        }
        case "CharacterLiteral": {
          const type = Char.from(value);
          return type instanceof Error
            ? newResult(null, [type])
            : newResult(type);
        }
        case "NullLiteral":
          return newResult(Null.from(value));
        case "StringLiteral":
          return newResult(String.from(value));
        default:
          throw new Error(
            `Unrecgonized literal type ${kind} found in literal.`
          );
      }
    }
    case "LocalVariableDeclarationStatement": {
      if (!node.variableDeclaratorList)
        throw new Error("Variable declarator list is undefined.");
      const results = node.variableDeclaratorList.map((variableDeclarator) => {
        const declaredType = getEnvironmentType(
          environmentFrame,
          node.localVariableType
        );
        if (declaredType instanceof Error)
          return newResult(null, [declaredType]);
        const { variableInitializer } = variableDeclarator;
        if (!variableInitializer)
          throw new Error("Variable initializer is undefined.");
        const { currentType, errors } = check(
          variableInitializer,
          environmentFrame
        );
        if (errors.length > 0) return { currentType: null, errors };
        if (currentType == null)
          throw new Error(
            "Variable initializer in local variable declaration statement should return a type."
          );
        if (!declaredType.canBeAssigned(currentType))
          return newResult(null, [new IncompatibleTypesError()]);
        setEnvironmentVariable(
          environmentFrame,
          variableDeclarator.variableDeclaratorId,
          declaredType
        );
        return OK_RESULT;
      });
      return results.reduce((previousResult, currentResult) => {
        if (currentResult.errors.length === 0) return previousResult;
        return {
          currentType: null,
          errors: [...previousResult.errors, ...currentResult.errors],
        };
      }, OK_RESULT);
    }
    case "PrefixExpression": {
      const { operator, expression } = node;
      switch (operator) {
        case "-": {
          if (expression.kind === "Literal") {
            switch (expression.literalType.kind) {
              case "BinaryIntegerLiteral":
              case "DecimalFloatingPointLiteral":
              case "DecimalIntegerLiteral":
              case "HexIntegerLiteral":
              case "OctalIntegerLiteral":
              case "HexadecimalFloatingPointLiteral": {
                expression.literalType.value =
                  "-" + expression.literalType.value;
                return check(expression, environmentFrame);
              }
              case "BooleanLiteral":
              case "CharacterLiteral":
              case "StringLiteral":
              case "NullLiteral":
                return newResult(null, [new BadOperandTypesError()]);
            }
          }
        }
        case "+":
          return check(expression, environmentFrame);
        default:
          throw new Error(
            `Unrecgonized operator ${operator} found in prefix expression.`
          );
      }
    }
    default:
      throw new Error(
        `Check is not implemented for this type of node ${node.kind}.`
      );
  }
};
