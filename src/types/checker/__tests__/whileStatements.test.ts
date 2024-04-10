import { check } from '..'
// import { BadOperandTypesError, IncompatibleTypesError } from "../../errors";
import { parse } from '../../ast'
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
    input: `int i = 0; while (i < 5) { i = i + 1; }`,
    result: { type: null, errors: [] }
  },
  {
    input: `int i = 0; while (i < 3) { int j = 0; while (j < 2) { j = j + 1; } i = i + 1; }`,
    result: { type: null, errors: [] }
  },
  {
    input: `int i = 0; double limit = 5.0; while (i < limit) { i = i + 1; }`,
    result: { type: null, errors: [] }
  },
  {
    input: `boolean flag = true; while (flag) { flag = false; }`,
    result: { type: null, errors: [] }
  },
  {
    input: `int i = 0; while (true) { if (i == 3) { break; } i = i + 1; }`,
    result: { type: null, errors: [] }
  },
  {
    input: `int i = 0; while (i < 5) { i = i + 1; if (i == 3) { continue; } }`,
    result: { type: null, errors: [] }
  }
]

describe('Type Checker', () => {
  testcases.map(testcase => {
    let it = test
    if (testcase.only) it = test.only
    it(`Checking while statements for ${testcase.input}`, () => {
      const program = createProgram(testcase.input)
      const ast = parse(program)
      if (!ast) throw new Error('Program parsing returns null.')
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
