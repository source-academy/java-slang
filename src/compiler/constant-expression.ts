/**
 * Evaluation of constant expressions (JLS 15.28): expressions that are built from literals with
 * the unary operators `+ - ~ !`, the binary operators, the conditional operator and casts to
 * primitive types or to String, and that a compiler can therefore evaluate at compile time.
 *
 * The value has a type, because the result of an operator depends on the promoted type of its
 * operands: an int wraps around at 32 bits, a long at 64 bits, a float has single precision.
 * Names of constant variables are not constant expressions here, since there is no symbol table.
 */

/** The value of a constant expression, with its type as a field descriptor (`T` is String). */
export type ConstantValue =
  | { type: 'Z'; value: boolean }
  | { type: 'B' | 'S' | 'C' | 'I' | 'J'; value: bigint }
  | { type: 'F' | 'D'; value: number }
  | { type: 'T'; value: string }

const INTEGRAL = ['B', 'S', 'C', 'I', 'J']
const isIntegral = (v: ConstantValue): v is Extract<ConstantValue, { value: bigint }> =>
  INTEGRAL.includes(v.type)
const isFloating = (v: ConstantValue): v is Extract<ConstantValue, { type: 'F' | 'D' }> =>
  v.type === 'F' || v.type === 'D'
const isNumeric = (v: ConstantValue) => isIntegral(v) || isFloating(v)

const WIDTH: { [type: string]: number } = { B: 8, S: 16, I: 32, J: 64 }

/** A bigint as a value of an integral type, wrapped around to the type's width (char is unsigned). */
function integral(type: 'B' | 'S' | 'C' | 'I' | 'J', value: bigint): ConstantValue {
  if (type === 'C') return { type, value: BigInt.asUintN(16, value) }
  return { type, value: BigInt.asIntN(WIDTH[type], value) }
}

function floating(type: 'F' | 'D', value: number): ConstantValue {
  return { type, value: type === 'F' ? Math.fround(value) : value }
}

/** Unary numeric promotion (JLS 5.6.1): byte, short and char become int. */
function promoteUnary(v: ConstantValue): ConstantValue {
  return v.type === 'B' || v.type === 'S' || v.type === 'C' ? integral('I', v.value) : v
}

/** Binary numeric promotion (JLS 5.6.2): the type that both operands are converted to. */
function promotedType(a: ConstantValue, b: ConstantValue): 'I' | 'J' | 'F' | 'D' {
  if (a.type === 'D' || b.type === 'D') return 'D'
  if (a.type === 'F' || b.type === 'F') return 'F'
  if (a.type === 'J' || b.type === 'J') return 'J'
  return 'I'
}

/** The value converted to a numeric type (JLS 5.1.2, 5.1.3), as a primitive cast does. */
function convertTo(v: ConstantValue, type: 'B' | 'S' | 'C' | 'I' | 'J' | 'F' | 'D'): ConstantValue {
  if (!isNumeric(v)) return v
  if (type === 'F' || type === 'D') {
    return floating(type, Number(v.value))
  }
  if (isIntegral(v)) return integral(type, v.value)
  if (!isFloating(v)) return v
  // a floating-point value narrowed to an integral type: NaN is 0, and the value saturates
  const bits = type === 'J' ? 64 : 32
  const number = v.value
  let truncated: bigint
  if (Number.isNaN(number)) {
    truncated = BigInt(0)
  } else if (!Number.isFinite(number) || Math.abs(number) >= 2 ** (bits - 1)) {
    const max = (BigInt(1) << BigInt(bits - 1)) - BigInt(1)
    truncated = number > 0 ? max : -max - BigInt(1)
  } else {
    truncated = BigInt(Math.trunc(number))
  }
  // narrowing further to byte, short or char goes through int
  return integral(type, truncated)
}

function parseInteger(text: string): ConstantValue | undefined {
  const match = /^([+-]?)(0[xX][0-9a-fA-F_]+|0[bB][01_]+|[0-9_]+)([lL]?)$/.exec(text)
  if (!match) return undefined
  const [, sign, numeral, suffix] = match
  const digits = numeral.replace(/_/g, '')
  const bits = suffix !== '' ? 64 : 32
  let magnitude: bigint
  let isDecimal = false
  try {
    if (/^0[xXbB]/.test(digits)) magnitude = BigInt(digits)
    else if (/^0[0-9]/.test(digits)) magnitude = BigInt('0o' + digits.slice(1))
    else {
      magnitude = BigInt(digits)
      isDecimal = true
    }
  } catch (e) {
    return undefined
  }
  const negative = sign === '-'
  // a decimal literal may be one larger than the maximum, but only when it is negated
  const limit = BigInt(1) << BigInt(bits - 1)
  if (isDecimal && (magnitude > limit || (magnitude === limit && !negative))) return undefined
  // hexadecimal, octal and binary literals give the bit pattern of an int or a long
  if (!isDecimal && magnitude >> BigInt(bits)) return undefined
  return integral(suffix !== '' ? 'J' : 'I', negative ? -magnitude : magnitude)
}

function evaluateLiteral(literal: { kind: string; value: string }): ConstantValue | undefined {
  switch (literal.kind) {
    case 'BooleanLiteral':
      return { type: 'Z', value: literal.value === 'true' }
    case 'DecimalIntegerLiteral':
    case 'HexIntegerLiteral':
    case 'OctalIntegerLiteral':
    case 'BinaryIntegerLiteral':
      return parseInteger(literal.value)
    case 'DecimalFloatingPointLiteral': {
      const text = literal.value.replace(/_/g, '')
      if (!/^[+-]?(\d+\.?\d*|\.\d+)([eE][+-]?\d+)?[fFdD]?$/.test(text)) return undefined
      return floating(/[fF]$/.test(text) ? 'F' : 'D', parseFloat(text))
    }
    case 'CharacterLiteral':
      return integral('C', BigInt(literal.value.charCodeAt(0)))
    case 'StringLiteral':
      return { type: 'T', value: literal.value.slice(1, literal.value.length - 1) }
    default:
      // the null literal and the others are not constants
      return undefined
  }
}

function evaluateUnary(operator: string, operand: ConstantValue): ConstantValue | undefined {
  if (operator === '!') {
    return operand.type === 'Z' ? { type: 'Z', value: !operand.value } : undefined
  }
  if (!isNumeric(operand)) return undefined
  const promoted = promoteUnary(operand)
  switch (operator) {
    case '+':
      return promoted
    case '-':
      return isFloating(promoted)
        ? floating(promoted.type, -promoted.value)
        : integral(promoted.type as 'I' | 'J', -(promoted as { value: bigint }).value)
    case '~':
      return isIntegral(promoted)
        ? integral(promoted.type as 'I' | 'J', ~promoted.value)
        : undefined
    default:
      return undefined
  }
}

function evaluateBinary(
  operator: string,
  left: ConstantValue,
  right: ConstantValue
): ConstantValue | undefined {
  // boolean operators
  if (left.type === 'Z' && right.type === 'Z') {
    switch (operator) {
      case '&&':
      case '&':
        return { type: 'Z', value: left.value && right.value }
      case '||':
      case '|':
        return { type: 'Z', value: left.value || right.value }
      case '^':
      case '!=':
        return { type: 'Z', value: left.value !== right.value }
      case '==':
        return { type: 'Z', value: left.value === right.value }
      default:
        return undefined
    }
  }

  // strings: concatenation of two strings, and (interned) equality
  if (left.type === 'T' && right.type === 'T') {
    switch (operator) {
      case '+':
        return { type: 'T', value: left.value + right.value }
      case '==':
        return { type: 'Z', value: left.value === right.value }
      case '!=':
        return { type: 'Z', value: left.value !== right.value }
      default:
        return undefined
    }
  }

  if (!isNumeric(left) || !isNumeric(right)) return undefined

  // shifts: each operand is promoted on its own, and the result has the type of the left one
  if (operator === '<<' || operator === '>>' || operator === '>>>') {
    const value = promoteUnary(left)
    const distance = promoteUnary(right)
    if (!isIntegral(value) || !isIntegral(distance)) return undefined
    const bits = value.type === 'J' ? 64 : 32
    const count = BigInt(Number(BigInt.asUintN(6, distance.value)) % bits)
    const type = value.type as 'I' | 'J'
    if (operator === '<<') return integral(type, value.value << count)
    if (operator === '>>') return integral(type, value.value >> count)
    return integral(type, BigInt.asUintN(bits, value.value) >> count)
  }

  const type = promotedType(left, right)
  const a = convertTo(left, type)
  const b = convertTo(right, type)

  if (type === 'F' || type === 'D') {
    const x = (a as { value: number }).value
    const y = (b as { value: number }).value
    switch (operator) {
      case '+':
        return floating(type, x + y)
      case '-':
        return floating(type, x - y)
      case '*':
        return floating(type, x * y)
      case '/':
        return floating(type, x / y)
      case '%':
        return floating(type, x % y)
      case '<':
        return { type: 'Z', value: x < y }
      case '<=':
        return { type: 'Z', value: x <= y }
      case '>':
        return { type: 'Z', value: x > y }
      case '>=':
        return { type: 'Z', value: x >= y }
      case '==':
        return { type: 'Z', value: x === y }
      case '!=':
        return { type: 'Z', value: x !== y }
      default:
        return undefined
    }
  }

  const x = (a as { value: bigint }).value
  const y = (b as { value: bigint }).value
  switch (operator) {
    case '+':
      return integral(type, x + y)
    case '-':
      return integral(type, x - y)
    case '*':
      return integral(type, x * y)
    // an integer division by zero is not a constant expression: it throws when it is evaluated
    case '/':
      return y === BigInt(0) ? undefined : integral(type, x / y)
    case '%':
      return y === BigInt(0) ? undefined : integral(type, x % y)
    case '&':
      return integral(type, x & y)
    case '|':
      return integral(type, x | y)
    case '^':
      return integral(type, x ^ y)
    case '<':
      return { type: 'Z', value: x < y }
    case '<=':
      return { type: 'Z', value: x <= y }
    case '>':
      return { type: 'Z', value: x > y }
    case '>=':
      return { type: 'Z', value: x >= y }
    case '==':
      return { type: 'Z', value: x === y }
    case '!=':
      return { type: 'Z', value: x !== y }
    default:
      return undefined
  }
}

const PRIMITIVE_CAST_TYPES: { [name: string]: 'B' | 'S' | 'C' | 'I' | 'J' | 'F' | 'D' } = {
  byte: 'B',
  short: 'S',
  char: 'C',
  int: 'I',
  long: 'J',
  float: 'F',
  double: 'D'
}

/**
 * The value of a constant expression, or `undefined` if the expression is not one (or its value
 * cannot be determined here).
 */
export function evaluateConstant(expression: any): ConstantValue | undefined {
  if (expression === null || typeof expression !== 'object') return undefined

  switch (expression.kind) {
    case 'Literal':
      return evaluateLiteral(expression.literalType)

    case 'PrefixExpression': {
      const operand = evaluateConstant(expression.expression)
      return operand === undefined ? undefined : evaluateUnary(expression.operator, operand)
    }

    case 'BinaryExpression': {
      const left = evaluateConstant(expression.left)
      const right = evaluateConstant(expression.right)
      if (left === undefined || right === undefined) return undefined
      return evaluateBinary(expression.operator, left, right)
    }

    case 'TernaryExpression': {
      const condition = evaluateConstant(expression.condition)
      const consequent = evaluateConstant(expression.consequent)
      const alternate = evaluateConstant(expression.alternate)
      if (condition?.type !== 'Z' || consequent === undefined || alternate === undefined) {
        return undefined
      }
      const chosen = condition.value ? consequent : alternate
      // operands of different numeric types are promoted to a common type
      if (consequent.type !== alternate.type && isNumeric(consequent) && isNumeric(alternate)) {
        return convertTo(chosen, promotedType(consequent, alternate))
      }
      return consequent.type === alternate.type ? chosen : undefined
    }

    case 'CastExpression': {
      const operand = evaluateConstant(expression.expression)
      if (operand === undefined) return undefined
      if (expression.isPrimitiveCast) {
        if (expression.castType === 'boolean') return operand.type === 'Z' ? operand : undefined
        const target = PRIMITIVE_CAST_TYPES[expression.castType]
        return target === undefined ? undefined : convertTo(operand, target)
      }
      // a cast to String of a string
      return expression.castType === 'String' && operand.type === 'T' ? operand : undefined
    }

    default:
      return undefined
  }
}

/** Whether the expression is a constant expression whose value is `true`. */
export function isConstantTrue(expression: any): boolean {
  const value = evaluateConstant(expression)
  return value?.type === 'Z' && value.value
}
