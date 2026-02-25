import { Location } from '../ast/specificationTypes'
import {
  ExceptionHasAlreadyBeenCaughtError,
  IncompatibleTypesError,
  SelectorTypeNotAllowedError,
  TypeCheckerError
} from '../errors'
import { Throwable } from '../types/references'
import { Type } from '../types/type'
import {
  isPrimitiveBooleanType,
  isPrimitiveIntegralType,
  isPrimitiveLongType,
  isReferenceBooleanType,
  isReferenceType
} from '../types/utils'

export const checkDoExpression = (
  expressionType: Type,
  location: Location
): null | TypeCheckerError => {
  if (isPrimitiveBooleanType(expressionType) || isReferenceBooleanType(expressionType)) return null
  return new IncompatibleTypesError(location)
}

export const checkSwitchExpression = (
  expressionType: Type,
  location: Location
): null | TypeCheckerError => {
  if (isPrimitiveIntegralType(expressionType) && !isPrimitiveLongType(expressionType)) return null
  if (isReferenceType(expressionType)) return null
  return new SelectorTypeNotAllowedError(location)
}

export const checkTryCatchType = (
  catchType: Type,
  caughtTypeList: Type[],
  location: Location
): null | TypeCheckerError => {
  for (const caughtType of caughtTypeList) {
    if (!caughtType.canBeAssigned(catchType)) continue
    return new ExceptionHasAlreadyBeenCaughtError(location)
  }
  if (new Throwable().canBeAssigned(catchType)) return null
  return new IncompatibleTypesError(location)
}
