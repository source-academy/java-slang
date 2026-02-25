import { Control, Environment, Stash } from './components'

/*
    Native function escape hatch.

    Used for implementing native methods. Allows for purely arbitrary modification to the control, stash, and environment via an external handler function.

    All native functions are expected to respect Java method call preconditions and postconditions, with the exception of returning. When a native function is called, it can expect the following.

    Preconditions: environment has been initialised for the current function call.

    Postconditions: returned result must be pushed onto the top of the stash.

    The current implementation automatically injects a return instruction after the external handler function call ends.
*/

export type NativeFunction = ({
  control,
  stash,
  environment
}: {
  control: Control
  stash: Stash
  environment: Environment
}) => void

export const natives: {
  [descriptor: string]: NativeFunction
} = {}
