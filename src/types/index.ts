import { check } from './checker'
import { Node } from './ast/types'
import { parse } from './ast'

export type TypeCheckResult = { hasTypeErrors: boolean; errorMessages: string[] }

export const parseProgram = (program: string): Node => {
  return parse(program)
}

export const typeCheck = (ast: Node): TypeCheckResult => {
  const result = check(ast)
  return {
    hasTypeErrors: result.errors.length > 0,
    errorMessages: result.errors.map(error => error.message)
  }
}
