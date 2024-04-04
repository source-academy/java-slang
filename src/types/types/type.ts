export abstract class Type {
  public name: string
  constructor(name: string) {
    this.name = name
  }

  abstract canBeAssigned(type: Type): boolean

  abstract accessField(name: string): Type | Error

  public equals(object: unknown): boolean {
    return object instanceof Type && this.name === object.name
  }
}
