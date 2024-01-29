import { Environment } from "../interpreter";
import { ControlItem, Context, Name, Value } from "../types";
import { Stack } from "../utils";

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
export class StashStub extends StackStub<Value> {};

export class EnvironmentStub extends Environment {
  private trace = new Map<Name, Value[]>();

  public set(key: Name, value: Value): this {
    super.set(key, value);

    if (this.trace.has(key)) {
      this.trace.set(key, [...this.trace.get(key)!, value]);
    } else {
      this.trace.set(key, [value]);
    }

    return this;
  }

  public getTrace(): Map<Name, Value[]> {
    return this.trace;
  }
}

export const createContextStub = (): Context => ({
  errors: [],
  control: new ControlStub(),
  stash: new StashStub(),
  environment: new EnvironmentStub(),
  totalSteps: Infinity,
});
