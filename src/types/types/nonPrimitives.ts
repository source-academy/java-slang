import { CannotBeDereferencedError, CannotFindSymbolError } from '../errors'
import * as Primitives from './primitives'
import { Type } from './type'

export class Class extends Type {
  public className: string
  constructor(className: string) {
    super('class')
    this.className = className
  }

  public accessField(_name: string): Error | Type {
    return new CannotFindSymbolError()
  }

  public canBeAssigned(type: Type): boolean {
    if (type instanceof Primitives.Null) return true
    if (!(type instanceof Class)) return false
    return this.className === type.className
  }
}

export class Boolean extends Class {
  constructor() {
    super('Boolean')
  }

  public accessField(_name: string): Error | Type {
    return new CannotFindSymbolError()
  }

  public canBeAssigned(type: Type): boolean {
    return super.canBeAssigned(type) || type instanceof Primitives.Boolean
  }
}

export class Byte extends Class {
  constructor() {
    super('Byte')
  }

  public accessField(_name: string): Error | Type {
    return new CannotFindSymbolError()
  }

  public canBeAssigned(type: Type): boolean {
    return super.canBeAssigned(type) || type instanceof Primitives.Byte
  }
}

export class Character extends Class {
  constructor() {
    super('Character')
  }

  public accessField(_name: string): Error | Type {
    return new CannotFindSymbolError()
  }

  public canBeAssigned(type: Type): boolean {
    return super.canBeAssigned(type) || type instanceof Primitives.Char
  }
}

export class Double extends Class {
  constructor() {
    super('Double')
  }

  public accessField(_name: string): Error | Type {
    return new CannotFindSymbolError()
  }

  public canBeAssigned(type: Type): boolean {
    return super.canBeAssigned(type) || type instanceof Primitives.Double
  }
}

export class Float extends Class {
  constructor() {
    super('Float')
  }

  public accessField(_name: string): Error | Type {
    return new CannotFindSymbolError()
  }

  public canBeAssigned(type: Type): boolean {
    return super.canBeAssigned(type) || type instanceof Primitives.Float
  }
}

export class Integer extends Class {
  constructor() {
    super('Integer')
  }

  public accessField(_name: string): Error | Type {
    return new CannotFindSymbolError()
  }

  public canBeAssigned(type: Type): boolean {
    return super.canBeAssigned(type) || type instanceof Primitives.Int
  }

  public equals(object: unknown): boolean {
    return object instanceof Integer
  }
}

export class Long extends Class {
  constructor() {
    super('Long')
  }

  public accessField(_name: string): Error | Type {
    return new CannotFindSymbolError()
  }

  public canBeAssigned(type: Type): boolean {
    return super.canBeAssigned(type) || type instanceof Primitives.Long
  }
}

export class Short extends Class {
  constructor() {
    super('Short')
  }

  public accessField(_name: string): Error | Type {
    return new CannotFindSymbolError()
  }

  public canBeAssigned(type: Type): boolean {
    return super.canBeAssigned(type) || type instanceof Primitives.Short
  }
}

export class String extends Class {
  constructor() {
    super('String')
  }

  public static from(value: string): String {
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

export class Void extends Type {
  constructor() {
    super('void')
  }

  public accessField(_name: string): Error | Type {
    return new CannotBeDereferencedError()
  }

  public canBeAssigned(type: Type): boolean {
    return type instanceof Void
  }
}
