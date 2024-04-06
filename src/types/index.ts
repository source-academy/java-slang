import { Node } from './ast/types'
import { typeCheckBody } from './checker'

export type TypeCheckResult = { hasTypeErrors: boolean }

export const typeCheck = (ast: Node): TypeCheckResult => {
  const result = typeCheckBody(ast)
  return { hasTypeErrors: result.errors.length > 0 }
}
