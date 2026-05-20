import { inspect } from 'util'
import { compile } from '../../index'
import { BinaryWriter } from '../../binary-writer'
import { AST } from '../../../ast/types/packages-and-modules'
import { javaPegGrammar } from '../../grammar'
import { peggyFunctions } from '../../peggy-functions'
import { execSync } from 'child_process'

import * as peggy from 'peggy'
import * as fs from 'fs'

export type testCase = {
  comment: string
  program: string
  expectedLines: string[]
}

const debug = false
const pathToTestDir = './src/compiler/__tests__/'
const parser = peggy.generate(peggyFunctions + javaPegGrammar, {
  allowedStartRules: ['CompilationUnit']
})
const binaryWriter = new BinaryWriter()

export function runTest(program: string, expectedLines: string[]) {
  const ast = parser.parse(program)
  expect(ast).not.toBeNull()

  if (debug) {
    console.log(inspect(ast, false, null, true))
  }

  const classes = compile(ast as AST)
  for (let c of classes) {
    binaryWriter.writeBinary(c.classFile, pathToTestDir)
  }

  const prevDir = process.cwd()
  process.chdir(pathToTestDir)
  execSync('java -noverify Main > output.log 2> err.log')

  // ignore difference between \r\n and \n
  const actualLines = fs.readFileSync('./output.log', 'utf-8').split(/\r?\n/).slice(0, -1)
  process.chdir(prevDir)

  expect(actualLines).toStrictEqual(expectedLines)
}
