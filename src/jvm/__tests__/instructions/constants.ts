import { CONSTANT_TAG } from '../../../ClassFile/constants/constants'
import { OPCODE } from '../../../ClassFile/constants/instructions'
import { ConstantUtf8Info, ConstantClassInfo } from '../../../ClassFile/types/constants'
import { METHOD_FLAGS } from '../../../ClassFile/types/methods'
import { JavaStackFrame } from '../../stackframe'
import Thread from '../../thread'
import { SuccessResult } from '../../types/Result'
import { ReferenceClassData } from '../../types/class/ClassData'
import { ConstantString, ConstantClass } from '../../types/class/Constants'
import { Method } from '../../types/class/Method'
import { JvmObject } from '../../types/reference/Object'
import { TestClassLoader, setupTest } from '../test-utils'

let testLoader: TestClassLoader
let thread: Thread
let code: DataView
let testClass: ReferenceClassData

beforeEach(() => {
  const setup = setupTest()
  testLoader = setup.testLoader
  thread = setup.thread
  code = setup.code
  testClass = setup.classes.testClass as ReferenceClassData
  const method = setup.method
  thread.invokeStackFrame(new JavaStackFrame(testClass, method, 0, []))
})

describe('Nop', () => {
  test('does not modify stack', () => {
    code.setUint8(0, OPCODE.NOP)
    thread.runFor(1)

    const lastFrame = thread.peekStackFrame()
    expect(lastFrame.operandStack.length).toBe(0)
    expect(lastFrame.locals.length).toBe(0)
    expect(thread.getPC()).toBe(1)
  })
})

describe('AconstNull', () => {
  test('pushes null to stack', () => {
    code.setUint8(0, OPCODE.ACONST_NULL)
    thread.runFor(1)

    const lastFrame = thread.peekStackFrame()
    expect(lastFrame.operandStack.length).toBe(1)
    expect(lastFrame.operandStack[0]).toBe(null)
    expect(lastFrame.locals.length).toBe(0)
    expect(thread.getPC()).toBe(1)
  })
})

describe('IconstM1', () => {
  test('pushes -1 to stack', () => {
    code.setUint8(0, OPCODE.ICONST_M1)
    thread.runFor(1)

    const lastFrame = thread.peekStackFrame()
    expect(lastFrame.operandStack.length).toBe(1)
    expect(lastFrame.operandStack[0]).toBe(-1)
    expect(lastFrame.locals.length).toBe(0)
    expect(thread.getPC()).toBe(1)
  })
})

describe('Iconst0', () => {
  test('pushes 0 to stack', () => {
    code.setUint8(0, OPCODE.ICONST_0)
    thread.runFor(1)

    const lastFrame = thread.peekStackFrame()
    expect(lastFrame.operandStack.length).toBe(1)
    expect(lastFrame.operandStack[0]).toBe(0)
    expect(lastFrame.locals.length).toBe(0)
    expect(thread.getPC()).toBe(1)
  })
})

describe('Iconst1', () => {
  test('pushes 1 to stack', () => {
    code.setUint8(0, OPCODE.ICONST_1)
    thread.runFor(1)

    const lastFrame = thread.peekStackFrame()
    expect(lastFrame.operandStack.length).toBe(1)
    expect(lastFrame.operandStack[0]).toBe(1)
    expect(lastFrame.locals.length).toBe(0)
    expect(thread.getPC()).toBe(1)
  })
})

describe('Iconst2', () => {
  test('pushes 2 to stack', () => {
    code.setUint8(0, OPCODE.ICONST_2)
    thread.runFor(1)

    const lastFrame = thread.peekStackFrame()
    expect(lastFrame.operandStack.length).toBe(1)
    expect(lastFrame.operandStack[0]).toBe(2)
    expect(lastFrame.locals.length).toBe(0)
    expect(thread.getPC()).toBe(1)
  })
})

describe('Iconst3', () => {
  test('pushes 3 to stack', () => {
    code.setUint8(0, OPCODE.ICONST_3)
    thread.runFor(1)

    const lastFrame = thread.peekStackFrame()
    expect(lastFrame.operandStack.length).toBe(1)
    expect(lastFrame.operandStack[0]).toBe(3)
    expect(lastFrame.locals.length).toBe(0)
    expect(thread.getPC()).toBe(1)
  })
})

describe('Iconst4', () => {
  test('pushes 4 to stack', () => {
    code.setUint8(0, OPCODE.ICONST_4)
    thread.runFor(1)

    const lastFrame = thread.peekStackFrame()
    expect(lastFrame.operandStack.length).toBe(1)
    expect(lastFrame.operandStack[0]).toBe(4)
    expect(lastFrame.locals.length).toBe(0)
    expect(thread.getPC()).toBe(1)
  })
})

describe('Iconst5', () => {
  test('pushes 5 to stack', () => {
    code.setUint8(0, OPCODE.ICONST_5)
    thread.runFor(1)

    const lastFrame = thread.peekStackFrame()
    expect(lastFrame.operandStack.length).toBe(1)
    expect(lastFrame.operandStack[0]).toBe(5)
    expect(lastFrame.locals.length).toBe(0)
    expect(thread.getPC()).toBe(1)
  })
})

describe('Lconst0', () => {
  test('pushes long 0 to stack', () => {
    code.setUint8(0, OPCODE.LCONST_0)
    thread.runFor(1)

    const lastFrame = thread.peekStackFrame()
    expect(lastFrame.operandStack.length).toBe(2)
    expect(lastFrame.operandStack[0]).toBe(BigInt(0))
    expect(lastFrame.locals.length).toBe(0)
    expect(thread.getPC()).toBe(1)
  })
})

describe('Lconst1', () => {
  test('pushes long 1 to stack', () => {
    code.setUint8(0, OPCODE.LCONST_1)
    thread.runFor(1)

    const lastFrame = thread.peekStackFrame()
    expect(lastFrame.operandStack.length).toBe(2)
    expect(lastFrame.operandStack[0]).toBe(BigInt(1))
    expect(lastFrame.locals.length).toBe(0)
    expect(thread.getPC()).toBe(1)
  })
})

describe('Fconst0', () => {
  test('pushes float 0 to stack', () => {
    code.setUint8(0, OPCODE.FCONST_0)
    thread.runFor(1)

    const lastFrame = thread.peekStackFrame()
    expect(lastFrame.operandStack.length).toBe(1)
    expect(lastFrame.operandStack[0]).toBe(Math.fround(0.0))
    expect(lastFrame.locals.length).toBe(0)
    expect(thread.getPC()).toBe(1)
  })
})

describe('Fconst1', () => {
  test('pushes float 1 to stack', () => {
    code.setUint8(0, OPCODE.FCONST_1)
    thread.runFor(1)

    const lastFrame = thread.peekStackFrame()
    expect(lastFrame.operandStack.length).toBe(1)
    expect(lastFrame.operandStack[0]).toBe(Math.fround(1.0))
    expect(lastFrame.locals.length).toBe(0)
    expect(thread.getPC()).toBe(1)
  })
})

describe('Fconst2', () => {
  test('pushes float 2 to stack', () => {
    code.setUint8(0, OPCODE.FCONST_2)
    thread.runFor(1)

    const lastFrame = thread.peekStackFrame()
    expect(lastFrame.operandStack.length).toBe(1)
    expect(lastFrame.operandStack[0]).toBe(Math.fround(2.0))
    expect(lastFrame.locals.length).toBe(0)
    expect(thread.getPC()).toBe(1)
  })
})

describe('Dconst0', () => {
  test('pushes double 0 to stack', () => {
    code.setUint8(0, OPCODE.DCONST_0)
    thread.runFor(1)

    const lastFrame = thread.peekStackFrame()
    expect(lastFrame.operandStack.length).toBe(2)
    expect(lastFrame.operandStack[0]).toBe(0.0)
    expect(lastFrame.locals.length).toBe(0)
    expect(thread.getPC()).toBe(1)
  })
})

describe('Dconst1', () => {
  test('pushes double 1 to stack', () => {
    code.setUint8(0, OPCODE.DCONST_1)
    thread.runFor(1)

    const lastFrame = thread.peekStackFrame()
    expect(lastFrame.operandStack.length).toBe(2)
    expect(lastFrame.operandStack[0]).toBe(1.0)
    expect(lastFrame.locals.length).toBe(0)
    expect(thread.getPC()).toBe(1)
  })
})

describe('Bipush', () => {
  test('pushes byte to stack', () => {
    code.setUint8(0, OPCODE.BIPUSH)
    code.setInt8(1, 128)
    thread.runFor(1)
    const lastFrame = thread.peekStackFrame()
    expect(lastFrame.operandStack.length).toBe(1)
    expect(lastFrame.operandStack[0]).toBe(-128)
    expect(lastFrame.locals.length).toBe(0)
    expect(thread.getPC()).toBe(2)
  })
})

describe('Sipush', () => {
  test('pushes short to stack', () => {
    code.setUint8(0, OPCODE.SIPUSH)
    code.setInt16(1, 32768)
    thread.runFor(1)

    const lastFrame = thread.peekStackFrame()
    expect(lastFrame.operandStack.length).toBe(1)
    expect(lastFrame.operandStack[0]).toBe(-32768)
    expect(lastFrame.locals.length).toBe(0)
    expect(thread.getPC()).toBe(3)
  })
})

describe('Ldc', () => {
  test('reads int from constant pool and pushes to stack', () => {
    // use custom class
    thread.returnStackFrame()
    const intConstant = {
      tag: CONSTANT_TAG.Integer,
      value: -99
    }
    let constIdx = 0
    const customClass = testLoader.createClass({
      className: 'custom',
      constants: [
        cPool => {
          constIdx = cPool.length
          return intConstant
        }
      ],
      methods: [
        {
          accessFlags: [METHOD_FLAGS.ACC_PUBLIC],
          name: 'test0',
          descriptor: '()V',
          attributes: [],
          code: code
        }
      ],
      loader: testLoader
    })
    const method = customClass.getMethod('test0()V') as Method
    thread.invokeStackFrame(new JavaStackFrame(customClass, method, 0, []))
    code.setUint8(0, OPCODE.LDC)
    code.setUint8(1, constIdx)
    thread.runFor(1)

    const lastFrame = thread.peekStackFrame()
    expect(lastFrame.operandStack.length).toBe(1)
    expect(lastFrame.operandStack[0]).toBe(-99)
    expect(lastFrame.locals.length).toBe(0)
    expect(thread.getPC()).toBe(2)
  })

  test('reads float from constant pool and pushes to stack', () => {
    thread.returnStackFrame()
    const floatConstant = {
      tag: CONSTANT_TAG.Float,
      value: Math.fround(-0.3)
    }
    let constIdx = 0
    const customClass = testLoader.createClass({
      className: 'custom',
      constants: [
        cPool => {
          constIdx = cPool.length
          return floatConstant
        }
      ],
      methods: [
        {
          accessFlags: [METHOD_FLAGS.ACC_PUBLIC],
          name: 'test0',
          descriptor: '()V',
          attributes: [],
          code: code
        }
      ],
      loader: testLoader
    })
    const method = customClass.getMethod('test0()V') as Method
    thread.invokeStackFrame(new JavaStackFrame(customClass, method, 0, []))
    code.setUint8(0, OPCODE.LDC)
    code.setUint8(1, constIdx)
    thread.runFor(1)

    const lastFrame = thread.peekStackFrame()
    expect(lastFrame.operandStack.length).toBe(1)
    expect(lastFrame.operandStack[0]).toBe(Math.fround(-0.3))
    expect(lastFrame.locals.length).toBe(0)
    expect(thread.getPC()).toBe(2)
  })

  test('reads string from constant pool and pushes to stack', () => {
    thread.returnStackFrame()
    let constIdx = 0
    const customClass = testLoader.createClass({
      className: 'custom',
      constants: [
        () => ({
          tag: CONSTANT_TAG.Utf8,
          value: 'hello world',
          length: 11
        }),
        cPool => {
          constIdx = cPool.length
          return {
            tag: CONSTANT_TAG.String,
            stringIndex: constIdx - 1
          }
        }
      ],
      methods: [
        {
          accessFlags: [METHOD_FLAGS.ACC_PUBLIC],
          name: 'test0',
          descriptor: '()V',
          attributes: [],
          code: code
        }
      ],
      loader: testLoader
    })

    const cstr = customClass.getConstant(constIdx) as ConstantString
    const str = (cstr.resolve(thread, testLoader) as SuccessResult<JvmObject>).result

    const method = customClass.getMethod('test0()V') as Method
    thread.invokeStackFrame(new JavaStackFrame(customClass, method, 0, []))
    code.setUint8(0, OPCODE.LDC)
    code.setUint8(1, constIdx)
    thread.runFor(1)

    const lastFrame = thread.peekStackFrame()
    expect(lastFrame.operandStack.length).toBe(1)
    expect(lastFrame.operandStack[0] === str).toBe(true) // string literals should be same object
    expect(lastFrame.locals.length).toBe(0)
    expect(thread.getPC()).toBe(2)
  })

  test('initializes uninitialized string from constant pool', () => {
    thread.returnStackFrame()
    let constIdx = 0
    const customClass = testLoader.createClass({
      className: 'custom',
      constants: [
        () => ({
          tag: CONSTANT_TAG.Utf8,
          value: 'hello world',
          length: 11
        }),
        cPool => {
          constIdx = cPool.length
          return {
            tag: CONSTANT_TAG.String,
            stringIndex: constIdx - 1
          }
        }
      ],
      methods: [
        {
          accessFlags: [METHOD_FLAGS.ACC_PUBLIC],
          name: 'test0',
          descriptor: '()V',
          attributes: [],
          code: code
        }
      ],
      loader: testLoader
    })

    const cstr = customClass.getConstant(constIdx) as ConstantString

    const method = customClass.getMethod('test0()V') as Method
    thread.invokeStackFrame(new JavaStackFrame(customClass, method, 0, []))
    code.setUint8(0, OPCODE.LDC)
    code.setUint8(1, constIdx)
    thread.runFor(1)

    const lastFrame = thread.peekStackFrame()
    expect(lastFrame.operandStack.length).toBe(1)
    expect(lastFrame.operandStack[0]).toBeDefined()
    expect(lastFrame.operandStack[0] === cstr.get()).toBe(true) // string literals should be same object
    expect(lastFrame.locals.length).toBe(0)
    expect(thread.getPC()).toBe(2)
  })

  test('reads classref from constant pool and pushes to stack', () => {
    thread.returnStackFrame()
    let constIdx = 0
    const customClass = testLoader.createClass({
      className: 'custom',
      constants: [
        () => ({
          tag: CONSTANT_TAG.Utf8,
          value: 'Test',
          length: 4
        }),
        cPool => {
          constIdx = cPool.length
          return {
            tag: CONSTANT_TAG.Class,
            nameIndex: cPool.length - 1
          }
        }
      ],
      methods: [
        {
          accessFlags: [METHOD_FLAGS.ACC_PUBLIC],
          name: 'test0',
          descriptor: '()V',
          attributes: [],
          code: code
        }
      ],
      loader: testLoader
    })

    const clsConstant = customClass.getConstant(constIdx) as ConstantClass
    clsConstant.resolve()

    const method = customClass.getMethod('test0()V') as Method
    thread.invokeStackFrame(new JavaStackFrame(customClass, method, 0, []))
    code.setUint8(0, OPCODE.LDC)
    code.setUint8(1, constIdx)
    thread.runFor(1)

    const lastFrame = thread.peekStackFrame()
    expect(lastFrame.operandStack.length).toBe(1)
    const clsObj = lastFrame.operandStack[0] as JvmObject
    expect(clsConstant.get() === testClass).toBe(true)
    expect(clsObj.getClass().getName()).toBe('java/lang/Class')
    expect(clsObj.getNativeField('classRef') === testClass).toBe(true)
    expect(lastFrame.locals.length).toBe(0)
    expect(thread.getPC()).toBe(2)
  })
})

describe('LdcW', () => {
  test('reads int from constant pool and pushes to stack', () => {
    // use custom class
    thread.returnStackFrame()
    const intConstant = {
      tag: CONSTANT_TAG.Integer,
      value: -99
    }
    let constIdx = 0
    const customClass = testLoader.createClass({
      className: 'custom',
      constants: [
        cPool => {
          constIdx = cPool.length
          return intConstant
        }
      ],
      methods: [
        {
          accessFlags: [METHOD_FLAGS.ACC_PUBLIC],
          name: 'test0',
          descriptor: '()V',
          attributes: [],
          code: code
        }
      ],
      loader: testLoader
    })
    const method = customClass.getMethod('test0()V') as Method
    thread.invokeStackFrame(new JavaStackFrame(customClass, method, 0, []))
    code.setUint8(0, OPCODE.LDC_W)
    code.setUint16(1, constIdx)
    thread.runFor(1)

    const lastFrame = thread.peekStackFrame()
    expect(lastFrame.operandStack.length).toBe(1)
    expect(lastFrame.operandStack[0]).toBe(-99)
    expect(lastFrame.locals.length).toBe(0)
    expect(thread.getPC()).toBe(3)
  })

  test('reads float from constant pool and pushes to stack', () => {
    thread.returnStackFrame()
    const floatConstant = {
      tag: CONSTANT_TAG.Float,
      value: Math.fround(-0.3)
    }
    let constIdx = 0
    const customClass = testLoader.createClass({
      className: 'custom',
      constants: [
        cPool => {
          constIdx = cPool.length
          return floatConstant
        }
      ],
      methods: [
        {
          accessFlags: [METHOD_FLAGS.ACC_PUBLIC],
          name: 'test0',
          descriptor: '()V',
          attributes: [],
          code: code
        }
      ],
      loader: testLoader
    })
    const method = customClass.getMethod('test0()V') as Method
    thread.invokeStackFrame(new JavaStackFrame(customClass, method, 0, []))
    code.setUint8(0, OPCODE.LDC_W)
    code.setUint16(1, constIdx)
    thread.runFor(1)

    const lastFrame = thread.peekStackFrame()
    expect(lastFrame.operandStack.length).toBe(1)
    expect(lastFrame.operandStack[0]).toBe(Math.fround(-0.3))
    expect(lastFrame.locals.length).toBe(0)
    expect(thread.getPC()).toBe(3)
  })

  test('reads string from constant pool and pushes to stack', () => {
    thread.returnStackFrame()
    let constIdx = 0
    const customClass = testLoader.createClass({
      className: 'custom',
      constants: [
        () => ({
          tag: CONSTANT_TAG.Utf8,
          value: 'hello world',
          length: 11
        }),
        cPool => {
          constIdx = cPool.length
          return {
            tag: CONSTANT_TAG.String,
            stringIndex: constIdx - 1
          }
        }
      ],
      methods: [
        {
          accessFlags: [METHOD_FLAGS.ACC_PUBLIC],
          name: 'test0',
          descriptor: '()V',
          attributes: [],
          code: code
        }
      ],
      loader: testLoader
    })

    const cstr = customClass.getConstant(constIdx) as ConstantString
    const str = (cstr.resolve(thread, testLoader) as SuccessResult<JvmObject>).result
    const method = customClass.getMethod('test0()V') as Method
    thread.invokeStackFrame(new JavaStackFrame(customClass, method, 0, []))
    code.setUint8(0, OPCODE.LDC_W)
    code.setUint16(1, constIdx)
    thread.runFor(1)

    const lastFrame = thread.peekStackFrame()
    expect(lastFrame.operandStack.length).toBe(1)
    expect(lastFrame.operandStack[0] === str).toBe(true) // string literals should be same object
    expect(lastFrame.locals.length).toBe(0)
    expect(thread.getPC()).toBe(3)
  })

  test('initializes uninitialized string from constant pool', () => {
    thread.returnStackFrame()
    let constIdx = 0
    const customClass = testLoader.createClass({
      className: 'custom',
      constants: [
        () => ({
          tag: CONSTANT_TAG.Utf8,
          value: 'hello world',
          length: 11
        }),
        cPool => {
          constIdx = cPool.length
          return {
            tag: CONSTANT_TAG.String,
            stringIndex: constIdx - 1
          }
        }
      ],
      methods: [
        {
          accessFlags: [METHOD_FLAGS.ACC_PUBLIC],
          name: 'test0',
          descriptor: '()V',
          attributes: [],
          code: code
        }
      ],
      loader: testLoader
    })

    const cstr = customClass.getConstant(constIdx) as ConstantString
    const method = customClass.getMethod('test0()V') as Method
    thread.invokeStackFrame(new JavaStackFrame(customClass, method, 0, []))
    code.setUint8(0, OPCODE.LDC_W)
    code.setUint16(1, constIdx)
    thread.runFor(1)

    const lastFrame = thread.peekStackFrame()
    expect(lastFrame.operandStack.length).toBe(1)
    expect(lastFrame.operandStack[0] === cstr.get()).toBe(true) // string literals should be same object
    expect(lastFrame.operandStack[0]).toBeDefined()
    expect(lastFrame.locals.length).toBe(0)
    expect(thread.getPC()).toBe(3)
  })

  test('reads classref from constant pool and pushes to stack', () => {
    thread.returnStackFrame()
    let classConstant
    const strContent = {
      tag: CONSTANT_TAG.Utf8,
      value: 'Test'
    } as ConstantUtf8Info
    let constIdx = 0
    const customClass = testLoader.createClass({
      className: 'custom',
      constants: [
        () => strContent,
        cPool => {
          constIdx = cPool.length
          classConstant = {
            tag: CONSTANT_TAG.Class,
            nameIndex: cPool.length - 1,
            classRef: testClass
          } as ConstantClassInfo
          return classConstant
        }
      ],
      methods: [
        {
          accessFlags: [METHOD_FLAGS.ACC_PUBLIC],
          name: 'test0',
          descriptor: '()V',
          attributes: [],
          code: code
        }
      ],
      loader: testLoader
    })
    const method = customClass.getMethod('test0()V') as Method
    thread.invokeStackFrame(new JavaStackFrame(customClass, method, 0, []))
    code.setUint8(0, OPCODE.LDC_W)
    code.setUint16(1, constIdx)
    thread.runFor(1)

    const lastFrame = thread.peekStackFrame()
    expect(lastFrame.operandStack.length).toBe(1)
    expect(lastFrame.operandStack[0].getClass().getName()).toBe('java/lang/Class')
    expect(lastFrame.operandStack[0].getNativeField('classRef') === testClass).toBe(true)
    expect(lastFrame.locals.length).toBe(0)
    expect(thread.getPC()).toBe(3)
  })
})

describe('Ldc2W', () => {
  test('reads long from constant pool and pushes to stack', () => {
    // use custom class
    thread.returnStackFrame()
    const longConstant = {
      tag: CONSTANT_TAG.Long,
      value: BigInt(99)
    }
    let constIdx = 0
    const customClass = testLoader.createClass({
      className: 'custom',
      constants: [
        cPool => {
          constIdx = cPool.length
          return longConstant
        }
      ],
      methods: [
        {
          accessFlags: [METHOD_FLAGS.ACC_PUBLIC],
          name: 'test0',
          descriptor: '()V',
          attributes: [],
          code: code
        }
      ],
      loader: testLoader
    })
    const method = customClass.getMethod('test0()V') as Method
    thread.invokeStackFrame(new JavaStackFrame(customClass, method, 0, []))
    code.setUint8(0, OPCODE.LDC2_W)
    code.setUint16(1, constIdx)
    thread.runFor(1)

    const lastFrame = thread.peekStackFrame()
    expect(lastFrame.operandStack.length).toBe(2)
    expect(lastFrame.operandStack[0]).toBe(BigInt(99))
    expect(lastFrame.locals.length).toBe(0)
    expect(thread.getPC()).toBe(3)
  })

  test('reads double from constant pool and pushes to stack', () => {
    // use custom class
    thread.returnStackFrame()
    const doubleConstant = {
      tag: CONSTANT_TAG.Double,
      value: -0.3
    }
    let constIdx = 0
    const customClass = testLoader.createClass({
      className: 'custom',
      constants: [
        cPool => {
          constIdx = cPool.length
          return doubleConstant
        }
      ],
      methods: [
        {
          accessFlags: [METHOD_FLAGS.ACC_PUBLIC],
          name: 'test0',
          descriptor: '()V',
          attributes: [],
          code: code
        }
      ],
      loader: testLoader
    })
    const method = customClass.getMethod('test0()V') as Method
    thread.invokeStackFrame(new JavaStackFrame(customClass, method, 0, []))
    code.setUint8(0, OPCODE.LDC2_W)
    code.setUint16(1, constIdx)
    thread.runFor(1)

    const lastFrame = thread.peekStackFrame()
    expect(lastFrame.operandStack.length).toBe(2)
    expect(lastFrame.operandStack[0]).toBe(-0.3)
    expect(lastFrame.locals.length).toBe(0)
    expect(thread.getPC()).toBe(3)
  })
})
