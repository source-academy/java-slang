import { check } from '..'
import { parse } from '../../ast'
import { TypeCheckerError, UnsupportedNestedClassError } from '../../errors'
import { Type } from '../../types/type'

const testcases: {
  input: string
  result: { type: Type | null; errors: Error[] }
  only?: boolean
}[] = [
  {
    input: `
        class Outer {
          static class Inner {
            int value;
            Inner(int v) { value = v; }
            int getValue() { return value; }
          }

          public static void main(String[] args) {
            Inner inner = new Inner(5);
            inner.getValue();
          }
        }
    `,
    result: { type: null, errors: [] }
  },
  {
    input: `
        class Outer {
          static int counter = 1;

          static class Inner {
            int read() { return counter; }
          }

          public static void main(String[] args) {
            Inner inner = new Inner();
            inner.read();
          }
        }
    `,
    result: { type: null, errors: [] }
  },
  {
    input: `
        class Outer {
          static class Middle {
            static class Inner {
              void hello() {}
            }
          }

          public static void main(String[] args) {
            Inner inner = new Inner();
            inner.hello();
          }
        }
    `,
    result: { type: null, errors: [] }
  },
  {
    input: `
        class Outer {
          class Inner {}

          public static void main(String[] args) {}
        }
    `,
    result: { type: null, errors: [new UnsupportedNestedClassError()] }
  }
]

describe('Type Checker', () => {
  testcases.map(testcase => {
    let it = test
    if (testcase.only) it = test.only
    it(`Checking nested classes for '${testcase.input}'`, () => {
      const program = testcase.input
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
