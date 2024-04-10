import { check } from './checker'
import { Node } from './ast/types'
import { parse } from './ast'
import { TypeCheckerError } from './errors'

export type TypeCheckResult = { hasTypeErrors: boolean; errors: Error[] }

export const parseProgram = (program: string): Node => {
  return parse(program)
}

export const typeCheck = (ast: Node): TypeCheckResult => {
  const result = check(ast)
  return {
    hasTypeErrors: result.errors.length > 0,
    errors: result.errors
  }
}

export const convertErrorsToReadableMsgs = (program: string, errors: Error[]): string[] => {
  return errors.map(error => {
    if (!(error instanceof TypeCheckerError)) return error.message
    return error.toReadableMessage(program)
  })
}
