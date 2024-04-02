import { ExpressionName } from "../../ast/types/blocks-and-statements";
import { Frame } from "./environment";
import { Method } from "../types/methods";
import { Node } from "../../ast/types/ast";
import { String } from "../types/nonPrimitives";
import { Type } from "../types/type";
import {
  BadOperandTypesError,
  IncompatibleTypesError,
  VariableAlreadyDefinedError,
} from "../errors";
import {
  createArgumentList,
  createMethod,
  createMethodSignature,
} from "../typeFactories/methodFactory";
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

const newResult = (
  currentType: Type | null = null,
  errors: Error[] = []
): Result => ({ currentType, errors });

const OK_RESULT: Result = newResult(null);

export const check = (
  node: Node,
  frame: Frame = Frame.globalFrame()
): Result => {
  switch (node.kind) {
    case "Assignment": {
      const left = node.left as ExpressionName;
      const right = node.right;
      const leftType = frame.getVariable(left.name);
      if (leftType instanceof Error) return newResult(null, [leftType]);
      const { currentType, errors } = check(right, frame);
      if (errors.length > 0) return newResult(null, errors);
      if (!currentType)
        throw new Error(
          "Right side of assignment statment should return a type."
        );
      if (!leftType.canBeAssigned(currentType))
        return newResult(null, [new IncompatibleTypesError()]);
      return OK_RESULT;
    }
    case "BasicForStatement": {
      const errors: Error[] = [];
      let forConditionFrame: Frame;
      if (Array.isArray(node.forInit)) {
        forConditionFrame = frame;
        node.forInit.forEach((forInit) => {
          const forInitCheck = check(forInit, forConditionFrame);
          errors.push(...forInitCheck.errors);
        });
      } else {
        forConditionFrame = frame.newChildFrame();
        const preCheckErrors = node.forInit.variableDeclaratorList.reduce(
          (errors, { variableDeclaratorId }) =>
            frame.isVariableInFrame(variableDeclaratorId)
              ? [...errors, new VariableAlreadyDefinedError()]
              : errors,
          []
        );
        if (preCheckErrors.length > 0) {
          errors.push(...preCheckErrors);
        } else {
          const forInitCheck = check(node.forInit, forConditionFrame);
          errors.push(...forInitCheck.errors);
        }
      }
      if (node.condition) {
        const conditionCheck = check(node.condition!, forConditionFrame);
        errors.push(...conditionCheck.errors);
      }
      node.forUpdate.forEach((forUpdate) => {
        const checkResult = check(forUpdate, forConditionFrame);
        errors.push(...checkResult.errors);
      });
      const forBodyFrame = forConditionFrame.newChildFrame();
      const bodyCheck = check(node.body, forBodyFrame);
      if (bodyCheck.errors) errors.push(...bodyCheck.errors);
      return newResult(null, errors);
    }
    case "BinaryExpression": {
      const { left, operator, right } = node;
      const { currentType: leftType, errors: leftErrors } = check(left, frame);
      if (leftErrors.length > 0)
        return { currentType: null, errors: leftErrors };
      const { currentType: rightType, errors: rightErrors } = check(
        right,
        frame
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
        case "<":
        case ">":
        case "<=":
        case ">=":
          if (
            doubleType.canBeAssigned(leftType) &&
            doubleType.canBeAssigned(rightType)
          )
            return newResult(new Boolean());
          return newResult(null, [new BadOperandTypesError()]);
        case "&&":
        case "||":
          const booleanType = new Boolean();
          if (
            booleanType.canBeAssigned(leftType) &&
            booleanType.canBeAssigned(rightType)
          )
            return newResult(new Boolean());
          return newResult(null, [new BadOperandTypesError()]);
        case "==":
          if (
            leftType.canBeAssigned(rightType) ||
            rightType.canBeAssigned(leftType)
          )
            return newResult(new Boolean());
          return newResult(null, [new BadOperandTypesError()]);
        default:
          throw new Error(
            `Unrecgonized operator ${operator} found in binary expression.`
          );
      }
    }
    case "Block": {
      const errors: Error[] = [];
      const newFrame = frame.newChildFrame();
      node.blockStatements.forEach((statement) => {
        const result = check(statement, newFrame);
        if (result.errors) errors.push(...result.errors);
      });
      return newResult(null, errors);
    }
    case "BreakStatement": {
      return OK_RESULT;
    }
    case "CompilationUnit": {
      return check(node.topLevelClassOrInterfaceDeclarations[0]);
    }
    case "ContinueStatement": {
      return OK_RESULT;
    }
    case "EmptyStatement": {
      return OK_RESULT;
    }
    case "ExpressionName": {
      const type = frame.getVariable(node.name);
      if (type instanceof Error) return newResult(null, [type]);
      return newResult(type);
    }
    case "ExpressionStatement": {
      return check(node.stmtExp, frame);
    }
    case "IfStatement": {
      const errors: Error[] = [];
      const conditionResult = check(node.condition, frame);
      if (conditionResult.errors) errors.push(...conditionResult.errors);
      const booleanType = new Boolean();
      if (
        conditionResult.currentType &&
        !booleanType.canBeAssigned(conditionResult.currentType)
      )
        errors.push(new IncompatibleTypesError());
      const newFrame = frame.newChildFrame();
      const consequentResult = check(node.consequent, newFrame);
      if (consequentResult.errors) errors.push(...consequentResult.errors);
      return newResult(null, errors);
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
        const declaredType = frame.getType(node.localVariableType);
        if (declaredType instanceof Error)
          return newResult(null, [declaredType]);
        const { variableInitializer } = variableDeclarator;
        if (!variableInitializer)
          throw new Error("Variable initializer is undefined.");
        if (Array.isArray(variableInitializer)) {
          // Is array initializer
        } else {
          // Is not array initializer
          const { currentType, errors } = check(variableInitializer, frame);
          if (errors.length > 0) return { currentType: null, errors };
          if (currentType == null)
            throw new Error(
              "Variable initializer in local variable declaration statement should return a type."
            );
          if (!declaredType.canBeAssigned(currentType))
            return newResult(null, [new IncompatibleTypesError()]);
        }
        const error = frame.setVariable(
          variableDeclarator.variableDeclaratorId,
          declaredType
        );
        if (error) return newResult(null, [error]);
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
    case "MethodInvocation": {
      const errors: Error[] = [];
      const method = frame.getMethod(node.identifier);
      if (method instanceof Error) return newResult(null, [method]);
      const argumentTypes: Type[] = [];
      for (const argument of node.argumentList) {
        const argumentResult = check(argument, frame);
        if (argumentResult.errors.length > 0) {
          errors.push(...argumentResult.errors);
          continue;
        }
        if (!argumentResult.currentType)
          throw new Error("Arguments should have a type.");
        argumentTypes.push(argumentResult.currentType);
      }
      const argumentList = createArgumentList(...argumentTypes);
      if (argumentList instanceof Error)
        return newResult(null, [...errors, argumentList]);
      const returnType = method.invoke(argumentList);
      if (returnType instanceof Error)
        return newResult(null, [...errors, returnType]);
      return newResult(returnType, errors);
    }
    case "NormalClassDeclaration": {
      const errors: Error[] = [];
      const classFrame = frame.newChildFrame();
      const furtherChecks: (() => void)[] = [];
      node.classBody.forEach((bodyDeclaration) => {
        if (bodyDeclaration.kind === "MethodDeclaration") {
          const methodName = bodyDeclaration.methodHeader.identifier;
          if (classFrame.isMethodInFrame(methodName)) {
            const method = classFrame.getMethod(methodName) as Method;
            const overloadSignature = createMethodSignature(
              classFrame,
              bodyDeclaration
            );
            if (overloadSignature instanceof Error) {
              errors.push(overloadSignature);
              return;
            }
            const error = method.addOverload(overloadSignature);
            if (error) errors.push(error);
            furtherChecks.push(() => {
              const methodFrame = classFrame.newChildFrame();
              overloadSignature.mapParameters((name, type) => {
                const error = methodFrame.setVariable(name, type);
                if (error) errors.push(error);
              });
              methodFrame.setReturnType(overloadSignature.getReturnType());
              const checkResult = check(
                bodyDeclaration.methodBody,
                methodFrame
              );
              errors.push(...checkResult.errors);
            });
          } else {
            const method = createMethod(frame, bodyDeclaration);
            if (method instanceof Error) {
              errors.push(method);
              return;
            }
            classFrame.setMethod(methodName, method);
            furtherChecks.push(() => {
              const methodFrame = classFrame.newChildFrame();
              const methodSignature = method.getOverload(0);
              methodSignature.mapParameters((name, type) => {
                const error = methodFrame.setVariable(name, type);
                if (error) errors.push(error);
              });
              methodFrame.setReturnType(methodSignature.getReturnType());
              const checkResult = check(
                bodyDeclaration.methodBody,
                methodFrame
              );
              errors.push(...checkResult.errors);
            });
          }
        }
      });
      furtherChecks.forEach((furtherCheck) => furtherCheck());
      return newResult(null, errors);
    }
    case "PostfixExpression": {
      const expressionCheck = check(node.expression, frame);
      if (expressionCheck.errors.length > 0) return expressionCheck;
      const doubleType = new Double();
      if (!expressionCheck.currentType)
        throw new Error("Expression check did not return a type.");
      if (!doubleType.canBeAssigned(expressionCheck.currentType))
        return newResult(null, [new BadOperandTypesError()]);
      return expressionCheck;
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
                return check(expression, frame);
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
          return check(expression, frame);
        case "!":
          const expressionCheck = check(expression, frame);
          if (expressionCheck.errors.length > 0) return expressionCheck;
          if (!expressionCheck.currentType)
            throw new Error("Type missing in ! prefix expression.");
          const booleanType = new Boolean();
          if (booleanType.canBeAssigned(expressionCheck.currentType))
            return newResult(booleanType);
          return newResult(null, [new BadOperandTypesError()]);
        default:
          throw new Error(
            `Unrecgonized operator ${operator} found in prefix expression.`
          );
      }
    }
    case "ReturnStatement": {
      const expressionCheck = check(node.exp, frame);
      if (expressionCheck.errors.length > 0) return expressionCheck;
      if (!expressionCheck.currentType)
        throw new Error("Expression check should return a type.");
      const returnType = frame.getReturn();
      if (returnType instanceof Error) return newResult(null, [returnType]);
      if (!returnType.canBeAssigned(expressionCheck.currentType))
        return newResult(null, [new IncompatibleTypesError()]);
      return OK_RESULT;
    }
    case "TernaryExpression": {
      const conditionCheck = check(node.condition, frame);
      if (conditionCheck.errors.length > 0) return conditionCheck;
      if (!conditionCheck.currentType)
        throw new Error("Type missing in ternary expresion condition.");
      const booleanType = new Boolean();
      if (!booleanType.canBeAssigned(conditionCheck.currentType))
        return newResult(null, [new BadOperandTypesError()]);
      const consequentCheck = check(node.consequent, frame);
      if (consequentCheck.errors.length > 0) return conditionCheck;
      if (!consequentCheck.currentType)
        throw new Error(
          "Type missing in ternary expresion consequent expression."
        );
      const alternateCheck = check(node.alternate, frame);
      if (alternateCheck.errors.length > 0) return conditionCheck;
      if (!alternateCheck.currentType)
        throw new Error(
          "Type missing in ternary expresion alternate expression."
        );
      if (consequentCheck.currentType.canBeAssigned(alternateCheck.currentType))
        return newResult(consequentCheck.currentType);
      if (alternateCheck.currentType.canBeAssigned(consequentCheck.currentType))
        return newResult(alternateCheck.currentType);
      return newResult(null, [new BadOperandTypesError()]);
    }
    case "WhileStatement": {
      const conditionCheck = check(node.condition, frame);
      if (conditionCheck.errors.length > 0) return conditionCheck;
      if (!conditionCheck.currentType)
        throw new Error("Type missing in ternary expresion condition.");
      const booleanType = new Boolean();
      if (!booleanType.canBeAssigned(conditionCheck.currentType))
        return newResult(null, [new BadOperandTypesError()]);
      const newFrame = frame.newChildFrame();
      const bodyCheck = check(node.body, newFrame);
      if (bodyCheck.errors.length > 0) return bodyCheck;
      return OK_RESULT;
    }
    default:
      throw new Error(
        `Check is not implemented for this type of node ${node.kind}.`
      );
  }
};
