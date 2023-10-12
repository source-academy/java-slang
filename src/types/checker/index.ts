import { BadOperandTypesError } from "../errors";
import { Integer, String, Type } from "../types";
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
          if (leftType instanceof Integer && rightType instanceof Integer)
            return newResult(new Integer());
          if (leftType instanceof Integer && rightType instanceof String)
            return newResult(new String());
          if (leftType instanceof String && rightType instanceof Integer)
            return newResult(new String());
          return newResult(null, [new BadOperandTypesError()]);
        case Operator.TIMES:
        case Operator.DIVIDE:
          if (leftType instanceof Integer && rightType instanceof Integer)
            return newResult(new Integer());
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
          const type = Integer.from(value);
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
      const { errors } = check(variableInitializer);
      if (errors.length > 0) return { currentType: null, errors };
      // TODO: Check variable initializer type against variable declaration type.
      return OK_RESULT;
    }
    default:
      throw new Error("Node type cannot is not recgonized by type checker.");
  }
};
