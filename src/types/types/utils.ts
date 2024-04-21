import { TypeCheckerInternalError } from '../errors'
import * as References from './references'
import * as Primitives from './primitives'
import { ReferenceType, Type } from './type'

export const isPrimitiveBooleanType = (type: Type): boolean => {
  return type instanceof Primitives.Boolean
}

export const isPrimitiveBooleanTypeConvertible = (type: Type): boolean => {
  return (
    isPrimitiveNumericTypeConvertible(type) ||
    isReferenceType(type) ||
    type instanceof References.Boolean
  )
}

export const isPrimitiveDoubleType = (type: Type): boolean => {
  return type instanceof Primitives.Double
}

export const isPrimitiveFloatingPointType = (type: Type): boolean => {
  return type instanceof Primitives.Float || type instanceof Primitives.Double
}

export const isPrimitiveFloatType = (type: Type): boolean => {
  return type instanceof Primitives.Float
}

export const isPrimitiveIntegralType = (type: Type): boolean => {
  return (
    type instanceof Primitives.Byte ||
    type instanceof Primitives.Short ||
    type instanceof Primitives.Int ||
    type instanceof Primitives.Long ||
    type instanceof Primitives.Char
  )
}

export const isPrimitiveIntegralTypeConvertible = (type: Type): boolean => {
  return (
    type instanceof References.Byte ||
    type instanceof References.Short ||
    type instanceof References.Integer ||
    type instanceof References.Long ||
    type instanceof References.Character
  )
}

export const isPrimitiveLongType = (type: Type): boolean => {
  return type instanceof Primitives.Long
}

export const isPrimitiveNumericType = (type: Type): boolean => {
  return isPrimitiveIntegralType(type) || isPrimitiveFloatingPointType(type)
}

export const isPrimitiveNumericTypeConvertible = (type: Type): boolean => {
  return (
    type instanceof References.Boolean ||
    type instanceof References.Byte ||
    type instanceof References.Short ||
    type instanceof References.Character ||
    type instanceof References.Integer ||
    type instanceof References.Long ||
    type instanceof References.Float ||
    type instanceof References.Double
  )
}

export const isStringType = (type: Type): boolean => {
  return type instanceof References.String
}

export const isStringTypeConvertible = (type: Type): boolean => {
  return isPrimitiveBooleanType(type) || isPrimitiveNumericType(type) || isReferenceType(type)
}

export const isReferenceBooleanType = (type: Type): boolean => {
  return type instanceof References.Boolean
}

export const isReferenceType = (type: Type): boolean => {
  return type instanceof ReferenceType
}

// TODO: Update for numeric choice context
export const numericPromotion = (...types: Type[]): Type[] => {
  for (let i = 0; i < types.length; i++) {
    if (isReferenceType(types[i])) types[i] = unboxReferenceType(types[i])
  }
  const hasDoubleType = types.filter(type => type instanceof Primitives.Double).length > 0
  if (hasDoubleType) {
    return types.map(_ => new Primitives.Double())
  }
  const hasFloatType = types.filter(type => type instanceof Primitives.Float).length > 0
  if (hasFloatType) {
    return types.map(_ => new Primitives.Float())
  }
  const hasLongType = types.filter(type => type instanceof Primitives.Long).length > 0
  if (hasLongType) {
    return types.map(_ => new Primitives.Long())
  }
  return types.map(_ => new Primitives.Int())
}

export const unboxReferenceType = (type: Type): Type => {
  if (type instanceof References.Boolean) return new Primitives.Boolean()
  if (type instanceof References.Byte) return new Primitives.Byte()
  if (type instanceof References.Short) return new Primitives.Short()
  if (type instanceof References.Character) return new Primitives.Char()
  if (type instanceof References.Integer) return new Primitives.Int()
  if (type instanceof References.Long) return new Primitives.Long()
  if (type instanceof References.Float) return new Primitives.Float()
  if (type instanceof References.Double) return new Primitives.Double()
  throw new TypeCheckerInternalError('Trying to unbox invalid reference type')
}
