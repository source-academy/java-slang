import { check } from '..'
import { parse } from '../../ast'
import { TypeCheckerError } from '../../errors'
import { Type } from '../../types/type'

const createProgram = (statement: string) => `
  public class Main {
    public static void main(String args[]) {
      ${statement}
    }
  }
`

const testcases: {
  input: string
  result: { type: Type | null; errors: Error[] }
  only?: boolean
}[] = [
  {
    input: 'boolean test = true;',
    result: { type: null, errors: [] }
  },
  {
    input: 'boolean test = false;',
    result: { type: null, errors: [] }
  },
  {
    input: 'Boolean test = true;',
    result: { type: null, errors: [] }
  }
]

describe('Type Checker', () => {
  testcases.map(testcase => {
    let it = test
    if (testcase.only) it = test.only
    it(`Checking boolean literals for ${testcase.input}`, () => {
      const program = createProgram(testcase.input)
      const ast = parse(program)
      if (!ast) throw new Error('Program parsing returns null.')
      if (ast instanceof TypeCheckerError) throw new Error('Test case is invalid.')
      const result = check(ast)
      if (result.currentType === null) expect(result.currentType).toBe(testcase.result.type)
      else expect(result.currentType).toBeInstanceOf(testcase.result.type)
      if (testcase.result.errors.length > result.errors.length) {
        testcase.result.errors.forEach((error, index) => {
          if (!result.errors[index]) expect('').toBe(error.message)
          expect(result.errors[index].message).toBe(error.message)
        })
      } else {
        result.errors.forEach((error, index) => {
          if (!testcase.result.errors[index]) expect(error.message).toBe('')
          expect(error.message).toBe(testcase.result.errors[index].message)
        })
      }
    })
  })
})
