import { Location } from '../ast/specificationTypes'
import { CannotBeDereferencedError, TypeCheckerError } from '../errors'
import { Method } from './methods'

// TODO: Change Type to an interface
export abstract class Type {
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
    return object instanceof Type && this.name === object.name
  }
}
