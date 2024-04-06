import { CannotFindSymbolError, VariableAlreadyDefinedError } from '../errors'
import { Method } from './methods'
import { Type } from './type'

export interface Class extends Type {
  accessConstructor(): Method | null
  getParentClass(): Class
  setConstructor(method: Method): void
  setField(name: string, type: Type): null | Error
  setMethod(name: string, method: Method): null | Error
  setParentClass(parentClass: Class): void
}

export class ClassImpl extends Type implements Class {
  private _constructor: Method | null
  private _fields = new Map<string, Type>()
  private _methods = new Map<string, Method>()
  private _parent: Class = new ObjectClass()

  constructor(name: string) {
    super(`Class: ${name}`)
  }

  public accessConstructor(): Method | null {
    return this._constructor
  }

  public accessField(_name: string): Type | Error {
    const field = this._fields.get(_name)
    if (field) return field
    return this._parent.accessField(_name)
  }

  public accessMethod(name: string): Method | Error {
    const method = this._methods.get(name)
    if (method) return method
    return this._parent.accessMethod(name)
  }

  public canBeAssigned(type: Type): boolean {
    if (!(type instanceof ClassImpl)) return false
    while (type instanceof ClassImpl) {
      if (this.name === type.name) return true
      type = type.getParentClass()
    }
    return false
  }

  public getParentClass(): Class {
    return this._parent
  }

  public hasMethod(name: string): boolean {
    const method = this._methods.get(name)
    return !!method
  }

  public setConstructor(method: Method): void {
    this._constructor = method
  }

  public setField(name: string, type: Type): null | Error {
    const field = this._fields.get(name)
    if (field) return new VariableAlreadyDefinedError()
    this._fields.set(name, type)
    return null
  }

  public setMethod(name: string, type: Method): null | Error {
    const method = this._methods.get(name)
    if (method) return new VariableAlreadyDefinedError()
    this._methods.set(name, type)
    return null
  }

  public setParentClass(parentClass: Class): void {
    this._parent = parentClass
  }
}

export class ObjectClass extends Type implements Class {
  public constructor() {
    super('Class: Object')
  }

  public accessConstructor(): Method | null {
    throw new Error('Not implemented')
  }

  public accessField(_name: string): Type | Error {
    return new CannotFindSymbolError()
  }

  public accessMethod(_name: string): Method | Error {
    return new CannotFindSymbolError()
  }

  public canBeAssigned(type: Type): boolean {
    return type instanceof ClassImpl || type instanceof ObjectClass
  }

  public getParentClass(): Class {
    throw new Error('Object is already the parent of all classes')
  }

  public setConstructor(_method: Method): void {
    throw new Error('cannot set constructor in Object')
  }

  public setField(_name: string, _type: Type): null | Error {
    throw new Error('cannot set field in Object')
  }

  public setMethod(_name: string, _type: Method): null | Error {
    throw new Error('cannot set method in Object')
  }

  public setParentClass(_parentClass: Class): void {
    throw new Error('cannot set parent class in Object')
  }
}
