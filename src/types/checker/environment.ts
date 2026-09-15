import * as NonPrimitives from '../types/references'
import * as Primitives from '../types/primitives'
import { Method, Parameter } from '../types/methods'
import { Type } from '../types/type'
import { CannotFindSymbolError, TypeCheckerError, VariableAlreadyDefinedError } from '../errors'
import { Array } from '../types/arrays'
import { Class, ClassType } from '../types/classes'
import { Location } from '../ast/specificationTypes'
import { libraries } from '../../compiler/import/libs'
import { generatedLibInfo } from '../../compiler/import/generated-lib-info'
import { isArrayType, removeArraySuffix } from './arrays'

const PRIMITIVE_DESCRIPTORS: { [code: string]: string } = {
  B: 'byte',
  C: 'char',
  D: 'double',
  F: 'float',
  I: 'int',
  J: 'long',
  S: 'short',
  Z: 'boolean',
  V: 'void'
}

/** JVM field descriptor -> the type name `parseType` understands. */
const descriptorToTypeName = (descriptor: string): string => {
  let dims = 0
  while (descriptor[dims] === '[') dims++
  const base = descriptor.slice(dims)
  const suffix = '[]'.repeat(dims)
  if (base.startsWith('L') && base.endsWith(';')) return base.slice(1, -1) + suffix
  return (PRIMITIVE_DESCRIPTORS[base] ?? base) + suffix
}

/** Splits a JVM method descriptor into its parameter and return descriptors. */
const splitMethodDescriptor = (descriptor: string): { params: string[]; returns: string } => {
  const end = descriptor.indexOf(')')
  const paramSection = descriptor.slice(1, end)
  const params: string[] = []
  let i = 0
  while (i < paramSection.length) {
    const start = i
    while (paramSection[i] === '[') i++
    if (paramSection[i] === 'L') i = paramSection.indexOf(';', i) + 1
    else i++
    params.push(paramSection.slice(start, i))
  }
  return { params, returns: descriptor.slice(end + 1) }
}

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
  String: () => new NonPrimitives.String(),
  // Base type that all enum declarations implicitly extend. Its methods are
  // derived from the real java.lang.Enum metadata rather than hand-listed.
  Enum: () => {
    const enumType = new ClassType('Enum')
    const loc: Location = { startLine: -1, startOffset: -1 }
    // `Ljava/lang/Enum;` in a descriptor refers back to this type, which is not
    // yet registered in `stdlibTypeMap` while this factory runs.
    const resolve = (descriptor: string): Type =>
      descriptor === 'Ljava/lang/Enum;' ? enumType : parseType(descriptorToTypeName(descriptor))

    for (const member of generatedLibInfo['java/lang/Enum']?.methods ?? []) {
      if (member.name === '<init>' || member.name === '<clinit>') continue
      const { params, returns } = splitMethodDescriptor(member.descriptor)
      const method = new Method(member.name, resolve(returns))
      params.forEach((param, index) =>
        method.addParameter(new Parameter(`arg${index}`, resolve(param)))
      )
      enumType.addMethod(member.name, method, loc)
    }
    return enumType
  }
}

const simpleNameOf = (internalOrQualifiedName: string): string =>
  internalOrQualifiedName.replaceAll('.', '/').split('/').pop() || internalOrQualifiedName

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

  libraries.forEach(pkg => {
    pkg.classes.forEach(clazz => {
      const className = simpleNameOf(clazz.className)
      createType(className)
    })
  })

  libraries.forEach(pkg => {
    pkg.classes.forEach(clazz => {
      const className = simpleNameOf(clazz.className)
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

  // Derive class inheritance from the extracted standard-library metadata
  // instead of a hand-maintained table. Only edges between types the checker
  // already knows about (created from `libraries` above) are wired up.
  Object.values(generatedLibInfo).forEach(meta => {
    if (meta.superClass === null) return
    const childName = simpleNameOf(meta.name)
    const parentName = simpleNameOf(meta.superClass)
    if (childName === parentName) return
    const childType = stdlibTypeMap.get(childName)
    const parentType = stdlibTypeMap.get(parentName)
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
