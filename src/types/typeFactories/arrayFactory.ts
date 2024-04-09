import { Array as ArrayType } from '../types/arrays'
import { Expression, VariableInitializer } from '../ast/types/blocks-and-statements'
import { IncompatibleTypesError } from '../errors'
import { Type } from '../types/type'

export const createArrayType = (
  declaredType: Type,
  variableInitializer: VariableInitializer,
  checkExpression: (expression: Expression) => Type | Error
): Type | Error => {
  const isArrayInitializer = Array.isArray(variableInitializer)
  const isDeclaredTypeArray = declaredType instanceof ArrayType
  if (!isDeclaredTypeArray && isArrayInitializer) return new IncompatibleTypesError()

  if (isDeclaredTypeArray && !isArrayInitializer) {
    const type = checkExpression(variableInitializer)
    if (type instanceof Error) return type
    if (!declaredType.canBeAssigned(type)) return new IncompatibleTypesError()
    return declaredType
  }

  if (!isDeclaredTypeArray && !isArrayInitializer) {
    const type = checkExpression(variableInitializer)
    if (type instanceof Error) return type
    if (!declaredType.canBeAssigned(type)) return new IncompatibleTypesError()
    return type
  }

  if (isDeclaredTypeArray && isArrayInitializer) {
    const arrayContentType = declaredType.getContentType()
    for (const initializer of variableInitializer) {
      const type = createArrayType(arrayContentType, initializer, checkExpression)
      if (type instanceof Error) return type
    }
  }

  return declaredType
}
