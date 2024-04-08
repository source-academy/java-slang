import { Environment } from "../../components";
import { STEP_LIMIT } from "../../constants";
import { ControlItem, Context, StashItem, StructType } from "../../types";
import { Stack, isNode } from "../../utils";

export class StackStub<T> extends Stack<T> {
  private trace: T[] = [];

  public push(...items: T[]): void {
    for (const item of items) {
      super.push(item);
      this.trace.push(item);
    }
  };

  public getTrace(): T[] {
    return this.trace;
  };
};
export class ControlStub extends StackStub<ControlItem> {};
export class StashStub extends StackStub<StashItem> {};
// TODO make env traceable
export class EnvironmentStub extends Environment {};

export const createContextStub = (): Context => ({
  errors: [],
  control: new ControlStub(),
  stash: new StashStub(),
  environment: new EnvironmentStub(),
  totalSteps: STEP_LIMIT,
});

export const getControlItemStr = (i: ControlItem): string => {
  return isNode(i) ? i.kind : i.instrType;
};

export const getStashItemStr = (i: StashItem): string => {
  return i.kind === "Literal" 
    ? i.literalType.value 
    : i.kind === StructType.CLOSURE
    ? i.mtdOrCon.kind === "MethodDeclaration"
      ? i.mtdOrCon.methodHeader.identifier
      : i.mtdOrCon.constructorDeclarator.identifier
    : i.kind === StructType.VARIABLE
    ? i.name
    : i.kind === StructType.CLASS
    ? i.frame.name
    : i.kind === StructType.TYPE
    ? i.type
    : i.kind;
};
