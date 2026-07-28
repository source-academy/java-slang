import * as NonPrimitives from '../types/references'
import * as Primitives from '../types/primitives'
import { Method, Parameter } from '../types/methods'
import { Type } from '../types/type'
import { CannotFindSymbolError, TypeCheckerError, VariableAlreadyDefinedError } from '../errors'
import { Array } from '../types/arrays'
import { Class, ClassType } from '../types/classes'
import { Location } from '../ast/specificationTypes'
import { isArrayType, removeArraySuffix } from './arrays'
import { libraries } from '../../compiler/import/libs'

const BUILT_IN_TYPE_FACTORIES: { [name: string]: () => Type } = {
  boolean: () => new Primitives.Boolean(),
  byte: () => new Primitives.Byte(),
  char: () => new Primitives.Char(),
  double: () => new Primitives.Double(),
  float: () => new Primitives.Float(),
  int: () => new Primitives.Int(),
  long: () => new Primitives.Long(),
  short: () => new Primitives.Short(),
  void: () => new NonPrimitives.Void(),
  Boolean: () => new NonPrimitives.Boolean(),
  Byte: () => new NonPrimitives.Byte(),
  Character: () => new NonPrimitives.Character(),
  Double: () => new NonPrimitives.Double(),
  Float: () => new NonPrimitives.Float(),
  Integer: () => new NonPrimitives.Integer(),
  Long: () => new NonPrimitives.Long(),
  Short: () => new NonPrimitives.Short(),
  String: () => new NonPrimitives.String()
}

const EXCEPTION_INHERITANCE: { [child: string]: string } = {
  Error: 'Throwable',
  Exception: 'Throwable',
  RuntimeException: 'Exception',
  ArithmeticException: 'RuntimeException',
  ArrayIndexOutOfBoundsException: 'RuntimeException',
  ArrayStoreException: 'RuntimeException',
  ClassCastException: 'RuntimeException',
  IllegalArgumentException: 'RuntimeException',
  IllegalMonitorStateException: 'RuntimeException',
  IllegalStateException: 'RuntimeException',
  IndexOutOfBoundsException: 'RuntimeException',
  NegativeArraySizeException: 'RuntimeException',
  NullPointerException: 'RuntimeException',
  NumberFormatException: 'RuntimeException',
  StringIndexOutOfBoundsException: 'IndexOutOfBoundsException',
  UnsupportedOperationException: 'RuntimeException',
  SecurityException: 'RuntimeException',
  IllegalThreadStateException: 'RuntimeException'
}

const stdlibTypeMap = new Map<string, Type>()

const createType = (typeName: string): Type => {
  if (stdlibTypeMap.has(typeName)) return stdlibTypeMap.get(typeName)!

  const factory = BUILT_IN_TYPE_FACTORIES[typeName]
  const type = factory ? factory() : new ClassType(typeName)
  stdlibTypeMap.set(typeName, type)
  return type
}

const parseType = (typeName: string): Type => {
  if (typeName.endsWith('[]')) {
    return new Array(parseType(typeName.slice(0, -2)))
  }
  return createType(typeName.replaceAll('/', '.').split('.').pop() || typeName)
}

const buildStandardLibraryTypes = (): { [key: string]: Type } => {
  // Preload built-in type objects
  Object.keys(BUILT_IN_TYPE_FACTORIES).forEach(typeName => createType(typeName))

  const getSimpleName = (qualifiedName: string) => {
    const lastToken = qualifiedName.replaceAll('.', '/').split('/').pop() || qualifiedName
    return lastToken
  }

  libraries.forEach(pkg => {
    pkg.classes.forEach(clazz => {
      const className = getSimpleName(clazz.className)
      createType(className)
    })
  })

  libraries.forEach(pkg => {
    pkg.classes.forEach(clazz => {
      const className = getSimpleName(clazz.className)
      const classType = createType(className)
      if (!(classType instanceof ClassType)) return

      clazz.fields.forEach(field => {
        const fieldType = parseType(field.typeName)
        classType.addField(field.fieldName, fieldType, { startLine: -1, startOffset: -1 })
      })

      clazz.methods.forEach(methodInfo => {
        const method = new Method(methodInfo.methodName, parseType(methodInfo.returnTypeName))
        methodInfo.argsTypeName.forEach((argTypeName, index) => {
          const parameter = new Parameter(`arg${index}`, parseType(argTypeName))
          method.addParameter(parameter)
        })
        classType.addMethod(methodInfo.methodName, method, { startLine: -1, startOffset: -1 })
      })
    })
  })

  Object.entries(EXCEPTION_INHERITANCE).forEach(([child, parent]) => {
    const childType = createType(child)
    const parentType = createType(parent)
    if (childType instanceof ClassType && parentType instanceof ClassType) {
      childType.setParentClass(parentType)
    }
  })

  return Object.fromEntries(stdlibTypeMap.entries())
}

const GLOBAL_TYPE_ENVIRONMENT: { [key: string]: Type } = buildStandardLibraryTypes()

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
