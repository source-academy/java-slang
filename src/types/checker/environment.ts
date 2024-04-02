import * as NonPrimitives from "../types/nonPrimitives";
import * as Primitives from "../types/primitives";
import { Method, Type } from "../types/type";

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
  void: new NonPrimitives.Void(),
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
  private _methods = new Map<string, Method>();
  private _types = new Map<string, Type>();
  private _variables = new Map<string, Type>();

  private _parentFrame: Frame | null = null;
  private _childrenFrames: Frame[] = [];

  private constructor() {}

  public getMethod(name: string): Method | FrameError {
    let frame: Frame | null = this;
    while (frame) {
      const method = frame._methods.get(name);
      if (method) return method;
      frame = frame._parentFrame;
    }
    return new CannotFindSymbolError();
  }

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

  public setMethod(name: string, method: Method): null | FrameError {
    const existingMethod = this._methods.get(name);
    if (existingMethod) return new VariableAlreadyDefinedError();
    this._methods.set(name, method);
    return null;
  }

  public setType(name: string, type: Type): null | FrameError {
    const existingType = this._types.get(name);
    if (existingType) return new VariableAlreadyDefinedError();
    this._types.set(name, type);
    return null;
  }

  public setVariable(name: string, type: Type): null | FrameError {
    const existingVariable = this._types.get(name);
    if (existingVariable) return new VariableAlreadyDefinedError();
    this._variables.set(name, type);
    return null;
  }

  public toObject(): object {
    const methods = [...this._methods.entries()];
    const types = [...this._types.entries()];
    const variables = [...this._variables.entries()];
    const parentFrame = this._parentFrame?.toObject() ?? null;
    return { methods, types, variables, parentFrame };
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