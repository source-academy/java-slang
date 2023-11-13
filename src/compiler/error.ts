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