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

const THROWABLE_CLASS = new NonPrimitives.Throwable()
const EXCEPTION_CLASS = new NonPrimitives.Exception()
const RUNTIME_EXCEPTION_CLASS = new ClassType('RuntimeException')
RUNTIME_EXCEPTION_CLASS.setParentClass(EXCEPTION_CLASS)
const ERROR_CLASS = new ClassType('Error')
ERROR_CLASS.setParentClass(THROWABLE_CLASS)

const ARITHMETIC_EXCEPTION_CLASS = new ClassType('ArithmeticException')
ARITHMETIC_EXCEPTION_CLASS.setParentClass(RUNTIME_EXCEPTION_CLASS)
const ARRAY_INDEX_OUT_OF_BOUNDS_EXCEPTION_CLASS = new ClassType('ArrayIndexOutOfBoundsException')
ARRAY_INDEX_OUT_OF_BOUNDS_EXCEPTION_CLASS.setParentClass(RUNTIME_EXCEPTION_CLASS)
const ARRAY_STORE_EXCEPTION_CLASS = new ClassType('ArrayStoreException')
ARRAY_STORE_EXCEPTION_CLASS.setParentClass(RUNTIME_EXCEPTION_CLASS)
const CLASS_CAST_EXCEPTION_CLASS = new ClassType('ClassCastException')
CLASS_CAST_EXCEPTION_CLASS.setParentClass(RUNTIME_EXCEPTION_CLASS)
const ILLEGAL_ARGUMENT_EXCEPTION_CLASS = new ClassType('IllegalArgumentException')
ILLEGAL_ARGUMENT_EXCEPTION_CLASS.setParentClass(RUNTIME_EXCEPTION_CLASS)
const ILLEGAL_MONITOR_STATE_EXCEPTION_CLASS = new ClassType('IllegalMonitorStateException')
ILLEGAL_MONITOR_STATE_EXCEPTION_CLASS.setParentClass(RUNTIME_EXCEPTION_CLASS)
const ILLEGAL_STATE_EXCEPTION_CLASS = new ClassType('IllegalStateException')
ILLEGAL_STATE_EXCEPTION_CLASS.setParentClass(RUNTIME_EXCEPTION_CLASS)
const INDEX_OUT_OF_BOUNDS_EXCEPTION_CLASS = new ClassType('IndexOutOfBoundsException')
INDEX_OUT_OF_BOUNDS_EXCEPTION_CLASS.setParentClass(RUNTIME_EXCEPTION_CLASS)
const NEGATIVE_ARRAY_SIZE_EXCEPTION_CLASS = new ClassType('NegativeArraySizeException')
NEGATIVE_ARRAY_SIZE_EXCEPTION_CLASS.setParentClass(RUNTIME_EXCEPTION_CLASS)
const NULL_POINTER_EXCEPTION_CLASS = new ClassType('NullPointerException')
NULL_POINTER_EXCEPTION_CLASS.setParentClass(RUNTIME_EXCEPTION_CLASS)
const NUMBER_FORMAT_EXCEPTION_CLASS = new ClassType('NumberFormatException')
NUMBER_FORMAT_EXCEPTION_CLASS.setParentClass(RUNTIME_EXCEPTION_CLASS)
const STRING_INDEX_OUT_OF_BOUNDS_EXCEPTION_CLASS = new ClassType('StringIndexOutOfBoundsException')
STRING_INDEX_OUT_OF_BOUNDS_EXCEPTION_CLASS.setParentClass(INDEX_OUT_OF_BOUNDS_EXCEPTION_CLASS)
const UNSUPPORTED_OPERATION_EXCEPTION_CLASS = new ClassType('UnsupportedOperationException')
UNSUPPORTED_OPERATION_EXCEPTION_CLASS.setParentClass(RUNTIME_EXCEPTION_CLASS)
const SECURITY_EXCEPTION_CLASS = new ClassType('SecurityException')
SECURITY_EXCEPTION_CLASS.setParentClass(RUNTIME_EXCEPTION_CLASS)
const ILLEGAL_THREAD_STATE_EXCEPTION_CLASS = new ClassType('IllegalThreadStateException')
ILLEGAL_THREAD_STATE_EXCEPTION_CLASS.setParentClass(RUNTIME_EXCEPTION_CLASS)

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
  Throwable: THROWABLE_CLASS,
  Error: ERROR_CLASS,
  Exception: EXCEPTION_CLASS,
  RuntimeException: RUNTIME_EXCEPTION_CLASS,
  ArithmeticException: ARITHMETIC_EXCEPTION_CLASS,
  ArrayIndexOutOfBoundsException: ARRAY_INDEX_OUT_OF_BOUNDS_EXCEPTION_CLASS,
  ArrayStoreException: ARRAY_STORE_EXCEPTION_CLASS,
  ClassCastException: CLASS_CAST_EXCEPTION_CLASS,
  IllegalArgumentException: ILLEGAL_ARGUMENT_EXCEPTION_CLASS,
  IllegalMonitorStateException: ILLEGAL_MONITOR_STATE_EXCEPTION_CLASS,
  IllegalStateException: ILLEGAL_STATE_EXCEPTION_CLASS,
  IndexOutOfBoundsException: INDEX_OUT_OF_BOUNDS_EXCEPTION_CLASS,
  NegativeArraySizeException: NEGATIVE_ARRAY_SIZE_EXCEPTION_CLASS,
  NullPointerException: NULL_POINTER_EXCEPTION_CLASS,
  NumberFormatException: NUMBER_FORMAT_EXCEPTION_CLASS,
  StringIndexOutOfBoundsException: STRING_INDEX_OUT_OF_BOUNDS_EXCEPTION_CLASS,
  UnsupportedOperationException: UNSUPPORTED_OPERATION_EXCEPTION_CLASS,
  SecurityException: SECURITY_EXCEPTION_CLASS,
  IllegalThreadStateException: ILLEGAL_THREAD_STATE_EXCEPTION_CLASS
}

export class Frame {
  private _currentClass: Class
  private _methods = new Map<string, Method>()
  private _types = new Map<string, Type>()
  private _variables = new Map<string, Type>()

  private _returnType: Type | null = null
  private _throws: any[] = []
  private _activeCaughtExceptions: any[] = []

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

  public setThrows(exceptions: any[]): void {
    this._throws = exceptions.slice()
  }

  public getThrows(): any[] {
    if (this._throws && this._throws.length > 0) return this._throws.slice()
    if (this._parentFrame) return this._parentFrame.getThrows()
    return []
  }

  public setActiveCaughtExceptions(exceptions: any[]): void {
    this._activeCaughtExceptions = exceptions.slice()
  }

  public getActiveCaughtExceptions(): any[] {
    const parentCaught = this._parentFrame ? this._parentFrame.getActiveCaughtExceptions() : []
    return parentCaught.concat(this._activeCaughtExceptions)
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
