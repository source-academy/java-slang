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