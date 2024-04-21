import { Location } from '../ast/specificationTypes'
import { CannotBeDereferencedError, TypeCheckerError } from '../errors'
import { Method } from './methods'

export interface Type {
  // TODO: Change to use Identifier Node
  accessField(_name: string, location: Location): Type | TypeCheckerError
  accessMethod(_name: string, location: Location): Method | TypeCheckerError
  canBeAssigned(type: Type): boolean
  equals(object: unknown): boolean
}

// TODO: Change Type to an interface
export abstract class PrimitiveType implements Type {
  public name: string
  constructor(name: string) {
    this.name = name
  }

  public accessField(_name: string, location: Location): Type | TypeCheckerError {
    return new CannotBeDereferencedError(location)
  }

  public accessMethod(_name: string, location: Location): Method | TypeCheckerError {
    return new CannotBeDereferencedError(location)
  }

  abstract canBeAssigned(type: Type): boolean

  public equals(object: unknown): boolean {
    return object instanceof PrimitiveType && this.name === object.name
  }
}

export abstract class ReferenceType implements Type {
  public abstract accessField(_name: string, _location: Location): Type | TypeCheckerError
  public abstract accessMethod(_name: string, _location: Location): Method | TypeCheckerError
  public abstract canBeAssigned(_type: Type): boolean
  public abstract equals(object: unknown): boolean
}

export class NullType extends ReferenceType {
  public accessField(_name: string, location: Location): Type | TypeCheckerError {
    throw new CannotBeDereferencedError(location)
  }

  public accessMethod(_name: string, location: Location): Method | TypeCheckerError {
    return new CannotBeDereferencedError(location)
  }

  public canBeAssigned(_type: Type): boolean {
    return false
  }

  public equals(object: unknown): boolean {
    return object instanceof NullType
  }
}

export abstract class ClassOrInterfaceType extends ReferenceType {}

// export class TypeVariable extends ReferenceType {}}

// export class ArrayType extends ReferenceType {}

export class ClassType extends ClassOrInterfaceType {
  public readonly typeIdentifier: string
  constructor(typeIdentifier: string) {
    super()
    this.typeIdentifier = typeIdentifier
  }

  public accessField(_name: string, _location: Location): Type | TypeCheckerError {
    throw new Error('Not implemented')
  }

  public accessMethod(_name: string, _location: Location): TypeCheckerError | Method {
    throw new Error('Not implemented')
  }

  public canBeAssigned(_type: Type): boolean {
    throw new Error('Not implemented')
  }

  public equals(object: unknown): boolean {
    return this == object
  }
}

export class String extends ClassType {
  constructor() {
    super('String')
  }

  public accessField(_name: string, _location: Location): Type | TypeCheckerError {
    throw new Error('Not implemented')
  }

  public accessMethod(_name: string, _location: Location): TypeCheckerError | Method {
    throw new Error('Not implemented')
  }

  public canBeAssigned(type: Type): boolean {
    return type instanceof String
  }

  public equals(object: unknown): boolean {
    return this == object
  }
}
