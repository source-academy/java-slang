export class BadOperandTypesError extends Error {}

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
