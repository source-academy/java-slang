import { Location } from '../ast/specificationTypes'
import { ClassImpl } from './classes'
import * as Primitives from './primitives'
import { Type, TypeImpl } from './type'

export class Boolean extends ClassImpl {
  constructor() {
    super('Boolean')
  }

  public canBeAssigned(type: Type): boolean {
    return super.canBeAssigned(type) || type instanceof Primitives.Boolean
  }
}

export class Byte extends ClassImpl {
  constructor() {
    super('Byte')
  }

  public canBeAssigned(type: Type): boolean {
    return super.canBeAssigned(type) || type instanceof Primitives.Byte
  }
}

export class Character extends ClassImpl {
  constructor() {
    super('Character')
  }

  public canBeAssigned(type: Type): boolean {
    return super.canBeAssigned(type) || type instanceof Primitives.Char
  }
}

export class Double extends ClassImpl {
  constructor() {
    super('Double')
  }

  public canBeAssigned(type: Type): boolean {
    return super.canBeAssigned(type) || type instanceof Primitives.Double
  }
}

export class Float extends ClassImpl {
  constructor() {
    super('Float')
  }

  public canBeAssigned(type: Type): boolean {
    return super.canBeAssigned(type) || type instanceof Primitives.Float
  }
}

export class Integer extends ClassImpl {
  constructor() {
    super('Integer')
  }

  public canBeAssigned(type: Type): boolean {
    return super.canBeAssigned(type) || type instanceof Primitives.Int
  }

  public equals(object: unknown): boolean {
    return object instanceof Integer
  }
}

export class Long extends ClassImpl {
  constructor() {
    super('Long')
  }

  public canBeAssigned(type: Type): boolean {
    return super.canBeAssigned(type) || type instanceof Primitives.Long
  }
}

export class Short extends ClassImpl {
  constructor() {
    super('Short')
  }

  public canBeAssigned(type: Type): boolean {
    return super.canBeAssigned(type) || type instanceof Primitives.Short
  }
}

export class String extends ClassImpl {
  constructor() {
    super('String')
  }

  public static from(value: string, _location: Location): String {
    if (value.charAt(0) !== '"') throw new Error(`Unrecognized string ${value}.`)
    if (value.charAt(value.length - 1) !== '"') throw new Error(`Unrecognized string ${value}.`)
    if (
      value.length > 6 &&
      value.substring(0, 3) === '"""' &&
      value.substring(value.length - 3, value.length) !== '"""'
    )
      throw new Error(`Unrecognized string ${value}.`)
    return new String()
  }
}

export class Void extends TypeImpl {
  constructor() {
    super('void')
  }

  public canBeAssigned(type: Type): boolean {
    return type instanceof Void
  }
}
