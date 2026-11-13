import * as peggy from 'peggy'
import { evaluateConstant, isConstantTrue } from '../constant-expression'
import { javaPegGrammar } from '../grammar'
import { peggyFunctions } from '../peggy-functions'

const parser = peggy.generate(peggyFunctions + javaPegGrammar, {
  allowedStartRules: ['CompilationUnit']
})

// the expression AST of `expression`, taken from `return expression;` in a method
const parseExpression = (expression: string): any => {
  const ast = parser.parse(`class T { static Object f() { return ${expression}; } }`)
  return ast.topLevelClassOrInterfaceDeclarations[0].classBody[0].methodBody.blockStatements[0].exp
}
const evaluate = (expression: string) => evaluateConstant(parseExpression(expression))

describe('constant expressions', () => {
  describe('values and types', () => {
    // integral values are given in decimal, as strings
    const cases: [string, string, number | boolean | string][] = [
      ['true', 'Z', true],
      ['!false', 'Z', true],
      ['!(1 < 2)', 'Z', false],
      ['1', 'I', '1'],
      ['5000000000L', 'J', '5000000000'],
      ['0xFFFFFFFF', 'I', '-1'],
      ['0xFFFFFFFFL', 'J', '4294967295'],
      ['010', 'I', '8'],
      ['0b101', 'I', '5'],
      ['1_000', 'I', '1000'],
      ["'a'", 'C', '97'],
      ["'a' + 1", 'I', '98'],
      ['(char) 65', 'C', '65'],
      ['1.5', 'D', 1.5],
      ['1.5f', 'F', 1.5],
      ['0.1f', 'F', Math.fround(0.1)],
      ['1 + 1', 'I', '2'],
      ['1 + 1L', 'J', '2'],
      ['1 + 1.5', 'D', 2.5],
      ['1 + 1.5f', 'F', 2.5],
      ['2147483647 + 1', 'I', '-2147483648'],
      ['2147483647 + 1L', 'J', '2147483648'],
      ['9223372036854775807L + 1', 'J', '-9223372036854775808'],
      ['-2147483648 - 1', 'I', '2147483647'],
      ['2147483647 * 2', 'I', '-2'],
      ['10 / 3', 'I', '3'],
      ['-10 / 3', 'I', '-3'],
      ['-10 % 3', 'I', '-1'],
      ['5.5 % 2', 'D', 1.5],
      ['1 << 32', 'I', '1'],
      ['1 << 31', 'I', '-2147483648'],
      ['1L << 63', 'J', '-9223372036854775808'],
      ['-8 >> 1', 'I', '-4'],
      ['-8 >>> 28', 'I', '15'],
      ['-8L >>> 60', 'J', '15'],
      ['5 & 4', 'I', '4'],
      ['5 | 2', 'I', '7'],
      ['5 ^ 1', 'I', '4'],
      ['~0', 'I', '-1'],
      ['-(1 + 1)', 'I', '-2'],
      ['(byte) 200', 'B', '-56'],
      ['(short) 70000', 'S', '4464'],
      ['(char) -1', 'C', '65535'],
      ['(int) 3.9', 'I', '3'],
      ['(int) -3.9', 'I', '-3'],
      ['(int) 1e10', 'I', '2147483647'],
      ['(long) 1e19', 'J', '9223372036854775807'],
      ['(int) (0.0 / 0)', 'I', '0'],
      ['(double) 1', 'D', 1],
      ['(true ? 1 : 2.0)', 'D', 1],
      ['(1 > 2 ? 3 : 4)', 'I', '4'],
      ['"a" + "b"', 'T', 'ab'],
      ['"a" == "a"', 'Z', true],
      ['"a" != "a"', 'Z', false],
      ['1.0 / 0 > 1', 'Z', true],
      ['0.1 + 0.2 == 0.3', 'Z', false],
      ['0.1f + 0.2f == 0.3f', 'Z', true]
    ]
    for (const [expression, type, value] of cases) {
      it(`evaluates ${expression}`, () => {
        const result = evaluate(expression)
        expect(result?.type).toBe(type)
        const isIntegral = ['B', 'S', 'C', 'I', 'J'].includes(type)
        expect(isIntegral ? result?.value.toString() : result?.value).toBe(value)
      })
    }
  })

  describe('expressions that are not constant', () => {
    const cases = [
      'x',
      '!x',
      'x + 1',
      'x < 2',
      'x == x',
      'true && x',
      'f()',
      'null',
      '1 / 0',
      '1 % 0',
      '1 / 0 == 0',
      '1 < 2 || 1 / 0 == 0',
      '1 > 2 && 1 / 0 == 0',
      '1L / 0',
      '"a" + 1',
      '"a" < "b"',
      '(String) 1',
      'true + 1',
      '!1',
      '-true',
      '~1.5',
      '1 < true',
      '1 && 2',
      'new Object()',
      '(true ? 1 : "s")',
      '(x ? 1 : 2)'
    ]
    for (const expression of cases) {
      it(`does not evaluate ${expression}`, () => expect(evaluate(expression)).toBeUndefined())
    }
  })

  describe('isConstantTrue', () => {
    const constantTrue = [
      'true',
      '!false',
      '!!true',
      '1 < 2',
      '1 + 1 == 2',
      'true && true',
      '(1 < 2 ? true : false)'
    ]
    const notConstantTrue = [
      'false',
      '!true',
      '1 > 2',
      'x',
      '!x',
      'true && x',
      '1',
      '"true"',
      "'a'",
      '1 / 0 == 0'
    ]
    for (const expression of constantTrue) {
      it(`is true for ${expression}`, () =>
        expect(isConstantTrue(parseExpression(expression))).toBe(true))
    }
    for (const expression of notConstantTrue) {
      it(`is false for ${expression}`, () =>
        expect(isConstantTrue(parseExpression(expression))).toBe(false))
    }
    it('is false for something that is not an expression', () => {
      expect(isConstantTrue(undefined)).toBe(false)
      expect(isConstantTrue(null)).toBe(false)
    })
  })
})
