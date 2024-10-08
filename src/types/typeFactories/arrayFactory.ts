import { Array as ArrayType } from '../types/arrays'
import { Expression, VariableInitializer, Location } from '../ast/specificationTypes'
import { IncompatibleTypesError, TypeCheckerError } from '../errors'
import { Type } from '../types/type'

export const createArrayType = (
  declaredType: Type,
  variableInitializer: VariableInitializer,
  checkExpression: (expression: Expression) => Type | TypeCheckerError,
  location?: Location
): Type | TypeCheckerError => {
  const isArrayInitializer = variableInitializer.kind === 'ArrayInitializer'
  const isDeclaredTypeArray = declaredType instanceof ArrayType
  if (!isDeclaredTypeArray && isArrayInitializer) return new IncompatibleTypesError(location)

  if (isDeclaredTypeArray && !isArrayInitializer) {
    const type = checkExpression(variableInitializer)
    if (type instanceof TypeCheckerError) return type
    if (!declaredType.canBeAssigned(type)) return new IncompatibleTypesError(location)
    return declaredType
  }

  if (!isDeclaredTypeArray && !isArrayInitializer) {
    const type = checkExpression(variableInitializer)
    if (type instanceof TypeCheckerError) return type
    if (!declaredType.canBeAssigned(type)) return new IncompatibleTypesError(location)
    return type
  }

  if (isDeclaredTypeArray && isArrayInitializer) {
    const arrayContentType = declaredType.getContentType()
    if (!variableInitializer.variableInitializerList) return declaredType
    for (const initializer of variableInitializer.variableInitializerList.variableInitializers) {
      const type = createArrayType(
        arrayContentType,
        initializer,
        checkExpression,
        initializer.location
      )
      if (type instanceof TypeCheckerError) return type
    }
  }

  return declaredType
}
