import {
  CannotFindSymbolError,
  IncompatibleTypesError,
  MethodCannotBeAppliedError,
  TypeCheckerError,
  VarargsParameterMustBeLastParameter,
  VariableAlreadyDefinedError
} from '../../errors'
import { check } from '..'
import { parse } from '../../ast'
import { Type } from '../../types/type'

const createProgram = (methods: string) => `
  public class Main {
    ${methods}
  }
`

const testcases: {
  input: string
  result: { type: Type | null; errors: Error[] }
  only?: boolean
}[] = [
  {
    input: `
      public static void main(String[] args) { printMessage("Hello, World!"); }
      public static void printMessage(String message) {}
    `,
    result: { type: null, errors: [] }
  },
  {
    input: `
      public static void main(String[] args) { printMessage(100); }
      public static void printMessage(String message) {}
    `,
    result: { type: null, errors: [new IncompatibleTypesError()] }
  },
  {
    input: `
      public static void main(String[] args) { printMessage("Hello", "World"); }
      public static void printMessage(String message) {}
    `,
    result: { type: null, errors: [new MethodCannotBeAppliedError()] }
  },
  {
    input: `
      public static void main(String[] args) {
        printMessage("Hello, World!");
        printMessage("This is number ", 5);
      }
      public static void printMessage(String message) {}
      public static void printMessage(String message, int number) {}
    `,
    result: { type: null, errors: [] }
  },
  {
    input: `
      public static void main(String[] args) {
        nonExistentMethod(); // This method does not exist
      }
    `,
    result: { type: null, errors: [new CannotFindSymbolError()] }
  },
  {
    input: `
      public static void main(String[] args) { getStringLength("Hello World!"); }
      public static String getStringLength(String input) { return input; }
    `,
    result: { type: null, errors: [] }
  },
  {
    input: `
      public static void main(String[] args) { int test = getStringLength("Hello World!"); }
      public static String getStringLength(String input) { return input; }
    `,
    result: { type: null, errors: [new IncompatibleTypesError()] }
  },
  {
    input: `
      public static void main(String[] args) { int test = getStringLength("Hello World!"); }
      public static int getStringLength(String input) { return input; }
    `,
    result: { type: null, errors: [new IncompatibleTypesError()] }
  },
  {
    input: `
      public static void main(String[] args) { printMultipleMessages("Hello", "World"); }
      public static void printMultipleMessages(String... message, String message) {} // Duplicate Identifier
    `,
    result: { type: null, errors: [new VarargsParameterMustBeLastParameter()] }
  },
  {
    input: `
      public static void main(String[] args) { printMultipleMessages("Hello", "World"); }
      public static void printMultipleMessages(String message, String message) {} // Duplicate Identifier
    `,
    result: { type: null, errors: [new VariableAlreadyDefinedError()] }
  },
  {
    input: `
      public static void main(String[] args) { printMultipleMessages("Hello", "World", "!"); }
      public static void printMultipleMessages(String... messages) { for (String msg : messages) {} }
    `,
    result: { type: null, errors: [] }
  },
  {
    input: `
      public static void main(String[] args) { printMultipleMessages(); }
      public static void printMultipleMessages(String... messages) { for (String msg : messages) {} }
    `,
    result: { type: null, errors: [] }
  }
]

describe('Type Checker', () => {
  testcases.map(testcase => {
    let it = test
    if (testcase.only) it = test.only
    it(`Checking method invocation for ${testcase.input}`, () => {
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
