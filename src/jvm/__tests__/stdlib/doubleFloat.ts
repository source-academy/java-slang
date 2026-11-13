import doubleNatives from '../../stdlib/java/lang/Double'
import floatNatives from '../../stdlib/java/lang/Float'

/** Captures what a native method returns to its caller. */
const call = (fn: (thread: any, locals: any[]) => void, ...locals: any[]) => {
  let returned: any
  const thread = {
    returnStackFrame: (value: any) => (returned = value),
    returnStackFrame64: (value: any) => (returned = value)
  }
  fn(thread, locals)
  return returned
}

describe('Double natives', () => {
  const toBits = doubleNatives['doubleToRawLongBits(D)J']
  const fromBits = doubleNatives['longBitsToDouble(J)D']

  test('doubleToRawLongBits returns the IEEE 754 bits', () => {
    expect(call(toBits, 1.5)).toBe(BigInt('4609434218613702656'))
    expect(call(toBits, 0.1)).toBe(BigInt('4591870180066957722'))
    expect(call(toBits, -2)).toBe(BigInt('-4611686018427387904'))
    expect(call(toBits, 0)).toBe(BigInt(0))
    expect(call(toBits, -0)).toBe(BigInt('-9223372036854775808'))
  })

  test('longBitsToDouble returns the double with those bits', () => {
    expect(call(fromBits, BigInt('4609434218613702656'))).toBe(1.5)
    expect(call(fromBits, BigInt('4591870180066957722'))).toBe(0.1)
    expect(call(fromBits, BigInt('-4611686018427387904'))).toBe(-2)
    expect(call(fromBits, BigInt('9218868437227405312'))).toBe(Infinity)
    expect(Object.is(call(fromBits, BigInt('-9223372036854775808')), -0)).toBe(true)
    expect(call(fromBits, BigInt('9221120237041090560'))).toBeNaN()
  })

  test('the two are inverses of each other', () => {
    for (const d of [0, 1, -1, 0.1, 123456789.123, 1e300, 5e-324, Math.PI, -Infinity]) {
      expect(call(fromBits, call(toBits, d))).toBe(d)
    }
  })
})

describe('Float natives', () => {
  const toBits = floatNatives['floatToRawIntBits(F)I']
  const fromBits = floatNatives['intBitsToFloat(I)F']

  test('floatToRawIntBits returns the IEEE 754 bits', () => {
    expect(call(toBits, 1.5)).toBe(1069547520)
    expect(call(toBits, Math.fround(0.1))).toBe(1036831949)
    expect(call(toBits, -2)).toBe(-1073741824)
  })

  test('intBitsToFloat returns the float with those bits', () => {
    expect(call(fromBits, 1069547520)).toBe(1.5)
    expect(call(fromBits, 1036831949)).toBe(Math.fround(0.1))
    expect(call(fromBits, -1073741824)).toBe(-2)
    expect(call(fromBits, 2139095040)).toBe(Infinity)
    expect(call(fromBits, 2143289344)).toBeNaN()
  })

  test('the two are inverses of each other', () => {
    for (const f of [0, 1, -1, 0.1, 16777216, 3.4028234663852886e38, 1.401298464324817e-45]) {
      const float = Math.fround(f)
      expect(call(fromBits, call(toBits, float))).toBe(float)
    }
  })
})
