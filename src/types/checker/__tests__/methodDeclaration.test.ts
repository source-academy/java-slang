import {
  IllegalCombinationOfModifiersError,
  RepeatedModifierError,
  TypeCheckerError
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
      public public void twoPublicModifiers() {}
    `,
    result: { type: null, errors: [new RepeatedModifierError()] }
  },
  {
    input: `
      public private void illegalPublicPrivateModifiers() {}
    `,
    result: { type: null, errors: [new IllegalCombinationOfModifiersError()] }
  },
  {
    input: `
      public protected void illegalPublicProtectedModifiers() {}
    `,
    result: { type: null, errors: [new IllegalCombinationOfModifiersError()] }
  },
  {
    input: `
      protected private void illegalProtectedPrivateModifiers() {}
    `,
    result: { type: null, errors: [new IllegalCombinationOfModifiersError()] }
  }
]

describe('Type Checker', () => {
  testcases.map(testcase => {
    let it = test
    if (testcase.only) it = test.only
    it(`Checking method declaration for ${testcase.input}`, () => {
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
