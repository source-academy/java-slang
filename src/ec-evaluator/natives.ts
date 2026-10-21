import { Literal } from '../ast/types/blocks-and-statements'
import { Control, Environment, Stash } from './components'
import { RuntimeError } from './errors'
import { libraryBinaryNames } from './lib'
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

  'PrintStream::println(String s): void': ({ environment, interfaces }) => {
    // @ts-expect-error ts(2339): guaranteed valid by type checker
    const literal: Literal['literalType'] = environment.getVariable('s').value.literalType

    interfaces.stdout(literal.kind === 'StringLiteral' ? unquote(literal.value) : literal.value)
  },

  'Object::toString(): String': ({ stash, environment, interfaces }) => {
    const instance = environment.getVariable('this').value

    if (instance.kind !== StructType.OBJECT) {
      throw new RuntimeError('Call to toString on non-Object')
    }

    // as getClass().getName()
    const simpleName = instance.class.classDecl.typeIdentifier
    const className = libraryBinaryNames[simpleName] ?? simpleName
    // unsigned, as Integer.toHexString
    const hashCodeToHex = (getHashCode(instance, interfaces) >>> 0).toString(16)

    // string literal values keep their source quotes
    const stashItem: StashItem = {
      kind: 'Literal',
      literalType: {
        kind: 'StringLiteral',
        value: `"${className}@${hashCodeToHex}"`
      }
    }

    stash.push(stashItem)
    return
  }
}

// Utility functions used by native methods
const ESCAPES: { [c: string]: string } = {
  b: '\b',
  t: '\t',
  n: '\n',
  f: '\f',
  r: '\r',
  '"': '"',
  "'": "'",
  '\\': '\\'
}

// String literal source token -> its value: strip the quotes, decode escape sequences.
// Octal escapes are \0 to \377, matched longest first.
const unquote = (token: string): string =>
  token
    .slice(1, -1)
    .replace(/\\(?:([0-3][0-7]{2}|[0-7][0-7]?)|([btnfr"'\\]))/g, (_, octal: string, c: string) =>
      octal ? String.fromCharCode(parseInt(octal, 8)) : ESCAPES[c]
    )

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
