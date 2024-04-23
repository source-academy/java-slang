import { Identifier, Location } from '../ast/specificationTypes'
import {
  CannotFindSymbolError,
  MethodAlreadyDefinedError,
  TypeCheckerError,
  VariableAlreadyDefinedError
} from '../errors'
import { Arguments, Method } from './methods'
import { Modifiers, ModifierType } from './modifiers'
import { Null } from './primitives'
import { Type, PrimitiveType, ClassOrInterfaceType } from './type'

export interface Class extends PrimitiveType {
  addConstructor(method: Method, location: Location): void | TypeCheckerError
  addField(name: string, type: Type, location: Location): void | TypeCheckerError
  addMethod(name: string, method: Method, location: Location): void | TypeCheckerError
  addModifier(identifier: Identifier): void | TypeCheckerError
  getClassName(): string
  getParentClass(): Class
  invokeConstructor(args: Arguments): Type | TypeCheckerError
  invokeMethod(identifier: Identifier, args: Arguments): Type | TypeCheckerError
  setParentClass(parentClass: Class): void
}

export class ClassType extends ClassOrInterfaceType implements Class {
  public readonly name: string
  private _modifiers = new Modifiers()
  private _parent: Class = new ObjectClass()

  private _constructors: Method[] = []
  private _fields = new Map<string, Type>()
  private _methods = new Map<string, Method[]>()

  constructor(name: string) {
    super()
    this.name = name
  }

  public accessField(_name: string, location: Location): Type | TypeCheckerError {
    const field = this._fields.get(_name)
    if (field) return field
    return this._parent.accessField(_name, location)
  }

  public accessMethod(name: string, location: Location): Method[] | TypeCheckerError {
    const method = this._methods.get(name)
    if (method) return method
    return this._parent.accessMethod(name, location)
  }

  public addConstructor(method: Method, location: Location): void | TypeCheckerError {
    for (const existingMethod of this._constructors)
      if (existingMethod.equals(method)) return new MethodAlreadyDefinedError(location)
    this._constructors.push(method)
  }

  public addField(name: string, type: Type, location: Location): void | TypeCheckerError {
    const field = this._fields.get(name)
    if (field) return new VariableAlreadyDefinedError(location)
    this._fields.set(name, type)
  }

  public addMethod(name: string, method: Method, location: Location): void | TypeCheckerError {
    const methodList = this._methods.get(name)
    if (methodList) {
      for (const existingMethod of methodList)
        if (existingMethod.equals(method)) return new MethodAlreadyDefinedError(location)
      methodList.push(method)
    } else this._methods.set(name, [method])
  }

  public addModifier(identifier: Identifier): void | TypeCheckerError {
    return this._modifiers.addModifier(ModifierType.CLASS, identifier)
  }

  public canBeAssigned(type: Type): boolean {
    if (type instanceof Null) return true
    if (!(type instanceof ClassType)) return false
    while (type instanceof ClassType) {
      if (this.name === type.name) return true
      type = type.getParentClass()
    }
    return false
  }

  public equals(object: unknown): boolean {
    return this === object
  }

  public getClassName(): string {
    return this.name
  }

  public getConstructor(index: number): Method {
    return this._constructors[index]
  }

  public getMethod(name: string): Method[] {
    return this._methods.get(name) || []
  }

  public getParentClass(): Class {
    return this._parent
  }

  public hasMethod(name: string): boolean {
    const method = this._methods.get(name)
    return !!method
  }

  // TODO: Method overloading resolution (now it returns first match)
  public invokeConstructor(args: Arguments): Type | TypeCheckerError {
    if (this._constructors.length === 0) {
      const constructor = new Method(this.name, this)
      return constructor.invoke(args)
    }
    for (let i = 0; i < this._constructors.length - 1; i++) {
      const result = this._constructors[i].invoke(args)
      if (result instanceof TypeCheckerError) continue
      return result
    }
    return this._constructors[this._constructors.length - 1].invoke(args)
  }

  // TODO: Method overloading resolution (now it returns first match)
  public invokeMethod(name: Identifier, args: Arguments): Type | TypeCheckerError {
    const methods = this._methods.get(name.identifier)
    if (!methods) return this.getParentClass().invokeMethod(name, args)
    for (let i = 0; i < methods.length - 1; i++) {
      const result = methods[i].invoke(args)
      if (result instanceof TypeCheckerError) continue
    }
    return methods[methods.length - 1].invoke(args)
  }

  public mapFields(mapper: (name: string, type: Type) => void): void {
    for (const [name, type] of this._fields.entries()) {
      mapper(name, type)
    }
  }

  public setParentClass(parentClass: Class): void {
    this._parent = parentClass
  }
}

export class ObjectClass extends ClassOrInterfaceType implements Class {
  public readonly name: string = 'Object'
  public constructor() {
    super()
  }

  public accessConstructor(): Method {
    throw new Error('Not implemented')
  }

  public accessField(_name: string, location: Location): Type | TypeCheckerError {
    return new CannotFindSymbolError(location)
  }

  public accessMethod(_name: string, location: Location): Method[] | TypeCheckerError {
    return new CannotFindSymbolError(location)
  }

  public addConstructor(_method: Method, _location: Location): void | TypeCheckerError {
    throw new Error('Method not implemented.')
  }

  public addField(_name: string, _type: Type, _location: Location): void | TypeCheckerError {
    throw new Error('Method not implemented.')
  }

  public addMethod(_name: string, _method: Method, _location: Location): void | TypeCheckerError {
    throw new Error('Method not implemented.')
  }

  public addModifier(_identifier: Identifier): void | TypeCheckerError {
    throw new Error('Method not implemented.')
  }

  public canBeAssigned(type: Type): boolean {
    return type instanceof ClassType || type instanceof ObjectClass || type instanceof Null
  }

  public equals(object: unknown): boolean {
    return this === object
  }

  public getClassName(): string {
    return this.name
  }

  public getParentClass(): Class {
    throw new Error('Object is already the parent of all classes')
  }

  public invokeConstructor(_args: Arguments): Type | TypeCheckerError {
    throw new Error('Method not implemented.')
  }

  public invokeMethod(identifier: Identifier, _args: Arguments): Type | TypeCheckerError {
    return new CannotFindSymbolError(identifier.location)
  }

  public setParentClass(_parentClass: Class): void {
    throw new Error('Method not implemented.')
  }
}
