import { parse as parseToCst } from 'java-parser'
import { TypeCheckerError } from '../errors'
import AstExtractor from './extractor'
import { CompilationUnit } from './specificationTypes'

export * as AST from './specificationTypes'

const JAVA_PARSER_ERROR_PREFIX = 'Sad sad panda'
const NOT_IMPLEMENTED = 'Not implemented'
const GENERAL_AST_PARSER_ERROR = 'Error caught in ast parser'
const UNSUPPORTED_JAVA_PARSER_ERROR = 'Trying to parse unsupported Java specification'

/**
 * Parse program string into Abstract Syntax Tree (AST).
 * @throws {SyntaxError} Throw error if program is syntactically invalid.
 */
export const parse = (programStr: string): CompilationUnit | TypeCheckerError => {
  try {
    const cst = parseToCst(programStr)
    const extractor = new AstExtractor()
    return extractor.visit(cst)
  } catch (error: unknown) {
    if (error instanceof Error) {
      console.log(error)
      if (error.message === NOT_IMPLEMENTED)
        return new TypeCheckerError(UNSUPPORTED_JAVA_PARSER_ERROR)
      if (error.message.startsWith(JAVA_PARSER_ERROR_PREFIX)) {
        const pattern: RegExp = /line: (\d+), column: (\d+)!/
        const match = pattern.exec(error.message)
        if (!match) return new TypeCheckerError('Syntax')
        return new TypeCheckerError('Syntax', {
          startLine: parseInt(match[1]),
          startOffset: -1,
          startColumn: parseInt(match[2])
        })
      }
    }
    return new TypeCheckerError(GENERAL_AST_PARSER_ERROR)
  }
}
