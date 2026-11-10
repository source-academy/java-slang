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
  constructor(kind: 'field' | 'method' | 'variable', name: string) {
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

export class InconvertibleTypesError extends CompileError {
  constructor(from: string, to: string) {
    super(`incompatible types: ${from} cannot be converted to ${to}`)
  }
}

export class BadOperandTypesError extends CompileError {
  constructor(operator: string, left: string, right: string) {
    super(`bad operand types for binary operator '${operator}': ${left}, ${right}`)
  }
}

export class AbstractClassInstantiationError extends CompileError {
  constructor(name: string) {
    super(`${name} is abstract; cannot be instantiated`)
  }
}

export class EnumInstantiationError extends CompileError {
  constructor(name: string) {
    super(`enum classes may not be instantiated: ${name}`)
  }
}

export class MissingAbstractMethodImplementationError extends CompileError {
  constructor(className: string, method: string, declaringClass: string) {
    super(
      `${className} is not abstract and does not override abstract method ${method} in ${declaringClass}`
    )
  }
}

export class CannotInheritFromFinalClassError extends CompileError {
  constructor(name: string) {
    super(`cannot inherit from final ${name}`)
  }
}

export class InvalidOverrideError extends CompileError {
  constructor(overriding: string, overridden: string, verb: 'override' | 'hide', reason: string) {
    super(`${overriding} cannot ${verb} ${overridden}; ${reason}`)
  }
}

export class MethodAlreadyDefinedError extends CompileError {
  constructor(kind: 'method' | 'constructor', signature: string, className: string) {
    super(`${kind} ${signature} is already defined in class ${className}`)
  }
}

export class BadOperandTypeError extends CompileError {
  constructor(operator: string, type: string) {
    super(`bad operand type ${type} for unary operator '${operator}'`)
  }
}

export class UnreportedExceptionError extends CompileError {
  constructor(exception: string) {
    super(`unreported exception ${exception}; must be caught or declared to be thrown`)
  }
}

export class ExceptionNeverThrownError extends CompileError {
  constructor(exception: string) {
    super(`exception ${exception} is never thrown in body of corresponding try statement`)
  }
}

export class MulticatchAlternativesRelatedError extends CompileError {
  constructor(subclass: string, superclass: string) {
    super(
      `Alternatives in a multi-catch statement cannot be related by subclassing; ` +
        `Alternative ${subclass} is a subclass of alternative ${superclass}`
    )
  }
}

export class MulticatchParameterAssignedError extends CompileError {
  constructor(parameter: string) {
    super(`multi-catch parameter ${parameter} may not be assigned`)
  }
}
