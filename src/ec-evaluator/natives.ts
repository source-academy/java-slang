import { Control, Environment, Stash } from './components'
import { RuntimeError } from './errors'
import { Interfaces, StashItem, StructType, VarValue } from './types'

/*
    Native function escape hatch.

    Used for implementing native methods. Allows for purely arbitrary modification to the control, stash, and environment via an external handler function.

    All native functions are expected to respect Java method call preconditions and postconditions, with the exception of returning. When a native function is called, it can expect the following.

    Preconditions: environment has been initialised for the current function call.

    Postconditions: returned result must be pushed onto the top of the stash.

    The current implementation automatically injects a return instruction after the external handler function call ends.
*/

export type ForeignFunction = ({
  control,
  stash,
  environment,
  interfaces
}: {
  control: Control
  stash: Stash
  environment: Environment
  interfaces: Interfaces
}) => void

export const foreigns: {
  [descriptor: string]: ForeignFunction
} = {
  'Object::hashCode(): int': ({ stash, environment, interfaces }) => {
    const instance = environment.getVariable('this').value

    const hashCode = getHashCode(instance, interfaces)

    const stashItem: StashItem = {
      kind: 'Literal',
      literalType: { kind: 'DecimalIntegerLiteral', value: String(hashCode) }
    }

    stash.push(stashItem)
  },

  'Object::display(int s): void': ({ environment, interfaces }) => {
    // @ts-expect-error ts(2339): guaranteed valid by type checker
    const s = environment.getVariable('s').value.literalType.value

    interfaces.stdout(s)
  },

  'Object::toString(): String': ({ stash, environment, interfaces }) => {
    const instance = environment.getVariable('this').value

    if (instance.kind !== StructType.OBJECT) {
      throw new RuntimeError('Call to toString on non-Object')
    }

    const className = instance.class.classDecl.typeIdentifier
    const hashCodeToHex = getHashCode(instance, interfaces).toString(16)

    const stashItem: StashItem = {
      kind: 'Literal',
      literalType: {
        kind: 'StringLiteral',
        value: `${className}@${hashCodeToHex}`
      }
    }

    stash.push(stashItem)
    return
  }
}

// Utility functions used by native methods
const getHashCode = (obj: VarValue, interfaces: Interfaces): number => {
  if (obj.kind !== StructType.OBJECT) {
    // TODO: throw error here
    throw new RuntimeError('Attempt to retrieve hashCode from non-Object')
  }

  if (obj.hashCode === undefined) {
    obj.hashCode = interfaces.statics.lfsr.next()
  }

  return obj.hashCode
}
