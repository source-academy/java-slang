import { Location } from '../ast/specificationTypes'
import { IntegerTooLargeError, TypeCheckerError } from '../errors'
import { Type } from './type'

export class Boolean extends Type {
  constructor() {
    super('boolean')
  }

  public static from(value: string, _location: Location): Boolean | TypeCheckerError {
    if (!['true', 'false'].includes(value)) throw new Error(`Unrecognized boolean ${value}.`)
    return new Boolean()
  }

  public canBeAssigned(type: Type): boolean {
    return type instanceof Boolean
  }
}

export class Byte extends Type {
  private static BYTE_MAX = 127
  private static BYTE_MIN = -128
  constructor() {
    super('byte')
  }

  public static from(value: string, location: Location): Byte | TypeCheckerError {
    const isNegative = value.startsWith('-')
    if (isNegative) value = value.substring(1)
    value = value.replace(/_/g, '').toLowerCase()
    const base = getNumericBase(value)
    value = removeNumericBasePrefix(value, base)
    let byte = parseInt(value, base)
    byte = isNegative ? byte * -1 : byte
    if (byte > this.BYTE_MAX) return new IntegerTooLargeError(location)
    if (byte < this.BYTE_MIN) return new IntegerTooLargeError(location)
    return new Byte()
  }

  public canBeAssigned(type: Type): boolean {
    return type instanceof Byte
  }
}

export class Char extends Type {
  constructor() {
    super('char')
  }

  public static from(value: string, _location: Location): Char | TypeCheckerError {
    if (value.charAt(0) !== "'") throw new Error(`Unrecognized character ${value}.`)
    if (value.charAt(value.length - 1) !== "'") throw new Error(`Unrecognized character ${value}.`)
    return new Char()
  }

  public canBeAssigned(type: Type): boolean {
    return type instanceof Char || type instanceof Short || type instanceof Byte
  }
}

export class Double extends Type {
  constructor() {
    super('double')
  }

  public static from(value: number | string, _location: Location): Double | TypeCheckerError {
    if (typeof value === 'string') {
      value = removeFloatTypeSuffix(value)
      const isNegative = value.startsWith('-')
      if (isNegative) value = value.substring(1)
      value = value.replace(/_/g, '').toLowerCase()
      const base = getNumericBase(value)
      base === 16 ? parseHexFloat(value) : Number(value)
    }
    return new Double()
  }

  public canBeAssigned(type: Type): boolean {
    return (
      type instanceof Double ||
      type instanceof Float ||
      type instanceof Long ||
      type instanceof Int ||
      type instanceof Char ||
      type instanceof Short ||
      type instanceof Byte
    )
  }
}

export class Float extends Type {
  constructor() {
    super('float')
  }

  public static from(value: number | string, _location: Location): Float | TypeCheckerError {
    if (typeof value === 'string') {
      value = removeFloatTypeSuffix(value)
      const isNegative = value.startsWith('-')
      if (isNegative) value = value.substring(1)
      value = value.replace(/_/g, '').toLowerCase()
      const base = getNumericBase(value)
      base === 16 ? parseHexFloat(value) : Number(value)
    }
    return new Float()
  }

  public canBeAssigned(type: Type): boolean {
    return (
      type instanceof Float ||
      type instanceof Long ||
      type instanceof Int ||
      type instanceof Char ||
      type instanceof Short ||
      type instanceof Byte
    )
  }
}

export class Int extends Type {
  private static INTEGER_MAX = 2147483647
  private static INTEGER_MIN = -2147483648
  constructor() {
    super('int')
  }

  public static from(value: string, location: Location): Int | TypeCheckerError {
    const isNegative = value.startsWith('-')
    if (isNegative) value = value.substring(1)
    value = value.replace(/_/g, '').toLowerCase()
    const base = getNumericBase(value)
    value = removeNumericBasePrefix(value, base)
    let int = parseInt(value, base)
    int = isNegative ? int * -1 : int
    if (int > this.INTEGER_MAX) return new IntegerTooLargeError(location)
    if (int < this.INTEGER_MIN) return new IntegerTooLargeError(location)
    return new Int()
  }

  public canBeAssigned(type: Type): boolean {
    return (
      type instanceof Int || type instanceof Char || type instanceof Short || type instanceof Byte
    )
  }

  public equals(object: unknown): boolean {
    return object instanceof Int
  }
}

export class Long extends Type {
  private static LONG_MAX = BigInt('9223372036854775807')
  private static LONG_MIN = BigInt('-9223372036854775808')
  constructor() {
    super('long')
  }

  public static from(value: string, location: Location): Long | TypeCheckerError {
    const isNegative = value.startsWith('-')
    if (isNegative) value = value.substring(1)
    value = value.replace(/(_|l|L)/g, '').toLowerCase()
    if (getNumericBase(value) === 8) value = '0o' + removeNumericBasePrefix(value, 8)
    const long = BigInt(value) * BigInt(isNegative ? -1 : 1)
    if (long > this.LONG_MAX) return new IntegerTooLargeError(location)
    if (long < this.LONG_MIN) return new IntegerTooLargeError(location)
    return new Long()
  }

  public canBeAssigned(type: Type): boolean {
    return (
      type instanceof Long ||
      type instanceof Int ||
      type instanceof Char ||
      type instanceof Short ||
      type instanceof Byte
    )
  }
}

export class Null extends Type {
  constructor() {
    super('null')
  }

  public static from(value: string, _location: Location): Null {
    if (value !== 'null') throw new Error(`Unrecognized null ${value}.`)
    return new Null()
  }

  public canBeAssigned(_type: Type): boolean {
    return false
  }
}

export class Short extends Type {
  private static SHORT_MAX = 32767
  private static SHORT_MIN = -32768
  constructor() {
    super('short')
  }

  public static from(value: string, location: Location): Short | TypeCheckerError {
    const isNegative = value.startsWith('-')
    if (isNegative) value = value.substring(1)
    value = value.replace(/_/g, '').toLowerCase()
    const base = getNumericBase(value)
    value = removeNumericBasePrefix(value, base)
    let short = parseInt(value, base)
    short = isNegative ? short * -1 : short
    if (short > this.SHORT_MAX) return new IntegerTooLargeError(location)
    if (short < this.SHORT_MIN) return new IntegerTooLargeError(location)
    return new Short()
  }

  public canBeAssigned(type: Type): boolean {
    return type instanceof Short || type instanceof Byte
  }
}

type NumberType = 'long' | 'int'

export const getNumberType = (number: string): NumberType => {
  const lastCharacter = number.toLowerCase().charAt(number.length - 1)
  if (lastCharacter === 'l') return 'long'
  return 'int'
}

type NumericBase = 2 | 8 | 10 | 16

const getNumericBase = (number: string): NumericBase => {
  if (number.length < 2) return 10
  const firstCharacter = number.charAt(0)
  if (firstCharacter !== '0') return 10
  const secondCharacter = number.charAt(1).toLowerCase()
  if (secondCharacter === 'b') return 2
  else if (secondCharacter === 'x') return 16
  else return 8
}

const removeNumericBasePrefix = (number: string, base: number): string => {
  if (base === 2 || base === 16) return number.substring(2)
  if (base === 8) return number.substring(1)
  return number
}

type FloatType = 'double' | 'float'

export const getFloatType = (float: string): FloatType => {
  const lastCharacter = float.toLowerCase().charAt(float.length - 1)
  if (lastCharacter === 'f') return 'float'
  return 'double'
}

const removeFloatTypeSuffix = (float: string): string => {
  const lastCharacter = float.toLowerCase().charAt(float.length - 1)
  if (['d', 'f'].includes(lastCharacter)) return float.substring(0, float.length - 1)
  return float
}

const parseHexFloat = (float: string) => {
  float = float.toLowerCase().replace(/_/g, '')
  let floatTypeSuffix = float.charAt(-1)
  if (!['d', 'f'].includes(floatTypeSuffix)) floatTypeSuffix = 'd'
  else float = float.substring(0, float.length - 1)
  const [hexSignificandString, exponentIntegerString] = float.split('p')
  const exponentInteger = Number(exponentIntegerString)
  const parts = hexSignificandString.split('.')
  let number = parseInt(parts[0].length > 2 ? parts[0] : '0', 16)
  if (parts[1]) number += parseInt(parts[1], 16) / Math.pow(16, parts[1].length)
  return number * Math.pow(2, exponentInteger)
}
