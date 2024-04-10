import * as peggy from 'peggy'
import { AST } from '../ast/types/packages-and-modules'
import { Compiler } from './compiler'
import { javaPegGrammar } from './grammar'
import { BinaryWriter } from './binary-writer'

export const compile = (ast: AST): string => {
  const compiler = new Compiler()
  const classFile = compiler.compile(ast)

  const binaryWriter = new BinaryWriter()
  const byteArray = binaryWriter.generateBinary(classFile)
  const base64encoded = Buffer.from(byteArray).toString('base64')

  return base64encoded
}

export const compileFromSource = (javaProgram: string): string => {
  const parser = peggy.generate(javaPegGrammar, {
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
