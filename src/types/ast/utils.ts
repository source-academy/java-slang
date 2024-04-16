import { IToken } from 'java-parser'
import { Dim, Identifier, Location, NumericType, TypeName } from './specificationTypes'

export const getDimArray = (tokens: IToken[]): Dim[] => {
  return tokens.map(token => ({
    kind: 'Dim',
    location: getLocation(token)
  }))
}

export const getIdentifier = (object: IToken): Identifier => ({
  kind: 'Identifier',
  identifier: object.image,
  location: getLocation(object)
})

export const getLocation = (object: Location): Location => ({
  startLine: object.startLine,
  startOffset: object.startOffset,
  endColumn: object.endColumn,
  endLine: object.endLine,
  endOffset: object.endOffset,
  startColumn: object.startColumn
})

export const getNode = (object: IToken) => ({
  kind: object.image.charAt(0).toUpperCase() + object.image.substring(1),
  location: getLocation(object)
})

type GetableTypeIdentifier = NumericType | TypeName
const INTEGRAL_TYPES = ['byte', 'short', 'int', 'long', 'char']
const FLOATING_POINT_TYPES = ['float', 'double']
export const getTypeIdentifier = (object: IToken): GetableTypeIdentifier => {
  const typeString = object.image
  if (FLOATING_POINT_TYPES.includes(typeString)) {
    return {
      kind: 'FloatingPointType',
      identifier: getIdentifier(object),
      location: getLocation(object)
    }
  }
  if (INTEGRAL_TYPES.includes(typeString)) {
    return {
      kind: 'IntegralType',
      identifier: getIdentifier(object),
      location: getLocation(object)
    }
  }
  return getIdentifier(object)
}

export const isIdentifier = (object: Record<string, any>): boolean => {
  return object['kind'] && object['kind'] === 'Identifier'
}
