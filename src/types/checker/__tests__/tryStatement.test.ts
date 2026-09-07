import { check } from '..'
import { parse } from '../../ast'
import {
  IncompatibleTypesError,
  UnhandledExceptionError,
  TypeCheckerError
} from '../../errors'
import { Type } from '../../types/type'

const createProgram = (statement: string) => `
  public class Main {
    public static void main(String args[]) {
      ${statement}
    }
  }
`
const createClass = (body: string) => `
  public class Main {
    ${body}
  }
`

const testcases: {
  input: string
  result: { type: Type | null; errors: Error[] }
  only?: boolean
  fullProgram?: boolean
}[] = [
  {
    input: `
      try {} catch (Exception e) {}
    `,
    result: { type: null, errors: [] }
  },
  {
    input: `
      try {} 
      catch (Throwable e) {}
    `,
    result: { type: null, errors: [] }
  },
  {
    input: `
      public static void foo() throws Exception {
        throw new Exception();
      }
      public static void main(String args[]) {
        foo();
      }
    `,
    fullProgram: true,
    result: { type: null, errors: [new UnhandledExceptionError()] }
  },
  {
    input: `
      public static void foo() throws Exception {
        throw new Exception();
      }
      public static void main(String args[]) throws Exception {
        foo();
      }
    `,
    fullProgram: true,
    result: { type: null, errors: [] }
  },
  {
    input: `
      public static void foo() throws Exception {
        throw new Exception();
      }
      public static void main(String args[]) {
        try {
          foo();
        } catch (Exception e) {
        }
      }
    `,
    fullProgram: true,
    result: { type: null, errors: [] }
  },
  {
    input: `
      try {
        throw new Exception();
      } catch (Exception e) {
        throw new Exception();
      } finally {
      }
    `,
    result: { type: null, errors: [] }
  },
  {
    input: `
      try {} 
      catch (String s) {}
    `,
    result: { type: null, errors: [new IncompatibleTypesError()] }
  }
]

describe('Type Checker', () => {
  testcases.map(testcase => {
    let it = test
    if (testcase.only) it = test.only
    it(`Checking try statements for ${testcase.input}`, () => {
      const program = testcase.fullProgram ? createClass(testcase.input) : createProgram(testcase.input)
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
