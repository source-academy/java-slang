import { Location } from '../ast/specificationTypes'
import { CannotFindSymbolError, TypeCheckerError } from '../errors'
import * as Primitives from './primitives'
import { Type, PrimitiveType } from './type'

export class Array extends PrimitiveType {
  private static _fields: Record<string, Type> = {
    length: new Primitives.Int()
  }

  private _type: Type
  constructor(type: Type) {
    super('array')
    this._type = type
  }

  public accessField(name: string, location: Location): TypeCheckerError | Type {
    const field = Array._fields[name]
    if (field) return field
    return new CannotFindSymbolError(location)
  }

  public canBeAssigned(type: Type): boolean {
    if (!(type instanceof Array)) return false
    return this._type.equals(type._type)
  }

  public getContentType(): Type {
    return this._type
  }
}
