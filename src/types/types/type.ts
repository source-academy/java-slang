export abstract class Type {
  public name: string;
  constructor(name: string) {
    this.name = name;
  }

  abstract canBeAssigned(type: Type): boolean;
}

export class Parameter extends Type {
  public name: string;
  public type: Type;
  constructor() {
    super("parameter");
  }

  canBeAssigned(type: Type): boolean {
    if (type instanceof Parameter) return this.type.canBeAssigned(type.type);
    return this.type.canBeAssigned(type);
  }
}

export class Method extends Type {
  public returnType: Type;
  public methodName: string;
  public parameters: Parameter[];
  public exceptions: object[];

  constructor() {
    super("method");
  }

  canBeAssigned(type: Type): boolean {
    if (!(type instanceof Method)) return false;
    if (!this.returnType.canBeAssigned(type.returnType)) return false;
    if (this.parameters.length !== type.parameters.length) return false;
    for (let i = 0; i < this.parameters.length; i++)
      if (!this.parameters[i].canBeAssigned(type.parameters[i])) return false;
    return true;
  }
}

export class ClassMethod extends Method {
  public modifiers: string[];

  constructor() {
    super();
  }
}
