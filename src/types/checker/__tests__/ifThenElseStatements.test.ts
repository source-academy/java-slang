import { check } from '..'
import { BadOperandTypesError, IncompatibleTypesError, TypeCheckerError } from '../../errors'
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
    input: `
      int test = 0;
      if (true) {
        test = 1;
      }
    `,
    result: { type: null, errors: [] }
  },
  {
    input: `
      int test = 0;
      if (false) {}
      else {
        test = 1;
      }
    `,
    result: { type: null, errors: [] }
  },
  {
    input: `
      int test = 0;
      if (true) {
        test = 1;
        test = 2;
      }
      else {
        test = 3;
        test = 4;
      }
    `,
    result: { type: null, errors: [] }
  },
  {
    input: `
      int test = 0;
      if (1 + 1) {
        test = 1;
      }
    `,
    result: { type: null, errors: [new IncompatibleTypesError()] }
  },
  {
    input: `
      int test = 0;
      if (1 * "Hello") {
        test = 1;
      }
    `,
    result: { type: null, errors: [new BadOperandTypesError()] }
  },

  {
    input: `
      int test = 0;
      if (true) {
        if (1 * "Hello") {
          test = 1;
        }
      }
    `,
    result: { type: null, errors: [new BadOperandTypesError()] }
  },
  {
    input: `
      int a = 5; 
      int b = 10; 
      if (a < b) {} else {}
    `,
    result: { type: null, errors: [] }
  },
  {
    input: `
      int a = 5; 
      int b = 10; 
      if (a <= b) {} else {}
    `,
    result: { type: null, errors: [] }
  },
  {
    input: `
      int a = 5; 
      int b = 10; 
      if (a > b) {} else {}
    `,
    result: { type: null, errors: [] }
  },
  {
    input: `
      int a = 5; 
      int b = 10; 
      if (a >= b) {} else {}
    `,
    result: { type: null, errors: [] }
  },
  {
    input: `
      int a = 5; 
      int b = 10; 
      if (a < b) { 
        if (b > 0) {} else {} 
      } else {}
    `,
    result: { type: null, errors: [] }
  },
  {
    input: `
      int a = 5; 
      double b = 10.5; 
      if (a < b) {} else {}
    `,
    result: { type: null, errors: [] }
  },
  {
    input: `
      boolean a = true; 
      boolean b = false; 
      if (a && b) {} else {}
    `,
    result: { type: null, errors: [] }
  },
  {
    input: `
      boolean a = true; 
      boolean b = false; 
      if (a || b) {} else {}
    `,
    result: { type: null, errors: [] }
  },
  {
    input: `
      boolean a = true; 
      if (!a) {} else {}
    `,
    result: { type: null, errors: [] }
  },
  {
    input: `
      int a = 5; 
      int b = 10; 
      (a < b) ? "true" : "false";
    `,
    result: { type: null, errors: [] }
  },
  {
    input: `
      int a = 5; 
      int b = 10; 
      a == b ? "true" : "false";
    `,
    result: { type: null, errors: [] }
  }
]

describe('Type Checker', () => {
  testcases.map(testcase => {
    let it = test
    if (testcase.only) it = test.only
    it(`Checking if then else statements for ${testcase.input}`, () => {
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
