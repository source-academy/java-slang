import { check } from '..'
import { IncompatibleTypesError } from '../../errors'
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
    input: `int[] numbers = {1, 2, 3, 4, 5};`,
    result: { type: null, errors: [] }
  },
  {
    input: `double[] values;`,
    result: { type: null, errors: [] }
  },
  {
    input: `String[] names = {1, 2, 3};`,
    result: { type: null, errors: [new IncompatibleTypesError()] }
  },
  {
    input: `
      int[][] matrix = {
        {1, 2, 3},
        {4, 5, 6},
        {7, 8, 9}
      };
    `,
    result: { type: null, errors: [] }
  },
  {
    input: `
      int[] numbers = {1, 2, 3, 4, 5};
      int number = numbers[2]; // Accessing the third element
    `,
    result: { type: null, errors: [] }
  },
  {
    input: `
      int[][] numbers = {{1, 2, 3, 4, 5}};
      int number = numbers[0][2]; // Accessing the third nested element
    `,
    result: { type: null, errors: [] }
  },
  {
    input: `
      String[] names = {"Alice", "Bob", "Charlie"};
      String name = names["1"]; // Incorrect index type
    `,
    result: { type: null, errors: [new IncompatibleTypesError()] }
  },
  {
    input: `
      int[] numbers = new int[5];
      numbers[0] = 10; // Correct assignment
    `,
    result: { type: null, errors: [] }
  },
  {
    input: `
      boolean[] flags = new boolean[3];
      flags[0] = 1;
    `,
    result: { type: null, errors: [new IncompatibleTypesError()] }
  },
  {
    input: `
      int[] numbers = {1, 2, 3, 4, 5};
      int length = numbers.length; // Accessing array length
    `,
    result: { type: null, errors: [] }
  },

  {
    input: `
      int i = numbers.length; // Accessing array length
      int j = numbers.hashCode(length).test(); // Checking difference
    `,
    result: { type: null, errors: [] },
    only: true
  },

  {
    input: `
      char[] chars = new char[5];
      chars = new char[]{'a', 'b', 'c', 'd', 'e'}; // Reinitialization with values    
    `,
    result: { type: null, errors: [] }
  },
  {
    input: `int[] numbers = new int[-1]; // Attempting to create an array with negative size`,
    result: { type: null, errors: [new IncompatibleTypesError()] }
  }
]

describe('Type Checker', () => {
  testcases.map(testcase => {
    let it = test
    if (testcase.only) it = test.only
    it(`Checking arrays for '${testcase.input}'`, () => {
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
