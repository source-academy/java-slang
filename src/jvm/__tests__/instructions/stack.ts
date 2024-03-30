import { OPCODE } from '../../../ClassFile/constants/instructions'
import { JavaStackFrame } from '../../stackframe'
import Thread from '../../thread'
import { SuccessResult } from '../../types/Result'
import { ClassData, ReferenceClassData } from '../../types/class/ClassData'
import { JvmObject } from '../../types/reference/Object'
import { setupTest } from '../__utils__/test-utils'

let thread: Thread
let threadClass: ReferenceClassData
let code: DataView
let testClass: ClassData

beforeEach(() => {
  const setup = setupTest()
  thread = setup.thread
  threadClass = setup.classes.threadClass
  code = setup.code
  testClass = setup.classes.testClass
  const method = setup.method
  thread.invokeStackFrame(new JavaStackFrame(testClass, method, 0, []))
})

describe('Pop', () => {
  test('POP: pop stack', () => {
    thread.pushStack(1)
    code.setUint8(0, OPCODE.POP)
    thread.runFor(1)
    const lastFrame = thread.peekStackFrame()
    expect(lastFrame.operandStack.length).toBe(0)
    expect(lastFrame.locals.length).toBe(0)
    expect(thread.getPC()).toBe(1)
  })
})

describe('Pop2', () => {
  test('POP2: pop stack 2 ints', () => {
    thread.pushStack(1)
    thread.pushStack(1)
    code.setUint8(0, OPCODE.POP2)
    thread.runFor(1)
    const lastFrame = thread.peekStackFrame()
    expect(lastFrame.operandStack.length).toBe(0)
    expect(lastFrame.locals.length).toBe(0)
    expect(thread.getPC()).toBe(1)
  })

  test('POP2: pop stack 1 double', () => {
    thread.pushStack64(1.0)
    code.setUint8(0, OPCODE.POP2)
    thread.runFor(1)
    const lastFrame = thread.peekStackFrame()
    expect(lastFrame.operandStack.length).toBe(0)
    expect(lastFrame.locals.length).toBe(0)
    expect(thread.getPC()).toBe(1)
  })
})

describe('Dup', () => {
  test('DUP: duplicates reference', () => {
    const ref = testClass.instantiate()
    thread.pushStack(ref)
    code.setUint8(0, OPCODE.DUP)
    thread.runFor(1)
    const lastFrame = thread.peekStackFrame()
    expect(lastFrame.operandStack.length).toBe(2)
    expect(lastFrame.operandStack[0] === ref).toBe(true)
    expect(lastFrame.operandStack[1] === ref).toBe(true)
    expect(lastFrame.locals.length).toBe(0)
    expect(thread.getPC()).toBe(1)
  })
})

describe('DupX1', () => {
  test('DUPX1: duplicates reference', () => {
    const v1 = new JvmObject(threadClass)
    const v2 = new JvmObject(threadClass)
    thread.pushStack(v2)
    thread.pushStack(v1)
    code.setUint8(0, OPCODE.DUP_X1)
    thread.runFor(1)
    const lastFrame = thread.peekStackFrame()
    expect(lastFrame.operandStack.length).toBe(3)
    expect(lastFrame.operandStack[0] === v1).toBe(true)
    expect(lastFrame.operandStack[1] === v2).toBe(true)
    expect(lastFrame.operandStack[2] === v1).toBe(true)
    expect(lastFrame.locals.length).toBe(0)
    expect(thread.getPC()).toBe(1)
  })
})

describe('DupX2', () => {
  test('DUPX2: duplicates reference', () => {
    const v1 = new JvmObject(threadClass)
    const v2 = new JvmObject(threadClass)
    const v3 = new JvmObject(threadClass)
    thread.pushStack(v3)
    thread.pushStack(v2)
    thread.pushStack(v1)
    code.setUint8(0, OPCODE.DUP_X2)
    thread.runFor(1)
    const lastFrame = thread.peekStackFrame()
    expect(lastFrame.operandStack.length).toBe(4)
    expect((thread.popStack() as SuccessResult<any>).result === v1).toBe(true)
    expect((thread.popStack() as SuccessResult<any>).result === v2).toBe(true)
    expect((thread.popStack() as SuccessResult<any>).result === v3).toBe(true)
    expect((thread.popStack() as SuccessResult<any>).result === v1).toBe(true)
    expect(lastFrame.locals.length).toBe(0)
    expect(thread.getPC()).toBe(1)
  })
  test('DUPX2: duplicates double', () => {
    const v1 = new JvmObject(threadClass)
    thread.pushStack64(5.0)
    thread.pushStack(v1)
    code.setUint8(0, OPCODE.DUP_X2)
    thread.runFor(1)
    const lastFrame = thread.peekStackFrame()
    expect(lastFrame.operandStack.length).toBe(4)
    expect((thread.popStack() as SuccessResult<any>).result === v1).toBe(true)
    expect((thread.popStack64() as SuccessResult<any>).result).toBe(5.0)
    expect((thread.popStack() as SuccessResult<any>).result === v1).toBe(true)
    expect(lastFrame.locals.length).toBe(0)
    expect(thread.getPC()).toBe(1)
  })
})

describe('Dup2', () => {
  test('DUP2: duplicates 2 category 1', () => {
    const v1 = new JvmObject(threadClass)
    const v2 = new JvmObject(threadClass)
    thread.pushStack(v2)
    thread.pushStack(v1)
    code.setUint8(0, OPCODE.DUP2)
    thread.runFor(1)
    const lastFrame = thread.peekStackFrame()
    expect(lastFrame.operandStack.length).toBe(4)
    expect(lastFrame.operandStack[0] === v2).toBe(true)
    expect(lastFrame.operandStack[1] === v1).toBe(true)
    expect(lastFrame.operandStack[2] === v2).toBe(true)
    expect(lastFrame.operandStack[1] === v1).toBe(true)
    expect(lastFrame.locals.length).toBe(0)
    expect(thread.getPC()).toBe(1)
  })
  test('DUP2: duplicates category 2', () => {
    thread.pushStack64(5.0)
    code.setUint8(0, OPCODE.DUP2)
    thread.runFor(1)
    const lastFrame = thread.peekStackFrame()
    expect(lastFrame.operandStack.length).toBe(4)
    expect((thread.popStack64() as SuccessResult<any>).result).toBe(5.0)
    expect((thread.popStack64() as SuccessResult<any>).result).toBe(5.0)
    expect(lastFrame.locals.length).toBe(0)
    expect(thread.getPC()).toBe(1)
  })
})

describe('Dup2X1', () => {
  test('DUP2X1: duplicates 3 category 1', () => {
    const v1 = new JvmObject(threadClass)
    const v2 = new JvmObject(threadClass)
    const v3 = new JvmObject(threadClass)
    thread.pushStack(v3)
    thread.pushStack(v2)
    thread.pushStack(v1)
    code.setUint8(0, OPCODE.DUP2_X1)
    thread.runFor(1)
    const lastFrame = thread.peekStackFrame()
    expect(lastFrame.operandStack.length).toBe(5)
    expect(lastFrame.operandStack[0] === v2).toBe(true)
    expect(lastFrame.operandStack[1] === v1).toBe(true)
    expect(lastFrame.operandStack[2] === v3).toBe(true)
    expect(lastFrame.operandStack[3] === v2).toBe(true)
    expect(lastFrame.operandStack[4] === v1).toBe(true)
    expect(lastFrame.locals.length).toBe(0)
    expect(thread.getPC()).toBe(1)
  })
  test('DUP2X1: duplicates category 2 category 1', () => {
    const v1 = new JvmObject(threadClass)
    thread.pushStack64(5.0)
    thread.pushStack(v1)
    code.setUint8(0, OPCODE.DUP2_X1)
    thread.runFor(1)
    const lastFrame = thread.peekStackFrame()
    expect(lastFrame.operandStack.length).toBe(5)
    expect((thread.popStack() as SuccessResult<any>).result).toBe(v1)
    expect((thread.popStack64() as SuccessResult<any>).result).toBe(5.0)
    expect((thread.popStack() as SuccessResult<any>).result).toBe(v1)
    expect(lastFrame.locals.length).toBe(0)
    expect(thread.getPC()).toBe(1)
  })
})

describe('Dup2X2', () => {
  test('DUP2X2: duplicates 4 category 1', () => {
    const v1 = new JvmObject(threadClass)
    const v2 = new JvmObject(threadClass)
    const v3 = new JvmObject(threadClass)
    const v4 = new JvmObject(threadClass)
    thread.pushStack(v4)
    thread.pushStack(v3)
    thread.pushStack(v2)
    thread.pushStack(v1)
    code.setUint8(0, OPCODE.DUP2_X2)
    thread.runFor(1)
    const lastFrame = thread.peekStackFrame()
    expect(lastFrame.operandStack.length).toBe(6)
    expect(lastFrame.operandStack[0] === v2).toBe(true)
    expect(lastFrame.operandStack[1] === v1).toBe(true)
    expect(lastFrame.operandStack[2] === v4).toBe(true)
    expect(lastFrame.operandStack[3] === v3).toBe(true)
    expect(lastFrame.operandStack[4] === v2).toBe(true)
    expect(lastFrame.operandStack[5] === v1).toBe(true)
    expect(lastFrame.locals.length).toBe(0)
    expect(thread.getPC()).toBe(1)
  })

  test('DUP2X2: duplicates category 1,1,2', () => {
    const v1 = new JvmObject(threadClass)
    const v2 = new JvmObject(threadClass)
    thread.pushStack(v2)
    thread.pushStack(v1)
    thread.pushStack64(5.0)
    code.setUint8(0, OPCODE.DUP2_X2)
    thread.runFor(1)
    const lastFrame = thread.peekStackFrame()
    expect(lastFrame.operandStack.length).toBe(6)
    expect((thread.popStack64() as SuccessResult<any>).result).toBe(5.0)
    expect((thread.popStack() as SuccessResult<any>).result).toBe(v1)
    expect((thread.popStack() as SuccessResult<any>).result).toBe(v2)
    expect((thread.popStack64() as SuccessResult<any>).result).toBe(5.0)
    expect(lastFrame.locals.length).toBe(0)
    expect(thread.getPC()).toBe(1)
  })

  test('DUP2X2: duplicates category 2,1,1', () => {
    const v1 = new JvmObject(threadClass)
    const v2 = new JvmObject(threadClass)
    thread.pushStack64(5.0)
    thread.pushStack(v2)
    thread.pushStack(v1)
    code.setUint8(0, OPCODE.DUP2_X2)
    thread.runFor(1)
    const lastFrame = thread.peekStackFrame()
    expect(lastFrame.operandStack.length).toBe(6)
    expect((thread.popStack() as SuccessResult<any>).result).toBe(v1)
    expect((thread.popStack() as SuccessResult<any>).result).toBe(v2)
    expect((thread.popStack64() as SuccessResult<any>).result).toBe(5.0)
    expect((thread.popStack() as SuccessResult<any>).result).toBe(v1)
    expect((thread.popStack() as SuccessResult<any>).result).toBe(v2)
    expect(lastFrame.locals.length).toBe(0)
    expect(thread.getPC()).toBe(1)
  })
  test('DUP2X2: duplicates category 2,2', () => {
    thread.pushStack64(5.0)
    thread.pushStack64(6.0)
    code.setUint8(0, OPCODE.DUP2_X2)
    thread.runFor(1)
    const lastFrame = thread.peekStackFrame()
    expect(lastFrame.operandStack.length).toBe(6)
    expect((thread.popStack64() as SuccessResult<any>).result).toBe(6.0)
    expect((thread.popStack64() as SuccessResult<any>).result).toBe(5.0)
    expect((thread.popStack64() as SuccessResult<any>).result).toBe(6.0)
    expect(lastFrame.locals.length).toBe(0)
    expect(thread.getPC()).toBe(1)
  })
})

describe('Swap', () => {
  test('SWAP: swap stack operands', () => {
    const v1 = new JvmObject(threadClass)
    const v2 = new JvmObject(threadClass)
    thread.pushStack(v1)
    thread.pushStack(v2)
    code.setUint8(0, OPCODE.SWAP)
    thread.runFor(1)
    const lastFrame = thread.peekStackFrame()
    expect(lastFrame.operandStack.length).toBe(2)
    expect((thread.popStack() as SuccessResult<any>).result).toBe(v1)
    expect((thread.popStack() as SuccessResult<any>).result).toBe(v2)
    expect(lastFrame.locals.length).toBe(0)
    expect(thread.getPC()).toBe(1)
  })
})
