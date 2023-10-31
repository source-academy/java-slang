import { CannotFindSymbolError } from "../errors";
import * as Primitives from "../types/primitives";
import { Type } from "../types/type";

export type Frame = {
  types: Record<string, Type>;
  previousFrame: Frame;
} | null;

export const createFrame = (
  types: Record<string, Type>,
  previousFrame?: Frame
): Frame => ({
  types,
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
  String: new Primitives.String(),
});

export const getType = (
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
