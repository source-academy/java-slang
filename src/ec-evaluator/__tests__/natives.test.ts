import { foreigns } from '../natives'
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
  it('method declaration should dynamically link foreign function', () => {
    const mockForeignFn = jest.fn()

    foreigns['C::testNative(): void'] = mockForeignFn

    const programStr = `
    class C {
      public native void testNative();

      public static void main(String[] args) {
          C c = new C();
          c.testNative();
      }
  }
    `

    const compilationUnit = parse(programStr)
    expect(compilationUnit).toBeTruthy()

    const context = createContextStub()
    context.control.push(compilationUnit!)

    evaluate(context)

    const c = context.environment.getClass('C')
    c.instanceMethods.find(md => md)
  })

  it('invoke instruction should invoke external native function', () => {
    const mockForeignFn = jest.fn()

    foreigns['C::testNative(): void'] = mockForeignFn

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

    foreigns['C::testNative(String s): void'] = foreignFn

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
})
