import * as NonPrimitives from "../types/nonPrimitives";
import * as Primitives from "../types/primitives";
import { Type } from "../types/type";

export class FrameError extends Error {}

export class CannotFindSymbolError extends FrameError {
  constructor() {
    super("cannot find symbol");
  }
}

export class VariableAlreadyDefinedError extends FrameError {
  constructor() {
    super("variable is already defined");
  }
}

const GLOBAL_TYPE_ENVIRONMENT: { [key: string]: Type } = {
  boolean: new Primitives.Boolean(),
  byte: new Primitives.Byte(),
  char: new Primitives.Char(),
  double: new Primitives.Double(),
  float: new Primitives.Float(),
  int: new Primitives.Int(),
  long: new Primitives.Long(),
  short: new Primitives.Short(),
  Boolean: new NonPrimitives.Boolean(),
  Byte: new NonPrimitives.Byte(),
  Character: new NonPrimitives.Character(),
  Double: new NonPrimitives.Double(),
  Float: new NonPrimitives.Float(),
  Integer: new NonPrimitives.Integer(),
  Long: new NonPrimitives.Long(),
  Short: new NonPrimitives.Short(),
  String: new NonPrimitives.String(),
};

export class Frame {
  // private _methods = new Map<string, Type>();
  private _types = new Map<string, Type>();
  private _variables = new Map<string, Type>();

  private _parentFrame: Frame | null = null;
  private _childrenFrames: Frame[] = [];

  private constructor() {}

  public getVariable(name: string): Type | FrameError {
    let frame: Frame | null = this;
    while (frame) {
      const type = frame._variables.get(name);
      if (type) return type;
      frame = frame._parentFrame;
    }
    return new CannotFindSymbolError();
  }

  public isVariableInFrame(name: string): boolean {
    return !!this._variables.get(name);
  }

  public getType(name: string): Type | FrameError {
    let frame: Frame | null = this;
    while (frame) {
      const type = frame._types.get(name);
      if (type) return type;
      frame = frame._parentFrame;
    }
    return new CannotFindSymbolError();
  }

  public newChildFrame(): Frame {
    const childFrame = new Frame();
    this._childrenFrames.push(childFrame);
    childFrame._parentFrame = this;
    return childFrame;
  }

  public setType(name: string, type: Type): null | FrameError {
    const existingType = this._types.get(name);
    if (existingType) return new VariableAlreadyDefinedError();
    this._types.set(name, type);
    return null;
  }

  public setVariable(name: string, type: Type): null | FrameError {
    const existingType = this._types.get(name);
    if (existingType) return new VariableAlreadyDefinedError();
    this._variables.set(name, type);
    return null;
  }

  public toString(): string {
    const types = [...this._types.entries()];
    const variables = [...this._variables.entries()];
    const parentFrame = this._parentFrame
      ? JSON.parse(this._parentFrame.toString())
      : null;
    return JSON.stringify({ types, variables, parentFrame }, null, 2);
  }

  public static globalFrame(): Frame {
    const globalFrame = new Frame();
    Object.keys(GLOBAL_TYPE_ENVIRONMENT).forEach((key) => {
      globalFrame.setType(key, GLOBAL_TYPE_ENVIRONMENT[key]);
    });
    return globalFrame;
  }
}

export type FrameOld = {
  types: Record<string, Type>;
  variables: Record<string, Type>;
  previousFrame: FrameOld | null;
};
