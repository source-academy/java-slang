import * as NonPrimitives from '../types/references'
import * as Primitives from '../types/primitives'
import { Method, Parameter } from '../types/methods'
import { Type } from '../types/type'
import { CannotFindSymbolError, TypeCheckerError, VariableAlreadyDefinedError } from '../errors'
import { Array } from '../types/arrays'
import { Class, ClassType } from '../types/classes'
import { Location } from '../ast/specificationTypes'
import { isArrayType, removeArraySuffix } from './arrays'

const SYSTEM_CLASS = new ClassType('System')
const PRINTSTREAM_CLASS = new ClassType('PrintStream')
SYSTEM_CLASS.addField('out', PRINTSTREAM_CLASS, { startLine: -1, startOffset: -1 })
const PRINTLN_METHOD_1 = new Method('println')
PRINTLN_METHOD_1.addParameter(new Parameter('message', new NonPrimitives.String()))
const PRINTLN_METHOD_2 = new Method('println')
PRINTLN_METHOD_2.addParameter(new Parameter('message', new Primitives.Int()))
PRINTSTREAM_CLASS.addMethod('println', PRINTLN_METHOD_1, { startLine: -1, startOffset: -1 })
PRINTSTREAM_CLASS.addMethod('println', PRINTLN_METHOD_2, { startLine: -1, startOffset: -1 })

const GLOBAL_TYPE_ENVIRONMENT: { [key: string]: Type } = {
  boolean: new Primitives.Boolean(),
  byte: new Primitives.Byte(),
  char: new Primitives.Char(),
  double: new Primitives.Double(),
  float: new Primitives.Float(),
  int: new Primitives.Int(),
  long: new Primitives.Long(),
  short: new Primitives.Short(),
  void: new NonPrimitives.Void(),
  Boolean: new NonPrimitives.Boolean(),
  Byte: new NonPrimitives.Byte(),
  Character: new NonPrimitives.Character(),
  Double: new NonPrimitives.Double(),
  Float: new NonPrimitives.Float(),
  Integer: new NonPrimitives.Integer(),
  Long: new NonPrimitives.Long(),
  Short: new NonPrimitives.Short(),
  String: new NonPrimitives.String(),

  // Hard coded variables
  System: SYSTEM_CLASS,
  Throwable: new NonPrimitives.Throwable(),
  Exception: new NonPrimitives.Exception()
}

export class Frame {
  private _currentClass: Class
  private _methods = new Map<string, Method>()
  private _types = new Map<string, Type>()
  private _variables = new Map<string, Type>()

  private _returnType: Type | null = null

  private _parentFrame: Frame | null = null
  private _childrenFrames: Frame[] = []

  private constructor() {}

  public getMethod(name: string, location: Location): Method[] | TypeCheckerError {
    return this._currentClass.accessMethod(name, location)
    // const method = this._methods.get(name)
    // if (method) return method
    // if (this._parentFrame) return this._parentFrame.getMethod(name, location)
    // return new CannotFindSymbolError(location)
  }

  public getReturn(): Type | TypeCheckerError {
    if (this._returnType) return this._returnType
    if (this._parentFrame) return this._parentFrame.getReturn()
    throw new Error('cannot find return type')
  }

  public getType(name: string, location: Location): Type | TypeCheckerError {
    if (isArrayType(name)) {
      const typePrefix = removeArraySuffix(name)
      const prefixType = this.getType(typePrefix, location)
      if (prefixType instanceof TypeCheckerError) return prefixType
      return new Array(prefixType)
    }

    const type = this._types.get(name)
    if (type) return type
    if (this._parentFrame) return this._parentFrame.getType(name, location)
    return new CannotFindSymbolError(location)
  }

  public getVariable(name: string, location: Location): Type | TypeCheckerError {
    if (name === 'this') return this._currentClass
    if (name === 'super') return this._currentClass.getParentClass()
    const variable = this._variables.get(name)
    if (variable) return variable
    if (this._parentFrame) return this._parentFrame.getVariable(name, location)
    return new CannotFindSymbolError(location)
  }

  public isMethodInFrame(name: string): boolean {
    return !!this._methods.get(name)
  }

  public isVariableInFrame(name: string): boolean {
    return !!this._variables.get(name)
  }

  public newChildFrame(): Frame {
    const childFrame = new Frame()
    this._childrenFrames.push(childFrame)
    childFrame._parentFrame = this
    childFrame._currentClass = this._currentClass
    return childFrame
  }

  public setClass(classType: Class): void {
    this._currentClass = classType
  }

  public setMethod(name: string, method: Method, location: Location): null | TypeCheckerError {
    const existingMethod = this._methods.get(name)
    if (existingMethod) return new VariableAlreadyDefinedError(location)
    this._methods.set(name, method)
    return null
  }

  public setReturnType(type: Type): void {
    this._returnType = type
  }

  public setType(name: string, type: Type, location: Location): null | TypeCheckerError {
    const existingType = this._types.get(name)
    if (existingType) return new VariableAlreadyDefinedError(location)
    this._types.set(name, type)
    return null
  }

  public setVariable(name: string, type: Type, location: Location): null | TypeCheckerError {
    const existingVariable = this._types.get(name)
    if (existingVariable) return new VariableAlreadyDefinedError(location)
    this._variables.set(name, type)
    return null
  }

  public toObject(): object {
    const methods = [...this._methods.entries()]
    const types = [...this._types.entries()]
    const variables = [...this._variables.entries()]
    const parentFrame = this._parentFrame?.toObject() ?? null
    return { methods, types, variables, parentFrame }
  }

  public static globalFrame(): Frame {
    const globalFrame = new Frame()
    Object.keys(GLOBAL_TYPE_ENVIRONMENT).forEach(key => {
      globalFrame.setType(key, GLOBAL_TYPE_ENVIRONMENT[key], { startLine: -1, startOffset: -1 })
    })
    return globalFrame
  }
}
