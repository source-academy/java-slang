class CompileError extends Error {
  constructor(errorMsg: string) {
    super(errorMsg)
  }
}

export class SymbolNotFoundError extends CompileError {
  constructor(name: string) {
    super('"' + name + '"' + ' is not defined')
  }
}

export class SymbolRedeclarationError extends CompileError {
  constructor(name: string) {
    super('"' + name + '"' + ' has already been declared')
  }
}

export class SymbolCannotBeResolvedError extends CompileError {
  constructor(token: string, fullName: string) {
    super('cannot resolve symbol ' + '"' + token + '"' + ' in ' + '"' + fullName + '"')
  }
}

export class InvalidMethodCallError extends CompileError {
  constructor(name: string) {
    super('"' + name + '"' + ' is not a valid method')
  }
}

export class ConstructNotSupportedError extends CompileError {
  constructor(name: string) {
    super('"' + name + '"' + ' is currently not supported by the compiler')
  }
}

export class NoMethodMatchingSignatureError extends CompileError {
  constructor(signature: string) {
    super(`No method matching signature ${signature}) found.`)
  }
}

export class AmbiguousMethodCallError extends CompileError {
  constructor(signature: string) {
    super(`Ambiguous method call: ${signature}`)
  }
}
