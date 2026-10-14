import { natives } from '../natives'
import {
  //   ControlStub,
  //   StashStub,
  createContextStub
  //   getControlItemStr,
  //   getStashItemStr
} from './__utils__/utils'
import { parse } from '../../ast/parser'
import { evaluate } from '../interpreter'

describe('native functions', () => {
  it('should invoke external native function', () => {
    const mockForeignFn = jest.fn()

    natives['testNative(): void'] = mockForeignFn

    const programStr = `
    class C {
        public native void testNative();

        public static void main(String[] args) {
            C c = new C();
            c.testNative();
        }
    }`

    const compilationUnit = parse(programStr)
    expect(compilationUnit).toBeTruthy()

    const context = createContextStub()
    context.control.push(compilationUnit!)

    evaluate(context)

    expect(mockForeignFn.mock.calls).toHaveLength(1)
  })

  it('should invoke external native function with correct environment', () => {
    const foreignFn = jest.fn(({ environment }) => {
      const s = environment.getVariable('s').value.literalType.value
      expect(s).toBe('"Test"')
    })

    natives['testNative(String s): void'] = foreignFn

    const programStr = `
    class C {
        public native void testNative(String s);

        public static void main(String[] args) {
            C c = new C();
            c.testNative("Test");
        }
    }`

    const compilationUnit = parse(programStr)
    expect(compilationUnit).toBeTruthy()

    const context = createContextStub()
    context.control.push(compilationUnit!)

    evaluate(context)

    expect(foreignFn.mock.calls).toHaveLength(1)
  })

  it('should run control items pushed by external native function', () => {
    const foreignFn = jest.fn(({ control }) => {
      control.push({ kind: 'Literal', literalType: { kind: 'DecimalIntegerLiteral', value: '7' } })
    })

    const checkFn = jest.fn(({ environment }) => {
      const x = environment.getVariable('x').value.literalType.value
      expect(x).toBe('7')
    })

    natives['viaControl(): int'] = foreignFn
    natives['check(int x): void'] = checkFn

    const programStr = `
    class C {
        public static native int viaControl();
        public static native void check(int x);

        public static void main(String[] args) {
            int x = viaControl();
            check(x);
        }
    }`

    const compilationUnit = parse(programStr)
    expect(compilationUnit).toBeTruthy()

    const context = createContextStub()
    context.control.push(compilationUnit!)

    evaluate(context)

    expect(foreignFn.mock.calls).toHaveLength(1)
    expect(checkFn.mock.calls).toHaveLength(1)
  })
})
