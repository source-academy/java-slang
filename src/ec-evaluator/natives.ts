import { Control, Environment, Stash } from './components'
import { StashItem } from './types'

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
  environment
}: {
  control: Control
  stash: Stash
  environment: Environment
}) => void

export const foreigns: {
  [descriptor: string]: ForeignFunction
} = {
  'Object::hashCode(): int': ({ stash }) => {
    const hashCode = Math.floor(Math.random() * Math.pow(2, 32))
    const stashItem: StashItem = {
      kind: 'Literal',
      literalType: { kind: 'DecimalIntegerLiteral', value: String(hashCode) }
    }

    console.log(stashItem)
    stash.push(stashItem)
  },

  'Object::display(String s): void': ({ environment }) => {
    // @ts-expect-error ts(2339): guaranteed valid by type checker
    const s = environment.getVariable('s').value.literalType.value

    // TODO: hook up to frontend
    console.log(s)
  }
}
