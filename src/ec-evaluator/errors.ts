import { Type } from "./types";

export enum ErrorType {
  SYNTAX = "Syntax",
  RUNTIME = "Runtime",
}

export interface SourceError {
  type: ErrorType;
  explain(): string;
}

export class SyntaxError implements SourceError {
  type = ErrorType.SYNTAX;

  constructor(private errMsg: string) {};

  explain(): string {
    return `SyntaxError: ${this.errMsg}`;
  };
};

export class RuntimeError implements SourceError {
  type = ErrorType.RUNTIME;
  
  explain(): string {
    return "RuntimeError";
  };
};

export class UndeclaredVariableError extends RuntimeError {
  constructor(private name: string) {
    super();
  };

  public explain() {
    return `${super.explain()}: Name ${this.name} not declared.`;
  }
}

export class UnassignedVariableError extends RuntimeError {
  constructor(private name: string) {
    super();
  };

  public explain() {
    return `${super.explain()}: Name ${this.name} not definitely assigned.`;
  }
}

export class VariableRedeclarationError extends RuntimeError {
  constructor(private name: string) {
    super();
  };

  public explain() {
    return `${super.explain()}: Name ${this.name} redeclared.`;
  }
}

export class UndeclaredMethodError extends RuntimeError {
  constructor(private name: string) {
    super();
  };

  public explain() {
    return `${super.explain()}: Method ${this.name} not declared.`;
  }
}

export class MtdOrConRedeclarationError extends RuntimeError {
  constructor(private name: string) {
    super();
  };

  public explain() {
    return `${super.explain()}: Method/Constructor ${this.name} redeclared.`;
  }
}

export class UndeclaredClassError extends RuntimeError {
  constructor(private name: string) {
    super();
  };

  public explain() {
    return `${super.explain()}: Class ${this.name} not declared.`;
  }
}

export class ClassRedeclarationError extends RuntimeError {
  constructor(private name: string) {
    super();
  };

  public explain() {
    return `${super.explain()}: Class ${this.name} redeclared.`;
  }
}

export class UndeclaredNameError extends RuntimeError {
  constructor(private name: string) {
    super();
  };

  public explain() {
    return `${super.explain()}: Name ${this.name} not declared.`;
  }
}

export class ResOverloadError extends RuntimeError {
  constructor(private name: string, private argTypes: Type[]) {
    super();
  };

  public explain() {
    return `${super.explain()}: Overloading resolution of method ${this.name} \
      with argTypes ${this.argTypes.map(t => t.type).join(", ")} failed.`;
  }
}

export class ResConOverloadError extends RuntimeError {
  constructor(private name: string, private argTypes: Type[]) {
    super();
  };

  public explain() {
    return `${super.explain()}: Overloading resolution of constructor ${this.name} \
      with argTypes ${this.argTypes.map(t => t.type).join(", ")} failed.`;
  }
}

export class NullPointerException extends RuntimeError {
  public explain() {
    return `Accessing instance field/method of null value.`;
  }
}

export class NoMainMtdError extends RuntimeError {
  public explain() {
    return `public static void main(String[] args) is not defined in any class.`;
  }
}
