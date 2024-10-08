import { Location } from '../ast/specificationTypes'
import { ClassType } from './classes'
import { Method } from './methods'
import * as Primitives from './primitives'
import { Type, PrimitiveType } from './type'

export class Boolean extends ClassType {
  constructor() {
    super('Boolean')
  }

  public canBeAssigned(type: Type): boolean {
    return super.canBeAssigned(type) || type instanceof Primitives.Boolean
  }
}

export class Byte extends ClassType {
  constructor() {
    super('Byte')
  }

  public canBeAssigned(type: Type): boolean {
    return super.canBeAssigned(type) || type instanceof Primitives.Byte
  }
}

export class Character extends ClassType {
  constructor() {
    super('Character')
  }

  public canBeAssigned(type: Type): boolean {
    return super.canBeAssigned(type) || type instanceof Primitives.Char
  }
}

export class Double extends ClassType {
  constructor() {
    super('Double')
  }

  public canBeAssigned(type: Type): boolean {
    return super.canBeAssigned(type) || type instanceof Primitives.Double
  }
}

export class Float extends ClassType {
  constructor() {
    super('Float')
  }

  public canBeAssigned(type: Type): boolean {
    return super.canBeAssigned(type) || type instanceof Primitives.Float
  }
}

export class Integer extends ClassType {
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

export class Long extends ClassType {
  constructor() {
    super('Long')
  }

  public canBeAssigned(type: Type): boolean {
    return super.canBeAssigned(type) || type instanceof Primitives.Long
  }
}

export class Short extends ClassType {
  constructor() {
    super('Short')
  }

  public canBeAssigned(type: Type): boolean {
    return super.canBeAssigned(type) || type instanceof Primitives.Short
  }
}

export class String extends ClassType {
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

  public canBeAssigned(type: Type): boolean {
    if (type instanceof Primitives.Null) return true
    return type instanceof String
  }
}

export class Throwable extends ClassType {
  constructor() {
    super('Throwable')
    this.addConstructor(new Method('Throwable', this), { startLine: -1, startOffset: -1 })
  }
}

export class Exception extends ClassType {
  constructor() {
    super('Exception')
    this.setParentClass(new Throwable())
    this.addConstructor(new Method('Exception', this), { startLine: -1, startOffset: -1 })
  }
}

export class Void extends PrimitiveType {
  constructor() {
    super('void')
  }

  public canBeAssigned(type: Type): boolean {
    return type instanceof Void
  }
}
