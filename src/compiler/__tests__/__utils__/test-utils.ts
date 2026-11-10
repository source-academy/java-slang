import { inspect } from 'util'
import { compile } from '../../index'
import { BinaryWriter } from '../../binary-writer'
import { AST } from '../../../ast/types/packages-and-modules'
import { javaPegGrammar } from '../../grammar'
import { peggyFunctions } from '../../peggy-functions'
import { execSync } from 'child_process'
import * as path from 'path'

import * as peggy from 'peggy'
import * as fs from 'fs'

export type testCase = {
  comment: string
  program: string
  expectedLines: string[]
}

const debug = false
const parser = peggy.generate(peggyFunctions + javaPegGrammar, {
  allowedStartRules: ['CompilationUnit']
})

/**
 * Compiles `program` and checks the lines it prints when run on the host JVM. The generated
 * classes have no stack map frames, so by default the JVM's verifier is off; pass
 * `{ verify: true }` for a program without branches to also have it check the code and the
 * declared stack and local variable sizes.
 */
export function runTest(
  program: string,
  expectedLines: string[],
  options: { verify?: boolean } = {}
) {
  const ast = parser.parse(program)
  expect(ast).not.toBeNull()

  if (debug) {
    console.log(inspect(ast, false, null, true))
  }

  // Create a temporary directory for this test run to avoid race conditions
  const tempDir = fs.mkdtempSync(path.join(process.cwd(), 'test-temp-'))
  try {
    const binaryWriter = new BinaryWriter()
    const classes = compile(ast as AST)
    for (let c of classes) {
      binaryWriter.writeBinary(c.classFile, tempDir + path.sep)
    }

    const java = options.verify ? 'java' : 'java -noverify'
    execSync(`${java} Main > output.log 2> err.log`, { cwd: tempDir })

    // ignore difference between \r?\n and \n
    const actualLines = fs.readFileSync(path.join(tempDir, 'output.log'), 'utf-8').split(/\r?\n/).slice(0, -1)

    expect(actualLines).toStrictEqual(expectedLines)
  } finally {
    // Clean up temporary directory
    fs.rmSync(tempDir, { recursive: true, force: true })
  }
}
