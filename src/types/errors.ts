export class BadOperandTypesError extends Error {}

export class CannotFindSymbolError extends Error {
  constructor() {
    super("cannot find symbol");
  }
}

export class FloatTooLargeError extends Error {
  constructor() {
    super("floating-point number too large");
  }
}

export class FloatTooSmallError extends Error {
  constructor() {
    super("floating-point number too small");
  }
}

export class IllegalUnderscoreError extends Error {
  constructor() {
    super("illegal underscore");
  }
}

export class IntegerTooLargeError extends Error {
  constructor() {
    super("integer number too large");
  }
}

export class IncompatibleTypesError extends Error {
  constructor() {
    super("incompatible types");
  }
}
