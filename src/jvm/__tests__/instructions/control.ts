import { OPCODE } from '../../../ClassFile/constants/instructions'
import { JavaStackFrame } from '../../stackframe'
import Thread from '../../thread'
import { SuccessResult } from '../../types/Result'
import { ReferenceClassData } from '../../types/class/ClassData'
import { JvmObject } from '../../types/reference/Object'
import { setupTest } from '../__utils__/test-utils'

let thread: Thread
let threadClass: ReferenceClassData
let code: DataView

beforeEach(() => {
  const setup = setupTest()
  thread = setup.thread
  threadClass = setup.classes.threadClass
  code = setup.code
  const testClass = setup.classes.testClass
  const method = setup.method
  thread.invokeStackFrame(new JavaStackFrame(testClass, method, 0, []))
})

describe('Goto', () => {
  test('GOTO: goes to correct offset', () => {
    code.setUint8(0, OPCODE.GOTO)
    code.setInt16(1, 10)
    thread.runFor(1)
    const lastFrame = thread.peekStackFrame()
    expect(lastFrame.operandStack.length).toBe(0)
    expect(lastFrame.locals.length).toBe(0)
    expect(thread.getPC()).toBe(10)
  })
})

describe('Jsr', () => {
  test('JSR: pushes next pc and jumps to offset', () => {
    code.setUint8(0, OPCODE.JSR)
    code.setInt16(1, 10)

    thread.runFor(1)
    const lastFrame = thread.peekStackFrame()
    expect(lastFrame.operandStack.length).toBe(1)
    expect(lastFrame.operandStack[0]).toBe(3)
    expect(lastFrame.locals.length).toBe(0)
    expect(thread.getPC()).toBe(10)
  })
})

describe('Ret', () => {
  test('RET: pushes next pc and jumps to offset', () => {
    code.setUint8(0, OPCODE.RET)
    code.setUint8(1, 0)
    thread.storeLocal(0, 3)

    thread.runFor(1)
    const lastFrame = thread.peekStackFrame()
    expect(lastFrame.operandStack.length).toBe(0)
    expect(lastFrame.locals.length).toBe(1)
    expect(thread.getPC()).toBe(3)
  })
})

describe('Ireturn', () => {
  test('IRETURN: returns int to previous stackframe', () => {
    thread.invokeStackFrame(new JavaStackFrame(threadClass, thread.getMethod(), 0, []))
    thread.pushStack(5)
    code.setUint8(0, OPCODE.IRETURN)

    thread.runFor(1)

    const lastFrame = thread.peekStackFrame()
    expect(lastFrame.operandStack.length).toBe(1)
    expect((thread.popStack() as SuccessResult<any>).result).toBe(5)
    expect(lastFrame.locals.length).toBe(0)
    expect(thread.getPC()).toBe(0)

    thread.returnStackFrame()
    expect(thread.peekStackFrame()).toBe(undefined)
  })
})

describe('Lreturn', () => {
  test('LRETURN: returns long to previous stackframe', () => {
    thread.invokeStackFrame(new JavaStackFrame(threadClass, thread.getMethod(), 0, []))
    thread.pushStack64(BigInt(5))
    code.setUint8(0, OPCODE.LRETURN)

    thread.runFor(1)

    const lastFrame = thread.peekStackFrame()
    expect(lastFrame.operandStack.length).toBe(2)
    expect((thread.popStack64() as SuccessResult<any>).result === BigInt(5)).toBe(true)
    expect(lastFrame.locals.length).toBe(0)
    expect(thread.getPC()).toBe(0)

    thread.returnStackFrame()
    expect(thread.peekStackFrame()).toBe(undefined)
  })
})

describe('Freturn', () => {
  test('FRETURN: returns float to previous stackframe', () => {
    thread.invokeStackFrame(new JavaStackFrame(threadClass, thread.getMethod(), 0, []))
    thread.pushStack(0)
    code.setUint8(0, OPCODE.FRETURN)

    thread.runFor(1)

    const lastFrame = thread.peekStackFrame()
    expect(lastFrame.operandStack.length).toBe(1)
    expect((thread.popStack() as SuccessResult<any>).result).toBe(0)
    expect(lastFrame.locals.length).toBe(0)
    expect(thread.getPC()).toBe(0)

    thread.returnStackFrame()
    expect(thread.peekStackFrame()).toBe(undefined)
  })

  test('FRETURN: undergoes value set conversion', () => {
    thread.invokeStackFrame(new JavaStackFrame(threadClass, thread.getMethod(), 0, []))
    thread.pushStack(3.33)
    code.setUint8(0, OPCODE.FRETURN)

    thread.runFor(1)

    const lastFrame = thread.peekStackFrame()
    expect(lastFrame.operandStack.length).toBe(1)
    expect((thread.popStack() as SuccessResult<any>).result).toBe(Math.fround(3.33))
    expect(lastFrame.locals.length).toBe(0)
    expect(thread.getPC()).toBe(0)

    thread.returnStackFrame()
    expect(thread.peekStackFrame()).toBe(undefined)
  })
})

describe('Dreturn', () => {
  test('DRETURN: returns double to previous stackframe', () => {
    thread.invokeStackFrame(new JavaStackFrame(threadClass, thread.getMethod(), 0, []))
    thread.pushStack64(5.5)
    code.setUint8(0, OPCODE.DRETURN)

    thread.runFor(1)

    const lastFrame = thread.peekStackFrame()
    expect(lastFrame.operandStack.length).toBe(2)
    expect((thread.popStack64() as SuccessResult<any>).result).toBe(5.5)
    expect(lastFrame.locals.length).toBe(0)
    expect(thread.getPC()).toBe(0)

    thread.returnStackFrame()
    expect(thread.peekStackFrame()).toBe(undefined)
  })
})

describe('Areturn', () => {
  test('ARETURN: returns reference to previous stackframe', () => {
    const obj = new JvmObject(threadClass)
    thread.invokeStackFrame(new JavaStackFrame(threadClass, thread.getMethod(), 0, []))
    thread.pushStack(obj)
    code.setUint8(0, OPCODE.ARETURN)

    thread.runFor(1)

    const lastFrame = thread.peekStackFrame()
    expect(lastFrame.operandStack.length).toBe(1)
    expect((thread.popStack() as SuccessResult<any>).result).toBe(obj)
    expect(lastFrame.locals.length).toBe(0)
    expect(thread.getPC()).toBe(0)

    thread.returnStackFrame()
    expect(thread.peekStackFrame()).toBe(undefined)
  })
})

describe('return', () => {
  test('RETURN: returns to previous stackframe', () => {
    thread.invokeStackFrame(new JavaStackFrame(threadClass, thread.getMethod(), 0, []))
    code.setUint8(0, OPCODE.RETURN)

    thread.runFor(1)

    const lastFrame = thread.peekStackFrame()
    expect(lastFrame.operandStack.length).toBe(0)
    expect(lastFrame.locals.length).toBe(0)
    expect(thread.getPC()).toBe(0)

    thread.returnStackFrame()
    expect(thread.peekStackFrame()).toBe(undefined)
  })
})

describe('Tableswitch', () => {
  test('Tableswitch: no switch OK', () => {
    code.setUint8(0, OPCODE.TABLESWITCH)
    code.setInt32(4, 100) // default
    code.setInt32(8, 100) // low
    code.setInt32(12, 99) // high

    thread.pushStack(-1)

    thread.runFor(1)
    const lastFrame = thread.peekStackFrame()
    expect(lastFrame.operandStack.length).toBe(0)
    expect(lastFrame.locals.length).toBe(0)
    expect(thread.getPC()).toBe(100)
  })

  test('Tableswitch: default OK', () => {
    code.setUint8(0, OPCODE.TABLESWITCH)
    code.setInt32(4, 100) // default
    code.setInt32(8, 100) // low
    code.setInt32(12, 100) // high
    code.setInt32(16, 200) //offset 0

    thread.pushStack(99)

    thread.runFor(1)
    const lastFrame = thread.peekStackFrame()
    expect(lastFrame.operandStack.length).toBe(0)
    expect(lastFrame.locals.length).toBe(0)
    expect(thread.getPC()).toBe(100)
  })

  test('Tableswitch: switch OK', () => {
    code.setUint8(0, OPCODE.TABLESWITCH)
    code.setInt32(4, 100) // default
    code.setInt32(8, 100) // low
    code.setInt32(12, 100) // high
    code.setInt32(16, 200) //offset 0

    thread.pushStack(100)

    thread.runFor(1)
    const lastFrame = thread.peekStackFrame()
    expect(lastFrame.operandStack.length).toBe(0)
    expect(lastFrame.locals.length).toBe(0)
    expect(thread.getPC()).toBe(200)
  })

  test('Tableswitch: multi switch OK', () => {
    code.setUint8(0, OPCODE.TABLESWITCH)
    code.setInt32(4, 100) // default
    code.setInt32(8, 100) // low
    code.setInt32(12, 102) // high
    code.setInt32(16, 200) //offset 0
    code.setInt32(20, 300) //offset 1
    code.setInt32(24, 400) //offset 2

    thread.pushStack(102)

    thread.runFor(1)
    const lastFrame = thread.peekStackFrame()
    expect(lastFrame.operandStack.length).toBe(0)
    expect(lastFrame.locals.length).toBe(0)
    expect(thread.getPC()).toBe(400)
  })

  test('Tableswitch: padding OK', () => {
    code.setUint8(0, OPCODE.NOP)
    code.setUint8(1, OPCODE.NOP)
    code.setUint8(2, OPCODE.TABLESWITCH)
    code.setInt32(4, 100) // default
    code.setInt32(8, 100) // low
    code.setInt32(12, 102) // high
    code.setInt32(16, 200) //offset 0
    code.setInt32(20, 300) //offset 1
    code.setInt32(24, 400) //offset 2

    thread.pushStack(102)

    thread.runFor(3)
    const lastFrame = thread.peekStackFrame()
    expect(lastFrame.operandStack.length).toBe(0)
    expect(lastFrame.locals.length).toBe(0)
    expect(thread.getPC()).toBe(402)
  })
})

describe('Lookupswitch', () => {
  test('Lookupswitch: no switch OK', () => {
    code.setUint8(0, OPCODE.LOOKUPSWITCH)
    code.setInt32(4, 100) // default
    code.setInt32(8, 0) // npairs

    thread.pushStack(-1)

    thread.runFor(1)
    const lastFrame = thread.peekStackFrame()
    expect(lastFrame.operandStack.length).toBe(0)
    expect(lastFrame.locals.length).toBe(0)
    expect(thread.getPC()).toBe(100)
  })

  test('Lookupswitch: switch OK', () => {
    code.setUint8(0, OPCODE.LOOKUPSWITCH)
    code.setInt32(4, 100) // default
    code.setInt32(8, 1) // npairs
    code.setInt32(12, 10) // key1
    code.setInt32(16, 200) // value1

    thread.pushStack(10)

    thread.runFor(1)
    const lastFrame = thread.peekStackFrame()
    expect(lastFrame.operandStack.length).toBe(0)
    expect(lastFrame.locals.length).toBe(0)
    expect(thread.getPC()).toBe(200)
  })

  test('Lookupswitch: multi switch OK', () => {
    code.setUint8(0, OPCODE.LOOKUPSWITCH)
    code.setInt32(4, 100) // default
    code.setInt32(8, 3) // npairs
    code.setInt32(12, 10) // key1
    code.setInt32(16, 200) // value1
    code.setInt32(20, 20) // key2
    code.setInt32(24, 300) // value2
    code.setInt32(28, 30) // key3
    code.setInt32(32, 400) // value3

    thread.pushStack(30)

    thread.runFor(1)
    const lastFrame = thread.peekStackFrame()
    expect(lastFrame.operandStack.length).toBe(0)
    expect(lastFrame.locals.length).toBe(0)
    expect(thread.getPC()).toBe(400)
  })

  test('Lookupswitch: padding OK', () => {
    code.setUint8(0, OPCODE.NOP)
    code.setUint8(1, OPCODE.NOP)
    code.setUint8(2, OPCODE.NOP)
    code.setUint8(3, OPCODE.LOOKUPSWITCH)
    code.setInt32(4, 100) // default
    code.setInt32(8, 3) // npairs
    code.setInt32(12, 10) // key1
    code.setInt32(16, 200) // value1
    code.setInt32(20, 20) // key2
    code.setInt32(24, 300) // value2
    code.setInt32(28, 30) // key3
    code.setInt32(32, 400) // value3

    thread.pushStack(30)

    thread.runFor(4)
    const lastFrame = thread.peekStackFrame()
    expect(lastFrame.operandStack.length).toBe(0)
    expect(lastFrame.locals.length).toBe(0)
    expect(thread.getPC()).toBe(403)
  })
})
