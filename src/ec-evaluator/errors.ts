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
