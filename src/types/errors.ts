import { Location } from './ast/types'

export class TypeCheckerError extends Error {
  private location?: Location

  constructor(message: string, location?: Location) {
    super('Error: ' + message)
    this.location = location
  }

  public toReadableMessage(program: string): string {
    if (!this.location) return this.message
    const lines = program.split(/\n/)
    const errorLine = lines[this.location.startLine - 1] + ` (in line ${this.location.startLine})`
    if (!this.location.startColumn) return this.message + '\n' + errorLine + '\n'
    const errorPointer = `${' '.repeat(this.location.startColumn - 1)}^`
    return this.message + '\n' + errorLine + '\n' + errorPointer + '\n'
  }
}

export class ArrayRequiredError extends TypeCheckerError {
  constructor(location?: Location) {
    super('array required', location)
  }
}

export class BadOperandTypesError extends TypeCheckerError {
  constructor(location?: Location) {
    super('bad operand', location)
  }
}

export class CannotBeDereferencedError extends TypeCheckerError {
  constructor(location?: Location) {
    super('cannot be dereferenced', location)
  }
}

export class CannotFindSymbolError extends TypeCheckerError {
  constructor(location?: Location) {
    super('cannot find symbol', location)
  }
}

export class CyclicInheritanceError extends TypeCheckerError {
  constructor(location?: Location) {
    super('cyclic inheritance', location)
  }
}

export class FloatTooLargeError extends TypeCheckerError {
  constructor(location?: Location) {
    super('floating-point number too large', location)
  }
}

export class FloatTooSmallError extends TypeCheckerError {
  constructor(location?: Location) {
    super('floating-point number too small', location)
  }
}

export class NotApplicableToExpressionTypeError extends TypeCheckerError {
  constructor(location?: Location) {
    super('not applicable to expression type', location)
  }
}

export class IllegalUnderscoreError extends TypeCheckerError {
  constructor(location?: Location) {
    super('illegal underscore', location)
  }
}

export class IntegerTooLargeError extends TypeCheckerError {
  constructor(location?: Location) {
    super('integer number too large', location)
  }
}

export class IncompatibleTypesError extends TypeCheckerError {
  constructor(location?: Location) {
    super('incompatible types', location)
  }
}

export class MethodAlreadyDefinedError extends TypeCheckerError {
  constructor(location?: Location) {
    super('method is already defined', location)
  }
}

export class MethodCannotBeAppliedError extends TypeCheckerError {
  constructor(location?: Location) {
    super('method cannot be applied', location)
  }
}

export class VarargsParameterMustBeLastParameter extends TypeCheckerError {
  constructor(location?: Location) {
    super('varargs parameter must be the last parameter', location)
  }
}

export class VariableAlreadyDefinedError extends TypeCheckerError {
  constructor(location?: Location) {
    super('variable is already defined', location)
  }
}
