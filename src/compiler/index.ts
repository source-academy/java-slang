import * as peggy from 'peggy'
import { AST } from '../ast/types/packages-and-modules'
import { ClassFile } from '../ClassFile/types'
import { Compiler } from './compiler'
import { javaPegGrammar } from './grammar'
import { peggyFunctions } from './peggy-functions'

export const compile = (ast: AST): Array<ClassFile> => {
  const compiler = new Compiler()
  return compiler.compile(ast)
}

export const compileFromSource = (javaProgram: string): Array<ClassFile> => {
  const parser = peggy.generate(peggyFunctions + javaPegGrammar, {
    allowedStartRules: ['CompilationUnit'],
    cache: true
  })

  let ast: AST
  try {
    ast = parser.parse(javaProgram)
  } catch (e) {
    throw new SyntaxError(e)
  }

  return compile(ast)
}
