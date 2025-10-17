import { Environment } from '../../components'
import { STEP_LIMIT } from '../../constants'
import { LFSR } from '../../lib'
import { ControlItem, Context, StashItem, StructType } from '../../types'
import { Stack, isNode } from '../../utils'
import { makeObjectClass } from '../../index'

export class StackStub<T> extends Stack<T> {
  private trace: T[] = []

  public push(...items: T[]): void {
    for (const item of items) {
      super.push(item)
      this.trace.push(item)
    }
  }

  public getTrace(): T[] {
    return this.trace
  }
}

export class ControlStub extends StackStub<ControlItem> {}
export class StashStub extends StackStub<StashItem> {}
// TODO make env traceable
export class EnvironmentStub extends Environment {
  constructor() {
    super()
    this.defineClass('Object', makeObjectClass())
  }
}

export const createContextStub = (): Context => ({
  errors: [],
  control: new ControlStub(),
  stash: new StashStub(),
  environment: new EnvironmentStub(),
  totalSteps: STEP_LIMIT,
  interfaces: {
    stdout: console.log,
    stderr: console.error,
    statics: {
      lfsr: new LFSR('')
    }
  }
})

export const getControlItemStr = (i: ControlItem): string => {
  return isNode(i) ? i.kind : i.instrType
}

export const getStashItemStr = (i: StashItem): string => {
  return i.kind === 'Literal'
    ? i.literalType.value
    : i.kind === StructType.CLOSURE
      ? i.decl.kind === 'MethodDeclaration' || i.decl.kind === 'NativeDeclaration'
        ? i.decl.methodHeader.identifier
        : i.decl.constructorDeclarator.identifier
      : i.kind === StructType.VARIABLE
        ? i.name
        : i.kind === StructType.CLASS
          ? i.frame.name
          : i.kind === StructType.TYPE
            ? i.type
            : i.kind
}
