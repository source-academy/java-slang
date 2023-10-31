export abstract class Type {
  public name: string;
  constructor(name: string) {
    this.name = name;
  }

  abstract canBeAssigned(type: Type): boolean;
}
