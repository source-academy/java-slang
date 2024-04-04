import {
  IncompatibleTypesError,
  MethodAlreadyDefinedError,
  MethodCannotBeAppliedError
} from '../errors'
import { Type } from './type'

export class ArgumentList {
  private argumentTypes: Type[] = []
  constructor() {}

  public addArgument(argument: Type) {
    this.argumentTypes.push(argument)
  }

  public length(): number {
    return this.argumentTypes.length
  }

  public get(index: number): Type {
    return this.argumentTypes[index]
  }
}

export class Parameter {
  public name: string
  public type: Type
  constructor(name: string, type: Type) {
    this.name = name
    this.type = type
  }

  public canBeAssigned(type: Type): boolean {
    if (type instanceof Parameter) return this.type.canBeAssigned(type.type)
    return this.type.canBeAssigned(type)
  }

  public equals(object: unknown): boolean {
    return object instanceof Parameter && this.name === object.name && this.type.equals(object.type)
  }

  public getName(): string {
    return this.name
  }

  public getType(): Type {
    return this.type
  }
}

export class ParameterList {
  private parameters: Parameter[] = []
  constructor() {}

  public addParameter(parameter: Parameter): void {
    this.parameters.push(parameter)
  }

  public length(): number {
    return this.parameters.length
  }

  public get(index: number): Parameter {
    return this.parameters[index]
  }

  public matchesArguments(args: ArgumentList): boolean {
    if (this.length() !== args.length()) return false
    for (let i = 0; i < this.length(); i++) {
      const parameter = this.get(i)
      const argument = args.get(i)
      if (!parameter.canBeAssigned(argument)) return false
    }
    return true
  }
}

export class MethodSignature extends Type {
  public returnType: Type
  public parameters: ParameterList
  public exceptions: object[]

  constructor() {
    super('method signature')
  }

  public accessField(_name: string): Error | Type {
    return new Error('not impemented')
  }

  public canBeAssigned(type: Type): boolean {
    if (!(type instanceof MethodSignature)) return false
    if (!this.returnType.canBeAssigned(type.returnType)) return false
    if (this.parameters.length() !== type.parameters.length()) return false
    for (let i = 0; i < this.parameters.length(); i++) {}
    // if (!this.parameters[i].canBeAssigned(type.parameters[i])) return false;
    // TODO: Check exceptions
    return true
  }

  public equals(object: unknown): boolean {
    if (!(object instanceof MethodSignature)) return false
    if (!this.returnType.equals(object.returnType)) return false
    if (this.parameters.length() !== object.parameters.length()) return false
    for (let i = 0; i < this.parameters.length(); i++)
      if (!this.parameters.get(i).equals(object.parameters.get(i))) return false
    // TODO: Check exceptions
    return true
  }

  public canInvoke(args: ArgumentList): boolean {
    return this.parameters.matchesArguments(args)
  }

  public getReturnType(): Type {
    return this.returnType
  }

  public parameterSize(): number {
    return this.parameters.length()
  }

  public mapParameters<T>(mapper: (name: string, type: Type) => T): T[] {
    const result: T[] = []
    for (let i = 0; i < this.parameterSize(); i++) {
      const parameter = this.parameters.get(i)
      result.push(mapper(parameter.getName(), parameter.getType()))
    }
    return result
  }
}

export class Method extends Type {
  private methodSignatures: MethodSignature[] = []

  constructor(methodSignature: MethodSignature) {
    super('method')
    this.methodSignatures.push(methodSignature)
  }

  public accessField(_name: string): Error | Type {
    return new Error('not impemented')
  }

  public canBeAssigned(type: Type): boolean {
    throw new Error('Not implemented yet')
  }

  public addOverload(methodSignature: MethodSignature): null | Error {
    for (let i = 0; i < this.methodSignatures.length; i++) {
      if (this.methodSignatures[i].equals(methodSignature)) {
        console.log(this.methodSignatures[i])
        console.log(methodSignature)
        return new MethodAlreadyDefinedError()
      }
    }
    this.methodSignatures.push(methodSignature)
    return null
  }

  public getOverload(index: number): MethodSignature {
    return this.methodSignatures[index]
  }

  public invoke(args: ArgumentList): Type | Error {
    let hasSameLengthParamList = false
    for (const signature of this.methodSignatures) {
      if (signature.parameterSize() === args.length()) hasSameLengthParamList = true
      if (signature.canInvoke(args)) return signature.getReturnType()
    }
    return hasSameLengthParamList ? new IncompatibleTypesError() : new MethodCannotBeAppliedError()
  }
}

export class ClassMethod extends MethodSignature {
  public modifiers: string[] = []

  constructor() {
    super()
  }
}
