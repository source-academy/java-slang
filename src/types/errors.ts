export class ArrayRequiredError extends Error {
  constructor() {
    super('array required')
  }
}

export class BadOperandTypesError extends Error {
  constructor() {
    super('bad operand')
  }
}

export class CannotBeDereferencedError extends Error {
  constructor() {
    super('cannot be dereferenced')
  }
}

export class CannotFindSymbolError extends Error {
  constructor() {
    super('cannot find symbol')
  }
}

export class FloatTooLargeError extends Error {
  constructor() {
    super('floating-point number too large')
  }
}

export class FloatTooSmallError extends Error {
  constructor() {
    super('floating-point number too small')
  }
}

export class IllegalUnderscoreError extends Error {
  constructor() {
    super('illegal underscore')
  }
}

export class IntegerTooLargeError extends Error {
  constructor() {
    super('integer number too large')
  }
}

export class IncompatibleTypesError extends Error {
  constructor() {
    super('incompatible types')
  }
}

export class MethodAlreadyDefinedError extends Error {
  constructor() {
    super('method is already defined')
  }
}

export class MethodCannotBeAppliedError extends Error {
  constructor() {
    super('method cannot be applied')
  }
}

export class VariableAlreadyDefinedError extends Error {
  constructor() {
    super('variable is already defined')
  }
}
