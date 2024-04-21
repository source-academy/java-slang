import { Location } from '../ast/specificationTypes'
import { IncompatibleTypesError, SelectorTypeNotAllowedError, TypeCheckerError } from '../errors'
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
