import { Identifier } from '../ast/specificationTypes'
import {
  BadOperandTypesError,
  TypeCheckerError,
  TypeCheckerInternalError,
  UnexpectedTypeError
} from '../errors'
import { Type } from '../types/type'
import * as Primitives from '../types/primitives'
import * as References from '../types/references'
import {
  isPrimitiveBooleanType,
  isPrimitiveBooleanTypeConvertible,
  isPrimitiveDoubleType,
  isPrimitiveFloatType,
  isPrimitiveIntegralType,
  isPrimitiveIntegralTypeConvertible,
  isPrimitiveLongType,
  isPrimitiveNumericType,
  isPrimitiveNumericTypeConvertible,
  isReferenceBooleanType,
  isReferenceType,
  isStringType,
  isStringTypeConvertible,
  numericPromotion,
  unboxReferenceType
} from '../types/utils'

export const checkBinaryOperation = (
  leftType: Type,
  operator: Identifier,
  rightType: Type
): Type | TypeCheckerError => {
  switch (operator.identifier) {
    case '<':
    case '<=':
    case '>':
    case '>=': {
      if (
        (isPrimitiveNumericType(leftType) && isPrimitiveNumericType(rightType)) ||
        (isPrimitiveNumericTypeConvertible(leftType) && isPrimitiveNumericType(rightType)) ||
        (isPrimitiveNumericType(leftType) && isPrimitiveNumericTypeConvertible(rightType))
      ) {
        return new Primitives.Boolean()
      }
      return new BadOperandTypesError(operator.location)
    }
    case '==':
    case '!=': {
      if (
        (isPrimitiveNumericType(leftType) && isPrimitiveNumericType(rightType)) ||
        (isPrimitiveNumericType(leftType) && isPrimitiveNumericTypeConvertible(rightType)) ||
        (isPrimitiveNumericTypeConvertible(leftType) && isPrimitiveNumericType(rightType)) ||
        (isPrimitiveBooleanType(leftType) && isPrimitiveBooleanType(rightType)) ||
        (isPrimitiveBooleanType(leftType) && isPrimitiveBooleanTypeConvertible(rightType)) ||
        (isPrimitiveBooleanTypeConvertible(leftType) && isPrimitiveBooleanType(rightType)) ||
        (isReferenceType(leftType) && isReferenceType(rightType))
      ) {
        return new Primitives.Boolean()
      }
      return new BadOperandTypesError(operator.location)
    }
    case '+': {
      if (
        (isStringType(leftType) && isStringType(rightType)) ||
        (isStringType(leftType) && isStringTypeConvertible(rightType)) ||
        (isStringTypeConvertible(leftType) && isStringType(rightType))
      ) {
        return new References.String()
      }
    }
    case '*':
    case '/':
    case '%':
    case '-':
    case '&':
    case '^':
    case '|': {
      if (
        (isPrimitiveNumericType(leftType) && isPrimitiveNumericType(rightType)) ||
        (isPrimitiveNumericTypeConvertible(leftType) && isPrimitiveNumericType(rightType)) ||
        (isPrimitiveNumericType(leftType) && isPrimitiveNumericTypeConvertible(rightType))
      ) {
        leftType = isReferenceType(leftType) ? unboxReferenceType(leftType) : leftType
        rightType = isReferenceType(leftType) ? unboxReferenceType(leftType) : leftType
        return isPrimitiveDoubleType(leftType) || isPrimitiveDoubleType(rightType)
          ? new Primitives.Double()
          : isPrimitiveFloatType(leftType) || isPrimitiveFloatType(rightType)
            ? new Primitives.Float()
            : isPrimitiveLongType(leftType) || isPrimitiveLongType(rightType)
              ? new Primitives.Long()
              : new Primitives.Int()
      }
      return new BadOperandTypesError(operator.location)
    }
    case '<<':
    case '>>':
    case '>>>': {
      if (
        (isPrimitiveIntegralType(leftType) && isPrimitiveIntegralType(rightType)) ||
        (isPrimitiveIntegralTypeConvertible(leftType) && isPrimitiveIntegralType(rightType)) ||
        (isPrimitiveIntegralType(leftType) && isPrimitiveIntegralTypeConvertible(rightType))
      ) {
        leftType = isReferenceType(leftType) ? unboxReferenceType(leftType) : leftType
        rightType = isReferenceType(leftType) ? unboxReferenceType(leftType) : leftType
        return isPrimitiveLongType(leftType) ? new Primitives.Long() : new Primitives.Int()
      }
      return new BadOperandTypesError(operator.location)
    }
    case '&&':
    case '||': {
      if (
        (isPrimitiveBooleanType(leftType) || isReferenceBooleanType(leftType)) &&
        (isPrimitiveBooleanType(rightType) || isReferenceBooleanType(rightType))
      ) {
        return new Primitives.Boolean()
      }
      return new BadOperandTypesError(operator.location)
    }
    default:
      return new TypeCheckerInternalError('Not implemented', operator.location)
  }
}

export const checkPostfixOperation = (
  type: Type,
  operator: Identifier
): Type | TypeCheckerError => {
  switch (operator.identifier) {
    case '++':
    case '--': {
      if (isPrimitiveNumericType(type) || isPrimitiveNumericTypeConvertible(type)) {
        if (isReferenceType(type)) type = unboxReferenceType(type)
        return type
      }
      return new UnexpectedTypeError(operator.location)
    }
    default:
      return new TypeCheckerInternalError('Not implemented', operator.location)
  }
}

export const checkUnaryOperation = (operator: Identifier, type: Type): Type | TypeCheckerError => {
  switch (operator.identifier) {
    case '+':
    case '-': {
      if (isPrimitiveNumericType(type) || isPrimitiveNumericTypeConvertible(type)) {
        type = numericPromotion(type)[0]
        return type
      }
      return new UnexpectedTypeError(operator.location)
    }
    case '++':
    case '--': {
      if (isPrimitiveNumericType(type) || isPrimitiveNumericTypeConvertible(type)) {
        return type
      }
      return new UnexpectedTypeError(operator.location)
    }
    case '~': {
      if (isPrimitiveIntegralType(type) || isPrimitiveIntegralTypeConvertible(type)) {
        return numericPromotion(type)[0]
      }
    }
    case '!': {
      if (isPrimitiveBooleanType(type) || isPrimitiveBooleanTypeConvertible(type)) {
        return new Primitives.Boolean()
      }
      return new UnexpectedTypeError(operator.location)
    }
    default:
      return new TypeCheckerInternalError('Not implemented', operator.location)
  }
}
