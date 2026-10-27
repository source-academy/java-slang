import * as peggy from 'peggy'
import { AST } from '../ast/types/packages-and-modules'
import { Class } from '../ClassFile/types'
import { Compiler } from './compiler'
import { javaPegGrammar } from './grammar'
import { peggyFunctions } from './peggy-functions'

// `peggy` is CJS-only. Under `module: commonjs` (the main build), TS's namespace
// import already exposes `generate` directly; under real ESM (the Conductor
// evaluator build/tests), Node's CJS interop instead nests the whole module
// under `.default`. Handle both without depending on `esModuleInterop`, which
// the main build doesn't set.
const peggyGenerate: typeof peggy.generate =
  (peggy as unknown as { generate?: typeof peggy.generate }).generate ??
  (peggy as unknown as { default: typeof peggy }).default.generate

export const compile = (ast: AST): Array<Class> => {
  const compiler = new Compiler()
  return compiler.compile(ast)
}

export const compileFromSource = (javaProgram: string): Array<Class> => {
  const parser = peggyGenerate(peggyFunctions + javaPegGrammar, {
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
