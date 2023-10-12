export class BadOperandTypesError extends Error {}

export class IntegerTooLargeError extends Error {
  constructor() {
    super("integer number too large");
  }
}
