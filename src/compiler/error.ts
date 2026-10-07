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

export class UnresolvedImportError extends CompileError {
  constructor(identifier: string) {
    super('the import ' + '"' + identifier + '"' + ' cannot be resolved')
  }
}

export class InvalidMethodCallError extends CompileError {
  constructor(name: string) {
    super('"' + name + '"' + ' is not a valid method')
  }
}

export class NonStaticReferenceInStaticContextError extends CompileError {
  constructor(kind: 'field' | 'method', name: string) {
    super('non-static ' + kind + ' "' + name + '" cannot be referenced from a static context')
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

export class OverrideFinalMethodError extends CompileError {
  constructor(name: string) {
    super(`Cannot override final method ${name}`)
  }
}

export class MultiplePublicClassesError extends CompileError {
  constructor(names: string[]) {
    super(
      `Multiple public classes found (${names.join(', ')}): a program may declare at most one public class`
    )
  }
}

export class MainMethodNotFoundError extends CompileError {
  constructor(className: string) {
    super(
      `Main method not found in public class ${className}: expected public static void main(String[] args)`
    )
  }
}

export class NoMainClassError extends CompileError {
  constructor() {
    super(
      'No main method found: with no public class, some class must declare public static void main(String[] args)'
    )
  }
}
