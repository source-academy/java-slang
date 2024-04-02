import * as NonPrimitives from '../types/nonPrimitives'
import * as Primitives from '../types/primitives'
import { Method } from '../types/methods'
import { Type } from '../types/type'
import { CannotFindSymbolError, VariableAlreadyDefinedError } from '../errors'
import { Array } from '../types/arrays'
import { isArrayType, removeArraySuffix } from './arrays'

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
  // TODO: Fix to array type
  'String[]': new NonPrimitives.String()
}

export class Frame {
  private _methods = new Map<string, Method>()
  private _types = new Map<string, Type>()
  private _variables = new Map<string, Type>()

  private _returnType: Type | null = null

  private _parentFrame: Frame | null = null
  private _childrenFrames: Frame[] = []

  private constructor() {}

  public getMethod(name: string): Method | Error {
    const method = this._methods.get(name)
    if (method) return method
    if (this._parentFrame) return this._parentFrame.getMethod(name)
    return new CannotFindSymbolError()
  }

  public getReturn(): Type | Error {
    if (this._returnType) return this._returnType
    if (this._parentFrame) return this._parentFrame.getReturn()
    return new Error('cannot find return type')
  }

  public getType(name: string): Type | Error {
    if (isArrayType(name)) {
      const typePrefix = removeArraySuffix(name)
      const prefixType = this.getType(typePrefix)
      if (prefixType instanceof Error) return prefixType
      return new Array(prefixType)
    }

    const type = this._types.get(name)
    if (type) return type
    if (this._parentFrame) return this._parentFrame.getType(name)
    return new CannotFindSymbolError()
  }

  public getVariable(name: string): Type | Error {
    const variable = this._variables.get(name)
    if (variable) return variable
    if (this._parentFrame) return this._parentFrame.getVariable(name)
    return new CannotFindSymbolError()
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
    return childFrame
  }

  public setMethod(name: string, method: Method): null | Error {
    const existingMethod = this._methods.get(name)
    if (existingMethod) return new VariableAlreadyDefinedError()
    this._methods.set(name, method)
    return null
  }

  public setReturnType(type: Type): void {
    this._returnType = type
  }

  public setType(name: string, type: Type): null | Error {
    const existingType = this._types.get(name)
    if (existingType) return new VariableAlreadyDefinedError()
    this._types.set(name, type)
    return null
  }

  public setVariable(name: string, type: Type): null | Error {
    const existingVariable = this._types.get(name)
    if (existingVariable) return new VariableAlreadyDefinedError()
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
      globalFrame.setType(key, GLOBAL_TYPE_ENVIRONMENT[key])
    })
    return globalFrame
  }
}
