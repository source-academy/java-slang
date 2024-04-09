export const isArrayType = (typeDeclaration: string): boolean => {
  typeDeclaration = typeDeclaration.trim()
  if (typeDeclaration.length < 2) return false
  const arraySuffix = typeDeclaration.slice(-2)
  return arraySuffix === '[]'
}

export const removeArraySuffix = (typeDeclaration: string): string => {
  typeDeclaration = typeDeclaration.trim()
  if (!isArrayType(typeDeclaration)) return typeDeclaration
  return typeDeclaration.substring(0, typeDeclaration.length - 2)
}
