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
export abstract class TypeImpl implements Type {
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
    return object instanceof TypeImpl && this.name === object.name
  }
}
