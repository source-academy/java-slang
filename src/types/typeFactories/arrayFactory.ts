import { Array as ArrayType } from '../types/arrays'
import { Expression, VariableInitializer } from '../ast/types/blocks-and-statements'
import { IncompatibleTypesError } from '../errors'
import { Location } from '../ast/types'
import { Type } from '../types/type'

export const createArrayType = (
  declaredType: Type,
  variableInitializer: VariableInitializer,
  checkExpression: (expression: Expression) => Type | Error,
  location?: Location
): Type | Error => {
  const isArrayInitializer = Array.isArray(variableInitializer)
  const isDeclaredTypeArray = declaredType instanceof ArrayType
  if (!isDeclaredTypeArray && isArrayInitializer) return new IncompatibleTypesError(location)

  if (isDeclaredTypeArray && !isArrayInitializer) {
    const type = checkExpression(variableInitializer)
    if (type instanceof Error) return type
    if (!declaredType.canBeAssigned(type)) return new IncompatibleTypesError(location)
    return declaredType
  }

  if (!isDeclaredTypeArray && !isArrayInitializer) {
    const type = checkExpression(variableInitializer)
    if (type instanceof Error) return type
    if (!declaredType.canBeAssigned(type)) return new IncompatibleTypesError(location)
    return type
  }

  if (isDeclaredTypeArray && isArrayInitializer) {
    const arrayContentType = declaredType.getContentType()
    for (const initializer of variableInitializer) {
      if (Array.isArray(initializer)) {
        const type = createArrayType(arrayContentType, initializer, checkExpression, location)
        if (type instanceof Error) return type
      } else {
        const type = createArrayType(
          arrayContentType,
          initializer,
          checkExpression,
          initializer.location
        )
        if (type instanceof Error) return type
      }
    }
  }

  return declaredType
}
