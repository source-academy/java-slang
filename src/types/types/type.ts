import { CannotBeDereferencedError } from '../errors'
import { Method } from './methods'

// TODO: Change Type to an interface
export abstract class Type {
  public name: string
  constructor(name: string) {
    this.name = name
  }

  public accessField(_name: string): Type | Error {
    return new CannotBeDereferencedError()
  }

  public accessMethod(_name: string): Method | Error {
    return new CannotBeDereferencedError()
  }

  abstract canBeAssigned(type: Type): boolean

  public equals(object: unknown): boolean {
    return object instanceof Type && this.name === object.name
  }
}
