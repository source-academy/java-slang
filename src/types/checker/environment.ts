import * as NonPrimitives from "../types/nonPrimitives";
import * as Primitives from "../types/primitives";
import { CannotFindSymbolError } from "../errors";
import { Type } from "../types/type";

export type Frame = {
  types: Record<string, Type>;
  variables: Record<string, Type>;
  previousFrame: Frame | null;
};

export const createFrame = (
  types: Record<string, Type>,
  previousFrame?: Frame
): Frame => ({
  types,
  variables: {},
  previousFrame: previousFrame || null,
});

export const GLOBAL_ENVIRONMENT: Frame = createFrame({
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
});

export const getEnvironmentType = (
  environmentFrame: Frame | null,
  typeName: string
): Type | Error => {
  while (environmentFrame) {
    const { types } = environmentFrame;
    if (types[typeName]) return types[typeName];
    environmentFrame = environmentFrame.previousFrame;
  }
  return new CannotFindSymbolError();
};

export const getEnvironmentVariable = (
  environmentFrame: Frame | null,
  typeName: string
): Type | Error => {
  while (environmentFrame) {
    const { variables } = environmentFrame;
    if (variables[typeName]) return variables[typeName];
    environmentFrame = environmentFrame.previousFrame;
  }
  return new CannotFindSymbolError();
};

export const setEnvironmentVariable = (
  environmentFrame: Frame,
  typeName: string,
  type: Type
) => {
  environmentFrame.variables[typeName] = type;
};
