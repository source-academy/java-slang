import { Node } from './ast/types'
import { check } from './checker'

export type TypeCheckResult = { hasTypeErrors: boolean }

export const typeCheck = (ast: Node): TypeCheckResult => {
  const result = check(ast)
  return { hasTypeErrors: result.errors.length > 0 }
}
