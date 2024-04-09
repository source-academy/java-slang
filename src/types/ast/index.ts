import { parse as parseToCst } from 'java-parser'
import { ASTExtractor } from './astExtractor/ast-extractor'
import { AST } from './types'

/**
 * Parse program string into Abstract Syntax Tree (AST).
 * @throws {SyntaxError} Throw error if program is syntactically invalid.
 */
export const parse = (programStr: string): AST => {
  const cst = parseToCst(programStr)
  const astExtractor = new ASTExtractor()
  const ast = astExtractor.extract(cst)
  return ast
}
