import { OPCODE } from '../../../ClassFile/constants/instructions'
import { JavaStackFrame } from '../../stackframe'
import Thread from '../../thread'
import { setupTest } from '../__utils__/test-utils'

let thread: Thread
let code: DataView

beforeEach(() => {
  const setup = setupTest()
  thread = setup.thread
  code = setup.code
  const testClass = setup.classes.testClass
  const method = setup.method
  thread.invokeStackFrame(new JavaStackFrame(testClass, method, 0, []))
})

describe('Lcmp', () => {
  test('lcmp: value1 > value2 pushes 1I onto stack', () => {
    thread.pushStack64(BigInt(100))
    thread.pushStack64(BigInt(99))
    code.setUint8(0, OPCODE.LCMP)

    thread.runFor(1)
    const lastFrame = thread.peekStackFrame()
    expect(lastFrame.operandStack.length).toBe(1)
    expect(lastFrame.operandStack[0]).toBe(1)
    expect(lastFrame.locals.length).toBe(0)
    expect(thread.getPC()).toBe(1)
  })

  test('lcmp: value1 == value2 pushes 0I onto stack', () => {
    thread.pushStack64(BigInt(100))
    thread.pushStack64(BigInt(100))
    code.setUint8(0, OPCODE.LCMP)

    thread.runFor(1)
    const lastFrame = thread.peekStackFrame()
    expect(lastFrame.operandStack.length).toBe(1)
    expect(lastFrame.operandStack[0]).toBe(0)
    expect(lastFrame.locals.length).toBe(0)
    expect(thread.getPC()).toBe(1)
  })

  test('lcmp: value1 < value2 pushes 0I onto stack', () => {
    thread.pushStack64(BigInt(99))
    thread.pushStack64(BigInt(100))
    code.setUint8(0, OPCODE.LCMP)

    thread.runFor(1)
    const lastFrame = thread.peekStackFrame()
    expect(lastFrame.operandStack.length).toBe(1)
    expect(lastFrame.operandStack[0]).toBe(-1)
    expect(lastFrame.locals.length).toBe(0)
    expect(thread.getPC()).toBe(1)
  })
})

describe('Fcmpl', () => {
  test('FCMPL: value1 > value2 pushes 1I onto stack', () => {
    thread.pushStack(1.5)
    thread.pushStack(1.2)
    code.setUint8(0, OPCODE.FCMPL)

    thread.runFor(1)
    const lastFrame = thread.peekStackFrame()
    expect(lastFrame.operandStack.length).toBe(1)
    expect(lastFrame.operandStack[0]).toBe(1)
    expect(lastFrame.locals.length).toBe(0)
    expect(thread.getPC()).toBe(1)
  })

  test('FCMPL: value1 == value2 pushes 0I onto stack', () => {
    thread.pushStack(1.5)
    thread.pushStack(1.5)
    code.setUint8(0, OPCODE.FCMPL)

    thread.runFor(1)
    const lastFrame = thread.peekStackFrame()
    expect(lastFrame.operandStack.length).toBe(1)
    expect(lastFrame.operandStack[0]).toBe(0)
    expect(lastFrame.locals.length).toBe(0)
    expect(thread.getPC()).toBe(1)
  })

  test('FCMPL: -0 == +0 pushes 0I onto stack', () => {
    thread.pushStack(-0.0)
    thread.pushStack(+0.0)
    code.setUint8(0, OPCODE.FCMPL)

    thread.runFor(1)
    const lastFrame = thread.peekStackFrame()
    expect(lastFrame.operandStack.length).toBe(1)
    expect(lastFrame.operandStack[0]).toBe(0)
    expect(lastFrame.locals.length).toBe(0)
    expect(thread.getPC()).toBe(1)
  })

  test('FCMPL: value1 < value2 pushes 0I onto stack', () => {
    thread.pushStack(1.2)
    thread.pushStack(1.5)
    code.setUint8(0, OPCODE.FCMPL)

    thread.runFor(1)
    const lastFrame = thread.peekStackFrame()
    expect(lastFrame.operandStack.length).toBe(1)
    expect(lastFrame.operandStack[0]).toBe(-1)
    expect(lastFrame.locals.length).toBe(0)
    expect(thread.getPC()).toBe(1)
  })

  test('FCMPL: value1 is NaN pushes -1I onto stack', () => {
    thread.pushStack(NaN)
    thread.pushStack(1.5)
    code.setUint8(0, OPCODE.FCMPL)

    thread.runFor(1)
    const lastFrame = thread.peekStackFrame()
    expect(lastFrame.operandStack.length).toBe(1)
    expect(lastFrame.operandStack[0]).toBe(-1)
    expect(lastFrame.locals.length).toBe(0)
    expect(thread.getPC()).toBe(1)
  })

  test('FCMPL: value2 is NaN pushes -1I onto stack', () => {
    thread.pushStack(1.5)
    thread.pushStack(NaN)
    code.setUint8(0, OPCODE.FCMPL)

    thread.runFor(1)
    const lastFrame = thread.peekStackFrame()
    expect(lastFrame.operandStack.length).toBe(1)
    expect(lastFrame.operandStack[0]).toBe(-1)
    expect(lastFrame.locals.length).toBe(0)
    expect(thread.getPC()).toBe(1)
  })

  test('FCMPL: both values are NaN pushes -1I onto stack', () => {
    thread.pushStack(NaN)
    thread.pushStack(NaN)
    code.setUint8(0, OPCODE.FCMPL)

    thread.runFor(1)
    const lastFrame = thread.peekStackFrame()
    expect(lastFrame.operandStack.length).toBe(1)
    expect(lastFrame.operandStack[0]).toBe(-1)
    expect(lastFrame.locals.length).toBe(0)
    expect(thread.getPC()).toBe(1)
  })
})

describe('Fcmpg', () => {
  test('FCMPG: value1 > value2 pushes 1I onto stack', () => {
    thread.pushStack(1.5)
    thread.pushStack(1.2)
    code.setUint8(0, OPCODE.FCMPG)

    thread.runFor(1)
    const lastFrame = thread.peekStackFrame()
    expect(lastFrame.operandStack.length).toBe(1)
    expect(lastFrame.operandStack[0]).toBe(1)
    expect(lastFrame.locals.length).toBe(0)
    expect(thread.getPC()).toBe(1)
  })

  test('FCMPG: value1 == value2 pushes 0I onto stack', () => {
    thread.pushStack(1.5)
    thread.pushStack(1.5)
    code.setUint8(0, OPCODE.FCMPG)

    thread.runFor(1)
    const lastFrame = thread.peekStackFrame()
    expect(lastFrame.operandStack.length).toBe(1)
    expect(lastFrame.operandStack[0]).toBe(0)
    expect(lastFrame.locals.length).toBe(0)
    expect(thread.getPC()).toBe(1)
  })

  test('FCMPG: -0 == +0 pushes 0I onto stack', () => {
    thread.pushStack(-0.0)
    thread.pushStack(+0.0)
    code.setUint8(0, OPCODE.FCMPG)

    thread.runFor(1)
    const lastFrame = thread.peekStackFrame()
    expect(lastFrame.operandStack.length).toBe(1)
    expect(lastFrame.operandStack[0]).toBe(0)
    expect(lastFrame.locals.length).toBe(0)
    expect(thread.getPC()).toBe(1)
  })

  test('FCMPG: value1 < value2 pushes 0I onto stack', () => {
    thread.pushStack(1.2)
    thread.pushStack(1.5)
    code.setUint8(0, OPCODE.FCMPG)

    thread.runFor(1)
    const lastFrame = thread.peekStackFrame()
    expect(lastFrame.operandStack.length).toBe(1)
    expect(lastFrame.operandStack[0]).toBe(-1)
    expect(lastFrame.locals.length).toBe(0)
    expect(thread.getPC()).toBe(1)
  })

  test('FCMPG: value1 is NaN pushes 1I onto stack', () => {
    thread.pushStack(NaN)
    thread.pushStack(1.5)
    code.setUint8(0, OPCODE.FCMPG)

    thread.runFor(1)
    const lastFrame = thread.peekStackFrame()
    expect(lastFrame.operandStack.length).toBe(1)
    expect(lastFrame.operandStack[0]).toBe(1)
    expect(lastFrame.locals.length).toBe(0)
    expect(thread.getPC()).toBe(1)
  })

  test('FCMPG: value2 is NaN pushes 1I onto stack', () => {
    thread.pushStack(1.5)
    thread.pushStack(NaN)
    code.setUint8(0, OPCODE.FCMPG)

    thread.runFor(1)
    const lastFrame = thread.peekStackFrame()
    expect(lastFrame.operandStack.length).toBe(1)
    expect(lastFrame.operandStack[0]).toBe(1)
    expect(lastFrame.locals.length).toBe(0)
    expect(thread.getPC()).toBe(1)
  })

  test('FCMPG: both values are NaN pushes 1I onto stack', () => {
    thread.pushStack(NaN)
    thread.pushStack(NaN)
    code.setUint8(0, OPCODE.FCMPG)

    thread.runFor(1)
    const lastFrame = thread.peekStackFrame()
    expect(lastFrame.operandStack.length).toBe(1)
    expect(lastFrame.operandStack[0]).toBe(1)
    expect(lastFrame.locals.length).toBe(0)
    expect(thread.getPC()).toBe(1)
  })
})

describe('Dcmpl', () => {
  test('DCMPL: value1 > value2 pushes 1I onto stack', () => {
    thread.pushStack64(1.5)
    thread.pushStack64(1.2)
    code.setUint8(0, OPCODE.DCMPL)

    thread.runFor(1)
    const lastFrame = thread.peekStackFrame()
    expect(lastFrame.operandStack.length).toBe(1)
    expect(lastFrame.operandStack[0]).toBe(1)
    expect(lastFrame.locals.length).toBe(0)
    expect(thread.getPC()).toBe(1)
  })

  test('DCMPL: value1 == value2 pushes 0I onto stack', () => {
    thread.pushStack64(1.5)
    thread.pushStack64(1.5)
    code.setUint8(0, OPCODE.DCMPL)

    thread.runFor(1)
    const lastFrame = thread.peekStackFrame()
    expect(lastFrame.operandStack.length).toBe(1)
    expect(lastFrame.operandStack[0]).toBe(0)
    expect(lastFrame.locals.length).toBe(0)
    expect(thread.getPC()).toBe(1)
  })

  test('DCMPL: -0 == +0 pushes 0I onto stack', () => {
    thread.pushStack64(-0.0)
    thread.pushStack64(+0.0)
    code.setUint8(0, OPCODE.DCMPL)

    thread.runFor(1)
    const lastFrame = thread.peekStackFrame()
    expect(lastFrame.operandStack.length).toBe(1)
    expect(lastFrame.operandStack[0]).toBe(0)
    expect(lastFrame.locals.length).toBe(0)
    expect(thread.getPC()).toBe(1)
  })

  test('DCMPL: value1 < value2 pushes 0I onto stack', () => {
    thread.pushStack64(1.2)
    thread.pushStack64(1.5)
    code.setUint8(0, OPCODE.DCMPL)

    thread.runFor(1)
    const lastFrame = thread.peekStackFrame()
    expect(lastFrame.operandStack.length).toBe(1)
    expect(lastFrame.operandStack[0]).toBe(-1)
    expect(lastFrame.locals.length).toBe(0)
    expect(thread.getPC()).toBe(1)
  })

  test('DCMPL: value1 is NaN pushes -1I onto stack', () => {
    thread.pushStack64(NaN)
    thread.pushStack64(1.5)
    code.setUint8(0, OPCODE.DCMPL)

    thread.runFor(1)
    const lastFrame = thread.peekStackFrame()
    expect(lastFrame.operandStack.length).toBe(1)
    expect(lastFrame.operandStack[0]).toBe(-1)
    expect(lastFrame.locals.length).toBe(0)
    expect(thread.getPC()).toBe(1)
  })

  test('DCMPL: value2 is NaN pushes -1I onto stack', () => {
    thread.pushStack64(1.5)
    thread.pushStack64(NaN)
    code.setUint8(0, OPCODE.DCMPL)

    thread.runFor(1)
    const lastFrame = thread.peekStackFrame()
    expect(lastFrame.operandStack.length).toBe(1)
    expect(lastFrame.operandStack[0]).toBe(-1)
    expect(lastFrame.locals.length).toBe(0)
    expect(thread.getPC()).toBe(1)
  })

  test('DCMPL: both values are NaN pushes -1I onto stack', () => {
    thread.pushStack64(NaN)
    thread.pushStack64(NaN)
    code.setUint8(0, OPCODE.DCMPL)

    thread.runFor(1)
    const lastFrame = thread.peekStackFrame()
    expect(lastFrame.operandStack.length).toBe(1)
    expect(lastFrame.operandStack[0]).toBe(-1)
    expect(lastFrame.locals.length).toBe(0)
    expect(thread.getPC()).toBe(1)
  })
})

describe('Dcmpg', () => {
  test('DCMPG: value1 > value2 pushes 1I onto stack', () => {
    thread.pushStack64(1.5)
    thread.pushStack64(1.2)
    code.setUint8(0, OPCODE.DCMPG)

    thread.runFor(1)
    const lastFrame = thread.peekStackFrame()
    expect(lastFrame.operandStack.length).toBe(1)
    expect(lastFrame.operandStack[0]).toBe(1)
    expect(lastFrame.locals.length).toBe(0)
    expect(thread.getPC()).toBe(1)
  })

  test('DCMPG: value1 == value2 pushes 0I onto stack', () => {
    thread.pushStack64(1.5)
    thread.pushStack64(1.5)
    code.setUint8(0, OPCODE.DCMPG)

    thread.runFor(1)
    const lastFrame = thread.peekStackFrame()
    expect(lastFrame.operandStack.length).toBe(1)
    expect(lastFrame.operandStack[0]).toBe(0)
    expect(lastFrame.locals.length).toBe(0)
    expect(thread.getPC()).toBe(1)
  })

  test('DCMPG: -0 == +0 pushes 0I onto stack', () => {
    thread.pushStack64(-0.0)
    thread.pushStack64(+0.0)
    code.setUint8(0, OPCODE.DCMPG)

    thread.runFor(1)
    const lastFrame = thread.peekStackFrame()
    expect(lastFrame.operandStack.length).toBe(1)
    expect(lastFrame.operandStack[0]).toBe(0)
    expect(lastFrame.locals.length).toBe(0)
    expect(thread.getPC()).toBe(1)
  })

  test('DCMPG: value1 < value2 pushes 0I onto stack', () => {
    thread.pushStack64(1.2)
    thread.pushStack64(1.5)
    code.setUint8(0, OPCODE.DCMPG)

    thread.runFor(1)
    const lastFrame = thread.peekStackFrame()
    expect(lastFrame.operandStack.length).toBe(1)
    expect(lastFrame.operandStack[0]).toBe(-1)
    expect(lastFrame.locals.length).toBe(0)
    expect(thread.getPC()).toBe(1)
  })

  test('DCMPG: value1 is NaN pushes 1I onto stack', () => {
    thread.pushStack64(NaN)
    thread.pushStack64(1.5)
    code.setUint8(0, OPCODE.DCMPG)

    thread.runFor(1)
    const lastFrame = thread.peekStackFrame()
    expect(lastFrame.operandStack.length).toBe(1)
    expect(lastFrame.operandStack[0]).toBe(1)
    expect(lastFrame.locals.length).toBe(0)
    expect(thread.getPC()).toBe(1)
  })

  test('DCMPG: value2 is NaN pushes 1I onto stack', () => {
    thread.pushStack64(1.5)
    thread.pushStack64(NaN)
    code.setUint8(0, OPCODE.DCMPG)

    thread.runFor(1)
    const lastFrame = thread.peekStackFrame()
    expect(lastFrame.operandStack.length).toBe(1)
    expect(lastFrame.operandStack[0]).toBe(1)
    expect(lastFrame.locals.length).toBe(0)
    expect(thread.getPC()).toBe(1)
  })

  test('DCMPG: both values are NaN pushes 1I onto stack', () => {
    thread.pushStack64(NaN)
    thread.pushStack64(NaN)
    code.setUint8(0, OPCODE.DCMPG)

    thread.runFor(1)
    const lastFrame = thread.peekStackFrame()
    expect(lastFrame.operandStack.length).toBe(1)
    expect(lastFrame.operandStack[0]).toBe(1)
    expect(lastFrame.locals.length).toBe(0)
    expect(thread.getPC()).toBe(1)
  })
})

describe('Ifeq', () => {
  test('IFEQ: non zero no branch', () => {
    thread.pushStack(1)
    code.setUint8(0, OPCODE.IFEQ)
    code.setInt16(1, 10)
    thread.runFor(1)
    const lastFrame = thread.peekStackFrame()
    expect(lastFrame.operandStack.length).toBe(0)
    expect(lastFrame.locals.length).toBe(0)
    expect(thread.getPC()).toBe(3)
  })

  test('IFEQ: zero branches', () => {
    thread.pushStack(0)
    code.setUint8(0, OPCODE.IFEQ)
    code.setInt16(1, 10)
    thread.runFor(1)
    const lastFrame = thread.peekStackFrame()
    expect(lastFrame.operandStack.length).toBe(0)
    expect(lastFrame.locals.length).toBe(0)
    expect(thread.getPC()).toBe(10)
  })

  test('IFEQ: -0 branches', () => {
    thread.pushStack(-0)
    code.setUint8(0, OPCODE.IFEQ)
    code.setInt16(1, 10)
    thread.runFor(1)
    const lastFrame = thread.peekStackFrame()
    expect(lastFrame.operandStack.length).toBe(0)
    expect(lastFrame.locals.length).toBe(0)
    expect(thread.getPC()).toBe(10)
  })
})

describe('Ifne', () => {
  test('IFNE: non zero branches', () => {
    thread.pushStack(1)
    code.setUint8(0, OPCODE.IFNE)
    code.setInt16(1, 10)
    thread.runFor(1)
    const lastFrame = thread.peekStackFrame()
    expect(lastFrame.operandStack.length).toBe(0)
    expect(lastFrame.locals.length).toBe(0)
    expect(thread.getPC()).toBe(10)
  })

  test('IFNE: zero no branch', () => {
    thread.pushStack(0)
    code.setUint8(0, OPCODE.IFNE)
    code.setInt16(1, 10)
    thread.runFor(1)
    const lastFrame = thread.peekStackFrame()
    expect(lastFrame.operandStack.length).toBe(0)
    expect(lastFrame.locals.length).toBe(0)
    expect(thread.getPC()).toBe(3)
  })

  test('IFNE: -0 no branch', () => {
    thread.pushStack(-0)
    code.setUint8(0, OPCODE.IFNE)
    code.setInt16(1, 10)
    thread.runFor(1)
    const lastFrame = thread.peekStackFrame()
    expect(lastFrame.operandStack.length).toBe(0)
    expect(lastFrame.locals.length).toBe(0)
    expect(thread.getPC()).toBe(3)
  })
})

describe('Iflt', () => {
  test('IFLT: less than zero branches', () => {
    thread.pushStack(-1)
    code.setUint8(0, OPCODE.IFLT)
    code.setInt16(1, 10)
    thread.runFor(1)
    const lastFrame = thread.peekStackFrame()
    expect(lastFrame.operandStack.length).toBe(0)
    expect(lastFrame.locals.length).toBe(0)
    expect(thread.getPC()).toBe(10)
  })

  test('IFLT: zero no branch', () => {
    thread.pushStack(0)
    code.setUint8(0, OPCODE.IFLT)
    code.setInt16(1, 10)
    thread.runFor(1)
    const lastFrame = thread.peekStackFrame()
    expect(lastFrame.operandStack.length).toBe(0)
    expect(lastFrame.locals.length).toBe(0)
    expect(thread.getPC()).toBe(3)
  })

  test('IFLT: -0 no branch', () => {
    thread.pushStack(-0)
    code.setUint8(0, OPCODE.IFLT)
    code.setInt16(1, 10)
    thread.runFor(1)
    const lastFrame = thread.peekStackFrame()
    expect(lastFrame.operandStack.length).toBe(0)
    expect(lastFrame.locals.length).toBe(0)
    expect(thread.getPC()).toBe(3)
  })
})

describe('Ifge', () => {
  test('IFGE: greater than zero branches', () => {
    thread.pushStack(1)
    code.setUint8(0, OPCODE.IFGE)
    code.setInt16(1, 10)
    thread.runFor(1)
    const lastFrame = thread.peekStackFrame()
    expect(lastFrame.operandStack.length).toBe(0)
    expect(lastFrame.locals.length).toBe(0)
    expect(thread.getPC()).toBe(10)
  })

  test('IFGE: zero branches', () => {
    thread.pushStack(0)
    code.setUint8(0, OPCODE.IFGE)
    code.setInt16(1, 10)
    thread.runFor(1)
    const lastFrame = thread.peekStackFrame()
    expect(lastFrame.operandStack.length).toBe(0)
    expect(lastFrame.locals.length).toBe(0)
    expect(thread.getPC()).toBe(10)
  })

  test('IFGE: -0 branches', () => {
    thread.pushStack(-0)
    code.setUint8(0, OPCODE.IFGE)
    code.setInt16(1, 10)
    thread.runFor(1)
    const lastFrame = thread.peekStackFrame()
    expect(lastFrame.operandStack.length).toBe(0)
    expect(lastFrame.locals.length).toBe(0)
    expect(thread.getPC()).toBe(10)
  })

  test('IFGE: less than 0 no branch', () => {
    thread.pushStack(-1)
    code.setUint8(0, OPCODE.IFGE)
    code.setInt16(1, 10)
    thread.runFor(1)
    const lastFrame = thread.peekStackFrame()
    expect(lastFrame.operandStack.length).toBe(0)
    expect(lastFrame.locals.length).toBe(0)
    expect(thread.getPC()).toBe(3)
  })
})

describe('Ifgt', () => {
  test('IFGT: greater than zero branches', () => {
    thread.pushStack(1)
    code.setUint8(0, OPCODE.IFGT)
    code.setInt16(1, 10)
    thread.runFor(1)
    const lastFrame = thread.peekStackFrame()
    expect(lastFrame.operandStack.length).toBe(0)
    expect(lastFrame.locals.length).toBe(0)
    expect(thread.getPC()).toBe(10)
  })

  test('IFGT: zero no branch', () => {
    thread.pushStack(0)
    code.setUint8(0, OPCODE.IFGT)
    code.setInt16(1, 10)
    thread.runFor(1)
    const lastFrame = thread.peekStackFrame()
    expect(lastFrame.operandStack.length).toBe(0)
    expect(lastFrame.locals.length).toBe(0)
    expect(thread.getPC()).toBe(3)
  })

  test('IFGT: -0 no branch', () => {
    thread.pushStack(-0)
    code.setUint8(0, OPCODE.IFGT)
    code.setInt16(1, 10)
    thread.runFor(1)
    const lastFrame = thread.peekStackFrame()
    expect(lastFrame.operandStack.length).toBe(0)
    expect(lastFrame.locals.length).toBe(0)
    expect(thread.getPC()).toBe(3)
  })

  test('IFGT: less than 0 no branch', () => {
    thread.pushStack(-1)
    code.setUint8(0, OPCODE.IFGT)
    code.setInt16(1, 10)
    thread.runFor(1)
    const lastFrame = thread.peekStackFrame()
    expect(lastFrame.operandStack.length).toBe(0)
    expect(lastFrame.locals.length).toBe(0)
    expect(thread.getPC()).toBe(3)
  })
})

describe('Ifle', () => {
  test('IFLE: greater than zero no branch', () => {
    thread.pushStack(1)
    code.setUint8(0, OPCODE.IFLE)
    code.setInt16(1, 10)
    thread.runFor(1)
    const lastFrame = thread.peekStackFrame()
    expect(lastFrame.operandStack.length).toBe(0)
    expect(lastFrame.locals.length).toBe(0)
    expect(thread.getPC()).toBe(3)
  })

  test('IFLE: zero branches', () => {
    thread.pushStack(0)
    code.setUint8(0, OPCODE.IFLE)
    code.setInt16(1, 10)
    thread.runFor(1)
    const lastFrame = thread.peekStackFrame()
    expect(lastFrame.operandStack.length).toBe(0)
    expect(lastFrame.locals.length).toBe(0)
    expect(thread.getPC()).toBe(10)
  })

  test('IFLE: -0 branches', () => {
    thread.pushStack(-0)
    code.setUint8(0, OPCODE.IFLE)
    code.setInt16(1, 10)
    thread.runFor(1)
    const lastFrame = thread.peekStackFrame()
    expect(lastFrame.operandStack.length).toBe(0)
    expect(lastFrame.locals.length).toBe(0)
    expect(thread.getPC()).toBe(10)
  })

  test('IFLE: less than 0 branches', () => {
    thread.pushStack(-1)
    code.setUint8(0, OPCODE.IFLE)
    code.setInt16(1, 10)
    thread.runFor(1)
    const lastFrame = thread.peekStackFrame()
    expect(lastFrame.operandStack.length).toBe(0)
    expect(lastFrame.locals.length).toBe(0)
    expect(thread.getPC()).toBe(10)
  })
})
