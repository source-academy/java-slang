import { OPCODE } from '../../../ClassFile/constants/instructions'
import AbstractClassLoader from '../../ClassLoader/AbstractClassLoader'
import { JavaStackFrame } from '../../stackframe'
import Thread from '../../thread'
import { SuccessResult } from '../../types/Result'
import { ReferenceClassData } from '../../types/class/ClassData'
import { JvmArray } from '../../types/reference/Array'
import { JvmObject } from '../../types/reference/Object'
import { setupTest } from '../test-utils'

let thread: Thread
let threadClass: ReferenceClassData
let testLoader: AbstractClassLoader
let code: DataView

beforeEach(() => {
  const setup = setupTest()
  thread = setup.thread
  threadClass = setup.classes.threadClass
  code = setup.code
  const testClass = setup.classes.testClass
  const method = setup.method
  testLoader = setup.testLoader
  thread.invokeStackFrame(new JavaStackFrame(testClass, method, 0, []))
})

describe('ILOAD', () => {
  test('ILOAD: loads int from local variable array', () => {
    thread.peekStackFrame().locals[0] = 10
    code.setUint8(0, OPCODE.ILOAD)
    code.setUint8(1, 0)
    thread.runFor(1)

    const lastFrame = thread.peekStackFrame()
    expect(lastFrame.operandStack.length).toBe(1)
    expect(lastFrame.operandStack[0]).toBe(10)
    expect(lastFrame.locals.length).toBe(1)
    expect(thread.getPC()).toBe(2)
  })
})

describe('LLOAD', () => {
  test('LLOAD: loads long from local variable array', () => {
    thread.peekStackFrame().locals[0] = BigInt(10)
    code.setUint8(0, OPCODE.LLOAD)
    code.setUint8(1, 0)
    thread.runFor(1)

    const lastFrame = thread.peekStackFrame()
    expect(lastFrame.operandStack.length).toBe(2)
    expect(lastFrame.operandStack[0]).toBe(BigInt(10))
    expect(lastFrame.locals.length).toBe(1)
    expect(thread.getPC()).toBe(2)
  })
})

describe('FLOAD', () => {
  test('FLOAD: loads float from local variable array', () => {
    thread.peekStackFrame().locals[0] = 1.3
    code.setUint8(0, OPCODE.FLOAD)
    code.setUint8(1, 0)
    thread.runFor(1)

    const lastFrame = thread.peekStackFrame()
    expect(lastFrame.operandStack.length).toBe(1)
    expect(lastFrame.operandStack[0]).toBe(1.3)
    expect(lastFrame.locals.length).toBe(1)
    expect(thread.getPC()).toBe(2)
  })
})

describe('DLOAD', () => {
  test('DLOAD: loads double from local variable array', () => {
    thread.peekStackFrame().locals[0] = 1.3
    code.setUint8(0, OPCODE.DLOAD)
    code.setUint8(1, 0)
    thread.runFor(1)

    const lastFrame = thread.peekStackFrame()
    expect(lastFrame.operandStack.length).toBe(2)
    expect(lastFrame.operandStack[0]).toBe(1.3)
    expect(lastFrame.locals.length).toBe(1)
    expect(thread.getPC()).toBe(2)
  })
})

describe('ALOAD', () => {
  test('ALOAD: loads reference from local variable array', () => {
    const obj = new JvmObject(threadClass)
    thread.peekStackFrame().locals[0] = obj
    code.setUint8(0, OPCODE.ALOAD)
    code.setUint8(1, 0)
    thread.runFor(1)

    const lastFrame = thread.peekStackFrame()
    expect(lastFrame.operandStack.length).toBe(1)
    expect(lastFrame.operandStack[0]).toBe(obj)
    expect(lastFrame.locals.length).toBe(1)
    expect(thread.getPC()).toBe(2)
  })
})

describe('ILOAD_0', () => {
  test('ILOAD_0: loads int from local variable array', () => {
    thread.peekStackFrame().locals[0] = 10
    thread.peekStackFrame().locals[1] = 11
    thread.peekStackFrame().locals[2] = 12
    thread.peekStackFrame().locals[3] = 13
    code.setUint8(0, OPCODE.ILOAD_0)
    thread.runFor(1)

    const lastFrame = thread.peekStackFrame()
    expect(lastFrame.operandStack.length).toBe(1)
    expect(lastFrame.operandStack[0]).toBe(10)
    expect(lastFrame.locals.length).toBe(4)
    expect(thread.getPC()).toBe(1)
  })
})

describe('ILOAD_1', () => {
  test('ILOAD_1: loads int from local variable array', () => {
    thread.peekStackFrame().locals[0] = 10
    thread.peekStackFrame().locals[1] = 11
    thread.peekStackFrame().locals[2] = 12
    thread.peekStackFrame().locals[3] = 13
    code.setUint8(0, OPCODE.ILOAD_1)
    thread.runFor(1)

    const lastFrame = thread.peekStackFrame()
    expect(lastFrame.operandStack.length).toBe(1)
    expect(lastFrame.operandStack[0]).toBe(11)
    expect(lastFrame.locals.length).toBe(4)
    expect(thread.getPC()).toBe(1)
  })
})

describe('ILOAD_2', () => {
  test('ILOAD_2: loads int from local variable array', () => {
    thread.peekStackFrame().locals[0] = 10
    thread.peekStackFrame().locals[1] = 11
    thread.peekStackFrame().locals[2] = 12
    thread.peekStackFrame().locals[3] = 13
    code.setUint8(0, OPCODE.ILOAD_2)
    thread.runFor(1)
    const lastFrame = thread.peekStackFrame()
    expect(lastFrame.operandStack.length).toBe(1)
    expect(lastFrame.operandStack[0]).toBe(12)
    expect(lastFrame.locals.length).toBe(4)
    expect(thread.getPC()).toBe(1)
  })
})

describe('ILOAD_3', () => {
  test('ILOAD_3: loads int from local variable array', () => {
    thread.peekStackFrame().locals[0] = 10
    thread.peekStackFrame().locals[1] = 11
    thread.peekStackFrame().locals[2] = 12
    thread.peekStackFrame().locals[3] = 13
    code.setUint8(0, OPCODE.ILOAD_3)
    thread.runFor(1)
    const lastFrame = thread.peekStackFrame()
    expect(lastFrame.operandStack.length).toBe(1)
    expect(lastFrame.operandStack[0]).toBe(13)
    expect(lastFrame.locals.length).toBe(4)
    expect(thread.getPC()).toBe(1)
  })
})

describe('LLOAD_0', () => {
  test('LLOAD_0: loads long from local variable array', () => {
    thread.peekStackFrame().locals[0] = BigInt(10)
    thread.peekStackFrame().locals[1] = BigInt(11)
    thread.peekStackFrame().locals[2] = BigInt(12)
    thread.peekStackFrame().locals[3] = BigInt(13)
    code.setUint8(0, OPCODE.LLOAD_0)
    thread.runFor(1)
    const lastFrame = thread.peekStackFrame()
    expect(lastFrame.operandStack.length).toBe(2)
    expect(lastFrame.operandStack[0]).toBe(BigInt(10))
    expect(lastFrame.locals.length).toBe(4)
    expect(thread.getPC()).toBe(1)
  })
})

describe('LLOAD_1', () => {
  test('LLOAD_1: loads long from local variable array', () => {
    thread.peekStackFrame().locals[0] = BigInt(10)
    thread.peekStackFrame().locals[1] = BigInt(11)
    thread.peekStackFrame().locals[2] = BigInt(12)
    thread.peekStackFrame().locals[3] = BigInt(13)
    code.setUint8(0, OPCODE.LLOAD_1)
    thread.runFor(1)
    const lastFrame = thread.peekStackFrame()
    expect(lastFrame.operandStack.length).toBe(2)
    expect(lastFrame.operandStack[0]).toBe(BigInt(11))
    expect(lastFrame.locals.length).toBe(4)
    expect(thread.getPC()).toBe(1)
  })
})

describe('LLOAD_2', () => {
  test('LLOAD_2: loads long from local variable array', () => {
    thread.peekStackFrame().locals[0] = BigInt(10)
    thread.peekStackFrame().locals[1] = BigInt(11)
    thread.peekStackFrame().locals[2] = BigInt(12)
    thread.peekStackFrame().locals[3] = BigInt(13)
    code.setUint8(0, OPCODE.LLOAD_2)
    thread.runFor(1)
    const lastFrame = thread.peekStackFrame()
    expect(lastFrame.operandStack.length).toBe(2)
    expect(lastFrame.operandStack[0]).toBe(BigInt(12))
    expect(lastFrame.locals.length).toBe(4)
    expect(thread.getPC()).toBe(1)
  })
})

describe('LLOAD_3', () => {
  test('LLOAD_3: loads long from local variable array', () => {
    thread.peekStackFrame().locals[0] = BigInt(10)
    thread.peekStackFrame().locals[1] = BigInt(11)
    thread.peekStackFrame().locals[2] = BigInt(12)
    thread.peekStackFrame().locals[3] = BigInt(13)
    code.setUint8(0, OPCODE.LLOAD_3)
    thread.runFor(1)
    const lastFrame = thread.peekStackFrame()
    expect(lastFrame.operandStack.length).toBe(2)
    expect(lastFrame.operandStack[0]).toBe(BigInt(13))
    expect(lastFrame.locals.length).toBe(4)
    expect(thread.getPC()).toBe(1)
  })
})

describe('FLOAD_0', () => {
  test('FLOAD_0: loads float from local variable array', () => {
    thread.peekStackFrame().locals[0] = 10.0
    thread.peekStackFrame().locals[1] = 11.0
    thread.peekStackFrame().locals[2] = 12.0
    thread.peekStackFrame().locals[3] = 13.0
    code.setUint8(0, OPCODE.FLOAD_0)
    thread.runFor(1)
    const lastFrame = thread.peekStackFrame()
    expect(lastFrame.operandStack.length).toBe(1)
    expect(lastFrame.operandStack[0]).toBe(10.0)
    expect(lastFrame.locals.length).toBe(4)
    expect(thread.getPC()).toBe(1)
  })
})

describe('FLOAD_1', () => {
  test('FLOAD_1: loads float from local variable array', () => {
    thread.peekStackFrame().locals[0] = 10.0
    thread.peekStackFrame().locals[1] = 11.0
    thread.peekStackFrame().locals[2] = 12.0
    thread.peekStackFrame().locals[3] = 13.0
    code.setUint8(0, OPCODE.FLOAD_1)
    thread.runFor(1)
    const lastFrame = thread.peekStackFrame()
    expect(lastFrame.operandStack.length).toBe(1)
    expect(lastFrame.operandStack[0]).toBe(11.0)
    expect(lastFrame.locals.length).toBe(4)
    expect(thread.getPC()).toBe(1)
  })
})

describe('FLOAD_2', () => {
  test('FLOAD_2: loads float from local variable array', () => {
    thread.peekStackFrame().locals[0] = 10.0
    thread.peekStackFrame().locals[1] = 11.0
    thread.peekStackFrame().locals[2] = 12.0
    thread.peekStackFrame().locals[3] = 13.0
    code.setUint8(0, OPCODE.FLOAD_2)
    thread.runFor(1)
    const lastFrame = thread.peekStackFrame()
    expect(lastFrame.operandStack.length).toBe(1)
    expect(lastFrame.operandStack[0]).toBe(12.0)
    expect(lastFrame.locals.length).toBe(4)
    expect(thread.getPC()).toBe(1)
  })
})

describe('FLOAD_3', () => {
  test('FLOAD_3: loads float from local variable array', () => {
    thread.peekStackFrame().locals[0] = 10.0
    thread.peekStackFrame().locals[1] = 11.0
    thread.peekStackFrame().locals[2] = 12.0
    thread.peekStackFrame().locals[3] = 13.0
    code.setUint8(0, OPCODE.FLOAD_3)
    thread.runFor(1)
    const lastFrame = thread.peekStackFrame()
    expect(lastFrame.operandStack.length).toBe(1)
    expect(lastFrame.operandStack[0]).toBe(13.0)
    expect(lastFrame.locals.length).toBe(4)
    expect(thread.getPC()).toBe(1)
  })
})

describe('DLOAD_0', () => {
  test('DLOAD_0: loads double from local variable array', () => {
    thread.peekStackFrame().locals[0] = 10.0
    thread.peekStackFrame().locals[1] = 11.0
    thread.peekStackFrame().locals[2] = 12.0
    thread.peekStackFrame().locals[3] = 13.0
    code.setUint8(0, OPCODE.DLOAD_0)
    thread.runFor(1)
    const lastFrame = thread.peekStackFrame()
    expect(lastFrame.operandStack.length).toBe(2)
    expect(lastFrame.operandStack[0]).toBe(10.0)
    expect(lastFrame.locals.length).toBe(4)
    expect(thread.getPC()).toBe(1)
  })
})

describe('DLOAD_1', () => {
  test('DLOAD_1: loads double from local variable array', () => {
    thread.peekStackFrame().locals[0] = 10.0
    thread.peekStackFrame().locals[1] = 11.0
    thread.peekStackFrame().locals[2] = 12.0
    thread.peekStackFrame().locals[3] = 13.0
    code.setUint8(0, OPCODE.DLOAD_1)
    thread.runFor(1)
    const lastFrame = thread.peekStackFrame()
    expect(lastFrame.operandStack.length).toBe(2)
    expect(lastFrame.operandStack[0]).toBe(11.0)
    expect(lastFrame.locals.length).toBe(4)
    expect(thread.getPC()).toBe(1)
  })
})

describe('DLOAD_2', () => {
  test('DLOAD_2: loads double from local variable array', () => {
    thread.peekStackFrame().locals[0] = 10.0
    thread.peekStackFrame().locals[1] = 11.0
    thread.peekStackFrame().locals[2] = 12.0
    thread.peekStackFrame().locals[3] = 13.0
    code.setUint8(0, OPCODE.DLOAD_2)
    thread.runFor(1)
    const lastFrame = thread.peekStackFrame()
    expect(lastFrame.operandStack.length).toBe(2)
    expect(lastFrame.operandStack[0]).toBe(12.0)
    expect(lastFrame.locals.length).toBe(4)
    expect(thread.getPC()).toBe(1)
  })
})

describe('DLOAD_3', () => {
  test('DLOAD_3: loads double from local variable array', () => {
    thread.peekStackFrame().locals[0] = 10.0
    thread.peekStackFrame().locals[1] = 11.0
    thread.peekStackFrame().locals[2] = 12.0
    thread.peekStackFrame().locals[3] = 13.0
    code.setUint8(0, OPCODE.DLOAD_3)
    thread.runFor(1)
    const lastFrame = thread.peekStackFrame()
    expect(lastFrame.operandStack.length).toBe(2)
    expect(lastFrame.operandStack[0]).toBe(13.0)
    expect(lastFrame.locals.length).toBe(4)
    expect(thread.getPC()).toBe(1)
  })
})

describe('ALOAD_0', () => {
  test('ALOAD_0: loads reference from local variable array', () => {
    const l0 = new JvmObject(threadClass)
    const l1 = new JvmObject(threadClass)
    const l2 = new JvmObject(threadClass)
    const l3 = new JvmObject(threadClass)
    thread.peekStackFrame().locals[0] = l0
    thread.peekStackFrame().locals[1] = l1
    thread.peekStackFrame().locals[2] = l2
    thread.peekStackFrame().locals[3] = l3
    code.setUint8(0, OPCODE.ALOAD_0)
    thread.runFor(1)
    const lastFrame = thread.peekStackFrame()
    expect(lastFrame.operandStack.length).toBe(1)
    expect(lastFrame.operandStack[0]).toBe(l0)
    expect(lastFrame.locals.length).toBe(4)
    expect(thread.getPC()).toBe(1)
  })
})

describe('ALOAD_1', () => {
  test('ALOAD_1: loads reference from local variable array', () => {
    const l0 = new JvmObject(threadClass)
    const l1 = new JvmObject(threadClass)
    const l2 = new JvmObject(threadClass)
    const l3 = new JvmObject(threadClass)
    thread.peekStackFrame().locals[0] = l0
    thread.peekStackFrame().locals[1] = l1
    thread.peekStackFrame().locals[2] = l2
    thread.peekStackFrame().locals[3] = l3
    code.setUint8(0, OPCODE.ALOAD_1)
    thread.runFor(1)
    const lastFrame = thread.peekStackFrame()
    expect(lastFrame.operandStack.length).toBe(1)
    expect(lastFrame.operandStack[0]).toBe(l1)
    expect(lastFrame.locals.length).toBe(4)
    expect(thread.getPC()).toBe(1)
  })
})

describe('ALOAD_2', () => {
  test('ALOAD_2: loads reference from local variable array', () => {
    const l0 = new JvmObject(threadClass)
    const l1 = new JvmObject(threadClass)
    const l2 = new JvmObject(threadClass)
    const l3 = new JvmObject(threadClass)
    thread.peekStackFrame().locals[0] = l0
    thread.peekStackFrame().locals[1] = l1
    thread.peekStackFrame().locals[2] = l2
    thread.peekStackFrame().locals[3] = l3
    code.setUint8(0, OPCODE.ALOAD_2)
    thread.runFor(1)
    const lastFrame = thread.peekStackFrame()
    expect(lastFrame.operandStack.length).toBe(1)
    expect(lastFrame.operandStack[0]).toBe(l2)
    expect(lastFrame.locals.length).toBe(4)
    expect(thread.getPC()).toBe(1)
  })
})

describe('ALOAD_3', () => {
  test('ALOAD_3: loads reference from local variable array', () => {
    const l0 = new JvmObject(threadClass)
    const l1 = new JvmObject(threadClass)
    const l2 = new JvmObject(threadClass)
    const l3 = new JvmObject(threadClass)
    thread.peekStackFrame().locals[0] = l0
    thread.peekStackFrame().locals[1] = l1
    thread.peekStackFrame().locals[2] = l2
    thread.peekStackFrame().locals[3] = l3
    code.setUint8(0, OPCODE.ALOAD_3)
    thread.runFor(1)
    const lastFrame = thread.peekStackFrame()
    expect(lastFrame.operandStack.length).toBe(1)
    expect(lastFrame.operandStack[0]).toBe(l3)
    expect(lastFrame.locals.length).toBe(4)
    expect(thread.getPC()).toBe(1)
  })
})

describe('IALOAD', () => {
  test('IALOAD: loads int from array', () => {
    const arrCls = (testLoader.getClass('[I') as SuccessResult<ReferenceClassData>).result
    const arrayRef = arrCls.instantiate() as JvmArray
    arrayRef.initialize(thread, 1, [99])
    thread.pushStack(arrayRef)
    thread.pushStack(0)
    code.setUint8(0, OPCODE.IALOAD)
    thread.runFor(1)
    const lastFrame = thread.peekStackFrame()
    expect(lastFrame.operandStack.length).toBe(1)
    expect(lastFrame.operandStack[0]).toBe(99)
    expect(lastFrame.locals.length).toBe(0)
    expect(thread.getPC()).toBe(1)
  })

  test('IALOAD: null array throws NullPointerException', () => {
    const arrayRef = null
    thread.pushStack(arrayRef)
    thread.pushStack(0)
    code.setUint8(0, OPCODE.IALOAD)
    thread.runFor(1)
    const lastFrame = thread.peekStackFrame()
    expect(lastFrame.class === threadClass).toBe(true)
    expect(thread.getPC()).toBe(0)

    const exceptionObj = lastFrame.locals[1] as JvmObject
    expect(exceptionObj.getClass().getName()).toBe('java/lang/NullPointerException')
  })

  test('IALOAD: high index OOB throws ArrayIndexOutOfBoundsException', () => {
    const arrCls = (testLoader.getClass('[I') as SuccessResult<ReferenceClassData>).result
    const arrayRef = arrCls.instantiate() as JvmArray
    arrayRef.initialize(thread, 1, [99])
    thread.pushStack(arrayRef)
    thread.pushStack(1)
    code.setUint8(0, OPCODE.IALOAD)
    thread.runFor(1)
    const lastFrame = thread.peekStackFrame()
    expect(lastFrame.class === threadClass).toBe(true)
    expect(lastFrame.method).toBe(
      threadClass.getMethod('dispatchUncaughtException(Ljava/lang/Throwable;)V')
    )
    expect(thread.getPC()).toBe(0)

    const exceptionObj = lastFrame.locals[1] as JvmObject
    expect(exceptionObj.getClass().getName()).toBe('java/lang/ArrayIndexOutOfBoundsException')
  })

  test('IALOAD: low index OOB throws ArrayIndexOutOfBoundsException', () => {
    const arrCls = (testLoader.getClass('[I') as SuccessResult<ReferenceClassData>).result
    const arrayRef = arrCls.instantiate() as JvmArray
    arrayRef.initialize(thread, 1, [99])
    thread.pushStack(arrayRef)
    thread.pushStack(-1)
    code.setUint8(0, OPCODE.IALOAD)
    thread.runFor(1)
    const lastFrame = thread.peekStackFrame()
    expect(lastFrame.class === threadClass).toBe(true)
    expect(lastFrame.method).toBe(
      threadClass.getMethod('dispatchUncaughtException(Ljava/lang/Throwable;)V')
    )
    expect(thread.getPC()).toBe(0)

    const exceptionObj = lastFrame.locals[1] as JvmObject
    expect(exceptionObj.getClass().getName()).toBe('java/lang/ArrayIndexOutOfBoundsException')
  })
})

describe('LALOAD', () => {
  test('LALOAD: loads long from array', () => {
    const arrCls = (testLoader.getClass('[J') as SuccessResult<ReferenceClassData>).result
    const arrayRef = arrCls.instantiate() as JvmArray
    arrayRef.initialize(thread, 1, [BigInt(99)])
    thread.pushStack(arrayRef)
    thread.pushStack(0)
    code.setUint8(0, OPCODE.LALOAD)
    thread.runFor(1)
    const lastFrame = thread.peekStackFrame()
    expect(lastFrame.operandStack.length).toBe(2)
    expect(lastFrame.operandStack[0]).toBe(BigInt(99))
    expect(lastFrame.locals.length).toBe(0)
    expect(thread.getPC()).toBe(1)
  })

  test('LALOAD: null array throws NullPointerException', () => {
    const arrayRef = null
    thread.pushStack(arrayRef)
    thread.pushStack(0)
    code.setUint8(0, OPCODE.LALOAD)
    thread.runFor(1)
    const lastFrame = thread.peekStackFrame()
    expect(lastFrame.class === threadClass).toBe(true)
    expect(thread.getPC()).toBe(0)

    const exceptionObj = lastFrame.locals[1] as JvmObject
    expect(exceptionObj.getClass().getName()).toBe('java/lang/NullPointerException')
  })

  test('LALOAD: high index OOB throws ArrayIndexOutOfBoundsException', () => {
    const arrCls = (testLoader.getClass('[J') as SuccessResult<ReferenceClassData>).result
    const arrayRef = arrCls.instantiate() as JvmArray
    arrayRef.initialize(thread, 1, [BigInt(99)])
    thread.pushStack(arrayRef)
    thread.pushStack(1)
    code.setUint8(0, OPCODE.LALOAD)
    thread.runFor(1)
    const lastFrame = thread.peekStackFrame()
    expect(lastFrame.class === threadClass).toBe(true)
    expect(lastFrame.method).toBe(
      threadClass.getMethod('dispatchUncaughtException(Ljava/lang/Throwable;)V')
    )
    expect(thread.getPC()).toBe(0)
    const exceptionObj = lastFrame.locals[1] as JvmObject
    expect(exceptionObj.getClass().getName()).toBe('java/lang/ArrayIndexOutOfBoundsException')
  })

  test('LALOAD: low index OOB throws ArrayIndexOutOfBoundsException', () => {
    const arrCls = (testLoader.getClass('[J') as SuccessResult<ReferenceClassData>).result
    const arrayRef = arrCls.instantiate() as JvmArray
    arrayRef.initialize(thread, 1, [BigInt(99)])
    thread.pushStack(arrayRef)
    thread.pushStack(-1)
    code.setUint8(0, OPCODE.LALOAD)
    thread.runFor(1)
    const lastFrame = thread.peekStackFrame()
    expect(lastFrame.class === threadClass).toBe(true)
    expect(lastFrame.method).toBe(
      threadClass.getMethod('dispatchUncaughtException(Ljava/lang/Throwable;)V')
    )
    expect(thread.getPC()).toBe(0)
    const exceptionObj = lastFrame.locals[1] as JvmObject
    expect(exceptionObj.getClass().getName()).toBe('java/lang/ArrayIndexOutOfBoundsException')
  })
})

describe('FALOAD', () => {
  test('FALOAD: loads float from array', () => {
    const arrCls = (testLoader.getClass('[F') as SuccessResult<ReferenceClassData>).result
    const arrayRef = arrCls.instantiate() as JvmArray
    arrayRef.initialize(thread, 1, [99.0])
    thread.pushStack(arrayRef)
    thread.pushStack(0)
    code.setUint8(0, OPCODE.FALOAD)
    thread.runFor(1)
    const lastFrame = thread.peekStackFrame()
    expect(lastFrame.operandStack.length).toBe(1)
    expect(lastFrame.operandStack[0]).toBe(99.0)
    expect(lastFrame.locals.length).toBe(0)
    expect(thread.getPC()).toBe(1)
  })

  test('FALOAD: null array throws NullPointerException', () => {
    const arrayRef = null
    thread.pushStack(arrayRef)
    thread.pushStack(0)
    code.setUint8(0, OPCODE.FALOAD)
    thread.runFor(1)
    const lastFrame = thread.peekStackFrame()
    expect(lastFrame.class === threadClass).toBe(true)
    expect(thread.getPC()).toBe(0)

    const exceptionObj = lastFrame.locals[1] as JvmObject
    expect(exceptionObj.getClass().getName()).toBe('java/lang/NullPointerException')
  })

  test('FALOAD: high index OOB throws ArrayIndexOutOfBoundsException', () => {
    const arrCls = (testLoader.getClass('[F') as SuccessResult<ReferenceClassData>).result
    const arrayRef = arrCls.instantiate() as JvmArray
    arrayRef.initialize(thread, 1, [99.0])
    thread.pushStack(arrayRef)
    thread.pushStack(1)
    code.setUint8(0, OPCODE.FALOAD)
    thread.runFor(1)
    const lastFrame = thread.peekStackFrame()
    expect(lastFrame.class === threadClass).toBe(true)
    expect(lastFrame.method).toBe(
      threadClass.getMethod('dispatchUncaughtException(Ljava/lang/Throwable;)V')
    )
    expect(thread.getPC()).toBe(0)
    const exceptionObj = lastFrame.locals[1] as JvmObject
    expect(exceptionObj.getClass().getName()).toBe('java/lang/ArrayIndexOutOfBoundsException')
  })

  test('FALOAD: low index OOB throws ArrayIndexOutOfBoundsException', () => {
    const arrCls = (testLoader.getClass('[F') as SuccessResult<ReferenceClassData>).result
    const arrayRef = arrCls.instantiate() as JvmArray
    arrayRef.initialize(thread, 1, [99.0])
    thread.pushStack(arrayRef)
    thread.pushStack(-1)
    code.setUint8(0, OPCODE.FALOAD)
    thread.runFor(1)
    const lastFrame = thread.peekStackFrame()
    expect(lastFrame.class === threadClass).toBe(true)
    expect(lastFrame.method).toBe(
      threadClass.getMethod('dispatchUncaughtException(Ljava/lang/Throwable;)V')
    )
    expect(thread.getPC()).toBe(0)
    const exceptionObj = lastFrame.locals[1] as JvmObject
    expect(exceptionObj.getClass().getName()).toBe('java/lang/ArrayIndexOutOfBoundsException')
  })
})

describe('DALOAD', () => {
  test('DALOAD: loads float from array', () => {
    const arrCls = (testLoader.getClass('[F') as SuccessResult<ReferenceClassData>).result
    const arrayRef = arrCls.instantiate() as JvmArray
    arrayRef.initialize(thread, 1, [99.0])
    thread.pushStack(arrayRef)
    thread.pushStack(0)
    code.setUint8(0, OPCODE.DALOAD)
    thread.runFor(1)
    const lastFrame = thread.peekStackFrame()
    expect(lastFrame.operandStack.length).toBe(2)
    expect(lastFrame.operandStack[0]).toBe(99.0)
    expect(lastFrame.locals.length).toBe(0)
    expect(thread.getPC()).toBe(1)
  })

  test('DALOAD: null array throws NullPointerException', () => {
    const arrayRef = null
    thread.pushStack(arrayRef)
    thread.pushStack(0)
    code.setUint8(0, OPCODE.DALOAD)
    thread.runFor(1)
    const lastFrame = thread.peekStackFrame()
    expect(lastFrame.class === threadClass).toBe(true)
    expect(thread.getPC()).toBe(0)

    const exceptionObj = lastFrame.locals[1] as JvmObject
    expect(exceptionObj.getClass().getName()).toBe('java/lang/NullPointerException')
  })

  test('DALOAD: high index OOB throws ArrayIndexOutOfBoundsException', () => {
    const arrCls = (testLoader.getClass('[F') as SuccessResult<ReferenceClassData>).result
    const arrayRef = arrCls.instantiate() as JvmArray
    arrayRef.initialize(thread, 1, [99.0])
    thread.pushStack(arrayRef)
    thread.pushStack(1)
    code.setUint8(0, OPCODE.DALOAD)
    thread.runFor(1)
    const lastFrame = thread.peekStackFrame()
    expect(lastFrame.class === threadClass).toBe(true)
    expect(lastFrame.method).toBe(
      threadClass.getMethod('dispatchUncaughtException(Ljava/lang/Throwable;)V')
    )
    expect(thread.getPC()).toBe(0)
    const exceptionObj = lastFrame.locals[1] as JvmObject
    expect(exceptionObj.getClass().getName()).toBe('java/lang/ArrayIndexOutOfBoundsException')
  })

  test('DALOAD: low index OOB throws ArrayIndexOutOfBoundsException', () => {
    const arrCls = (testLoader.getClass('[F') as SuccessResult<ReferenceClassData>).result
    const arrayRef = arrCls.instantiate() as JvmArray
    arrayRef.initialize(thread, 1, [99.0])
    thread.pushStack(arrayRef)
    thread.pushStack(-1)
    code.setUint8(0, OPCODE.DALOAD)
    thread.runFor(1)
    const lastFrame = thread.peekStackFrame()
    expect(lastFrame.class === threadClass).toBe(true)
    expect(lastFrame.method).toBe(
      threadClass.getMethod('dispatchUncaughtException(Ljava/lang/Throwable;)V')
    )
    expect(thread.getPC()).toBe(0)
    const exceptionObj = lastFrame.locals[1] as JvmObject
    expect(exceptionObj.getClass().getName()).toBe('java/lang/ArrayIndexOutOfBoundsException')
  })
})

describe('AALOAD', () => {
  test('AALOAD: loads ref from array', () => {
    const arrCls = (testLoader.getClass('[Ljava/lang/Thread;') as SuccessResult<ReferenceClassData>)
      .result
    const arrayRef = arrCls.instantiate() as JvmArray
    arrayRef.initialize(thread, 1, [null])
    thread.pushStack(arrayRef)
    thread.pushStack(0)
    code.setUint8(0, OPCODE.AALOAD)
    thread.runFor(1)
    const lastFrame = thread.peekStackFrame()
    expect(lastFrame.operandStack.length).toBe(1)
    expect(lastFrame.operandStack[0]).toBe(null)
    expect(lastFrame.locals.length).toBe(0)
    expect(thread.getPC()).toBe(1)
  })

  test('AALOAD: loads arrayref from array', () => {
    const iarrCls = (
      testLoader.getClass('[Ljava/lang/Thread;') as SuccessResult<ReferenceClassData>
    ).result
    const iarrayRef = iarrCls.instantiate() as JvmArray
    iarrayRef.initialize(thread, 1, [null])
    const arrCls = (
      testLoader.getClass('[[Ljava/lang/Thread;') as SuccessResult<ReferenceClassData>
    ).result
    const arrayRef = arrCls.instantiate() as JvmArray
    arrayRef.initialize(thread, 1, [iarrayRef])
    thread.pushStack(arrayRef)
    thread.pushStack(0)
    code.setUint8(0, OPCODE.AALOAD)
    thread.runFor(1)
    const lastFrame = thread.peekStackFrame()
    expect(lastFrame.operandStack.length).toBe(1)
    expect(lastFrame.operandStack[0] === iarrayRef).toBe(true)
    expect(lastFrame.locals.length).toBe(0)
    expect(thread.getPC()).toBe(1)
  })

  test('AALOAD: null array throws NullPointerException', () => {
    const arrayRef = null
    thread.pushStack(arrayRef)
    thread.pushStack(0)
    code.setUint8(0, OPCODE.AALOAD)
    thread.runFor(1)
    const lastFrame = thread.peekStackFrame()
    expect(lastFrame.class === threadClass).toBe(true)
    expect(thread.getPC()).toBe(0)

    const exceptionObj = lastFrame.locals[1] as JvmObject
    expect(exceptionObj.getClass().getName()).toBe('java/lang/NullPointerException')
  })

  test('AALOAD: high index OOB throws ArrayIndexOutOfBoundsException', () => {
    const arrCls = (testLoader.getClass('[Ljava/lang/Thread;') as SuccessResult<ReferenceClassData>)
      .result
    const arrayRef = arrCls.instantiate() as JvmArray
    arrayRef.initialize(thread, 1, [99])
    thread.pushStack(arrayRef)
    thread.pushStack(1)
    code.setUint8(0, OPCODE.AALOAD)
    thread.runFor(1)
    const lastFrame = thread.peekStackFrame()
    expect(lastFrame.class === threadClass).toBe(true)
    expect(lastFrame.method).toBe(
      threadClass.getMethod('dispatchUncaughtException(Ljava/lang/Throwable;)V')
    )
    expect(thread.getPC()).toBe(0)

    const exceptionObj = lastFrame.locals[1] as JvmObject
    expect(exceptionObj.getClass().getName()).toBe('java/lang/ArrayIndexOutOfBoundsException')
  })

  test('AALOAD: low index OOB throws ArrayIndexOutOfBoundsException', () => {
    const arrCls = (testLoader.getClass('[Ljava/lang/Thread;') as SuccessResult<ReferenceClassData>)
      .result
    const arrayRef = arrCls.instantiate() as JvmArray
    arrayRef.initialize(thread, 1, [99])
    thread.pushStack(arrayRef)
    thread.pushStack(-1)
    code.setUint8(0, OPCODE.AALOAD)
    thread.runFor(1)
    const lastFrame = thread.peekStackFrame()
    expect(lastFrame.class === threadClass).toBe(true)
    expect(lastFrame.method).toBe(
      threadClass.getMethod('dispatchUncaughtException(Ljava/lang/Throwable;)V')
    )
    expect(thread.getPC()).toBe(0)

    const exceptionObj = lastFrame.locals[1] as JvmObject
    expect(exceptionObj.getClass().getName()).toBe('java/lang/ArrayIndexOutOfBoundsException')
  })
})

describe('BALOAD', () => {
  test('BALOAD: loads boolean from array', () => {
    const arrCls = (testLoader.getClass('[Z') as SuccessResult<ReferenceClassData>).result
    const arrayRef = arrCls.instantiate() as JvmArray
    arrayRef.initialize(thread, 1, [99])
    thread.pushStack(arrayRef)
    thread.pushStack(0)
    code.setUint8(0, OPCODE.BALOAD)
    thread.runFor(1)
    const lastFrame = thread.peekStackFrame()
    expect(lastFrame.operandStack.length).toBe(1)
    expect(lastFrame.operandStack[0]).toBe(99)
    expect(lastFrame.locals.length).toBe(0)
    expect(thread.getPC()).toBe(1)
  })

  test('BALOAD: null array throws NullPointerException', () => {
    const arrayRef = null
    thread.pushStack(arrayRef)
    thread.pushStack(0)
    code.setUint8(0, OPCODE.BALOAD)
    thread.runFor(1)
    const lastFrame = thread.peekStackFrame()
    expect(lastFrame.class === threadClass).toBe(true)
    expect(thread.getPC()).toBe(0)

    const exceptionObj = lastFrame.locals[1] as JvmObject
    expect(exceptionObj.getClass().getName()).toBe('java/lang/NullPointerException')
  })

  test('BALOAD: high index OOB throws ArrayIndexOutOfBoundsException', () => {
    const arrCls = (testLoader.getClass('[Z') as SuccessResult<ReferenceClassData>).result
    const arrayRef = arrCls.instantiate() as JvmArray
    arrayRef.initialize(thread, 1, [99])
    thread.pushStack(arrayRef)
    thread.pushStack(1)
    code.setUint8(0, OPCODE.BALOAD)
    thread.runFor(1)
    const lastFrame = thread.peekStackFrame()
    expect(lastFrame.class === threadClass).toBe(true)
    expect(lastFrame.method).toBe(
      threadClass.getMethod('dispatchUncaughtException(Ljava/lang/Throwable;)V')
    )
    expect(thread.getPC()).toBe(0)

    const exceptionObj = lastFrame.locals[1] as JvmObject
    expect(exceptionObj.getClass().getName()).toBe('java/lang/ArrayIndexOutOfBoundsException')
  })

  test('BALOAD: low index OOB throws ArrayIndexOutOfBoundsException', () => {
    const arrCls = (testLoader.getClass('[Z') as SuccessResult<ReferenceClassData>).result
    const arrayRef = arrCls.instantiate() as JvmArray
    arrayRef.initialize(thread, 1, [99])
    thread.pushStack(arrayRef)
    thread.pushStack(-1)
    code.setUint8(0, OPCODE.BALOAD)
    thread.runFor(1)
    const lastFrame = thread.peekStackFrame()
    expect(lastFrame.class === threadClass).toBe(true)
    expect(lastFrame.method).toBe(
      threadClass.getMethod('dispatchUncaughtException(Ljava/lang/Throwable;)V')
    )
    expect(thread.getPC()).toBe(0)

    const exceptionObj = lastFrame.locals[1] as JvmObject
    expect(exceptionObj.getClass().getName()).toBe('java/lang/ArrayIndexOutOfBoundsException')
  })
})

describe('CALOAD', () => {
  test('CALOAD: loads char from array', () => {
    const arrCls = (testLoader.getClass('[C') as SuccessResult<ReferenceClassData>).result
    const arrayRef = arrCls.instantiate() as JvmArray
    arrayRef.initialize(thread, 1, [99])
    thread.pushStack(arrayRef)
    thread.pushStack(0)
    code.setUint8(0, OPCODE.CALOAD)
    thread.runFor(1)
    const lastFrame = thread.peekStackFrame()
    expect(lastFrame.operandStack.length).toBe(1)
    expect(lastFrame.operandStack[0]).toBe(99)
    expect(lastFrame.locals.length).toBe(0)
    expect(thread.getPC()).toBe(1)
  })

  test('CALOAD: null array throws NullPointerException', () => {
    const arrayRef = null
    thread.pushStack(arrayRef)
    thread.pushStack(0)
    code.setUint8(0, OPCODE.CALOAD)
    thread.runFor(1)
    const lastFrame = thread.peekStackFrame()
    expect(lastFrame.class === threadClass).toBe(true)
    expect(thread.getPC()).toBe(0)

    const exceptionObj = lastFrame.locals[1] as JvmObject
    expect(exceptionObj.getClass().getName()).toBe('java/lang/NullPointerException')
  })

  test('CALOAD: high index OOB throws ArrayIndexOutOfBoundsException', () => {
    const arrCls = (testLoader.getClass('[C') as SuccessResult<ReferenceClassData>).result
    const arrayRef = arrCls.instantiate() as JvmArray
    arrayRef.initialize(thread, 1, [99])
    thread.pushStack(arrayRef)
    thread.pushStack(1)
    code.setUint8(0, OPCODE.CALOAD)
    thread.runFor(1)
    const lastFrame = thread.peekStackFrame()
    expect(lastFrame.class === threadClass).toBe(true)
    expect(lastFrame.method).toBe(
      threadClass.getMethod('dispatchUncaughtException(Ljava/lang/Throwable;)V')
    )
    expect(thread.getPC()).toBe(0)

    const exceptionObj = lastFrame.locals[1] as JvmObject
    expect(exceptionObj.getClass().getName()).toBe('java/lang/ArrayIndexOutOfBoundsException')
  })

  test('CALOAD: low index OOB throws ArrayIndexOutOfBoundsException', () => {
    const arrCls = (testLoader.getClass('[C') as SuccessResult<ReferenceClassData>).result
    const arrayRef = arrCls.instantiate() as JvmArray
    arrayRef.initialize(thread, 1, [99])
    thread.pushStack(arrayRef)
    thread.pushStack(-1)
    code.setUint8(0, OPCODE.CALOAD)
    thread.runFor(1)
    const lastFrame = thread.peekStackFrame()
    expect(lastFrame.class === threadClass).toBe(true)
    expect(lastFrame.method).toBe(
      threadClass.getMethod('dispatchUncaughtException(Ljava/lang/Throwable;)V')
    )
    expect(thread.getPC()).toBe(0)

    const exceptionObj = lastFrame.locals[1] as JvmObject
    expect(exceptionObj.getClass().getName()).toBe('java/lang/ArrayIndexOutOfBoundsException')
  })
})

describe('SALOAD', () => {
  test('SALOAD: loads short from array', () => {
    const arrCls = (testLoader.getClass('[S') as SuccessResult<ReferenceClassData>).result
    const arrayRef = arrCls.instantiate() as JvmArray
    arrayRef.initialize(thread, 1, [99])
    thread.pushStack(arrayRef)
    thread.pushStack(0)
    code.setUint8(0, OPCODE.SALOAD)
    thread.runFor(1)
    const lastFrame = thread.peekStackFrame()
    expect(lastFrame.operandStack.length).toBe(1)
    expect(lastFrame.operandStack[0]).toBe(99)
    expect(lastFrame.locals.length).toBe(0)
    expect(thread.getPC()).toBe(1)
  })

  test('SALOAD: null array throws NullPointerException', () => {
    const arrayRef = null
    thread.pushStack(arrayRef)
    thread.pushStack(0)
    code.setUint8(0, OPCODE.SALOAD)
    thread.runFor(1)
    const lastFrame = thread.peekStackFrame()
    expect(lastFrame.class === threadClass).toBe(true)
    expect(thread.getPC()).toBe(0)

    const exceptionObj = lastFrame.locals[1] as JvmObject
    expect(exceptionObj.getClass().getName()).toBe('java/lang/NullPointerException')
  })

  test('SALOAD: high index OOB throws ArrayIndexOutOfBoundsException', () => {
    const arrCls = (testLoader.getClass('[S') as SuccessResult<ReferenceClassData>).result
    const arrayRef = arrCls.instantiate() as JvmArray
    arrayRef.initialize(thread, 1, [99])
    thread.pushStack(arrayRef)
    thread.pushStack(1)
    code.setUint8(0, OPCODE.SALOAD)
    thread.runFor(1)
    const lastFrame = thread.peekStackFrame()
    expect(lastFrame.class === threadClass).toBe(true)
    expect(lastFrame.method).toBe(
      threadClass.getMethod('dispatchUncaughtException(Ljava/lang/Throwable;)V')
    )
    expect(thread.getPC()).toBe(0)

    const exceptionObj = lastFrame.locals[1] as JvmObject
    expect(exceptionObj.getClass().getName()).toBe('java/lang/ArrayIndexOutOfBoundsException')
  })

  test('SALOAD: low index OOB throws ArrayIndexOutOfBoundsException', () => {
    const arrCls = (testLoader.getClass('[S') as SuccessResult<ReferenceClassData>).result
    const arrayRef = arrCls.instantiate() as JvmArray
    arrayRef.initialize(thread, 1, [99])
    thread.pushStack(arrayRef)
    thread.pushStack(-1)
    code.setUint8(0, OPCODE.SALOAD)
    thread.runFor(1)
    const lastFrame = thread.peekStackFrame()
    expect(lastFrame.class === threadClass).toBe(true)
    expect(lastFrame.method).toBe(
      threadClass.getMethod('dispatchUncaughtException(Ljava/lang/Throwable;)V')
    )
    expect(thread.getPC()).toBe(0)

    const exceptionObj = lastFrame.locals[1] as JvmObject
    expect(exceptionObj.getClass().getName()).toBe('java/lang/ArrayIndexOutOfBoundsException')
  })
})
