class CompileError extends Error {
  constructor(errorMsg: string) {
    super(errorMsg);
  }
}

export class SymbolNotFoundError extends CompileError {
  constructor(name: string) {
    super("\"" + name + "\"" + " is not defined");
  }
}

export class SymbolRedeclarationError extends CompileError {
  constructor(name: string) {
    super("\"" + name + "\"" + " has already been declared");
  }
}

export class ConstructNotSupportedError extends CompileError {
  constructor(name: string) {
    super("\"" + name + "\"" + " is currently not supported by the compiler");
  }
}

export class InvalidMethodCallError extends CompileError {
  constructor(name: string) {
    super("\"" + name + "\"" + " is not a valid method");
  }
}