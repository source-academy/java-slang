import { check } from './checker'
import { parse } from './ast'
import { TypeCheckerError } from './errors'
import { Frame } from './checker/environment'

type TypeCheckResult = { hasTypeErrors: boolean; errorMsgs: string[] }

const convertErrorsToReadableMsgs = (program: string, errors: Error[]): string[] => {
  return errors.map(error => {
    if (!(error instanceof TypeCheckerError)) return error.message
    return error.toReadableMessage(program)
  })
}

export const typeCheck = (...programs: string[]): TypeCheckResult => {
  const frame: Frame = Frame.globalFrame().newChildFrame()

  // fail fast; returns early
  for (const p of programs) {
    const ast = parse(p)
    if (ast instanceof TypeCheckerError)
      return {
        hasTypeErrors: true,
        errorMsgs: convertErrorsToReadableMsgs(p, [ast])
      }
    const result = check(ast, frame)
    if (result.errors.length > 0)
      return {
        hasTypeErrors: true,
        errorMsgs: convertErrorsToReadableMsgs(p, result.errors)
      }
  }

  // no errors
  return {
    hasTypeErrors: false,
    errorMsgs: []
  }
}
