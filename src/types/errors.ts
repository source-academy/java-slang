export class BadOperandTypesError extends Error {}

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
