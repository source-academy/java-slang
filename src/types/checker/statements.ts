import { Location } from '../ast/specificationTypes'
import { SelectorTypeNotAllowedError, TypeCheckerError } from '../errors'
import { Type } from '../types/type'
import { isPrimitiveIntegralType, isPrimitiveLongType, isReferenceType } from '../types/utils'

export const checkSwitchExpression = (
  expressionType: Type,
  location: Location
): null | TypeCheckerError => {
  if (isPrimitiveIntegralType(expressionType) && !isPrimitiveLongType(expressionType)) return null
  if (isReferenceType(expressionType)) return null
  return new SelectorTypeNotAllowedError(location)
}
