import { BadOperandTypesError, IncompatibleTypesError } from "../errors";
import { Int, String, Type } from "../types";
import { LiteralType, NodeType } from "../../ast/types/node-types";
import { Node } from "../../ast/types/ast";
import { Operator } from "../../ast/types/blocks-and-statements";

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
    case NodeType.BinaryExpression: {
      const { left, operator, right } = node;
      const { currentType: leftType, errors: leftErrors } = check(left);
      if (leftErrors.length > 0)
        return { currentType: null, errors: leftErrors };
      const { currentType: rightType, errors: rightErrors } = check(right);
      if (rightErrors.length > 0)
        return { currentType: null, errors: rightErrors };

      switch (operator) {
        case Operator.PLUS:
          if (leftType instanceof String && rightType instanceof String)
            return newResult(new String());
        case Operator.MINUS:
          if (leftType instanceof Int && rightType instanceof Int)
            return newResult(new Int());
          if (leftType instanceof Int && rightType instanceof String)
            return newResult(new String());
          if (leftType instanceof String && rightType instanceof Int)
            return newResult(new String());
          return newResult(null, [new BadOperandTypesError()]);
        case Operator.TIMES:
        case Operator.DIVIDE:
          if (leftType instanceof Int && rightType instanceof Int)
            return newResult(new Int());
          return newResult(null, [new BadOperandTypesError()]);
        default:
          throw new Error(
            `Unrecgonized operator ${operator} found in binary expression.`
          );
      }
    }
    case NodeType.CompilationUnit: {
      const blockStatements =
        node.topLevelClassOrInterfaceDeclarations[0].classBody[0].methodBody;
      const errors = blockStatements.flatMap((blockStatement) => {
        return check(blockStatement).errors;
      });
      return { currentType: null, errors };
    }
    case NodeType.Literal: {
      const {
        literalType: { kind, value },
      } = node;
      switch (kind) {
        case LiteralType.BinaryIntegerLiteral:
          throw new Error(`Not implemented yet.`);
        case LiteralType.BooleanLiteral:
          throw new Error(`Not implemented yet.`);
        case LiteralType.CharacterLiteral:
          throw new Error(`Not implemented yet.`);
        case LiteralType.DecimalFloatingPointLiteral:
          throw new Error(`Not implemented yet.`);
        case LiteralType.DecimalIntegerLiteral: {
          const type = Int.from(value);
          return type instanceof Error
            ? newResult(null, [type])
            : newResult(type);
        }
        case LiteralType.HexIntegerLiteral:
          throw new Error(`Not implemented yet.`);
        case LiteralType.HexadecimalFloatingPointLiteral:
          throw new Error(`Not implemented yet.`);
        case LiteralType.NullLiteral:
          throw new Error(`Not implemented yet.`);
        case LiteralType.OctalIntegerLiteral:
          throw new Error(`Not implemented yet.`);
        case LiteralType.StringLiteral:
          return newResult(String.from(value));
        default:
          throw new Error(
            `Unrecgonized literal type ${kind} found in literal.`
          );
      }
    }
    case NodeType.LocalVariableDeclarationStatement: {
      const { variableInitializer } = node.variableDeclarationList;
      const { currentType, errors } = check(variableInitializer);
      if (currentType == null)
        throw new Error(
          "Variable initializer in local variable declaration statement should return a type."
        );
      if (errors.length > 0) return { currentType: null, errors };
      if (currentType.name !== node.localVariableType)
        return newResult(null, [new IncompatibleTypesError()]);
      return OK_RESULT;
    }
    case NodeType.PrefixExpression: {
      const { operator, expression } = node;
      switch (operator) {
        case Operator.MINUS: {
          if (
            expression.kind === NodeType.Literal &&
            expression.literalType.kind === LiteralType.DecimalIntegerLiteral
          ) {
            const integerString = Operator.MINUS + expression.literalType.value;
            const type = Int.from(integerString);
            return type instanceof Error
              ? newResult(null, [type])
              : newResult(type);
          }
        }
        case Operator.PLUS:
          return check(expression);
        default:
          throw new Error(
            `Unrecgonized operator ${operator} found in prefix expression.`
          );
      }
    }
    default:
      throw new Error(
        `Node type ${node.kind} is not recgonized by type checker.`
      );
  }
};
