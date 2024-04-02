import { Type } from "./type";

export class Array extends Type {
  private _type: Type;
  constructor(type: Type) {
    super("array");
    this._type = type;
  }

  public canBeAssigned(type: Type): boolean {
    if (!(type instanceof Array)) return false;
    return this._type.equals(type._type);
  }
}
