import { Type } from "./types";

export interface RuntimeError {
  explain(): string;
};

export class UndeclaredVariableError implements RuntimeError {
  constructor(private name: string) {};

  public explain() {
    return `Name ${this.name} not declared.`;
  }
}

export class UnassignedVariableError implements RuntimeError {
  constructor(private name: string) {};

  public explain() {
    return `Name ${this.name} not definitely assigned.`;
  }
}

export class VariableRedeclarationError implements RuntimeError {
  constructor(private name: string) {};

  public explain() {
    return `Name ${this.name} redeclared.`;
  }
}

export class UndeclaredMethodError implements RuntimeError {
  constructor(private name: string) {};

  public explain() {
    return `Method ${this.name} not declared.`;
  }
}

export class MtdOrConRedeclarationError implements RuntimeError {
  constructor(private name: string) {};

  public explain() {
    return `Method/Constructor ${this.name} redeclared.`;
  }
}

export class UndeclaredClassError implements RuntimeError {
  constructor(private name: string) {};

  public explain() {
    return `Class ${this.name} not declared.`;
  }
}

export class ClassRedeclarationError implements RuntimeError {
  constructor(private name: string) {};

  public explain() {
    return `Class ${this.name} redeclared.`;
  }
}

export class UndeclaredNameError implements RuntimeError {
  constructor(private name: string) {};

  public explain() {
    return `Name ${this.name} not declared.`;
  }
}

export class ResOverloadError implements RuntimeError {
  constructor(private name: string, private argTypes: Type[]) {};

  public explain() {
    return `Overloading resolution of method ${this.name} with argTypes ${this.argTypes.map(t => t.type).join(", ")} failed.`;
  }
}

export class ResConOverloadError implements RuntimeError {
  constructor(private name: string, private argTypes: Type[]) {};

  public explain() {
    return `Overloading resolution of constructor ${this.name} with argTypes ${this.argTypes.map(t => t.type).join(", ")} failed.`;
  }
}

export class NullPointerException implements RuntimeError {
  public explain() {
    return `Accessing instance field/method of null value.`;
  }
}

export class NoMainMtdError implements RuntimeError {
  public explain() {
    return `public static void main(String[] args) is not defined in any class.`;
  }
}
