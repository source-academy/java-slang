import { Identifier, Location } from '../ast/specificationTypes'
import { IncompatibleTypesError, MethodCannotBeAppliedError, TypeCheckerError } from '../errors'
import { Array } from './arrays'
import { Modifiers, ModifierType } from './modifiers'
import { Void } from './references'
import { Throws } from './throws'
import { Type } from './type'

export class Argument {
  public readonly type: Type
  public readonly location: Location
  public constructor(type: Type, location: Location) {
    this.type = type
    this.location = location
  }
}

export class Arguments {
  private arguments: Argument[] = []
  public readonly location: Location
  constructor(location: Location) {
    this.location = location
  }

  public addArgument(argument: Argument) {
    this.arguments.push(argument)
  }

  public length(): number {
    return this.arguments.length
  }

  public get(index: number): Argument {
    return this.arguments[index]
  }
}

export class Parameter {
  private _modifiers = new Modifiers()
  private _name: string
  private _type: Type
  private _isVarargs: boolean

  constructor(name: string, type: Type, isVarargs: boolean = false) {
    this._name = name
    this._type = type
    this._isVarargs = isVarargs
  }

  public addModifier(identifier: Identifier): void | TypeCheckerError {
    return this._modifiers.addModifier(ModifierType.VARIABLE, identifier)
  }

  public equals(object: unknown): boolean {
    return (
      object instanceof Parameter &&
      this._name === object._name &&
      (this._type.canBeAssigned(object._type) || object._type.canBeAssigned(this._type)) &&
      this._isVarargs === object._isVarargs
    )
  }

  public getName(): string {
    return this._name
  }

  public getType(): Type {
    if (this.isVarargs()) return new Array(this._type)
    return this._type
  }

  public invoke(argument: Argument): void | TypeCheckerError {
    if (this._type.canBeAssigned(argument.type)) return
    return new IncompatibleTypesError(argument.location)
  }

  public isFinal(): boolean {
    return this._modifiers.isFinal()
  }

  public isVarargs(): boolean {
    return this._isVarargs
  }

  public toString(): string {
    const modifiers = this._modifiers.isEmpty() ? '' : `${this._modifiers.toString()} `
    const ellipsis = this.isVarargs() ? '...' : ''
    return `${modifiers}${this._type.toString()} ${ellipsis}${this._name}`
  }
}

export class Parameters {
  private parameters: Parameter[] = []
  constructor() {}

  public addParameter(parameter: Parameter): void {
    this.parameters.push(parameter)
  }

  public get(index: number): Parameter {
    return this.parameters[index]
  }

  public equals(object: unknown): boolean {
    if (!(object instanceof Parameters)) return false
    if (this.parameters.length !== object.parameters.length) return false
    for (let i = 0; i < this.parameters.length; i++)
      if (!this.parameters[i].equals(object.parameters[i])) return false
    return true
  }

  public invoke(args: Arguments): void | TypeCheckerError {
    if (this.length() === 0 && args.length() !== 0)
      return new MethodCannotBeAppliedError(args.location)
    if (this.length() === 0 && args.length() === 0) return
    const isLastParameterVarargs = this.get(this.length() - 1).isVarargs()
    if (isLastParameterVarargs && args.length() < this.length() - 1)
      return new MethodCannotBeAppliedError(args.location)
    if (!isLastParameterVarargs && args.length() !== this.length())
      return new MethodCannotBeAppliedError(args.location)

    for (let i = 0; i < this.length(); i++) {
      const parameter = this.get(i)
      if (!parameter.isVarargs()) {
        const argument = args.get(i)
        const error = parameter.invoke(argument)
        if (error instanceof TypeCheckerError) return error
        continue
      }

      for (let j = i; j < args.length(); j++) {
        const argument = args.get(j)
        const error = parameter.invoke(argument)
        if (error instanceof TypeCheckerError) return error
      }
      break
    }
  }

  public length(): number {
    return this.parameters.length
  }

  public toString(): string {
    return `(${this.parameters.map(parameter => parameter.toString()).join(', ')})`
  }
}

export class Method implements Type {
  private modifiers = new Modifiers()
  private returnType: Type
  private methodName: string
  private parameters = new Parameters()
  private throws = new Throws()

  constructor(methodName: string, returnType?: Type) {
    this.methodName = methodName
    if (returnType) this.returnType = returnType
    else this.returnType = new Void()
  }

  public accessField(_name: string, _location: Location): Type | TypeCheckerError {
    throw new Error('Method not implemented.')
  }

  public accessMethod(_name: string, _location: Location): Method[] | TypeCheckerError {
    throw new Error('Method not implemented.')
  }

  public addModifier(identifier: Identifier): void | TypeCheckerError {
    return this.modifiers.addModifier(ModifierType.METHOD, identifier)
  }

  public addParameter(parameter: Parameter): void | TypeCheckerError {
    return this.parameters.addParameter(parameter)
  }

  public canBeAssigned(_type: Type): boolean {
    throw new Error('Method not implemented.')
  }

  public equals(object: unknown): boolean {
    if (!(object instanceof Method)) return false
    return this.parameters.equals(object.parameters)
  }

  public getReturnType(): Type {
    return this.returnType
  }

  public invoke(args: Arguments): Type | TypeCheckerError {
    if (this.methodName === 'println') return new Void()
    const error = this.parameters.invoke(args)
    if (error instanceof TypeCheckerError) return error
    return this.returnType
  }

  public mapParameters(mapper: (name: string, type: Type, isVarargs: boolean) => void): void {
    for (let i = 0; i < this.parameters.length(); i++) {
      const param = this.parameters.get(i)
      mapper(param.getName(), param.getType(), param.isVarargs())
    }
  }

  public toString(): string {
    return `${this.modifiers.toString()} ${this.returnType.toString()} ${this.methodName}${this.parameters.toString()} ${this.throws.toString()}`
  }
}
