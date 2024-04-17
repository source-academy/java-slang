import { Location } from '../ast/specificationTypes'
import { CannotFindSymbolError, TypeCheckerError, VariableAlreadyDefinedError } from '../errors'
import { Method, MethodSignature } from './methods'
import { Null } from './primitives'
import { Type } from './type'

export interface Class extends Type {
  accessConstructor(): Method
  getParentClass(): Class
  setConstructor(method: Method): void
  setField(name: string, type: Type): null | TypeCheckerError
  setMethod(name: string, method: Method): null | TypeCheckerError
  setModifier(modifier: string): void
  setParentClass(parentClass: Class): void
}

export class ClassImpl extends Type implements Class {
  private _constructor: Method
  private _fields = new Map<string, Type>()
  private _methods = new Map<string, Method>()
  private _parent: Class = new ObjectClass()
  private _modifiers: string[] = []

  constructor(name: string) {
    super(`Class: ${name}`)
    const defaultConstructorSignature = new MethodSignature()
    defaultConstructorSignature.setReturnType(this)
    this._constructor = new Method(defaultConstructorSignature)
  }

  public accessConstructor(): Method {
    return this._constructor
  }

  public accessField(_name: string, location: Location): Type | TypeCheckerError {
    const field = this._fields.get(_name)
    if (field) return field
    return this._parent.accessField(_name, location)
  }

  public accessMethod(name: string, location: Location): Method | TypeCheckerError {
    const method = this._methods.get(name)
    if (method) return method
    return this._parent.accessMethod(name, location)
  }

  public canBeAssigned(type: Type): boolean {
    if (type instanceof Null) return true
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

  public mapFields(mapper: (name: string, type: Type) => void) {
    this._fields.forEach((value, key) => mapper(key, value))
  }

  public mapMethods(mapper: (name: string, method: Method) => void) {
    this._methods.forEach((value, key) => mapper(key, value))
  }

  public setConstructor(method: Method): void {
    this._constructor = method
  }

  public setField(name: string, type: Type): null | TypeCheckerError {
    const field = this._fields.get(name)
    if (field) return new VariableAlreadyDefinedError()
    this._fields.set(name, type)
    return null
  }

  public setMethod(name: string, type: Method): null | TypeCheckerError {
    const method = this._methods.get(name)
    if (method) return new VariableAlreadyDefinedError()
    this._methods.set(name, type)
    return null
  }

  public setModifier(modifier: string): void {
    if (this._modifiers.includes(modifier)) return
    this._modifiers.push(modifier)
  }

  public setParentClass(parentClass: Class): void {
    this._parent = parentClass
  }
}

export class ObjectClass extends Type implements Class {
  public constructor() {
    super('Class: Object')
  }

  public accessConstructor(): Method {
    throw new Error('Not implemented')
  }

  public accessField(_name: string, location: Location): Type | TypeCheckerError {
    return new CannotFindSymbolError(location)
  }

  public accessMethod(_name: string, location: Location): Method | TypeCheckerError {
    return new CannotFindSymbolError(location)
  }

  public canBeAssigned(type: Type): boolean {
    return type instanceof ClassImpl || type instanceof ObjectClass || type instanceof Null
  }

  public getParentClass(): Class {
    throw new Error('Object is already the parent of all classes')
  }

  public setConstructor(_method: Method): void {
    throw new Error('cannot set constructor in Object')
  }

  public setField(_name: string, _type: Type): null | TypeCheckerError {
    throw new Error('cannot set field in Object')
  }

  public setMethod(_name: string, _type: Method): null | TypeCheckerError {
    throw new Error('cannot set method in Object')
  }

  public setModifier(_modifier: string): null | TypeCheckerError {
    throw new Error('cannot set modifier in Object')
  }

  public setParentClass(_parentClass: Class): void {
    throw new Error('cannot set parent class in Object')
  }
}
