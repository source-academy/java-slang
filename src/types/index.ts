import { check } from './checker'
import { parse } from './ast'
import { TypeCheckerError } from './errors'

type TypeCheckResult = { hasTypeErrors: boolean; errorMsgs: string[] }

const convertErrorsToReadableMsgs = (program: string, errors: Error[]): string[] => {
  return errors.map(error => {
    if (!(error instanceof TypeCheckerError)) return error.message
    return error.toReadableMessage(program)
  })
}

export const typeCheck = (program: string): TypeCheckResult => {
  const ast = parse(program)
  if (ast instanceof TypeCheckerError)
    return {
      hasTypeErrors: true,
      errorMsgs: convertErrorsToReadableMsgs(program, [ast])
    }
  const result = check(ast)
  return {
    hasTypeErrors: result.errors.length > 0,
    errorMsgs: convertErrorsToReadableMsgs(program, result.errors)
  }
}
