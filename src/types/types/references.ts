import { Location } from '../ast/specificationTypes'
import { ClassImpl } from './classes'
import { Method, MethodSignature, Parameter } from './methods'
import * as Primitives from './primitives'
import { Type, PrimitiveType } from './type'

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

  public canBeAssigned(type: Type): boolean {
    if (type instanceof Primitives.Null) return true
    return type instanceof String
  }
}

export class Throwable extends ClassImpl {
  constructor() {
    super('Throwable')
  }
}

export class Exception extends ClassImpl {
  constructor() {
    super('Exception')
    this.setParentClass(new Throwable())
    const constructorSignature1 = new MethodSignature()
    constructorSignature1.setReturnType(this)
    const constructor = new Method(constructorSignature1)
    const constructorSignature2 = new MethodSignature()
    constructorSignature2.setReturnType(this)
    constructorSignature2.parameters.addParameter(new Parameter('message', new String()))
    constructor.addOverload(constructorSignature2, { startLine: -1, startOffset: -1 })
    const constructorSignature3 = new MethodSignature()
    constructorSignature3.setReturnType(this)
    constructorSignature3.parameters.addParameter(new Parameter('cause', new Throwable()))
    constructor.addOverload(constructorSignature3, { startLine: -1, startOffset: -1 })
    const constructorSignature4 = new MethodSignature()
    constructorSignature4.setReturnType(this)
    constructorSignature2.parameters.addParameter(new Parameter('message', new String()))
    constructorSignature4.parameters.addParameter(new Parameter('cause', new Throwable()))
    constructor.addOverload(constructorSignature4, { startLine: -1, startOffset: -1 })
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
