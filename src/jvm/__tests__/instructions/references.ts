import { CONSTANT_TAG } from '../../../ClassFile/constants/constants'
import { OPCODE } from '../../../ClassFile/constants/instructions'
import { ACCESS_FLAGS } from '../../../ClassFile/types'
import { FIELD_FLAGS } from '../../../ClassFile/types/fields'
import { METHOD_FLAGS } from '../../../ClassFile/types/methods'
import { CLASS_STATUS } from '../../constants'
import { JNI } from '../../jni'
import { JavaStackFrame } from '../../stackframe'
import Thread from '../../thread'
import { SuccessResult } from '../../types/Result'
import { ReferenceClassData, ArrayClassData } from '../../types/class/ClassData'
import { Method } from '../../types/class/Method'
import { ArrayPrimitiveType, JvmArray } from '../../types/reference/Array'
import { JvmObject } from '../../types/reference/Object'
import { TestClassLoader, setupTest } from '../__utils__/test-utils'

let thread: Thread
let threadClass: ReferenceClassData
let testLoader: TestClassLoader
let jni: JNI
let NullPointerException: ReferenceClassData

beforeEach(() => {
  const setup = setupTest()
  thread = setup.thread
  threadClass = setup.classes.threadClass
  jni = setup.jni
  testLoader = setup.testLoader
  NullPointerException = setup.classes.NullPointerException as ReferenceClassData
})

describe('Invokestatic', () => {
  test('INVOKESTATIC: Non static method throws IncompatibleClassChangeError', () => {
    const ab = new ArrayBuffer(24)
    const code = new DataView(ab)
    let methodIdx = 0
    const testClass = testLoader.createClass({
      className: 'Test',
      constants: [
        () => ({
          tag: CONSTANT_TAG.Utf8,
          length: 3,
          value: '()V'
        }),
        () => ({
          tag: CONSTANT_TAG.Utf8,
          length: 5,
          value: 'test0'
        }),
        () => ({
          tag: CONSTANT_TAG.Utf8,
          length: 4,
          value: 'Test'
        }),
        cPool => ({
          tag: CONSTANT_TAG.NameAndType,
          nameIndex: cPool.length - 2,
          descriptorIndex: cPool.length - 3
        }),
        cPool => ({
          tag: CONSTANT_TAG.Class,
          nameIndex: cPool.length - 2
        }),
        cPool => {
          methodIdx = cPool.length
          return {
            tag: CONSTANT_TAG.Methodref,
            classIndex: cPool.length - 1,
            nameAndTypeIndex: cPool.length - 2
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
    code.setUint8(0, OPCODE.INVOKESTATIC)
    code.setUint16(1, methodIdx)

    const method = testClass.getMethod('test0()V') as Method
    thread.invokeStackFrame(new JavaStackFrame(testClass, method as Method, 0, []))

    thread.runFor(1)
    const lastFrame = thread.peekStackFrame()
    expect(lastFrame.method).toBe(
      threadClass.getMethod('dispatchUncaughtException(Ljava/lang/Throwable;)V')
    )
    expect(thread.getPC()).toBe(0)
    const exceptionObj = lastFrame.locals[1] as JvmObject
    expect(exceptionObj.getClass().getName()).toBe('java/lang/IncompatibleClassChangeError')
  })
  test('INVOKESTATIC: Initializes class if not already initialized', () => {
    const ab = new ArrayBuffer(24)
    const code = new DataView(ab)
    let methodIdx = 0
    const testClass = testLoader.createClass({
      className: 'Test',
      constants: [
        () => ({
          tag: CONSTANT_TAG.Utf8,
          length: 3,
          value: '()V'
        }),
        () => ({
          tag: CONSTANT_TAG.Utf8,
          length: 5,
          value: 'test0'
        }),
        () => ({
          tag: CONSTANT_TAG.Utf8,
          length: 4,
          value: 'Test'
        }),
        cPool => ({
          tag: CONSTANT_TAG.NameAndType,
          nameIndex: cPool.length - 2,
          descriptorIndex: cPool.length - 3
        }),
        cPool => ({
          tag: CONSTANT_TAG.Class,
          nameIndex: cPool.length - 2
        }),
        cPool => {
          methodIdx = cPool.length
          return {
            tag: CONSTANT_TAG.Methodref,
            classIndex: cPool.length - 1,
            nameAndTypeIndex: cPool.length - 2
          }
        }
      ],
      methods: [
        {
          accessFlags: [METHOD_FLAGS.ACC_STATIC],
          name: 'test0',
          descriptor: '()V',
          attributes: [],
          code: code
        }
      ],
      loader: testLoader
    })
    code.setUint8(0, OPCODE.INVOKESTATIC)
    code.setUint16(1, methodIdx)

    const method = testClass.getMethod('test0()V') as Method
    thread.invokeStackFrame(new JavaStackFrame(testClass, method as Method, 0, []))
    expect(testClass.status).toBe(CLASS_STATUS.PREPARED)
    thread.runFor(1)
    expect(testClass.status).toBe(CLASS_STATUS.INITIALIZED)
  })
  test('INVOKESTATIC: Pops args off stack per descriptor', () => {
    const ab = new ArrayBuffer(24)
    const code = new DataView(ab)
    let methodIdx = 0
    const testClass = testLoader.createClass({
      className: 'Test',
      constants: [
        () => ({
          tag: CONSTANT_TAG.Utf8,
          length: 6,
          value: '(IDJ)V'
        }),
        () => ({
          tag: CONSTANT_TAG.Utf8,
          length: 5,
          value: 'test0'
        }),
        () => ({
          tag: CONSTANT_TAG.Utf8,
          length: 4,
          value: 'Test'
        }),
        cPool => ({
          tag: CONSTANT_TAG.NameAndType,
          nameIndex: cPool.length - 2,
          descriptorIndex: cPool.length - 3
        }),
        cPool => ({
          tag: CONSTANT_TAG.Class,
          nameIndex: cPool.length - 2
        }),
        cPool => {
          methodIdx = cPool.length
          return {
            tag: CONSTANT_TAG.Methodref,
            classIndex: cPool.length - 1,
            nameAndTypeIndex: cPool.length - 2
          }
        }
      ],
      methods: [
        {
          accessFlags: [METHOD_FLAGS.ACC_STATIC],
          name: 'test0',
          descriptor: '(IDJ)V',
          attributes: [],
          code: code
        }
      ],
      loader: testLoader
    })
    code.setUint8(0, OPCODE.INVOKESTATIC)
    code.setUint16(1, methodIdx)
    const method = testClass.getMethod('test0(IDJ)V')
    thread.invokeStackFrame(new JavaStackFrame(testClass, method as Method, 0, []))
    thread.pushStack(1)
    thread.pushStack64(2.5)
    thread.pushStack64(BigInt(3))
    thread.runFor(1)
    expect(thread.peekStackFrame().locals[0]).toBe(1)
    expect(thread.peekStackFrame().locals[1]).toBe(2.5)
    expect(thread.peekStackFrame().locals[3] === BigInt(3)).toBe(true)
  })
  test('INVOKESTATIC: Undergoes value set conversion', () => {
    const ab = new ArrayBuffer(24)
    const code = new DataView(ab)
    let methodIdx = 0
    const testClass = testLoader.createClass({
      className: 'Test',
      constants: [
        () => ({
          tag: CONSTANT_TAG.Utf8,
          length: 5,
          value: '(FD)V'
        }),
        () => ({
          tag: CONSTANT_TAG.Utf8,
          length: 5,
          value: 'test0'
        }),
        () => ({
          tag: CONSTANT_TAG.Utf8,
          length: 4,
          value: 'Test'
        }),
        cPool => ({
          tag: CONSTANT_TAG.NameAndType,
          nameIndex: cPool.length - 2,
          descriptorIndex: cPool.length - 3
        }),
        cPool => ({
          tag: CONSTANT_TAG.Class,
          nameIndex: cPool.length - 2
        }),
        cPool => {
          methodIdx = cPool.length
          return {
            tag: CONSTANT_TAG.Methodref,
            classIndex: cPool.length - 1,
            nameAndTypeIndex: cPool.length - 2
          }
        }
      ],
      methods: [
        {
          accessFlags: [METHOD_FLAGS.ACC_STATIC],
          name: 'test0',
          descriptor: '(FD)V',
          attributes: [],
          code: code
        }
      ],
      loader: testLoader
    })
    code.setUint8(0, OPCODE.INVOKESTATIC)
    code.setUint16(1, methodIdx)
    const method = testClass.getMethod('test0(FD)V')
    thread.invokeStackFrame(new JavaStackFrame(testClass, method as Method, 0, []))
    thread.pushStack(1.3)
    thread.pushStack64(1.3)
    thread.runFor(1)
    expect(thread.peekStackFrame().locals[0]).toBe(Math.fround(1.3))
    expect(thread.peekStackFrame().locals[1]).toBe(1.3)
  })
  test('INVOKESTATIC: private method throws IllegalAccessError', () => {
    const ab = new ArrayBuffer(24)
    const code = new DataView(ab)
    let methodIdx = 0
    const superClass = testLoader.createClass({
      className: 'superClass',
      methods: [
        {
          accessFlags: [METHOD_FLAGS.ACC_STATIC, METHOD_FLAGS.ACC_PRIVATE],
          name: 'test0',
          descriptor: '(FD)V',
          attributes: [],
          code: new DataView(new ArrayBuffer(8))
        }
      ],
      loader: testLoader
    })
    const mainClass = testLoader.createClass({
      className: 'mainClass',
      superClass: superClass as ReferenceClassData,
      constants: [
        () => ({
          tag: CONSTANT_TAG.Utf8,
          length: 5,
          value: '(FD)V'
        }),
        () => ({
          tag: CONSTANT_TAG.Utf8,
          length: 5,
          value: 'test0'
        }),
        () => ({
          tag: CONSTANT_TAG.Utf8,
          length: 4,
          value: 'mainClass'
        }),
        cPool => ({
          tag: CONSTANT_TAG.NameAndType,
          nameIndex: cPool.length - 2,
          descriptorIndex: cPool.length - 3
        }),
        cPool => ({
          tag: CONSTANT_TAG.Class,
          nameIndex: cPool.length - 2
        }),
        cPool => {
          methodIdx = cPool.length
          return {
            tag: CONSTANT_TAG.Methodref,
            classIndex: cPool.length - 1,
            nameAndTypeIndex: cPool.length - 2
          }
        }
      ],
      methods: [
        {
          accessFlags: [METHOD_FLAGS.ACC_STATIC],
          name: 'main',
          descriptor: '()V',
          attributes: [],
          code: code
        }
      ],
      loader: testLoader
    })

    code.setUint8(0, OPCODE.INVOKESTATIC)
    code.setUint16(1, methodIdx)
    const method = mainClass.getMethod('main()V')
    thread.invokeStackFrame(new JavaStackFrame(mainClass, method as Method, 0, []))
    thread.pushStack(1.3)
    thread.pushStack64(1.3)
    thread.runFor(1)
    const lastFrame = thread.peekStackFrame()
    expect(lastFrame.method.getName() + lastFrame.method.getDescriptor()).toBe(
      'dispatchUncaughtException(Ljava/lang/Throwable;)V'
    )
    expect(thread.getPC()).toBe(0)
    const exceptionObj = lastFrame.locals[1] as JvmObject
    expect(exceptionObj.getClass().getName()).toBe('java/lang/IllegalAccessError')
  })
  test('INVOKESTATIC: method lookup checks superclass', () => {
    const ab = new ArrayBuffer(24)
    const code = new DataView(ab)
    let methodIdx = 0

    const mainClass = testLoader.createClass({
      className: 'mainClass',
      constants: [
        () => ({
          tag: CONSTANT_TAG.Utf8,
          length: 5,
          value: '(FD)V'
        }),
        () => ({
          tag: CONSTANT_TAG.Utf8,
          length: 5,
          value: 'test0'
        }),
        () => ({
          tag: CONSTANT_TAG.Utf8,
          length: 4,
          value: 'mainClass'
        }),
        cPool => ({
          tag: CONSTANT_TAG.NameAndType,
          nameIndex: cPool.length - 2,
          descriptorIndex: cPool.length - 3
        }),
        cPool => ({
          tag: CONSTANT_TAG.Class,
          nameIndex: cPool.length - 2
        }),
        cPool => {
          methodIdx = cPool.length
          return {
            tag: CONSTANT_TAG.Methodref,
            classIndex: cPool.length - 1,
            nameAndTypeIndex: cPool.length - 2
          }
        }
      ],
      methods: [
        {
          accessFlags: [METHOD_FLAGS.ACC_STATIC],
          name: 'main',
          descriptor: '()V',
          attributes: [],
          code: code
        },
        {
          accessFlags: [METHOD_FLAGS.ACC_STATIC],
          name: 'test0',
          descriptor: '(FD)V',
          attributes: [],
          code: new DataView(new ArrayBuffer(8))
        }
      ],
      loader: testLoader
    })

    code.setUint8(0, OPCODE.INVOKESTATIC)
    code.setUint16(1, methodIdx)
    const method = mainClass.getMethod('main()V')
    thread.invokeStackFrame(new JavaStackFrame(mainClass, method as Method, 0, []))
    thread.pushStack(1.3)
    thread.pushStack64(1.3)
    thread.runFor(1)
    expect(thread.getClass().getName()).toBe('mainClass')
    expect(thread.peekStackFrame().locals[0]).toBe(Math.fround(1.3))
    expect(thread.peekStackFrame().locals[1]).toBe(1.3)
  })
  test('INVOKESTATIC: method lookup checks superclass', () => {
    const ab = new ArrayBuffer(24)
    const code = new DataView(ab)
    let methodIdx = 0
    const interfaceClass = testLoader.createClass({
      className: 'interfaceClass',
      methods: [
        {
          accessFlags: [METHOD_FLAGS.ACC_STATIC],
          name: 'test0',
          descriptor: '(FD)V',
          attributes: [],
          code: new DataView(new ArrayBuffer(8))
        }
      ],
      loader: testLoader
    })
    const superClass = testLoader.createClass({
      className: 'superClass',
      methods: [
        {
          accessFlags: [METHOD_FLAGS.ACC_STATIC],
          name: 'test0',
          descriptor: '(FD)V',
          attributes: [],
          code: new DataView(new ArrayBuffer(8))
        }
      ],
      loader: testLoader
    })
    const mainClass = testLoader.createClass({
      className: 'mainClass',
      superClass: superClass as ReferenceClassData,
      constants: [
        () => ({
          tag: CONSTANT_TAG.Utf8,
          length: 5,
          value: '(FD)V'
        }),
        () => ({
          tag: CONSTANT_TAG.Utf8,
          length: 5,
          value: 'test0'
        }),
        () => ({
          tag: CONSTANT_TAG.Utf8,
          length: 4,
          value: 'mainClass'
        }),
        cPool => ({
          tag: CONSTANT_TAG.NameAndType,
          nameIndex: cPool.length - 2,
          descriptorIndex: cPool.length - 3
        }),
        cPool => ({
          tag: CONSTANT_TAG.Class,
          nameIndex: cPool.length - 2
        }),
        cPool => {
          methodIdx = cPool.length
          return {
            tag: CONSTANT_TAG.Methodref,
            classIndex: cPool.length - 1,
            nameAndTypeIndex: cPool.length - 2
          }
        }
      ],
      methods: [
        {
          accessFlags: [METHOD_FLAGS.ACC_STATIC],
          name: 'main',
          descriptor: '()V',
          attributes: [],
          code: code
        }
      ],
      interfaces: [interfaceClass as ReferenceClassData],
      loader: testLoader
    })

    code.setUint8(0, OPCODE.INVOKESTATIC)
    code.setUint16(1, methodIdx)
    const method = mainClass.getMethod('main()V')
    thread.invokeStackFrame(new JavaStackFrame(mainClass, method as Method, 0, []))
    thread.pushStack(1.3)
    thread.pushStack64(1.3)
    thread.runFor(1)
    expect(thread.getClass().getName()).toBe('superClass')
    expect(thread.peekStackFrame().locals[0]).toBe(Math.fround(1.3))
    expect(thread.peekStackFrame().locals[1]).toBe(1.3)
  })
  test('INVOKESTATIC: method lookup interface static methods not called', () => {
    const ab = new ArrayBuffer(24)
    const code = new DataView(ab)
    let methodIdx = 0
    const interfaceClass = testLoader.createClass({
      className: 'interfaceClass',
      methods: [
        {
          accessFlags: [METHOD_FLAGS.ACC_STATIC],
          name: 'test0',
          descriptor: '(FD)V',
          attributes: [],
          code: new DataView(new ArrayBuffer(8))
        }
      ],
      loader: testLoader
    })
    const mainClass = testLoader.createClass({
      className: 'mainClass',
      constants: [
        () => ({
          tag: CONSTANT_TAG.Utf8,
          length: 5,
          value: '(FD)V'
        }),
        () => ({
          tag: CONSTANT_TAG.Utf8,
          length: 5,
          value: 'test0'
        }),
        () => ({
          tag: CONSTANT_TAG.Utf8,
          length: 4,
          value: 'mainClass'
        }),
        cPool => ({
          tag: CONSTANT_TAG.NameAndType,
          nameIndex: cPool.length - 2,
          descriptorIndex: cPool.length - 3
        }),
        cPool => ({
          tag: CONSTANT_TAG.Class,
          nameIndex: cPool.length - 2
        }),
        cPool => {
          methodIdx = cPool.length
          return {
            tag: CONSTANT_TAG.Methodref,
            classIndex: cPool.length - 1,
            nameAndTypeIndex: cPool.length - 2
          }
        }
      ],
      methods: [
        {
          accessFlags: [METHOD_FLAGS.ACC_STATIC],
          name: 'main',
          descriptor: '()V',
          attributes: [],
          code: code
        }
      ],
      interfaces: [interfaceClass as ReferenceClassData],
      loader: testLoader
    })

    code.setUint8(0, OPCODE.INVOKESTATIC)
    code.setUint16(1, methodIdx)
    const method = mainClass.getMethod('main()V')
    thread.invokeStackFrame(new JavaStackFrame(mainClass, method as Method, 0, []))
    thread.pushStack(1.3)
    thread.pushStack64(1.3)
    thread.runFor(1)
    const lastFrame = thread.peekStackFrame()
    expect(lastFrame.method).toBe(
      threadClass.getMethod('dispatchUncaughtException(Ljava/lang/Throwable;)V')
    )
    expect(thread.getPC()).toBe(0)
    const exceptionObj = lastFrame.locals[1] as JvmObject
    expect(exceptionObj.getClass().getName()).toBe('java/lang/NoSuchMethodError')
  })
  test('INVOKESTATIC: Native method returns int', () => {
    const ab = new ArrayBuffer(24)
    const code = new DataView(ab)
    let nativeMethodIdx = 0
    const testClass = testLoader.createClass({
      className: 'Test',
      constants: [
        () => ({
          tag: CONSTANT_TAG.Utf8,
          length: 3,
          value: '()I'
        }),
        () => ({
          tag: CONSTANT_TAG.Utf8,
          length: 5,
          value: 'test0'
        }),
        () => ({
          tag: CONSTANT_TAG.Utf8,
          length: 4,
          value: 'Test'
        }),
        cPool => ({
          tag: CONSTANT_TAG.NameAndType,
          nameIndex: cPool.length - 2,
          descriptorIndex: cPool.length - 3
        }),
        cPool => ({
          tag: CONSTANT_TAG.Class,
          nameIndex: cPool.length - 2
        }),
        cPool => {
          return {
            tag: CONSTANT_TAG.Methodref,
            classIndex: cPool.length - 1,
            nameAndTypeIndex: cPool.length - 2
          }
        },
        () => ({
          tag: CONSTANT_TAG.Utf8,
          length: 3,
          value: '()I'
        }),
        () => ({
          tag: CONSTANT_TAG.Utf8,
          length: 5,
          value: 'nativeFunc'
        }),
        cPool => ({
          tag: CONSTANT_TAG.NameAndType,
          nameIndex: cPool.length - 1,
          descriptorIndex: cPool.length - 2
        }),
        cPool => ({
          tag: CONSTANT_TAG.Class,
          nameIndex: cPool.length - 7
        }),
        cPool => {
          nativeMethodIdx = cPool.length
          return {
            tag: CONSTANT_TAG.Methodref,
            classIndex: cPool.length - 1,
            nameAndTypeIndex: cPool.length - 2
          }
        }
      ],
      methods: [
        {
          accessFlags: [METHOD_FLAGS.ACC_STATIC],
          name: 'test0',
          descriptor: '()I',
          attributes: [],
          code: code
        },
        {
          accessFlags: [METHOD_FLAGS.ACC_STATIC, METHOD_FLAGS.ACC_NATIVE],
          name: 'nativeFunc',
          descriptor: '()I',
          attributes: [],
          code: code
        }
      ],
      loader: testLoader
    })
    code.setUint8(0, OPCODE.INVOKESTATIC)
    code.setUint16(1, nativeMethodIdx)
    const method = testClass.getMethod('test0()I') as Method
    jni.registerNativeMethod('Test', 'nativeFunc()I', (thread: Thread) => {
      thread.returnStackFrame(5)
    })
    thread.invokeStackFrame(new JavaStackFrame(testClass, method as Method, 0, []))
    thread.runFor(1)
    thread.runFor(1)
    expect((thread.popStack() as SuccessResult<any>).result).toBe(5)
    expect(thread.peekStackFrame().operandStack.length).toBe(0)
  })
  test('INVOKESTATIC: Native method returns long', () => {
    const ab = new ArrayBuffer(24)
    const code = new DataView(ab)
    let nativeMethodIdx = 0
    const testClass = testLoader.createClass({
      className: 'Test',
      constants: [
        () => ({
          tag: CONSTANT_TAG.Utf8,
          length: 5,
          value: '()J'
        }),
        () => ({
          tag: CONSTANT_TAG.Utf8,
          length: 5,
          value: 'test0'
        }),
        () => ({
          tag: CONSTANT_TAG.Utf8,
          length: 4,
          value: 'Test'
        }),
        cPool => ({
          tag: CONSTANT_TAG.NameAndType,
          nameIndex: cPool.length - 2,
          descriptorIndex: cPool.length - 3
        }),
        cPool => ({
          tag: CONSTANT_TAG.Class,
          nameIndex: cPool.length - 2
        }),
        cPool => {
          return {
            tag: CONSTANT_TAG.Methodref,
            classIndex: cPool.length - 1,
            nameAndTypeIndex: cPool.length - 2
          }
        },
        () => ({
          tag: CONSTANT_TAG.Utf8,
          length: 5,
          value: '()J'
        }),
        () => ({
          tag: CONSTANT_TAG.Utf8,
          length: 5,
          value: 'nativeFunc'
        }),
        cPool => ({
          tag: CONSTANT_TAG.NameAndType,
          nameIndex: cPool.length - 1,
          descriptorIndex: cPool.length - 2
        }),
        cPool => ({
          tag: CONSTANT_TAG.Class,
          nameIndex: cPool.length - 7
        }),
        cPool => {
          nativeMethodIdx = cPool.length
          return {
            tag: CONSTANT_TAG.Methodref,
            classIndex: cPool.length - 1,
            nameAndTypeIndex: cPool.length - 2
          }
        }
      ],
      methods: [
        {
          accessFlags: [METHOD_FLAGS.ACC_STATIC],
          name: 'test0',
          descriptor: '()J',
          attributes: [],
          code: code
        },
        {
          accessFlags: [METHOD_FLAGS.ACC_STATIC, METHOD_FLAGS.ACC_NATIVE],
          name: 'nativeFunc',
          descriptor: '()J',
          attributes: [],
          code: code
        }
      ],
      loader: testLoader
    })
    code.setUint8(0, OPCODE.INVOKESTATIC)
    code.setUint16(1, nativeMethodIdx)
    const method = testClass.getMethod('test0()J') as Method
    jni.registerNativeMethod('Test', 'nativeFunc()J', (thread: Thread) => {
      thread.returnStackFrame64(BigInt(5))
    })
    thread.invokeStackFrame(new JavaStackFrame(testClass, method as Method, 0, []))
    thread.runFor(1)
    thread.runFor(1)
    expect((thread.popStack64() as SuccessResult<any>).result === BigInt(5)).toBe(true)
    expect(thread.peekStackFrame().operandStack.length).toBe(0)
  })
})

describe('invokevirtual', () => {
  test('INVOKEVIRTUAL: static method invoked without error', () => {
    const ab = new ArrayBuffer(24)
    const code = new DataView(ab)
    let methodIdx = 0
    const testClass = testLoader.createClass({
      className: 'Test',
      constants: [
        () => ({
          tag: CONSTANT_TAG.Utf8,
          length: 3,
          value: '()V'
        }),
        () => ({
          tag: CONSTANT_TAG.Utf8,
          length: 5,
          value: 'test0'
        }),
        () => ({
          tag: CONSTANT_TAG.Utf8,
          length: 4,
          value: 'Test'
        }),
        cPool => ({
          tag: CONSTANT_TAG.NameAndType,
          nameIndex: cPool.length - 2,
          descriptorIndex: cPool.length - 3
        }),
        cPool => ({
          tag: CONSTANT_TAG.Class,
          nameIndex: cPool.length - 2
        }),
        cPool => {
          methodIdx = cPool.length
          return {
            tag: CONSTANT_TAG.Methodref,
            classIndex: cPool.length - 1,
            nameAndTypeIndex: cPool.length - 2
          }
        }
      ],
      methods: [
        {
          accessFlags: [METHOD_FLAGS.ACC_PUBLIC, METHOD_FLAGS.ACC_STATIC],
          name: 'test0',
          descriptor: '()V',
          attributes: [],
          code: code
        }
      ],
      loader: testLoader
    })
    code.setUint8(0, OPCODE.INVOKEVIRTUAL)
    code.setUint16(1, methodIdx)

    const method = testClass.getMethod('test0()V') as Method

    thread.invokeStackFrame(new JavaStackFrame(testClass, method as Method, 0, []))
    const objRef = new JvmObject(testClass)
    thread.pushStack(objRef)
    thread.runFor(1)
    const lastFrame = thread.peekStackFrame()
    expect(lastFrame.method.getName()).toBe('test0')
    expect(lastFrame.method.getDescriptor()).toBe('()V')
    expect(thread.getPC()).toBe(0)
  })
  test('INVOKEVIRTUAL: Pops args off stack per descriptor', () => {
    const ab = new ArrayBuffer(24)
    const code = new DataView(ab)
    let methodIdx = 0
    const testClass = testLoader.createClass({
      className: 'Test',
      constants: [
        () => ({
          tag: CONSTANT_TAG.Utf8,
          length: 6,
          value: '(IDJ)V'
        }),
        () => ({
          tag: CONSTANT_TAG.Utf8,
          length: 5,
          value: 'test0'
        }),
        () => ({
          tag: CONSTANT_TAG.Utf8,
          length: 4,
          value: 'Test'
        }),
        cPool => ({
          tag: CONSTANT_TAG.NameAndType,
          nameIndex: cPool.length - 2,
          descriptorIndex: cPool.length - 3
        }),
        cPool => ({
          tag: CONSTANT_TAG.Class,
          nameIndex: cPool.length - 2
        }),
        cPool => {
          methodIdx = cPool.length
          return {
            tag: CONSTANT_TAG.Methodref,
            classIndex: cPool.length - 1,
            nameAndTypeIndex: cPool.length - 2
          }
        }
      ],
      methods: [
        {
          accessFlags: [METHOD_FLAGS.ACC_PUBLIC],
          name: 'test0',
          descriptor: '(IDJ)V',
          attributes: [],
          code: code
        }
      ],
      loader: testLoader
    })
    code.setUint8(0, OPCODE.INVOKEVIRTUAL)
    code.setUint16(1, methodIdx)
    const method = testClass.getMethod('test0(IDJ)V')
    thread.invokeStackFrame(new JavaStackFrame(testClass, method as Method, 0, []))
    const objRef = new JvmObject(testClass)
    thread.pushStack(objRef)
    thread.pushStack(1)
    thread.pushStack64(2.5)
    thread.pushStack64(BigInt(3))
    thread.runFor(1)
    expect(thread.peekStackFrame().locals[0] === objRef).toBe(true)
    expect(thread.peekStackFrame().locals[1]).toBe(1)
    expect(thread.peekStackFrame().locals[2]).toBe(2.5)
    expect(thread.peekStackFrame().locals[4] === BigInt(3)).toBe(true)
  })
  test('INVOKEVIRTUAL: Undergoes value set conversion', () => {
    const ab = new ArrayBuffer(24)
    const code = new DataView(ab)
    let methodIdx = 0
    const testClass = testLoader.createClass({
      className: 'Test',
      constants: [
        () => ({
          tag: CONSTANT_TAG.Utf8,
          length: 5,
          value: '(FD)V'
        }),
        () => ({
          tag: CONSTANT_TAG.Utf8,
          length: 5,
          value: 'test0'
        }),
        () => ({
          tag: CONSTANT_TAG.Utf8,
          length: 4,
          value: 'Test'
        }),
        cPool => ({
          tag: CONSTANT_TAG.NameAndType,
          nameIndex: cPool.length - 2,
          descriptorIndex: cPool.length - 3
        }),
        cPool => ({
          tag: CONSTANT_TAG.Class,
          nameIndex: cPool.length - 2
        }),
        cPool => {
          methodIdx = cPool.length
          return {
            tag: CONSTANT_TAG.Methodref,
            classIndex: cPool.length - 1,
            nameAndTypeIndex: cPool.length - 2
          }
        }
      ],
      methods: [
        {
          accessFlags: [METHOD_FLAGS.ACC_PUBLIC],
          name: 'test0',
          descriptor: '(FD)V',
          attributes: [],
          code: code
        }
      ],
      loader: testLoader
    })
    code.setUint8(0, OPCODE.INVOKEVIRTUAL)
    code.setUint16(1, methodIdx)
    const method = testClass.getMethod('test0(FD)V')
    thread.invokeStackFrame(new JavaStackFrame(testClass, method as Method, 0, []))
    const objRef = new JvmObject(testClass)
    thread.pushStack(objRef)
    thread.pushStack(1.3)
    thread.pushStack64(1.3)
    thread.runFor(1)
    expect(thread.peekStackFrame().locals[1]).toBe(Math.fround(1.3))
    expect(thread.peekStackFrame().locals[2]).toBe(1.3)
  })
  test('INVOKEVIRTUAL: private method throws IllegalAccessError', () => {
    const ab = new ArrayBuffer(24)
    const code = new DataView(ab)
    let methodIdx = 0
    const superClass = testLoader.createClass({
      className: 'superClass',
      methods: [
        {
          accessFlags: [METHOD_FLAGS.ACC_PRIVATE],
          name: 'test0',
          descriptor: '(FD)V',
          attributes: [],
          code: new DataView(new ArrayBuffer(8))
        }
      ],
      loader: testLoader
    })
    const mainClass = testLoader.createClass({
      className: 'mainClass',
      superClass: superClass as ReferenceClassData,
      constants: [
        () => ({
          tag: CONSTANT_TAG.Utf8,
          length: 5,
          value: '(FD)V'
        }),
        () => ({
          tag: CONSTANT_TAG.Utf8,
          length: 5,
          value: 'test0'
        }),
        () => ({
          tag: CONSTANT_TAG.Utf8,
          length: 4,
          value: 'mainClass'
        }),
        cPool => ({
          tag: CONSTANT_TAG.NameAndType,
          nameIndex: cPool.length - 2,
          descriptorIndex: cPool.length - 3
        }),
        cPool => ({
          tag: CONSTANT_TAG.Class,
          nameIndex: cPool.length - 2
        }),
        cPool => {
          methodIdx = cPool.length
          return {
            tag: CONSTANT_TAG.Methodref,
            classIndex: cPool.length - 1,
            nameAndTypeIndex: cPool.length - 2
          }
        }
      ],
      methods: [
        {
          name: 'main',
          descriptor: '()V',
          attributes: [],
          code: code
        }
      ],
      loader: testLoader
    })

    code.setUint8(0, OPCODE.INVOKEVIRTUAL)
    code.setUint16(1, methodIdx)
    const method = mainClass.getMethod('main()V')
    thread.invokeStackFrame(new JavaStackFrame(mainClass, method as Method, 0, []))
    const objRef = new JvmObject(mainClass)
    thread.pushStack(objRef)
    thread.pushStack(1.3)
    thread.pushStack64(1.3)
    thread.runFor(1)
    const lastFrame = thread.peekStackFrame()
    expect(lastFrame.method).toBe(
      threadClass.getMethod('dispatchUncaughtException(Ljava/lang/Throwable;)V')
    )
    expect(thread.getPC()).toBe(0)
    const exceptionObj = lastFrame.locals[1] as JvmObject
    expect(exceptionObj.getClass().getName()).toBe('java/lang/IllegalAccessError')
  })
  test('INVOKEVIRTUAL: method lookup ok', () => {
    const ab = new ArrayBuffer(24)
    const code = new DataView(ab)
    let methodIdx = 0
    const mainClass = testLoader.createClass({
      className: 'mainClass',
      constants: [
        () => ({
          tag: CONSTANT_TAG.Utf8,
          length: 5,
          value: '()V'
        }),
        () => ({
          tag: CONSTANT_TAG.Utf8,
          length: 5,
          value: 'test0'
        }),
        () => ({
          tag: CONSTANT_TAG.Utf8,
          length: 4,
          value: 'mainClass'
        }),
        cPool => ({
          tag: CONSTANT_TAG.NameAndType,
          nameIndex: cPool.length - 2,
          descriptorIndex: cPool.length - 3
        }),
        cPool => ({
          tag: CONSTANT_TAG.Class,
          nameIndex: cPool.length - 2
        }),
        cPool => {
          methodIdx = cPool.length
          return {
            tag: CONSTANT_TAG.Methodref,
            classIndex: cPool.length - 1,
            nameAndTypeIndex: cPool.length - 2
          }
        }
      ],
      methods: [
        {
          accessFlags: [METHOD_FLAGS.ACC_STATIC],
          name: 'main',
          descriptor: '()V',
          attributes: [],
          code: code
        },
        {
          accessFlags: [METHOD_FLAGS.ACC_STATIC],
          name: 'test0',
          descriptor: '()V',
          attributes: [],
          code: new DataView(new ArrayBuffer(8))
        }
      ],
      loader: testLoader
    })

    code.setUint8(0, OPCODE.INVOKEVIRTUAL)
    code.setUint16(1, methodIdx)
    const method = mainClass.getMethod('main()V')
    thread.invokeStackFrame(new JavaStackFrame(mainClass, method as Method, 0, []))
    const objRef = new JvmObject(mainClass)
    thread.pushStack(objRef)
    thread.runFor(1)
    expect(thread.peekStackFrame().locals[0] === objRef).toBe(true)
  })
  test('INVOKEVIRTUAL: method lookup checks superclass', () => {
    const ab = new ArrayBuffer(24)
    const code = new DataView(ab)
    let methodIdx = 0
    const superClass = testLoader.createClass({
      className: 'superClass',
      methods: [
        {
          name: 'test0',
          descriptor: '()V',
          attributes: [],
          code: new DataView(new ArrayBuffer(8))
        }
      ],
      loader: testLoader
    })
    const mainClass = testLoader.createClass({
      className: 'mainClass',
      superClass: superClass as ReferenceClassData,
      constants: [
        () => ({
          tag: CONSTANT_TAG.Utf8,
          length: 5,
          value: '()V'
        }),
        () => ({
          tag: CONSTANT_TAG.Utf8,
          length: 5,
          value: 'test0'
        }),
        () => ({
          tag: CONSTANT_TAG.Utf8,
          length: 4,
          value: 'mainClass'
        }),
        cPool => ({
          tag: CONSTANT_TAG.NameAndType,
          nameIndex: cPool.length - 2,
          descriptorIndex: cPool.length - 3
        }),
        cPool => ({
          tag: CONSTANT_TAG.Class,
          nameIndex: cPool.length - 2
        }),
        cPool => {
          methodIdx = cPool.length
          return {
            tag: CONSTANT_TAG.Methodref,
            classIndex: cPool.length - 1,
            nameAndTypeIndex: cPool.length - 2
          }
        }
      ],
      methods: [
        {
          accessFlags: [METHOD_FLAGS.ACC_STATIC],
          name: 'main',
          descriptor: '()V',
          attributes: [],
          code: code
        }
      ],
      loader: testLoader
    })

    code.setUint8(0, OPCODE.INVOKEVIRTUAL)
    code.setUint16(1, methodIdx)
    const method = mainClass.getMethod('main()V')
    thread.invokeStackFrame(new JavaStackFrame(mainClass, method as Method, 0, []))
    const objRef = new JvmObject(superClass)
    thread.pushStack(objRef)
    thread.runFor(1)
    expect(thread.getClass().getName()).toBe('superClass')
    expect(thread.peekStackFrame().locals[0] === objRef).toBe(true)
  })
  test('INVOKEVIRTUAL: method lookup override OK', () => {
    const ab = new ArrayBuffer(24)
    const code = new DataView(ab)
    let methodIdx = 0
    const superClass = testLoader.createClass({
      className: 'superClass',
      methods: [
        {
          name: 'test0',
          descriptor: '()V',
          attributes: [],
          code: new DataView(new ArrayBuffer(8))
        }
      ],
      loader: testLoader
    })
    const mainClass = testLoader.createClass({
      className: 'mainClass',
      superClass: superClass as ReferenceClassData,
      constants: [
        () => ({
          tag: CONSTANT_TAG.Utf8,
          length: 5,
          value: '()V'
        }),
        () => ({
          tag: CONSTANT_TAG.Utf8,
          length: 5,
          value: 'test0'
        }),
        () => ({
          tag: CONSTANT_TAG.Utf8,
          length: 4,
          value: 'mainClass'
        }),
        cPool => ({
          tag: CONSTANT_TAG.NameAndType,
          nameIndex: cPool.length - 2,
          descriptorIndex: cPool.length - 3
        }),
        cPool => ({
          tag: CONSTANT_TAG.Class,
          nameIndex: cPool.length - 2
        }),
        cPool => {
          methodIdx = cPool.length
          return {
            tag: CONSTANT_TAG.Methodref,
            classIndex: cPool.length - 1,
            nameAndTypeIndex: cPool.length - 2
          }
        }
      ],
      methods: [
        {
          accessFlags: [METHOD_FLAGS.ACC_STATIC],
          name: 'main',
          descriptor: '()V',
          attributes: [],
          code: code
        },
        {
          name: 'test0',
          descriptor: '()V',
          attributes: [],
          code: new DataView(new ArrayBuffer(8))
        }
      ],
      loader: testLoader
    })

    code.setUint8(0, OPCODE.INVOKEVIRTUAL)
    code.setUint16(1, methodIdx)
    const method = mainClass.getMethod('main()V')
    thread.invokeStackFrame(new JavaStackFrame(mainClass, method as Method, 0, []))
    const objRef = new JvmObject(mainClass)
    thread.pushStack(objRef)
    thread.runFor(1)
    expect(thread.getClass().getName()).toBe('mainClass')
    expect(thread.peekStackFrame().locals[0] === objRef).toBe(true)
  })
  test('INVOKEVIRTUAL: objectref is null, throws a NullPointerException', () => {
    const ab = new ArrayBuffer(24)
    const code = new DataView(ab)
    let methodIdx = 0
    const mainClass = testLoader.createClass({
      className: 'mainClass',
      constants: [
        () => ({
          tag: CONSTANT_TAG.Utf8,
          length: 5,
          value: '()V'
        }),
        () => ({
          tag: CONSTANT_TAG.Utf8,
          length: 5,
          value: 'test0'
        }),
        () => ({
          tag: CONSTANT_TAG.Utf8,
          length: 4,
          value: 'mainClass'
        }),
        cPool => ({
          tag: CONSTANT_TAG.NameAndType,
          nameIndex: cPool.length - 2,
          descriptorIndex: cPool.length - 3
        }),
        cPool => ({
          tag: CONSTANT_TAG.Class,
          nameIndex: cPool.length - 2
        }),
        cPool => {
          methodIdx = cPool.length
          return {
            tag: CONSTANT_TAG.Methodref,
            classIndex: cPool.length - 1,
            nameAndTypeIndex: cPool.length - 2
          }
        }
      ],
      methods: [
        {
          accessFlags: [METHOD_FLAGS.ACC_STATIC],
          name: 'main',
          descriptor: '()V',
          attributes: [],
          code: code
        },
        {
          name: 'test0',
          descriptor: '()V',
          attributes: [],
          code: new DataView(new ArrayBuffer(8))
        }
      ],
      loader: testLoader
    })

    code.setUint8(0, OPCODE.INVOKEVIRTUAL)
    code.setUint16(1, methodIdx)
    const method = mainClass.getMethod('main()V')
    thread.invokeStackFrame(new JavaStackFrame(mainClass, method as Method, 0, []))
    thread.pushStack(null)
    thread.runFor(1)
    const lastFrame = thread.peekStackFrame()
    expect(lastFrame.method).toBe(
      threadClass.getMethod('dispatchUncaughtException(Ljava/lang/Throwable;)V')
    )
    expect(thread.getPC()).toBe(0)
    const exceptionObj = lastFrame.locals[1] as JvmObject
    expect(exceptionObj.getClass().getName()).toBe('java/lang/NullPointerException')
  })
  test('INVOKEVIRTUAL: lookup abstract method throws AbstractMethodError', () => {
    const ab = new ArrayBuffer(24)
    const code = new DataView(ab)
    let methodIdx = 0
    const mainClass = testLoader.createClass({
      className: 'mainClass',
      constants: [
        () => ({
          tag: CONSTANT_TAG.Utf8,
          length: 5,
          value: '()V'
        }),
        () => ({
          tag: CONSTANT_TAG.Utf8,
          length: 5,
          value: 'test0'
        }),
        () => ({
          tag: CONSTANT_TAG.Utf8,
          length: 4,
          value: 'mainClass'
        }),
        cPool => ({
          tag: CONSTANT_TAG.NameAndType,
          nameIndex: cPool.length - 2,
          descriptorIndex: cPool.length - 3
        }),
        cPool => ({
          tag: CONSTANT_TAG.Class,
          nameIndex: cPool.length - 2
        }),
        cPool => {
          methodIdx = cPool.length
          return {
            tag: CONSTANT_TAG.Methodref,
            classIndex: cPool.length - 1,
            nameAndTypeIndex: cPool.length - 2
          }
        }
      ],
      methods: [
        {
          accessFlags: [METHOD_FLAGS.ACC_STATIC],
          name: 'main',
          descriptor: '()V',
          attributes: [],
          code: code
        },
        {
          accessFlags: [METHOD_FLAGS.ACC_ABSTRACT],
          name: 'test0',
          descriptor: '()V',
          attributes: [],
          code: new DataView(new ArrayBuffer(8))
        }
      ],
      loader: testLoader
    })

    code.setUint8(0, OPCODE.INVOKEVIRTUAL)
    code.setUint16(1, methodIdx)
    const method = mainClass.getMethod('main()V')
    thread.invokeStackFrame(new JavaStackFrame(mainClass, method as Method, 0, []))
    const objRef = new JvmObject(mainClass)
    thread.pushStack(objRef)
    thread.runFor(1)
    const lastFrame = thread.peekStackFrame()
    expect(lastFrame.method).toBe(
      threadClass.getMethod('dispatchUncaughtException(Ljava/lang/Throwable;)V')
    )
    expect(thread.getPC()).toBe(0)
    const exceptionObj = lastFrame.locals[1] as JvmObject
    expect(exceptionObj.getClass().getName()).toBe('java/lang/AbstractMethodError')
  })
  test('INVOKEVIRTUAL: lookup method fails throws AbstractMethodError', () => {
    const ab = new ArrayBuffer(24)
    const code = new DataView(ab)
    let methodIdx = 0
    const failLookupClass = testLoader.createClass({
      className: 'mainClass',
      constants: [
        () => ({
          tag: CONSTANT_TAG.Utf8,
          length: 5,
          value: '()V'
        }),
        () => ({
          tag: CONSTANT_TAG.Utf8,
          length: 5,
          value: 'test0'
        }),
        () => ({
          tag: CONSTANT_TAG.Utf8,
          length: 4,
          value: 'mainClass'
        }),
        cPool => ({
          tag: CONSTANT_TAG.NameAndType,
          nameIndex: cPool.length - 2,
          descriptorIndex: cPool.length - 3
        }),
        cPool => ({
          tag: CONSTANT_TAG.Class,
          nameIndex: cPool.length - 2
        }),
        cPool => {
          methodIdx = cPool.length
          return {
            tag: CONSTANT_TAG.Methodref,
            classIndex: cPool.length - 1,
            nameAndTypeIndex: cPool.length - 2
          }
        }
      ],
      methods: [
        {
          accessFlags: [METHOD_FLAGS.ACC_STATIC],
          name: 'main',
          descriptor: '()V',
          attributes: [],
          code: code
        }
      ],
      loader: testLoader
    })
    const mainClass = testLoader.createClass({
      className: 'mainClass',
      constants: [
        () => ({
          tag: CONSTANT_TAG.Utf8,
          length: 5,
          value: '()V'
        }),
        () => ({
          tag: CONSTANT_TAG.Utf8,
          length: 5,
          value: 'test0'
        }),
        () => ({
          tag: CONSTANT_TAG.Utf8,
          length: 4,
          value: 'mainClass'
        }),
        cPool => ({
          tag: CONSTANT_TAG.NameAndType,
          nameIndex: cPool.length - 2,
          descriptorIndex: cPool.length - 3
        }),
        cPool => ({
          tag: CONSTANT_TAG.Class,
          nameIndex: cPool.length - 2
        }),
        cPool => {
          methodIdx = cPool.length
          return {
            tag: CONSTANT_TAG.Methodref,
            classIndex: cPool.length - 1,
            nameAndTypeIndex: cPool.length - 2
          }
        }
      ],
      methods: [
        {
          accessFlags: [METHOD_FLAGS.ACC_STATIC],
          name: 'main',
          descriptor: '()V',
          attributes: [],
          code: code
        },
        {
          accessFlags: [METHOD_FLAGS.ACC_ABSTRACT],
          name: 'test0',
          descriptor: '()V',
          attributes: [],
          code: new DataView(new ArrayBuffer(8))
        }
      ],
      loader: testLoader
    })

    code.setUint8(0, OPCODE.INVOKEVIRTUAL)
    code.setUint16(1, methodIdx)
    const method = mainClass.getMethod('main()V')
    thread.invokeStackFrame(new JavaStackFrame(mainClass, method as Method, 0, []))
    const objRef = new JvmObject(failLookupClass)
    thread.pushStack(objRef)
    thread.runFor(1)
    const lastFrame = thread.peekStackFrame()
    expect(lastFrame.method).toBe(
      threadClass.getMethod('dispatchUncaughtException(Ljava/lang/Throwable;)V')
    )
    expect(thread.getPC()).toBe(0)
    const exceptionObj = lastFrame.locals[1] as JvmObject
    expect(exceptionObj.getClass().getName()).toBe('java/lang/AbstractMethodError')
  })
})

describe('Invokeinterface', () => {
  test('INVOKEINTERFACE: static method invoked without error', () => {
    const ab = new ArrayBuffer(40)
    const code = new DataView(ab)
    let methodIdx = 0
    const interfaceClass = testLoader.createClass({
      className: 'interfaceClass',
      flags: ACCESS_FLAGS.ACC_INTERFACE,
      methods: [
        {
          accessFlags: [METHOD_FLAGS.ACC_ABSTRACT],
          name: 'test0',
          descriptor: '()V',
          attributes: [],
          code: new DataView(new ArrayBuffer(8))
        }
      ],
      loader: testLoader
    })
    const mainClass = testLoader.createClass({
      className: 'mainClass',
      constants: [
        () => ({
          tag: CONSTANT_TAG.Utf8,
          length: 5,
          value: '()V'
        }),
        () => ({
          tag: CONSTANT_TAG.Utf8,
          length: 5,
          value: 'test0'
        }),
        () => ({
          tag: CONSTANT_TAG.Utf8,
          length: 4,
          value: 'interfaceClass'
        }),
        cPool => ({
          tag: CONSTANT_TAG.NameAndType,
          nameIndex: cPool.length - 2,
          descriptorIndex: cPool.length - 3
        }),
        cPool => ({
          tag: CONSTANT_TAG.Class,
          nameIndex: cPool.length - 2
        }),
        cPool => {
          methodIdx = cPool.length
          return {
            tag: CONSTANT_TAG.InterfaceMethodref,
            classIndex: cPool.length - 1,
            nameAndTypeIndex: cPool.length - 2
          }
        }
      ],
      methods: [
        {
          accessFlags: [METHOD_FLAGS.ACC_STATIC],
          name: 'main',
          descriptor: '()V',
          attributes: [],
          code: code
        },
        {
          accessFlags: [METHOD_FLAGS.ACC_PUBLIC, METHOD_FLAGS.ACC_STATIC],
          name: 'test0',
          descriptor: '()V',
          attributes: [],
          code: new DataView(new ArrayBuffer(8))
        }
      ],
      interfaces: [interfaceClass as ReferenceClassData],
      loader: testLoader
    })

    code.setUint8(0, OPCODE.INVOKEINTERFACE)
    code.setUint16(1, methodIdx)
    code.setUint8(3, 0)
    code.setUint8(4, 0)

    const method = mainClass.getMethod('main()V') as Method
    thread.invokeStackFrame(new JavaStackFrame(mainClass, method as Method, 0, []))
    const objRef = new JvmObject(mainClass)
    thread.pushStack(objRef)
    thread.runFor(1)
    const lastFrame = thread.peekStackFrame()
    expect(lastFrame.method.getName()).toBe('test0')
    expect(lastFrame.method.getDescriptor()).toBe('()V')
    expect(thread.getPC()).toBe(0)
  })
  test('INVOKEINTERFACE: Pops args off stack per descriptor', () => {
    const ab = new ArrayBuffer(40)
    const code = new DataView(ab)
    let methodIdx = 0
    const interfaceClass = testLoader.createClass({
      className: 'interfaceClass',
      flags: ACCESS_FLAGS.ACC_INTERFACE,
      methods: [
        {
          accessFlags: [METHOD_FLAGS.ACC_ABSTRACT],
          name: 'test0',
          descriptor: '(FD)V',
          attributes: [],
          code: new DataView(new ArrayBuffer(8))
        }
      ],
      loader: testLoader
    })
    const mainClass = testLoader.createClass({
      className: 'mainClass',
      constants: [
        () => ({
          tag: CONSTANT_TAG.Utf8,
          length: 5,
          value: '(FD)V'
        }),
        () => ({
          tag: CONSTANT_TAG.Utf8,
          length: 5,
          value: 'test0'
        }),
        () => ({
          tag: CONSTANT_TAG.Utf8,
          length: 4,
          value: 'interfaceClass'
        }),
        cPool => ({
          tag: CONSTANT_TAG.NameAndType,
          nameIndex: cPool.length - 2,
          descriptorIndex: cPool.length - 3
        }),
        cPool => ({
          tag: CONSTANT_TAG.Class,
          nameIndex: cPool.length - 2
        }),
        cPool => {
          methodIdx = cPool.length
          return {
            tag: CONSTANT_TAG.InterfaceMethodref,
            classIndex: cPool.length - 1,
            nameAndTypeIndex: cPool.length - 2
          }
        }
      ],
      methods: [
        {
          accessFlags: [METHOD_FLAGS.ACC_STATIC],
          name: 'main',
          descriptor: '()V',
          attributes: [],
          code: code
        },
        {
          accessFlags: [METHOD_FLAGS.ACC_PUBLIC, METHOD_FLAGS.ACC_STATIC],
          name: 'test0',
          descriptor: '(FD)V',
          attributes: [],
          code: new DataView(new ArrayBuffer(8))
        }
      ],
      interfaces: [interfaceClass as ReferenceClassData],
      loader: testLoader
    })

    code.setUint8(0, OPCODE.INVOKEINTERFACE)
    code.setUint16(1, methodIdx)
    code.setUint8(3, 0)
    code.setUint8(4, 0)

    const method = mainClass.getMethod('main()V') as Method
    thread.invokeStackFrame(new JavaStackFrame(mainClass, method as Method, 0, []))
    const objRef = new JvmObject(mainClass)
    thread.pushStack(objRef)
    thread.pushStack(0.5)
    thread.pushStack64(0.5)
    thread.runFor(1)
    const lastFrame = thread.peekStackFrame()
    expect(lastFrame.method.getName()).toBe('test0')
    expect(lastFrame.method.getDescriptor()).toBe('(FD)V')
    expect(lastFrame.locals[0] === objRef).toBe(true)
    expect(lastFrame.locals[1]).toBe(0.5)
    expect(lastFrame.locals[2]).toBe(0.5)
    expect(thread.getPC()).toBe(0)
  })
  test('INVOKEINTERFACE: Undergoes value set conversion', () => {
    const ab = new ArrayBuffer(40)
    const code = new DataView(ab)
    let methodIdx = 0
    const interfaceClass = testLoader.createClass({
      className: 'interfaceClass',
      flags: ACCESS_FLAGS.ACC_INTERFACE,
      methods: [
        {
          accessFlags: [METHOD_FLAGS.ACC_ABSTRACT],
          name: 'test0',
          descriptor: '(FD)V',
          attributes: [],
          code: new DataView(new ArrayBuffer(8))
        }
      ],
      loader: testLoader
    })
    const mainClass = testLoader.createClass({
      className: 'mainClass',
      constants: [
        () => ({
          tag: CONSTANT_TAG.Utf8,
          length: 5,
          value: '(FD)V'
        }),
        () => ({
          tag: CONSTANT_TAG.Utf8,
          length: 5,
          value: 'test0'
        }),
        () => ({
          tag: CONSTANT_TAG.Utf8,
          length: 4,
          value: 'interfaceClass'
        }),
        cPool => ({
          tag: CONSTANT_TAG.NameAndType,
          nameIndex: cPool.length - 2,
          descriptorIndex: cPool.length - 3
        }),
        cPool => ({
          tag: CONSTANT_TAG.Class,
          nameIndex: cPool.length - 2
        }),
        cPool => {
          methodIdx = cPool.length
          return {
            tag: CONSTANT_TAG.InterfaceMethodref,
            classIndex: cPool.length - 1,
            nameAndTypeIndex: cPool.length - 2
          }
        }
      ],
      methods: [
        {
          accessFlags: [METHOD_FLAGS.ACC_STATIC],
          name: 'main',
          descriptor: '()V',
          attributes: [],
          code: code
        },
        {
          accessFlags: [METHOD_FLAGS.ACC_PUBLIC, METHOD_FLAGS.ACC_STATIC],
          name: 'test0',
          descriptor: '(FD)V',
          attributes: [],
          code: new DataView(new ArrayBuffer(8))
        }
      ],
      interfaces: [interfaceClass as ReferenceClassData],
      loader: testLoader
    })

    code.setUint8(0, OPCODE.INVOKEINTERFACE)
    code.setUint16(1, methodIdx)
    code.setUint8(3, 0)
    code.setUint8(4, 0)

    const method = mainClass.getMethod('main()V') as Method
    thread.invokeStackFrame(new JavaStackFrame(mainClass, method as Method, 0, []))
    const objRef = new JvmObject(mainClass)
    thread.pushStack(objRef)
    thread.pushStack(1.3)
    thread.pushStack64(1.3)
    thread.runFor(1)
    const lastFrame = thread.peekStackFrame()
    expect(lastFrame.method.getName()).toBe('test0')
    expect(lastFrame.method.getDescriptor()).toBe('(FD)V')
    expect(lastFrame.locals[0] === objRef).toBe(true)
    expect(lastFrame.locals[1]).toBe(Math.fround(1.3))
    expect(lastFrame.locals[2]).toBe(1.3)
    expect(thread.getPC()).toBe(0)
  })
  test('INVOKEINTERFACE: non public method throws IllegalAccessError', () => {
    const ab = new ArrayBuffer(40)
    const code = new DataView(ab)
    let methodIdx = 0
    const interfaceClass = testLoader.createClass({
      className: 'interfaceClass',
      flags: ACCESS_FLAGS.ACC_INTERFACE,
      methods: [
        {
          accessFlags: [METHOD_FLAGS.ACC_ABSTRACT],
          name: 'test0',
          descriptor: '()V',
          attributes: [],
          code: new DataView(new ArrayBuffer(8))
        }
      ],
      loader: testLoader
    })

    const objClass = testLoader.createClass({
      className: 'objClass',
      flags: ACCESS_FLAGS.ACC_INTERFACE,
      methods: [
        {
          accessFlags: [],
          name: 'test0',
          descriptor: '()V',
          attributes: [],
          code: new DataView(new ArrayBuffer(8))
        }
      ],
      interfaces: [interfaceClass as ReferenceClassData],
      loader: testLoader
    })

    const mainClass = testLoader.createClass({
      className: 'mainClass',
      constants: [
        () => ({
          tag: CONSTANT_TAG.Utf8,
          length: 5,
          value: '()V'
        }),
        () => ({
          tag: CONSTANT_TAG.Utf8,
          length: 5,
          value: 'test0'
        }),
        () => ({
          tag: CONSTANT_TAG.Utf8,
          length: 4,
          value: 'interfaceClass'
        }),
        cPool => ({
          tag: CONSTANT_TAG.NameAndType,
          nameIndex: cPool.length - 2,
          descriptorIndex: cPool.length - 3
        }),
        cPool => ({
          tag: CONSTANT_TAG.Class,
          nameIndex: cPool.length - 2
        }),
        cPool => {
          methodIdx = cPool.length
          return {
            tag: CONSTANT_TAG.InterfaceMethodref,
            classIndex: cPool.length - 1,
            nameAndTypeIndex: cPool.length - 2
          }
        }
      ],
      methods: [
        {
          accessFlags: [METHOD_FLAGS.ACC_STATIC],
          name: 'main',
          descriptor: '()V',
          attributes: [],
          code: code
        }
      ],
      loader: testLoader
    })

    code.setUint8(0, OPCODE.INVOKEINTERFACE)
    code.setUint16(1, methodIdx)
    code.setUint8(3, 0)
    code.setUint8(4, 0)

    const method = mainClass.getMethod('main()V') as Method
    thread.invokeStackFrame(new JavaStackFrame(mainClass, method as Method, 0, []))
    const objRef = new JvmObject(objClass)
    thread.pushStack(objRef)
    thread.runFor(1)
    const lastFrame = thread.peekStackFrame()
    expect(lastFrame.method).toBe(
      threadClass.getMethod('dispatchUncaughtException(Ljava/lang/Throwable;)V')
    )
    expect(thread.getPC()).toBe(0)
    const exceptionObj = lastFrame.locals[1] as JvmObject
    expect(exceptionObj.getClass().getName()).toBe('java/lang/IllegalAccessError')
  })
  test('INVOKEINTERFACE: abstract method throws AbstractMethodError', () => {
    const ab = new ArrayBuffer(40)
    const code = new DataView(ab)
    let methodIdx = 0
    const interfaceClass = testLoader.createClass({
      className: 'interfaceClass',
      flags: ACCESS_FLAGS.ACC_INTERFACE,
      methods: [
        {
          accessFlags: [METHOD_FLAGS.ACC_ABSTRACT],
          name: 'test0',
          descriptor: '()V',
          attributes: [],
          code: new DataView(new ArrayBuffer(8))
        }
      ],
      loader: testLoader
    })

    const objClass = testLoader.createClass({
      className: 'objClass',
      flags: ACCESS_FLAGS.ACC_INTERFACE,
      methods: [
        {
          accessFlags: [METHOD_FLAGS.ACC_PUBLIC, METHOD_FLAGS.ACC_ABSTRACT],
          name: 'test0',
          descriptor: '()V',
          attributes: [],
          code: new DataView(new ArrayBuffer(8))
        }
      ],
      interfaces: [interfaceClass as ReferenceClassData],
      loader: testLoader
    })

    const mainClass = testLoader.createClass({
      className: 'mainClass',
      constants: [
        () => ({
          tag: CONSTANT_TAG.Utf8,
          length: 5,
          value: '()V'
        }),
        () => ({
          tag: CONSTANT_TAG.Utf8,
          length: 5,
          value: 'test0'
        }),
        () => ({
          tag: CONSTANT_TAG.Utf8,
          length: 4,
          value: 'interfaceClass'
        }),
        cPool => ({
          tag: CONSTANT_TAG.NameAndType,
          nameIndex: cPool.length - 2,
          descriptorIndex: cPool.length - 3
        }),
        cPool => ({
          tag: CONSTANT_TAG.Class,
          nameIndex: cPool.length - 2
        }),
        cPool => {
          methodIdx = cPool.length
          return {
            tag: CONSTANT_TAG.InterfaceMethodref,
            classIndex: cPool.length - 1,
            nameAndTypeIndex: cPool.length - 2
          }
        }
      ],
      methods: [
        {
          accessFlags: [METHOD_FLAGS.ACC_STATIC],
          name: 'main',
          descriptor: '()V',
          attributes: [],
          code: code
        }
      ],
      loader: testLoader
    })

    code.setUint8(0, OPCODE.INVOKEINTERFACE)
    code.setUint16(1, methodIdx)
    code.setUint8(3, 0)
    code.setUint8(4, 0)

    const method = mainClass.getMethod('main()V') as Method
    thread.invokeStackFrame(new JavaStackFrame(mainClass, method as Method, 0, []))
    const objRef = new JvmObject(objClass)
    thread.pushStack(objRef)
    thread.runFor(1)
    const lastFrame = thread.peekStackFrame()
    expect(lastFrame.method).toBe(
      threadClass.getMethod('dispatchUncaughtException(Ljava/lang/Throwable;)V')
    )
    expect(thread.getPC()).toBe(0)
    const exceptionObj = lastFrame.locals[1] as JvmObject
    expect(exceptionObj.getClass().getName()).toBe('java/lang/AbstractMethodError')
  })
  test('INVOKEINTERFACE: multiple maximally specific throws IncompatibleClassChangeError', () => {
    const ab = new ArrayBuffer(40)
    const code = new DataView(ab)
    let methodIdx = 0
    const interfaceClass = testLoader.createClass({
      className: 'interfaceClass',
      flags: ACCESS_FLAGS.ACC_INTERFACE,
      methods: [
        {
          accessFlags: [METHOD_FLAGS.ACC_ABSTRACT],
          name: 'test0',
          descriptor: '()V',
          attributes: [],
          code: new DataView(new ArrayBuffer(8))
        }
      ],
      loader: testLoader
    })
    const superInterA = testLoader.createClass({
      className: 'superInterA',
      flags: ACCESS_FLAGS.ACC_INTERFACE,
      methods: [
        {
          accessFlags: [METHOD_FLAGS.ACC_PUBLIC],
          name: 'test0',
          descriptor: '()V',
          attributes: [],
          code: new DataView(new ArrayBuffer(8))
        }
      ],
      loader: testLoader
    })
    const superInterB = testLoader.createClass({
      className: 'superInterB',
      flags: ACCESS_FLAGS.ACC_INTERFACE,
      methods: [
        {
          accessFlags: [METHOD_FLAGS.ACC_PUBLIC],
          name: 'test0',
          descriptor: '()V',
          attributes: [],
          code: new DataView(new ArrayBuffer(8))
        }
      ],
      loader: testLoader
    })

    const objClass = testLoader.createClass({
      className: 'objClass',
      flags: ACCESS_FLAGS.ACC_INTERFACE,
      interfaces: [
        interfaceClass as ReferenceClassData,
        superInterA as ReferenceClassData,
        superInterB as ReferenceClassData
      ],
      loader: testLoader
    })

    const mainClass = testLoader.createClass({
      className: 'mainClass',
      constants: [
        () => ({
          tag: CONSTANT_TAG.Utf8,
          length: 5,
          value: '()V'
        }),
        () => ({
          tag: CONSTANT_TAG.Utf8,
          length: 5,
          value: 'test0'
        }),
        () => ({
          tag: CONSTANT_TAG.Utf8,
          length: 4,
          value: 'interfaceClass'
        }),
        cPool => ({
          tag: CONSTANT_TAG.NameAndType,
          nameIndex: cPool.length - 2,
          descriptorIndex: cPool.length - 3
        }),
        cPool => ({
          tag: CONSTANT_TAG.Class,
          nameIndex: cPool.length - 2
        }),
        cPool => {
          methodIdx = cPool.length
          return {
            tag: CONSTANT_TAG.Methodref,
            classIndex: cPool.length - 1,
            nameAndTypeIndex: cPool.length - 2
          }
        }
      ],
      methods: [
        {
          accessFlags: [METHOD_FLAGS.ACC_STATIC],
          name: 'main',
          descriptor: '()V',
          attributes: [],
          code: code
        }
      ],
      loader: testLoader
    })

    code.setUint8(0, OPCODE.INVOKEINTERFACE)
    code.setUint16(1, methodIdx)
    code.setUint8(3, 0)
    code.setUint8(4, 0)

    const method = mainClass.getMethod('main()V') as Method
    thread.invokeStackFrame(new JavaStackFrame(mainClass, method as Method, 0, []))
    const objRef = new JvmObject(objClass)
    thread.pushStack(objRef)
    thread.runFor(1)
    const lastFrame = thread.peekStackFrame()
    expect(lastFrame.method.getName() + lastFrame.method.getDescriptor()).toBe(
      'dispatchUncaughtException(Ljava/lang/Throwable;)V'
    )
    expect(thread.getPC()).toBe(0)
    const exceptionObj = lastFrame.locals[1] as JvmObject
    expect(exceptionObj.getClass().getName()).toBe('java/lang/IncompatibleClassChangeError')
  })
  test('INVOKEINTERFACE: no non abstract method throws AbstractMethodError', () => {
    const ab = new ArrayBuffer(40)
    const code = new DataView(ab)
    let methodIdx = 0
    const interfaceClass = testLoader.createClass({
      className: 'interfaceClass',
      flags: ACCESS_FLAGS.ACC_INTERFACE,
      methods: [
        {
          accessFlags: [METHOD_FLAGS.ACC_ABSTRACT],
          name: 'test0',
          descriptor: '()V',
          attributes: [],
          code: new DataView(new ArrayBuffer(8))
        }
      ],
      loader: testLoader
    })

    const objClass = testLoader.createClass({
      className: 'objClass',
      flags: ACCESS_FLAGS.ACC_INTERFACE,
      interfaces: [interfaceClass as ReferenceClassData],
      loader: testLoader
    })

    const mainClass = testLoader.createClass({
      className: 'mainClass',
      constants: [
        () => ({
          tag: CONSTANT_TAG.Utf8,
          length: 5,
          value: '()V'
        }),
        () => ({
          tag: CONSTANT_TAG.Utf8,
          length: 5,
          value: 'test0'
        }),
        () => ({
          tag: CONSTANT_TAG.Utf8,
          length: 4,
          value: 'interfaceClass'
        }),
        cPool => ({
          tag: CONSTANT_TAG.NameAndType,
          nameIndex: cPool.length - 2,
          descriptorIndex: cPool.length - 3
        }),
        cPool => ({
          tag: CONSTANT_TAG.Class,
          nameIndex: cPool.length - 2
        }),
        cPool => {
          methodIdx = cPool.length
          return {
            tag: CONSTANT_TAG.InterfaceMethodref,
            classIndex: cPool.length - 1,
            nameAndTypeIndex: cPool.length - 2
          }
        }
      ],
      methods: [
        {
          accessFlags: [METHOD_FLAGS.ACC_STATIC],
          name: 'main',
          descriptor: '()V',
          attributes: [],
          code: code
        }
      ],
      loader: testLoader
    })

    code.setUint8(0, OPCODE.INVOKEINTERFACE)
    code.setUint16(1, methodIdx)
    code.setUint8(3, 0)
    code.setUint8(4, 0)

    const method = mainClass.getMethod('main()V') as Method
    thread.invokeStackFrame(new JavaStackFrame(mainClass, method as Method, 0, []))
    const objRef = new JvmObject(objClass)
    thread.pushStack(objRef)
    thread.runFor(1)
    const lastFrame = thread.peekStackFrame()
    expect(lastFrame.method.getName() + lastFrame.method.getDescriptor()).toBe(
      'dispatchUncaughtException(Ljava/lang/Throwable;)V'
    )
    expect(thread.getPC()).toBe(0)
    const exceptionObj = lastFrame.locals[1] as JvmObject
    expect(exceptionObj.getClass().getName()).toBe('java/lang/AbstractMethodError')
  })
})

describe('invokespecial', () => {
  test('INVOKESPECIAL: static method invoked without error', () => {
    const ab = new ArrayBuffer(24)
    const code = new DataView(ab)
    let methodIdx = 0
    const superClass = testLoader.createClass({
      className: 'superClass',
      methods: [
        {
          name: '<init>',
          descriptor: '()V',
          attributes: [],
          code: new DataView(new ArrayBuffer(8))
        }
      ],
      loader: testLoader
    })

    const objClass = testLoader.createClass({
      className: 'objClass',
      methods: [
        {
          accessFlags: [METHOD_FLAGS.ACC_PUBLIC, METHOD_FLAGS.ACC_STATIC],
          name: '<init>',
          descriptor: '()V',
          attributes: [],
          code: new DataView(new ArrayBuffer(8))
        }
      ],
      superClass: superClass as ReferenceClassData,
      loader: testLoader
    })

    const mainClass = testLoader.createClass({
      className: 'mainClass',
      constants: [
        () => ({
          tag: CONSTANT_TAG.Utf8,
          length: 5,
          value: '()V'
        }),
        () => ({
          tag: CONSTANT_TAG.Utf8,
          length: 5,
          value: '<init>'
        }),
        () => ({
          tag: CONSTANT_TAG.Utf8,
          length: 4,
          value: 'objClass'
        }),
        cPool => ({
          tag: CONSTANT_TAG.NameAndType,
          nameIndex: cPool.length - 2,
          descriptorIndex: cPool.length - 3
        }),
        cPool => ({
          tag: CONSTANT_TAG.Class,
          nameIndex: cPool.length - 2
        }),
        cPool => {
          methodIdx = cPool.length
          return {
            tag: CONSTANT_TAG.Methodref,
            classIndex: cPool.length - 1,
            nameAndTypeIndex: cPool.length - 2
          }
        }
      ],
      methods: [
        {
          accessFlags: [METHOD_FLAGS.ACC_STATIC],
          name: 'main',
          descriptor: '()V',
          attributes: [],
          code: code
        }
      ],
      loader: testLoader
    })
    code.setUint8(0, OPCODE.INVOKESPECIAL)
    code.setUint16(1, methodIdx)

    const method = mainClass.getMethod('main()V') as Method
    thread.invokeStackFrame(new JavaStackFrame(mainClass, method as Method, 0, []))
    const objRef = new JvmObject(objClass)
    thread.pushStack(objRef)
    thread.runFor(1)
    const lastFrame = thread.peekStackFrame()
    expect(thread.getPC()).toBe(0)
    expect(lastFrame.method.getName()).toBe('<init>')
    expect(lastFrame.method.getDescriptor()).toBe('()V')
    expect(thread.getPC()).toBe(0)
  })
  test('INVOKESPECIAL: Pops args off stack per descriptor', () => {
    const ab = new ArrayBuffer(24)
    const code = new DataView(ab)
    let methodIdx = 0
    const superClass = testLoader.createClass({
      className: 'superClass',
      methods: [
        {
          name: '<init>',
          descriptor: '(FD)V',
          attributes: [],
          code: new DataView(new ArrayBuffer(8))
        }
      ],
      loader: testLoader
    })

    const objClass = testLoader.createClass({
      className: 'objClass',
      methods: [
        {
          accessFlags: [METHOD_FLAGS.ACC_PUBLIC, METHOD_FLAGS.ACC_STATIC],
          name: '<init>',
          descriptor: '(FD)V',
          attributes: [],
          code: new DataView(new ArrayBuffer(8))
        }
      ],
      superClass: superClass as ReferenceClassData,
      loader: testLoader
    })

    const mainClass = testLoader.createClass({
      className: 'mainClass',
      constants: [
        () => ({
          tag: CONSTANT_TAG.Utf8,
          length: 5,
          value: '(FD)V'
        }),
        () => ({
          tag: CONSTANT_TAG.Utf8,
          length: 5,
          value: '<init>'
        }),
        () => ({
          tag: CONSTANT_TAG.Utf8,
          length: 4,
          value: 'objClass'
        }),
        cPool => ({
          tag: CONSTANT_TAG.NameAndType,
          nameIndex: cPool.length - 2,
          descriptorIndex: cPool.length - 3
        }),
        cPool => ({
          tag: CONSTANT_TAG.Class,
          nameIndex: cPool.length - 2
        }),
        cPool => {
          methodIdx = cPool.length
          return {
            tag: CONSTANT_TAG.Methodref,
            classIndex: cPool.length - 1,
            nameAndTypeIndex: cPool.length - 2
          }
        }
      ],
      methods: [
        {
          accessFlags: [METHOD_FLAGS.ACC_STATIC],
          name: 'main',
          descriptor: '()V',
          attributes: [],
          code: code
        }
      ],
      loader: testLoader
    })
    code.setUint8(0, OPCODE.INVOKESPECIAL)
    code.setUint16(1, methodIdx)

    const method = mainClass.getMethod('main()V') as Method
    thread.invokeStackFrame(new JavaStackFrame(mainClass, method as Method, 0, []))
    const objRef = new JvmObject(objClass)
    thread.pushStack(objRef)
    thread.pushStack(0.5)
    thread.pushStack64(0.5)
    thread.runFor(1)
    const lastFrame = thread.peekStackFrame()
    expect(lastFrame.method.getName()).toBe('<init>')
    expect(lastFrame.method.getDescriptor()).toBe('(FD)V')
    expect(lastFrame.locals[0] === objRef).toBe(true)
    expect(lastFrame.locals[1]).toBe(0.5)
    expect(lastFrame.locals[2]).toBe(0.5)
    expect(thread.getPC()).toBe(0)
  })
  test('INVOKESPECIAL: Undergoes value set conversion', () => {
    const ab = new ArrayBuffer(24)
    const code = new DataView(ab)
    let methodIdx = 0
    const superClass = testLoader.createClass({
      className: 'superClass',
      methods: [
        {
          name: '<init>',
          descriptor: '(FD)V',
          attributes: [],
          code: new DataView(new ArrayBuffer(8))
        }
      ],
      loader: testLoader
    })

    const objClass = testLoader.createClass({
      className: 'objClass',
      methods: [
        {
          accessFlags: [METHOD_FLAGS.ACC_PUBLIC, METHOD_FLAGS.ACC_STATIC],
          name: '<init>',
          descriptor: '(FD)V',
          attributes: [],
          code: new DataView(new ArrayBuffer(8))
        }
      ],
      superClass: superClass as ReferenceClassData,
      loader: testLoader
    })

    const mainClass = testLoader.createClass({
      className: 'mainClass',
      constants: [
        () => ({
          tag: CONSTANT_TAG.Utf8,
          length: 5,
          value: '(FD)V'
        }),
        () => ({
          tag: CONSTANT_TAG.Utf8,
          length: 5,
          value: '<init>'
        }),
        () => ({
          tag: CONSTANT_TAG.Utf8,
          length: 4,
          value: 'objClass'
        }),
        cPool => ({
          tag: CONSTANT_TAG.NameAndType,
          nameIndex: cPool.length - 2,
          descriptorIndex: cPool.length - 3
        }),
        cPool => ({
          tag: CONSTANT_TAG.Class,
          nameIndex: cPool.length - 2
        }),
        cPool => {
          methodIdx = cPool.length
          return {
            tag: CONSTANT_TAG.Methodref,
            classIndex: cPool.length - 1,
            nameAndTypeIndex: cPool.length - 2
          }
        }
      ],
      methods: [
        {
          accessFlags: [METHOD_FLAGS.ACC_STATIC],
          name: 'main',
          descriptor: '()V',
          attributes: [],
          code: code
        }
      ],
      loader: testLoader
    })
    code.setUint8(0, OPCODE.INVOKESPECIAL)
    code.setUint16(1, methodIdx)

    const method = mainClass.getMethod('main()V') as Method
    thread.invokeStackFrame(new JavaStackFrame(mainClass, method as Method, 0, []))
    const objRef = new JvmObject(objClass)
    thread.pushStack(objRef)
    thread.pushStack(1.3)
    thread.pushStack64(1.3)
    thread.runFor(1)
    const lastFrame = thread.peekStackFrame()
    expect(lastFrame.method.getName()).toBe('<init>')
    expect(lastFrame.method.getDescriptor()).toBe('(FD)V')
    expect(lastFrame.locals[0] === objRef).toBe(true)
    expect(lastFrame.locals[1]).toBe(Math.fround(1.3))
    expect(lastFrame.locals[2]).toBe(1.3)
    expect(thread.getPC()).toBe(0)
  })
  test('INVOKESPECIAL: Interface method ref ok', () => {
    const ab = new ArrayBuffer(40)
    const code = new DataView(ab)
    let methodIdx = 0
    const objClass = testLoader.createClass({
      className: 'java/lang/Object',
      methods: [
        {
          accessFlags: [METHOD_FLAGS.ACC_PUBLIC],
          name: '<init>',
          descriptor: '()V',
          attributes: [],
          code: new DataView(new ArrayBuffer(8))
        }
      ],
      loader: testLoader
    })
    const interfaceClass = testLoader.createClass({
      className: 'interfaceClass',
      flags: ACCESS_FLAGS.ACC_INTERFACE,
      methods: [],
      superClass: objClass as ReferenceClassData,
      loader: testLoader
    })
    const mainClass = testLoader.createClass({
      className: 'mainClass',
      constants: [
        () => ({
          tag: CONSTANT_TAG.Utf8,
          length: 5,
          value: '()V'
        }),
        () => ({
          tag: CONSTANT_TAG.Utf8,
          length: 5,
          value: '<init>'
        }),
        () => ({
          tag: CONSTANT_TAG.Utf8,
          length: 4,
          value: 'interfaceClass'
        }),
        cPool => ({
          tag: CONSTANT_TAG.NameAndType,
          nameIndex: cPool.length - 2,
          descriptorIndex: cPool.length - 3
        }),
        cPool => ({
          tag: CONSTANT_TAG.Class,
          nameIndex: cPool.length - 2
        }),
        cPool => {
          methodIdx = cPool.length
          return {
            tag: CONSTANT_TAG.InterfaceMethodref,
            classIndex: cPool.length - 1,
            nameAndTypeIndex: cPool.length - 2
          }
        }
      ],
      methods: [
        {
          accessFlags: [METHOD_FLAGS.ACC_STATIC],
          name: 'main',
          descriptor: '()V',
          attributes: [],
          code: code
        }
      ],
      interfaces: [interfaceClass as ReferenceClassData],
      loader: testLoader
    })

    code.setUint8(0, OPCODE.INVOKESPECIAL)
    code.setUint16(1, methodIdx)
    const method = mainClass.getMethod('main()V') as Method
    thread.invokeStackFrame(new JavaStackFrame(mainClass, method as Method, 0, []))
    const objRef = new JvmObject(interfaceClass)
    thread.pushStack(objRef)
    thread.runFor(1)
    const lastFrame = thread.peekStackFrame()
    expect(lastFrame.method.getName()).toBe('<init>')
    expect(lastFrame.method.getDescriptor()).toBe('()V')
    expect(lastFrame.locals[0] === objRef).toBe(true)
    expect(thread.getPC()).toBe(0)
  })
  test('INVOKESPECIAL: abstract method throws AbstractMethodError', () => {
    const ab = new ArrayBuffer(24)
    const code = new DataView(ab)
    let methodIdx = 0
    const superClass = testLoader.createClass({
      className: 'superClass',
      methods: [
        {
          name: '<init>',
          descriptor: '()V',
          attributes: [],
          code: new DataView(new ArrayBuffer(8))
        }
      ],
      loader: testLoader
    })

    const objClass = testLoader.createClass({
      className: 'objClass',
      methods: [
        {
          accessFlags: [METHOD_FLAGS.ACC_ABSTRACT],
          name: '<init>',
          descriptor: '()V',
          attributes: [],
          code: new DataView(new ArrayBuffer(8))
        }
      ],
      superClass: superClass as ReferenceClassData,
      loader: testLoader
    })

    const mainClass = testLoader.createClass({
      className: 'mainClass',
      constants: [
        () => ({
          tag: CONSTANT_TAG.Utf8,
          length: 5,
          value: '()V'
        }),
        () => ({
          tag: CONSTANT_TAG.Utf8,
          length: 5,
          value: '<init>'
        }),
        () => ({
          tag: CONSTANT_TAG.Utf8,
          length: 4,
          value: 'objClass'
        }),
        cPool => ({
          tag: CONSTANT_TAG.NameAndType,
          nameIndex: cPool.length - 2,
          descriptorIndex: cPool.length - 3
        }),
        cPool => ({
          tag: CONSTANT_TAG.Class,
          nameIndex: cPool.length - 2
        }),
        cPool => {
          methodIdx = cPool.length
          return {
            tag: CONSTANT_TAG.Methodref,
            classIndex: cPool.length - 1,
            nameAndTypeIndex: cPool.length - 2
          }
        }
      ],
      methods: [
        {
          accessFlags: [METHOD_FLAGS.ACC_STATIC],
          name: 'main',
          descriptor: '()V',
          attributes: [],
          code: code
        }
      ],
      loader: testLoader
    })
    code.setUint8(0, OPCODE.INVOKESPECIAL)
    code.setUint16(1, methodIdx)

    const method = mainClass.getMethod('main()V') as Method
    thread.invokeStackFrame(new JavaStackFrame(mainClass, method as Method, 0, []))
    const objRef = new JvmObject(objClass)
    thread.pushStack(objRef)
    thread.runFor(1)
    const lastFrame = thread.peekStackFrame()
    expect(lastFrame.method).toBe(
      threadClass.getMethod('dispatchUncaughtException(Ljava/lang/Throwable;)V')
    )
    expect(thread.getPC()).toBe(0)
    const exceptionObj = lastFrame.locals[1] as JvmObject
    expect(exceptionObj.getClass().getName()).toBe('java/lang/AbstractMethodError')
  })
  test('INVOKESPECIAL: multiple maximally specific throws IncompatibleClassChangeError', () => {
    const ab = new ArrayBuffer(24)
    const code = new DataView(ab)
    let methodIdx = 0
    const superInterA = testLoader.createClass({
      className: 'superInterA',
      flags: ACCESS_FLAGS.ACC_INTERFACE,
      methods: [
        {
          accessFlags: [METHOD_FLAGS.ACC_PUBLIC],
          name: '<init>',
          descriptor: '()V',
          attributes: [],
          code: new DataView(new ArrayBuffer(8))
        }
      ],
      loader: testLoader
    })
    const superInterB = testLoader.createClass({
      className: 'superInterB',
      flags: ACCESS_FLAGS.ACC_INTERFACE,
      methods: [
        {
          accessFlags: [METHOD_FLAGS.ACC_PUBLIC],
          name: '<init>',
          descriptor: '()V',
          attributes: [],
          code: new DataView(new ArrayBuffer(8))
        }
      ],
      loader: testLoader
    })

    const objClass = testLoader.createClass({
      className: 'objClass',
      interfaces: [superInterA as ReferenceClassData, superInterB as ReferenceClassData],
      loader: testLoader
    })

    const mainClass = testLoader.createClass({
      className: 'mainClass',
      constants: [
        () => ({
          tag: CONSTANT_TAG.Utf8,
          length: 5,
          value: '()V'
        }),
        () => ({
          tag: CONSTANT_TAG.Utf8,
          length: 5,
          value: '<init>'
        }),
        () => ({
          tag: CONSTANT_TAG.Utf8,
          length: 4,
          value: 'superInterA'
        }),
        cPool => ({
          tag: CONSTANT_TAG.NameAndType,
          nameIndex: cPool.length - 2,
          descriptorIndex: cPool.length - 3
        }),
        cPool => ({
          tag: CONSTANT_TAG.Class,
          nameIndex: cPool.length - 2
        }),
        cPool => {
          methodIdx = cPool.length
          return {
            tag: CONSTANT_TAG.Methodref,
            classIndex: cPool.length - 1,
            nameAndTypeIndex: cPool.length - 2
          }
        }
      ],
      methods: [
        {
          accessFlags: [METHOD_FLAGS.ACC_STATIC],
          name: 'main',
          descriptor: '()V',
          attributes: [],
          code: code
        }
      ],
      loader: testLoader
    })
    code.setUint8(0, OPCODE.INVOKESPECIAL)
    code.setUint16(1, methodIdx)

    const method = mainClass.getMethod('main()V') as Method
    thread.invokeStackFrame(new JavaStackFrame(mainClass, method as Method, 0, []))
    const objRef = new JvmObject(objClass)
    thread.pushStack(objRef)
    thread.runFor(1)
    const lastFrame = thread.peekStackFrame()
    expect(lastFrame.method).toBe(
      threadClass.getMethod('dispatchUncaughtException(Ljava/lang/Throwable;)V')
    )
    expect(thread.getPC()).toBe(0)
    const exceptionObj = lastFrame.locals[1] as JvmObject
    expect(exceptionObj.getClass().getName()).toBe('java/lang/IncompatibleClassChangeError')
  })
})

describe('Getstatic', () => {
  test('GETSTATIC: Initializes class', () => {
    const ab = new ArrayBuffer(24)
    const code = new DataView(ab)
    let fieldIdx = 0
    const testClass = testLoader.createClass({
      className: 'Test',
      constants: [
        () => ({
          tag: CONSTANT_TAG.Utf8,
          length: 11,
          value: 'staticField'
        }),
        () => ({
          tag: CONSTANT_TAG.Utf8,
          length: 1,
          value: 'I'
        }),
        () => ({
          tag: CONSTANT_TAG.Utf8,
          length: 4,
          value: 'Test'
        }),
        cPool => ({
          tag: CONSTANT_TAG.NameAndType,
          nameIndex: cPool.length - 3,
          descriptorIndex: cPool.length - 2
        }),
        cPool => ({
          tag: CONSTANT_TAG.Class,
          nameIndex: cPool.length - 2
        }),
        cPool => {
          fieldIdx = cPool.length
          return {
            tag: CONSTANT_TAG.Fieldref,
            classIndex: cPool.length - 1,
            nameAndTypeIndex: cPool.length - 2
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
      fields: [
        {
          accessFlags: [FIELD_FLAGS.ACC_PUBLIC, FIELD_FLAGS.ACC_STATIC],
          name: 'staticField',
          descriptor: 'I',
          attributes: []
        }
      ],
      loader: testLoader
    })
    code.setUint8(0, OPCODE.GETSTATIC)
    code.setUint16(1, fieldIdx)
    const method = testClass.getMethod('test0()V') as Method

    thread.invokeStackFrame(new JavaStackFrame(testClass, method as Method, 0, []))
    expect(testClass.status).toBe(CLASS_STATUS.PREPARED)
    thread.runFor(1)
    expect(testClass.status).toBe(CLASS_STATUS.INITIALIZED)
  })
  test('GETSTATIC: Gets static int', () => {
    const ab = new ArrayBuffer(24)
    const code = new DataView(ab)
    let fieldIdx = 0
    const testClass = testLoader.createClass({
      className: 'Test',
      constants: [
        () => ({
          tag: CONSTANT_TAG.Utf8,
          length: 11,
          value: 'staticField'
        }),
        () => ({
          tag: CONSTANT_TAG.Utf8,
          length: 1,
          value: 'I'
        }),
        () => ({
          tag: CONSTANT_TAG.Utf8,
          length: 4,
          value: 'Test'
        }),
        cPool => ({
          tag: CONSTANT_TAG.NameAndType,
          nameIndex: cPool.length - 3,
          descriptorIndex: cPool.length - 2
        }),
        cPool => ({
          tag: CONSTANT_TAG.Class,
          nameIndex: cPool.length - 2
        }),
        cPool => {
          fieldIdx = cPool.length
          return {
            tag: CONSTANT_TAG.Fieldref,
            classIndex: cPool.length - 1,
            nameAndTypeIndex: cPool.length - 2
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
      fields: [
        {
          accessFlags: [FIELD_FLAGS.ACC_PUBLIC, FIELD_FLAGS.ACC_STATIC],
          name: 'staticField',
          descriptor: 'I',
          attributes: []
        }
      ],
      loader: testLoader
    })
    testClass.lookupField('staticFieldI')?.putValue(5)
    code.setUint8(0, OPCODE.GETSTATIC)
    code.setUint16(1, fieldIdx)

    const method = testClass.getMethod('test0()V') as Method

    thread.invokeStackFrame(new JavaStackFrame(testClass, method as Method, 0, []))
    thread.runFor(1)
    expect((thread.popStack() as SuccessResult<any>).result).toBe(5)
    expect(thread.peekStackFrame().operandStack.length).toBe(0)
  })
  test('GETSTATIC: Gets static long', () => {
    const ab = new ArrayBuffer(24)
    const code = new DataView(ab)
    let fieldIdx = 0
    const testClass = testLoader.createClass({
      className: 'Test',
      constants: [
        () => ({
          tag: CONSTANT_TAG.Utf8,
          length: 11,
          value: 'staticField'
        }),
        () => ({
          tag: CONSTANT_TAG.Utf8,
          length: 1,
          value: 'J'
        }),
        () => ({
          tag: CONSTANT_TAG.Utf8,
          length: 4,
          value: 'Test'
        }),
        cPool => ({
          tag: CONSTANT_TAG.NameAndType,
          nameIndex: cPool.length - 3,
          descriptorIndex: cPool.length - 2
        }),
        cPool => ({
          tag: CONSTANT_TAG.Class,
          nameIndex: cPool.length - 2
        }),
        cPool => {
          fieldIdx = cPool.length
          return {
            tag: CONSTANT_TAG.Fieldref,
            classIndex: cPool.length - 1,
            nameAndTypeIndex: cPool.length - 2
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
      fields: [
        {
          accessFlags: [FIELD_FLAGS.ACC_PUBLIC, FIELD_FLAGS.ACC_STATIC],
          name: 'staticField',
          descriptor: 'J',
          attributes: []
        }
      ],
      loader: testLoader
    })
    testClass.lookupField('staticFieldJ')?.putValue(BigInt(5))
    code.setUint8(0, OPCODE.GETSTATIC)
    code.setUint16(1, fieldIdx)

    const method = testClass.getMethod('test0()V') as Method

    thread.invokeStackFrame(new JavaStackFrame(testClass, method as Method, 0, []))
    thread.runFor(1)
    expect((thread.popStack64() as SuccessResult<any>).result === BigInt(5)).toBe(true)
    expect(thread.peekStackFrame().operandStack.length).toBe(0)
  })
  test('GETSTATIC: gets inherited static long', () => {
    const ab = new ArrayBuffer(24)
    const code = new DataView(ab)
    let fieldIdx = 0
    const superClass = testLoader.createClass({
      className: 'SuperClass',
      fields: [
        {
          accessFlags: [FIELD_FLAGS.ACC_STATIC],
          name: 'staticField',
          descriptor: 'J',
          attributes: []
        }
      ],
      loader: testLoader
    })
    const mainClass = testLoader.createClass({
      className: 'mainClass',
      superClass: superClass as ReferenceClassData,
      constants: [
        () => ({
          tag: CONSTANT_TAG.Utf8,
          length: 11,
          value: 'staticField'
        }),
        () => ({
          tag: CONSTANT_TAG.Utf8,
          length: 1,
          value: 'J'
        }),
        () => ({
          tag: CONSTANT_TAG.Utf8,
          length: 4,
          value: 'SuperClass'
        }),
        cPool => ({
          tag: CONSTANT_TAG.NameAndType,
          nameIndex: cPool.length - 3,
          descriptorIndex: cPool.length - 2
        }),
        cPool => ({
          tag: CONSTANT_TAG.Class,
          nameIndex: cPool.length - 2
        }),
        cPool => {
          fieldIdx = cPool.length
          return {
            tag: CONSTANT_TAG.Fieldref,
            classIndex: cPool.length - 1,
            nameAndTypeIndex: cPool.length - 2
          }
        }
      ],
      methods: [
        {
          accessFlags: [METHOD_FLAGS.ACC_STATIC],
          name: 'main',
          descriptor: '()V',
          attributes: [],
          code: code
        }
      ],
      loader: testLoader
    })
    superClass.lookupField('staticFieldJ')?.putValue(BigInt(5))
    code.setUint8(0, OPCODE.GETSTATIC)
    code.setUint16(1, fieldIdx)

    const method = mainClass.getMethod('main()V') as Method
    thread.invokeStackFrame(new JavaStackFrame(mainClass, method as Method, 0, []))
    thread.runFor(1)
    expect((thread.popStack64() as SuccessResult<any>).result === BigInt(5)).toBe(true)
    expect(thread.peekStackFrame().operandStack.length).toBe(0)
  })
  test('GETSTATIC: private static int throws IllegalAccessError', () => {
    const ab = new ArrayBuffer(24)
    const code = new DataView(ab)
    let fieldIdx = 0
    const superClass = testLoader.createClass({
      className: 'SuperClass',
      fields: [
        {
          accessFlags: [FIELD_FLAGS.ACC_PRIVATE, FIELD_FLAGS.ACC_STATIC],
          name: 'staticField',
          descriptor: 'J',
          attributes: []
        }
      ],
      loader: testLoader
    })
    const mainClass = testLoader.createClass({
      className: 'mainClass',
      superClass: superClass as ReferenceClassData,
      constants: [
        () => ({
          tag: CONSTANT_TAG.Utf8,
          length: 11,
          value: 'staticField'
        }),
        () => ({
          tag: CONSTANT_TAG.Utf8,
          length: 1,
          value: 'J'
        }),
        () => ({
          tag: CONSTANT_TAG.Utf8,
          length: 4,
          value: 'SuperClass'
        }),
        cPool => ({
          tag: CONSTANT_TAG.NameAndType,
          nameIndex: cPool.length - 3,
          descriptorIndex: cPool.length - 2
        }),
        cPool => ({
          tag: CONSTANT_TAG.Class,
          nameIndex: cPool.length - 2
        }),
        cPool => {
          fieldIdx = cPool.length
          return {
            tag: CONSTANT_TAG.Fieldref,
            classIndex: cPool.length - 1,
            nameAndTypeIndex: cPool.length - 2
          }
        }
      ],
      methods: [
        {
          accessFlags: [METHOD_FLAGS.ACC_STATIC],
          name: 'main',
          descriptor: '()V',
          attributes: [],
          code: code
        }
      ],
      loader: testLoader
    })
    superClass.lookupField('staticFieldJ')?.putValue(BigInt(5))

    code.setUint8(0, OPCODE.GETSTATIC)
    code.setUint16(1, fieldIdx)

    const method = mainClass.getMethod('main()V') as Method
    thread.invokeStackFrame(new JavaStackFrame(mainClass, method as Method, 0, []))
    thread.runFor(1)
    const lastFrame = thread.peekStackFrame()
    expect(lastFrame.method).toBe(
      threadClass.getMethod('dispatchUncaughtException(Ljava/lang/Throwable;)V')
    )
    expect(thread.getPC()).toBe(0)
    const exceptionObj = lastFrame.locals[1] as JvmObject
    expect(exceptionObj.getClass().getName()).toBe('java/lang/IllegalAccessError')
  })
  test('GETSTATIC: non static int throws IncompatibleClassChangeError', () => {
    const ab = new ArrayBuffer(24)
    const code = new DataView(ab)
    let fieldIdx = 0
    const superClass = testLoader.createClass({
      className: 'SuperClass',
      fields: [
        {
          name: 'staticField',
          descriptor: 'J',
          attributes: []
        }
      ],
      loader: testLoader
    })
    const mainClass = testLoader.createClass({
      className: 'mainClass',
      superClass: superClass as ReferenceClassData,
      constants: [
        () => ({
          tag: CONSTANT_TAG.Utf8,
          length: 11,
          value: 'staticField'
        }),
        () => ({
          tag: CONSTANT_TAG.Utf8,
          length: 1,
          value: 'J'
        }),
        () => ({
          tag: CONSTANT_TAG.Utf8,
          length: 4,
          value: 'SuperClass'
        }),
        cPool => ({
          tag: CONSTANT_TAG.NameAndType,
          nameIndex: cPool.length - 3,
          descriptorIndex: cPool.length - 2
        }),
        cPool => ({
          tag: CONSTANT_TAG.Class,
          nameIndex: cPool.length - 2
        }),
        cPool => {
          fieldIdx = cPool.length
          return {
            tag: CONSTANT_TAG.Fieldref,
            classIndex: cPool.length - 1,
            nameAndTypeIndex: cPool.length - 2
          }
        }
      ],
      methods: [
        {
          accessFlags: [METHOD_FLAGS.ACC_STATIC],
          name: 'main',
          descriptor: '()V',
          attributes: [],
          code: code
        }
      ],
      loader: testLoader
    })
    superClass.lookupField('staticFieldJ')?.putValue(BigInt(5))

    code.setUint8(0, OPCODE.GETSTATIC)
    code.setUint16(1, fieldIdx)

    const method = mainClass.getMethod('main()V') as Method
    thread.invokeStackFrame(new JavaStackFrame(mainClass, method as Method, 0, []))
    thread.runFor(1)
    const lastFrame = thread.peekStackFrame()
    expect(lastFrame.method.getName() + lastFrame.method.getDescriptor()).toBe(
      'dispatchUncaughtException(Ljava/lang/Throwable;)V'
    )
    expect(thread.getPC()).toBe(0)
    const exceptionObj = lastFrame.locals[1] as JvmObject
    expect(exceptionObj.getClass().getName()).toBe('java/lang/IncompatibleClassChangeError')
  })
  test('GETSTATIC: Invalid field throws NoSuchFieldError', () => {
    const ab = new ArrayBuffer(24)
    const code = new DataView(ab)
    let fieldIdx = 0
    const testClass = testLoader.createClass({
      className: 'Test',
      constants: [
        () => ({
          tag: CONSTANT_TAG.Utf8,
          length: 11,
          value: 'staticField'
        }),
        () => ({
          tag: CONSTANT_TAG.Utf8,
          length: 1,
          value: 'J'
        }),
        () => ({
          tag: CONSTANT_TAG.Utf8,
          length: 4,
          value: 'Test'
        }),
        cPool => ({
          tag: CONSTANT_TAG.NameAndType,
          nameIndex: cPool.length - 3,
          descriptorIndex: cPool.length - 2
        }),
        cPool => ({
          tag: CONSTANT_TAG.Class,
          nameIndex: cPool.length - 2
        }),
        cPool => {
          fieldIdx = cPool.length
          return {
            tag: CONSTANT_TAG.Fieldref,
            classIndex: cPool.length - 1,
            nameAndTypeIndex: cPool.length - 2
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
      fields: [],
      loader: testLoader
    })
    code.setUint8(0, OPCODE.GETSTATIC)
    code.setUint16(1, fieldIdx)

    const method = testClass.getMethod('test0()V') as Method

    thread.invokeStackFrame(new JavaStackFrame(testClass, method as Method, 0, []))
    thread.runFor(1)
    const lastFrame = thread.peekStackFrame()
    expect(lastFrame.method).toBe(
      threadClass.getMethod('dispatchUncaughtException(Ljava/lang/Throwable;)V')
    )
    expect(thread.getPC()).toBe(0)
    const exceptionObj = lastFrame.locals[1] as JvmObject
    expect(exceptionObj.getClass().getName()).toBe('java/lang/NoSuchFieldError')
  })
})

describe('Putstatic', () => {
  test('PUTSTATIC: Initializes class', () => {
    const ab = new ArrayBuffer(24)
    const code = new DataView(ab)
    let fieldIdx = 0
    const testClass = testLoader.createClass({
      className: 'Test',
      constants: [
        () => ({
          tag: CONSTANT_TAG.Utf8,
          length: 11,
          value: 'staticField'
        }),
        () => ({
          tag: CONSTANT_TAG.Utf8,
          length: 1,
          value: 'I'
        }),
        () => ({
          tag: CONSTANT_TAG.Utf8,
          length: 4,
          value: 'Test'
        }),
        cPool => ({
          tag: CONSTANT_TAG.NameAndType,
          nameIndex: cPool.length - 3,
          descriptorIndex: cPool.length - 2
        }),
        cPool => ({
          tag: CONSTANT_TAG.Class,
          nameIndex: cPool.length - 2
        }),
        cPool => {
          fieldIdx = cPool.length
          return {
            tag: CONSTANT_TAG.Fieldref,
            classIndex: cPool.length - 1,
            nameAndTypeIndex: cPool.length - 2
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
      fields: [
        {
          accessFlags: [FIELD_FLAGS.ACC_PUBLIC, FIELD_FLAGS.ACC_STATIC],
          name: 'staticField',
          descriptor: 'I',
          attributes: []
        }
      ],
      loader: testLoader
    })
    code.setUint8(0, OPCODE.PUTSTATIC)
    code.setUint16(1, fieldIdx)
    const method = testClass.getMethod('test0()V') as Method

    thread.invokeStackFrame(new JavaStackFrame(testClass, method as Method, 0, []))
    thread.pushStack(5)
    expect(testClass.status).toBe(CLASS_STATUS.PREPARED)
    thread.runFor(1)
    expect(testClass.status).toBe(CLASS_STATUS.INITIALIZED)
  })
  test('PUTSTATIC: Puts static int', () => {
    const ab = new ArrayBuffer(24)
    const code = new DataView(ab)
    let fieldIdx = 0
    const testClass = testLoader.createClass({
      className: 'Test',
      constants: [
        () => ({
          tag: CONSTANT_TAG.Utf8,
          length: 11,
          value: 'staticField'
        }),
        () => ({
          tag: CONSTANT_TAG.Utf8,
          length: 1,
          value: 'I'
        }),
        () => ({
          tag: CONSTANT_TAG.Utf8,
          length: 4,
          value: 'Test'
        }),
        cPool => ({
          tag: CONSTANT_TAG.NameAndType,
          nameIndex: cPool.length - 3,
          descriptorIndex: cPool.length - 2
        }),
        cPool => ({
          tag: CONSTANT_TAG.Class,
          nameIndex: cPool.length - 2
        }),
        cPool => {
          fieldIdx = cPool.length
          return {
            tag: CONSTANT_TAG.Fieldref,
            classIndex: cPool.length - 1,
            nameAndTypeIndex: cPool.length - 2
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
      fields: [
        {
          accessFlags: [FIELD_FLAGS.ACC_PUBLIC, FIELD_FLAGS.ACC_STATIC],
          name: 'staticField',
          descriptor: 'I',
          attributes: []
        }
      ],
      loader: testLoader
    })
    code.setUint8(0, OPCODE.PUTSTATIC)
    code.setUint16(1, fieldIdx)
    const method = testClass.getMethod('test0()V') as Method

    thread.invokeStackFrame(new JavaStackFrame(testClass, method as Method, 0, []))
    thread.pushStack(5)
    thread.runFor(1)
    expect(testClass.lookupField('staticFieldI')?.getValue()).toBe(5)
    expect(thread.peekStackFrame().operandStack.length).toBe(0)
  })
  test('PUTSTATIC: Puts static long', () => {
    const ab = new ArrayBuffer(24)
    const code = new DataView(ab)
    let fieldIdx = 0
    const testClass = testLoader.createClass({
      className: 'Test',
      constants: [
        () => ({
          tag: CONSTANT_TAG.Utf8,
          length: 11,
          value: 'staticField'
        }),
        () => ({
          tag: CONSTANT_TAG.Utf8,
          length: 1,
          value: 'J'
        }),
        () => ({
          tag: CONSTANT_TAG.Utf8,
          length: 4,
          value: 'Test'
        }),
        cPool => ({
          tag: CONSTANT_TAG.NameAndType,
          nameIndex: cPool.length - 3,
          descriptorIndex: cPool.length - 2
        }),
        cPool => ({
          tag: CONSTANT_TAG.Class,
          nameIndex: cPool.length - 2
        }),
        cPool => {
          fieldIdx = cPool.length
          return {
            tag: CONSTANT_TAG.Fieldref,
            classIndex: cPool.length - 1,
            nameAndTypeIndex: cPool.length - 2
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
      fields: [
        {
          accessFlags: [FIELD_FLAGS.ACC_PUBLIC, FIELD_FLAGS.ACC_STATIC],
          name: 'staticField',
          descriptor: 'J',
          attributes: []
        }
      ],
      loader: testLoader
    })

    code.setUint8(0, OPCODE.PUTSTATIC)
    code.setUint16(1, fieldIdx)
    const method = testClass.getMethod('test0()V') as Method

    thread.invokeStackFrame(new JavaStackFrame(testClass, method as Method, 0, []))
    thread.pushStack64(BigInt(5))
    thread.runFor(1)
    expect(testClass.lookupField('staticFieldJ')?.getValue() === BigInt(5)).toBe(true)
    expect(thread.peekStackFrame().operandStack.length).toBe(0)
  })
  test('PUTSTATIC: Puts inherited static long', () => {
    const ab = new ArrayBuffer(24)
    const code = new DataView(ab)
    let fieldIdx = 0
    const superClass = testLoader.createClass({
      className: 'SuperClass',
      fields: [
        {
          accessFlags: [FIELD_FLAGS.ACC_STATIC],
          name: 'staticField',
          descriptor: 'J',
          attributes: []
        }
      ],
      loader: testLoader
    })
    const mainClass = testLoader.createClass({
      className: 'mainClass',
      superClass: superClass as ReferenceClassData,
      constants: [
        () => ({
          tag: CONSTANT_TAG.Utf8,
          length: 11,
          value: 'staticField'
        }),
        () => ({
          tag: CONSTANT_TAG.Utf8,
          length: 1,
          value: 'J'
        }),
        () => ({
          tag: CONSTANT_TAG.Utf8,
          length: 4,
          value: 'SuperClass'
        }),
        cPool => ({
          tag: CONSTANT_TAG.NameAndType,
          nameIndex: cPool.length - 3,
          descriptorIndex: cPool.length - 2
        }),
        cPool => ({
          tag: CONSTANT_TAG.Class,
          nameIndex: cPool.length - 2
        }),
        cPool => {
          fieldIdx = cPool.length
          return {
            tag: CONSTANT_TAG.Fieldref,
            classIndex: cPool.length - 1,
            nameAndTypeIndex: cPool.length - 2
          }
        }
      ],
      methods: [
        {
          accessFlags: [METHOD_FLAGS.ACC_STATIC],
          name: 'main',
          descriptor: '()V',
          attributes: [],
          code: code
        }
      ],
      loader: testLoader
    })
    code.setUint8(0, OPCODE.PUTSTATIC)
    code.setUint16(1, fieldIdx)

    const method = mainClass.getMethod('main()V') as Method
    thread.invokeStackFrame(new JavaStackFrame(mainClass, method as Method, 0, []))
    thread.pushStack64(BigInt(5))
    thread.runFor(1)
    expect(superClass.lookupField('staticFieldJ')?.getValue() === BigInt(5)).toBe(true)
    expect(thread.peekStackFrame().operandStack.length).toBe(0)
  })
  test('PUTSTATIC: private static int throws IllegalAccessError', () => {
    const ab = new ArrayBuffer(24)
    const code = new DataView(ab)
    let fieldIdx = 0
    const superClass = testLoader.createClass({
      className: 'SuperClass',
      fields: [
        {
          accessFlags: [FIELD_FLAGS.ACC_PRIVATE, FIELD_FLAGS.ACC_STATIC],
          name: 'staticField',
          descriptor: 'J',
          attributes: []
        }
      ],
      loader: testLoader
    })
    const mainClass = testLoader.createClass({
      className: 'mainClass',
      superClass: superClass as ReferenceClassData,
      constants: [
        () => ({
          tag: CONSTANT_TAG.Utf8,
          length: 11,
          value: 'staticField'
        }),
        () => ({
          tag: CONSTANT_TAG.Utf8,
          length: 1,
          value: 'J'
        }),
        () => ({
          tag: CONSTANT_TAG.Utf8,
          length: 4,
          value: 'SuperClass'
        }),
        cPool => ({
          tag: CONSTANT_TAG.NameAndType,
          nameIndex: cPool.length - 3,
          descriptorIndex: cPool.length - 2
        }),
        cPool => ({
          tag: CONSTANT_TAG.Class,
          nameIndex: cPool.length - 2
        }),
        cPool => {
          fieldIdx = cPool.length
          return {
            tag: CONSTANT_TAG.Fieldref,
            classIndex: cPool.length - 1,
            nameAndTypeIndex: cPool.length - 2
          }
        }
      ],
      methods: [
        {
          accessFlags: [METHOD_FLAGS.ACC_STATIC],
          name: 'main',
          descriptor: '()V',
          attributes: [],
          code: code
        }
      ],
      loader: testLoader
    })
    superClass.lookupField('staticFieldJ')?.putValue(BigInt(5))

    code.setUint8(0, OPCODE.PUTSTATIC)
    code.setUint16(1, fieldIdx)
    const method = mainClass.getMethod('main()V') as Method
    thread.invokeStackFrame(new JavaStackFrame(mainClass, method as Method, 0, []))
    thread.pushStack(5)
    thread.runFor(1)
    const lastFrame = thread.peekStackFrame()
    expect(lastFrame.method).toBe(
      threadClass.getMethod('dispatchUncaughtException(Ljava/lang/Throwable;)V')
    )
    expect(thread.getPC()).toBe(0)
    const exceptionObj = lastFrame.locals[1] as JvmObject
    expect(exceptionObj.getClass().getName()).toBe('java/lang/IllegalAccessError')
  })
  test('PUTSTATIC: non static int throws IncompatibleClassChangeError', () => {
    const ab = new ArrayBuffer(24)
    const code = new DataView(ab)
    let fieldIdx = 0
    const superClass = testLoader.createClass({
      className: 'SuperClass',
      fields: [
        {
          name: 'staticField',
          descriptor: 'J',
          attributes: []
        }
      ],
      loader: testLoader
    })
    const mainClass = testLoader.createClass({
      className: 'mainClass',
      superClass: superClass as ReferenceClassData,
      constants: [
        () => ({
          tag: CONSTANT_TAG.Utf8,
          length: 11,
          value: 'staticField'
        }),
        () => ({
          tag: CONSTANT_TAG.Utf8,
          length: 1,
          value: 'J'
        }),
        () => ({
          tag: CONSTANT_TAG.Utf8,
          length: 4,
          value: 'SuperClass'
        }),
        cPool => ({
          tag: CONSTANT_TAG.NameAndType,
          nameIndex: cPool.length - 3,
          descriptorIndex: cPool.length - 2
        }),
        cPool => ({
          tag: CONSTANT_TAG.Class,
          nameIndex: cPool.length - 2
        }),
        cPool => {
          fieldIdx = cPool.length
          return {
            tag: CONSTANT_TAG.Fieldref,
            classIndex: cPool.length - 1,
            nameAndTypeIndex: cPool.length - 2
          }
        }
      ],
      methods: [
        {
          accessFlags: [METHOD_FLAGS.ACC_STATIC],
          name: 'main',
          descriptor: '()V',
          attributes: [],
          code: code
        }
      ],
      loader: testLoader
    })
    superClass.lookupField('staticFieldJ')?.putValue(BigInt(5))

    code.setUint8(0, OPCODE.PUTSTATIC)
    code.setUint16(1, fieldIdx)
    const method = mainClass.getMethod('main()V') as Method
    thread.invokeStackFrame(new JavaStackFrame(mainClass, method as Method, 0, []))
    thread.pushStack(5)
    thread.runFor(1)
    const lastFrame = thread.peekStackFrame()
    expect(lastFrame.method).toBe(
      threadClass.getMethod('dispatchUncaughtException(Ljava/lang/Throwable;)V')
    )
    expect(thread.getPC()).toBe(0)
    const exceptionObj = lastFrame.locals[1] as JvmObject
    expect(exceptionObj.getClass().getName()).toBe('java/lang/IncompatibleClassChangeError')
  })
  test('PUTSTATIC: Invalid field throws NoSuchFieldError', () => {
    const ab = new ArrayBuffer(24)
    const code = new DataView(ab)
    let fieldIdx = 0
    const testClass = testLoader.createClass({
      className: 'Test',
      constants: [
        () => ({
          tag: CONSTANT_TAG.Utf8,
          length: 11,
          value: 'staticField'
        }),
        () => ({
          tag: CONSTANT_TAG.Utf8,
          length: 1,
          value: 'J'
        }),
        () => ({
          tag: CONSTANT_TAG.Utf8,
          length: 4,
          value: 'Test'
        }),
        cPool => ({
          tag: CONSTANT_TAG.NameAndType,
          nameIndex: cPool.length - 3,
          descriptorIndex: cPool.length - 2
        }),
        cPool => ({
          tag: CONSTANT_TAG.Class,
          nameIndex: cPool.length - 2
        }),
        cPool => {
          fieldIdx = cPool.length
          return {
            tag: CONSTANT_TAG.Fieldref,
            classIndex: cPool.length - 1,
            nameAndTypeIndex: cPool.length - 2
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
      fields: [],
      loader: testLoader
    })
    code.setUint8(0, OPCODE.PUTSTATIC)
    code.setUint16(1, fieldIdx)

    const method = testClass.getMethod('test0()V') as Method

    thread.invokeStackFrame(new JavaStackFrame(testClass, method as Method, 0, []))
    thread.pushStack(5)
    thread.runFor(1)
    const lastFrame = thread.peekStackFrame()
    expect(lastFrame.method).toBe(
      threadClass.getMethod('dispatchUncaughtException(Ljava/lang/Throwable;)V')
    )
    expect(thread.getPC()).toBe(0)
    const exceptionObj = lastFrame.locals[1] as JvmObject
    expect(exceptionObj.getClass().getName()).toBe('java/lang/NoSuchFieldError')
  })
  test('PUTSTATIC: final static int outside init throws IllegalAccessError', () => {
    const ab = new ArrayBuffer(24)
    const code = new DataView(ab)
    let fieldIdx = 0
    const superClass = testLoader.createClass({
      className: 'SuperClass',
      fields: [
        {
          accessFlags: [FIELD_FLAGS.ACC_FINAL, FIELD_FLAGS.ACC_STATIC],
          name: 'staticField',
          descriptor: 'J',
          attributes: []
        }
      ],
      loader: testLoader
    })
    const mainClass = testLoader.createClass({
      className: 'mainClass',
      superClass: superClass as ReferenceClassData,
      constants: [
        () => ({
          tag: CONSTANT_TAG.Utf8,
          length: 11,
          value: 'staticField'
        }),
        () => ({
          tag: CONSTANT_TAG.Utf8,
          length: 1,
          value: 'J'
        }),
        () => ({
          tag: CONSTANT_TAG.Utf8,
          length: 4,
          value: 'SuperClass'
        }),
        cPool => ({
          tag: CONSTANT_TAG.NameAndType,
          nameIndex: cPool.length - 3,
          descriptorIndex: cPool.length - 2
        }),
        cPool => ({
          tag: CONSTANT_TAG.Class,
          nameIndex: cPool.length - 2
        }),
        cPool => {
          fieldIdx = cPool.length
          return {
            tag: CONSTANT_TAG.Fieldref,
            classIndex: cPool.length - 1,
            nameAndTypeIndex: cPool.length - 2
          }
        }
      ],
      methods: [
        {
          accessFlags: [METHOD_FLAGS.ACC_STATIC],
          name: 'main',
          descriptor: '()V',
          attributes: [],
          code: code
        }
      ],
      loader: testLoader
    })
    superClass.lookupField('staticFieldJ')?.putValue(BigInt(5))

    code.setUint8(0, OPCODE.PUTSTATIC)
    code.setUint16(1, fieldIdx)
    const method = mainClass.getMethod('main()V') as Method
    thread.invokeStackFrame(new JavaStackFrame(mainClass, method as Method, 0, []))
    thread.pushStack(5)
    thread.runFor(1)
    const lastFrame = thread.peekStackFrame()
    expect(lastFrame.method).toBe(
      threadClass.getMethod('dispatchUncaughtException(Ljava/lang/Throwable;)V')
    )
    expect(thread.getPC()).toBe(0)
    const exceptionObj = lastFrame.locals[1] as JvmObject
    expect(exceptionObj.getClass().getName()).toBe('java/lang/IllegalAccessError')
  })
  test('PUTSTATIC: final static int inside init ok', () => {
    const ab = new ArrayBuffer(24)
    const code = new DataView(ab)
    let fieldIdx = 0
    const mainClass = testLoader.createClass({
      className: 'MainClass',
      superClass: null,

      fields: [
        {
          accessFlags: [FIELD_FLAGS.ACC_FINAL, FIELD_FLAGS.ACC_STATIC],
          name: 'staticField',
          descriptor: 'I'
        }
      ],
      constants: [
        () => ({
          tag: CONSTANT_TAG.Utf8,
          length: 11,
          value: 'staticField'
        }),
        () => ({
          tag: CONSTANT_TAG.Utf8,
          length: 1,
          value: 'I'
        }),
        () => ({
          tag: CONSTANT_TAG.Utf8,
          length: 4,
          value: 'MainClass'
        }),
        cPool => ({
          tag: CONSTANT_TAG.NameAndType,
          nameIndex: cPool.length - 3,
          descriptorIndex: cPool.length - 2
        }),
        cPool => ({
          tag: CONSTANT_TAG.Class,
          nameIndex: cPool.length - 2
        }),
        cPool => {
          fieldIdx = cPool.length
          return {
            tag: CONSTANT_TAG.Fieldref,
            classIndex: cPool.length - 1,
            nameAndTypeIndex: cPool.length - 2
          }
        }
      ],
      methods: [
        {
          accessFlags: [METHOD_FLAGS.ACC_STATIC],
          name: '<clinit>',
          descriptor: '()V',
          attributes: [],
          code: code
        }
      ],
      loader: testLoader
    })
    code.setUint8(0, OPCODE.PUTSTATIC)
    code.setUint16(1, fieldIdx)
    mainClass.initialize(thread)
    thread.pushStack(5)
    thread.runFor(1)
    expect(mainClass.lookupField('staticFieldI')?.getValue()).toBe(5)
    expect(thread.peekStackFrame().operandStack.length).toBe(0)
  })

  test('PUTSTATIC: final static int from child init throws IllegalAccessError', () => {
    const ab = new ArrayBuffer(24)
    const code = new DataView(ab)
    let fieldIdx = 0
    const superClass = testLoader.createClass({
      className: 'SuperClass',
      fields: [
        {
          accessFlags: [FIELD_FLAGS.ACC_STATIC, FIELD_FLAGS.ACC_FINAL],
          name: 'staticField',
          descriptor: 'I',
          attributes: []
        }
      ],
      loader: testLoader
    })
    const mainClass = testLoader.createClass({
      className: 'mainClass',
      status: CLASS_STATUS.INITIALIZING,
      superClass: superClass as ReferenceClassData,
      constants: [
        () => ({
          tag: CONSTANT_TAG.Utf8,
          length: 11,
          value: 'staticField'
        }),
        () => ({
          tag: CONSTANT_TAG.Utf8,
          length: 1,
          value: 'I'
        }),
        () => ({
          tag: CONSTANT_TAG.Utf8,
          length: 4,
          value: 'mainClass'
        }),
        cPool => ({
          tag: CONSTANT_TAG.NameAndType,
          nameIndex: cPool.length - 3,
          descriptorIndex: cPool.length - 2
        }),
        cPool => ({
          tag: CONSTANT_TAG.Class,
          nameIndex: cPool.length - 2
        }),
        cPool => {
          fieldIdx = cPool.length
          return {
            tag: CONSTANT_TAG.Fieldref,
            classIndex: cPool.length - 1,
            nameAndTypeIndex: cPool.length - 2
          }
        }
      ],
      methods: [
        {
          accessFlags: [METHOD_FLAGS.ACC_STATIC],
          name: '<clinit>',
          descriptor: '()V',
          attributes: [],
          code: code
        }
      ],
      loader: testLoader
    })
    code.setUint8(0, OPCODE.PUTSTATIC)
    code.setUint16(1, fieldIdx)

    const method = mainClass.getMethod('<clinit>()V') as Method
    thread.invokeStackFrame(new JavaStackFrame(mainClass, method as Method, 0, []))
    thread.pushStack(5)
    thread.runFor(1)
    const lastFrame = thread.peekStackFrame()
    expect(lastFrame.method.getName() + lastFrame.method.getDescriptor()).toBe(
      'dispatchUncaughtException(Ljava/lang/Throwable;)V'
    )
    expect(thread.getPC()).toBe(0)
    const exceptionObj = lastFrame.locals[1] as JvmObject
    expect(exceptionObj.getClass().getName()).toBe('java/lang/IllegalAccessError')
  })
  test('PUTSTATIC: float undergoes value set conversion', () => {
    const ab = new ArrayBuffer(24)
    const code = new DataView(ab)
    let fieldIdx = 0
    const testClass = testLoader.createClass({
      className: 'Test',
      constants: [
        () => ({
          tag: CONSTANT_TAG.Utf8,
          length: 11,
          value: 'staticField'
        }),
        () => ({
          tag: CONSTANT_TAG.Utf8,
          length: 1,
          value: 'F'
        }),
        () => ({
          tag: CONSTANT_TAG.Utf8,
          length: 4,
          value: 'Test'
        }),
        cPool => ({
          tag: CONSTANT_TAG.NameAndType,
          nameIndex: cPool.length - 3,
          descriptorIndex: cPool.length - 2
        }),
        cPool => ({
          tag: CONSTANT_TAG.Class,
          nameIndex: cPool.length - 2
        }),
        cPool => {
          fieldIdx = cPool.length
          return {
            tag: CONSTANT_TAG.Fieldref,
            classIndex: cPool.length - 1,
            nameAndTypeIndex: cPool.length - 2
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
      fields: [
        {
          accessFlags: [FIELD_FLAGS.ACC_PUBLIC, FIELD_FLAGS.ACC_STATIC],
          name: 'staticField',
          descriptor: 'F',
          attributes: []
        }
      ],
      loader: testLoader
    })
    code.setUint8(0, OPCODE.PUTSTATIC)
    code.setUint16(1, fieldIdx)
    const method = testClass.getMethod('test0()V') as Method

    thread.invokeStackFrame(new JavaStackFrame(testClass, method as Method, 0, []))
    thread.pushStack(1.3)
    thread.runFor(1)
    expect(testClass.lookupField('staticFieldF')?.getValue()).toBe(Math.fround(1.3))
    expect(thread.peekStackFrame().operandStack.length).toBe(0)
  })
  test('PUTSTATIC: int to boolean narrowed', () => {
    const ab = new ArrayBuffer(24)
    const code = new DataView(ab)
    let fieldIdx = 0
    const testClass = testLoader.createClass({
      className: 'Test',
      constants: [
        () => ({
          tag: CONSTANT_TAG.Utf8,
          length: 11,
          value: 'staticField'
        }),
        () => ({
          tag: CONSTANT_TAG.Utf8,
          length: 1,
          value: 'Z'
        }),
        () => ({
          tag: CONSTANT_TAG.Utf8,
          length: 4,
          value: 'Test'
        }),
        cPool => ({
          tag: CONSTANT_TAG.NameAndType,
          nameIndex: cPool.length - 3,
          descriptorIndex: cPool.length - 2
        }),
        cPool => ({
          tag: CONSTANT_TAG.Class,
          nameIndex: cPool.length - 2
        }),
        cPool => {
          fieldIdx = cPool.length
          return {
            tag: CONSTANT_TAG.Fieldref,
            classIndex: cPool.length - 1,
            nameAndTypeIndex: cPool.length - 2
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
      fields: [
        {
          accessFlags: [FIELD_FLAGS.ACC_PUBLIC, FIELD_FLAGS.ACC_STATIC],
          name: 'staticField',
          descriptor: 'Z',
          attributes: []
        }
      ],
      loader: testLoader
    })
    code.setUint8(0, OPCODE.PUTSTATIC)
    code.setUint16(1, fieldIdx)
    const method = testClass.getMethod('test0()V') as Method

    thread.invokeStackFrame(new JavaStackFrame(testClass, method as Method, 0, []))
    thread.pushStack(3)
    thread.runFor(1)
    expect(testClass.lookupField('staticFieldZ')?.getValue()).toBe(1)
    expect(thread.peekStackFrame().operandStack.length).toBe(0)
  })
})

describe('New', () => {
  test('NEW: creates new object', () => {
    const ab = new ArrayBuffer(24)
    const code = new DataView(ab)
    let classIdx = 0
    const testClass = testLoader.createClass({
      className: 'Test',
      constants: [
        () => ({
          tag: CONSTANT_TAG.Utf8,
          length: 4,
          value: 'Test'
        }),
        cPool => {
          classIdx = cPool.length
          return {
            tag: CONSTANT_TAG.Class,
            nameIndex: classIdx - 1
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
    code.setUint8(0, OPCODE.NEW)
    code.setUint16(1, classIdx)
    const method = testClass.getMethod('test0()V') as Method

    thread.invokeStackFrame(new JavaStackFrame(testClass, method as Method, 0, []))
    thread.runFor(1)
    const lastFrame = thread.peekStackFrame()
    expect(lastFrame.operandStack.length).toBe(1)
    expect((thread.popStack() as SuccessResult<any>).result.getClass() === testClass).toBe(true)
  })

  test('NEW: Interface class throws InstantiationError', () => {
    const ab = new ArrayBuffer(24)
    const code = new DataView(ab)
    let classIdx = 0
    const testClass = testLoader.createClass({
      className: 'Test',
      flags: ACCESS_FLAGS.ACC_INTERFACE,
      constants: [
        () => ({
          tag: CONSTANT_TAG.Utf8,
          length: 4,
          value: 'Test'
        }),
        cPool => {
          classIdx = cPool.length
          return {
            tag: CONSTANT_TAG.Class,
            nameIndex: classIdx - 1
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
    code.setUint8(0, OPCODE.NEW)
    code.setUint16(1, classIdx)
    const method = testClass.getMethod('test0()V') as Method

    thread.invokeStackFrame(new JavaStackFrame(testClass, method as Method, 0, []))
    thread.runFor(1)
    const lastFrame = thread.peekStackFrame()
    expect(lastFrame.method).toBe(
      threadClass.getMethod('dispatchUncaughtException(Ljava/lang/Throwable;)V')
    )
    expect(thread.getPC()).toBe(0)
    const exceptionObj = lastFrame.locals[1] as JvmObject
    expect(exceptionObj.getClass().getName()).toBe('java/lang/InstantiationError')
  })

  test('NEW: Abstract class throws InstantiationError', () => {
    const ab = new ArrayBuffer(24)
    const code = new DataView(ab)
    let classIdx = 0
    const testClass = testLoader.createClass({
      className: 'Test',
      flags: ACCESS_FLAGS.ACC_ABSTRACT,
      constants: [
        () => ({
          tag: CONSTANT_TAG.Utf8,
          length: 4,
          value: 'Test'
        }),
        cPool => {
          classIdx = cPool.length
          return {
            tag: CONSTANT_TAG.Class,
            nameIndex: classIdx - 1
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
    code.setUint8(0, OPCODE.NEW)
    code.setUint16(1, classIdx)
    const method = testClass.getMethod('test0()V') as Method

    thread.invokeStackFrame(new JavaStackFrame(testClass, method as Method, 0, []))
    thread.runFor(1)
    const lastFrame = thread.peekStackFrame()
    expect(lastFrame.method).toBe(
      threadClass.getMethod('dispatchUncaughtException(Ljava/lang/Throwable;)V')
    )
    expect(thread.getPC()).toBe(0)
    const exceptionObj = lastFrame.locals[1] as JvmObject
    expect(exceptionObj.getClass().getName()).toBe('java/lang/InstantiationError')
  })

  test('NEW: initializes class', () => {
    const ab = new ArrayBuffer(24)
    const code = new DataView(ab)
    let classIdx = 0
    const testClass = testLoader.createClass({
      className: 'Test',
      constants: [
        () => ({
          tag: CONSTANT_TAG.Utf8,
          length: 4,
          value: 'Test'
        }),
        cPool => {
          classIdx = cPool.length
          return {
            tag: CONSTANT_TAG.Class,
            nameIndex: classIdx - 1
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
    code.setUint8(0, OPCODE.NEW)
    code.setUint16(1, classIdx)
    const method = testClass.getMethod('test0()V') as Method

    thread.invokeStackFrame(new JavaStackFrame(testClass, method as Method, 0, []))
    expect(testClass.status).toBe(CLASS_STATUS.PREPARED)
    thread.runFor(1)
    expect(testClass.status).toBe(CLASS_STATUS.INITIALIZED)
  })
})

describe('Newarray', () => {
  test('NEWARRAY: creates new array', () => {
    const ab = new ArrayBuffer(16)
    const code = new DataView(ab)

    const testClass = testLoader.createClass({
      className: 'Test',
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
    code.setUint8(0, OPCODE.NEWARRAY)
    code.setUint8(1, ArrayPrimitiveType.boolean)
    const method = testClass.getMethod('test0()V') as Method

    thread.invokeStackFrame(new JavaStackFrame(testClass, method as Method, 0, []))
    thread.pushStack(0)
    thread.runFor(1)
    const lastFrame = thread.peekStackFrame()
    expect(lastFrame.operandStack.length).toBe(1)
    const arrayObj = (thread.popStack() as SuccessResult<any>).result as JvmArray
    expect(arrayObj.getClass().getName()).toBe('[Z')
    expect(arrayObj.len()).toBe(0)
  })

  test('NEWARRAY: sets elements to default value', () => {
    const ab = new ArrayBuffer(16)
    const code = new DataView(ab)

    const testClass = testLoader.createClass({
      className: 'Test',
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
    code.setUint8(0, OPCODE.NEWARRAY)

    // boolean
    code.setUint8(1, ArrayPrimitiveType.boolean)
    const method = testClass.getMethod('test0()V') as Method

    thread.invokeStackFrame(new JavaStackFrame(testClass, method as Method, 0, []))
    thread.pushStack(1)
    thread.runFor(1)
    let arrayObj = (thread.popStack() as SuccessResult<any>).result as JvmArray
    expect(arrayObj.get(0)).toBe(0)
    thread.returnStackFrame()

    // char
    code.setUint8(1, ArrayPrimitiveType.char)
    thread.invokeStackFrame(new JavaStackFrame(testClass, method as Method, 0, []))
    thread.pushStack(1)
    thread.runFor(1)
    arrayObj = (thread.popStack() as SuccessResult<any>).result as JvmArray
    expect(arrayObj.get(0)).toBe(0)
    thread.returnStackFrame()

    // float
    code.setUint8(1, ArrayPrimitiveType.float)
    thread.invokeStackFrame(new JavaStackFrame(testClass, method as Method, 0, []))
    thread.pushStack(1)
    thread.runFor(1)
    arrayObj = (thread.popStack() as SuccessResult<any>).result as JvmArray
    expect(arrayObj.get(0)).toBe(0)
    thread.returnStackFrame()

    // double
    code.setUint8(1, ArrayPrimitiveType.double)
    thread.invokeStackFrame(new JavaStackFrame(testClass, method as Method, 0, []))
    thread.pushStack(1)
    thread.runFor(1)
    arrayObj = (thread.popStack() as SuccessResult<any>).result as JvmArray
    expect(arrayObj.get(0)).toBe(0)
    thread.returnStackFrame()

    // byte
    code.setUint8(1, ArrayPrimitiveType.byte)
    thread.invokeStackFrame(new JavaStackFrame(testClass, method as Method, 0, []))
    thread.pushStack(1)
    thread.runFor(1)
    arrayObj = (thread.popStack() as SuccessResult<any>).result as JvmArray
    expect(arrayObj.get(0)).toBe(0)
    thread.returnStackFrame()

    // short
    code.setUint8(1, ArrayPrimitiveType.short)
    thread.invokeStackFrame(new JavaStackFrame(testClass, method as Method, 0, []))
    thread.pushStack(1)
    thread.runFor(1)
    arrayObj = (thread.popStack() as SuccessResult<any>).result as JvmArray
    expect(arrayObj.get(0)).toBe(0)
    thread.returnStackFrame()

    // int
    code.setUint8(1, ArrayPrimitiveType.int)
    thread.invokeStackFrame(new JavaStackFrame(testClass, method as Method, 0, []))
    thread.pushStack(1)
    thread.runFor(1)
    arrayObj = (thread.popStack() as SuccessResult<any>).result as JvmArray
    expect(arrayObj.get(0)).toBe(0)
    thread.returnStackFrame()

    // long
    code.setUint8(1, ArrayPrimitiveType.long)
    thread.invokeStackFrame(new JavaStackFrame(testClass, method as Method, 0, []))
    thread.pushStack(1)
    thread.runFor(1)
    arrayObj = (thread.popStack() as SuccessResult<any>).result as JvmArray
    expect(arrayObj.get(0) === BigInt(0)).toBe(true)
    thread.returnStackFrame()
  })

  test('NEWARRAY: negative array size throws NegativeArraySizeException', () => {
    const ab = new ArrayBuffer(16)
    const code = new DataView(ab)

    const testClass = testLoader.createClass({
      className: 'Test',
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
    code.setUint8(0, OPCODE.NEWARRAY)
    code.setUint8(1, ArrayPrimitiveType.boolean)
    const method = testClass.getMethod('test0()V') as Method

    thread.invokeStackFrame(new JavaStackFrame(testClass, method as Method, 0, []))
    thread.pushStack(-1)
    thread.runFor(1)
    const lastFrame = thread.peekStackFrame()
    expect(lastFrame.method.getName() + lastFrame.method.getDescriptor()).toBe(
      'dispatchUncaughtException(Ljava/lang/Throwable;)V'
    )
    expect(thread.getPC()).toBe(0)
    const exceptionObj = lastFrame.locals[1] as JvmObject
    expect(exceptionObj.getClass().getName()).toBe('java/lang/NegativeArraySizeException')
  })
})

describe('Anewarray', () => {
  test('ANEWARRAY: creates new array', () => {
    const ab = new ArrayBuffer(24)
    const code = new DataView(ab)
    let classIndex = 0
    const testClass = testLoader.createClass({
      className: 'Test',
      constants: [
        () => ({
          tag: CONSTANT_TAG.Utf8,
          length: 4,
          value: 'Test'
        }),
        cPool => {
          classIndex = cPool.length
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
    code.setUint8(0, OPCODE.ANEWARRAY)
    code.setUint16(1, classIndex)
    const method = testClass.getMethod('test0()V') as Method

    thread.invokeStackFrame(new JavaStackFrame(testClass, method as Method, 0, []))
    thread.pushStack(0)
    thread.runFor(1)
    const lastFrame = thread.peekStackFrame()
    expect(lastFrame.operandStack.length).toBe(1)
    const arrayObj = (thread.popStack() as SuccessResult<any>).result as JvmArray
    expect(arrayObj.getClass().getName()).toBe('[LTest;')
    expect(arrayObj.len()).toBe(0)
  })

  test('ANEWARRAY: sets elements to default value', () => {
    const ab = new ArrayBuffer(24)
    const code = new DataView(ab)
    let classIndex = 0
    const testClass = testLoader.createClass({
      className: 'Test',
      constants: [
        () => ({
          tag: CONSTANT_TAG.Utf8,
          length: 4,
          value: 'Test'
        }),
        cPool => {
          classIndex = cPool.length
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
    code.setUint8(0, OPCODE.ANEWARRAY)
    code.setUint16(1, classIndex)
    const method = testClass.getMethod('test0()V') as Method

    thread.invokeStackFrame(new JavaStackFrame(testClass, method as Method, 0, []))
    thread.pushStack(1)
    thread.runFor(1)
    const arrayObj = (thread.popStack() as SuccessResult<any>).result as JvmArray
    expect(arrayObj.get(0) === null).toBe(true)
  })

  test('ANEWARRAY: negative array size throws NegativeArraySizeException', () => {
    const ab = new ArrayBuffer(24)
    const code = new DataView(ab)
    let classIndex = 0
    const testClass = testLoader.createClass({
      className: 'Test',
      constants: [
        () => ({
          tag: CONSTANT_TAG.Utf8,
          length: 4,
          value: 'Test'
        }),
        cPool => {
          classIndex = cPool.length
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
    code.setUint8(0, OPCODE.ANEWARRAY)
    code.setUint16(1, classIndex)
    const method = testClass.getMethod('test0()V') as Method

    thread.invokeStackFrame(new JavaStackFrame(testClass, method as Method, 0, []))
    thread.pushStack(-1)
    thread.runFor(1)
    const lastFrame = thread.peekStackFrame()
    expect(lastFrame.method.getName() + lastFrame.method.getDescriptor()).toBe(
      'dispatchUncaughtException(Ljava/lang/Throwable;)V'
    )
    expect(thread.getPC()).toBe(0)
    const exceptionObj = lastFrame.locals[1] as JvmObject
    expect(exceptionObj.getClass().getName()).toBe('java/lang/NegativeArraySizeException')
  })
})

describe('Anewarray', () => {
  test('ANEWARRAY: creates new array', () => {
    const ab = new ArrayBuffer(24)
    const code = new DataView(ab)
    let classIndex = 0
    const testClass = testLoader.createClass({
      className: 'Test',
      constants: [
        () => ({
          tag: CONSTANT_TAG.Utf8,
          length: 4,
          value: 'Test'
        }),
        cPool => {
          classIndex = cPool.length
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
    code.setUint8(0, OPCODE.ANEWARRAY)
    code.setUint16(1, classIndex)
    const method = testClass.getMethod('test0()V') as Method

    thread.invokeStackFrame(new JavaStackFrame(testClass, method as Method, 0, []))
    thread.pushStack(0)
    thread.runFor(1)
    const lastFrame = thread.peekStackFrame()
    expect(lastFrame.operandStack.length).toBe(1)
    const arrayObj = (thread.popStack() as SuccessResult<any>).result as JvmArray
    expect(arrayObj.getClass().getName()).toBe('[LTest;')
    expect(arrayObj.len()).toBe(0)
  })

  test('ANEWARRAY: sets elements to default value', () => {
    const ab = new ArrayBuffer(24)
    const code = new DataView(ab)
    let classIndex = 0
    const testClass = testLoader.createClass({
      className: 'Test',
      constants: [
        () => ({
          tag: CONSTANT_TAG.Utf8,
          length: 4,
          value: 'Test'
        }),
        cPool => {
          classIndex = cPool.length
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
    code.setUint8(0, OPCODE.ANEWARRAY)
    code.setUint16(1, classIndex)
    const method = testClass.getMethod('test0()V') as Method

    thread.invokeStackFrame(new JavaStackFrame(testClass, method as Method, 0, []))
    thread.pushStack(1)
    thread.runFor(1)
    const arrayObj = (thread.popStack() as SuccessResult<any>).result as JvmArray
    expect(arrayObj.get(0) === null).toBe(true)
  })

  test('ANEWARRAY: negative array size throws NegativeArraySizeException', () => {
    const ab = new ArrayBuffer(24)
    const code = new DataView(ab)
    let classIndex = 0
    const testClass = testLoader.createClass({
      className: 'Test',
      constants: [
        () => ({
          tag: CONSTANT_TAG.Utf8,
          length: 4,
          value: 'Test'
        }),
        cPool => {
          classIndex = cPool.length
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
    code.setUint8(0, OPCODE.ANEWARRAY)
    code.setUint16(1, classIndex)
    const method = testClass.getMethod('test0()V') as Method

    thread.invokeStackFrame(new JavaStackFrame(testClass, method as Method, 0, []))
    thread.pushStack(-1)
    thread.runFor(1)
    const lastFrame = thread.peekStackFrame()
    expect(lastFrame.method.getName() + lastFrame.method.getDescriptor()).toBe(
      'dispatchUncaughtException(Ljava/lang/Throwable;)V'
    )
    expect(thread.getPC()).toBe(0)
    const exceptionObj = lastFrame.locals[1] as JvmObject
    expect(exceptionObj.getClass().getName()).toBe('java/lang/NegativeArraySizeException')
  })
})

describe('Arraylength', () => {
  test('ARRAYLENGTH: gets length of array', () => {
    const ab = new ArrayBuffer(8)
    const code = new DataView(ab)
    const testClass = testLoader.createClass({
      className: 'Test',
      constants: [
        () => ({
          tag: CONSTANT_TAG.Utf8,
          length: 4,
          value: 'Test'
        }),
        cPool => {
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
    code.setUint8(0, OPCODE.ARRAYLENGTH)
    const method = testClass.getMethod('test0()V') as Method

    thread.invokeStackFrame(new JavaStackFrame(testClass, method as Method, 0, []))

    const arrCls = (testLoader.getClass('[I') as any).result as ArrayClassData
    const arrayRef = arrCls.instantiate()
    arrayRef.initialize(thread, 5)
    thread.pushStack(arrayRef)

    thread.runFor(1)
    expect((thread.popStack() as SuccessResult<any>).result).toBe(5)
    const lastFrame = thread.peekStackFrame()
    expect(lastFrame.operandStack.length).toBe(0)
    expect(thread.getPC()).toBe(1)
  })

  test('ARRAYLENGTH: null array throws NullPointerException', () => {
    const ab = new ArrayBuffer(8)
    const code = new DataView(ab)
    const testClass = testLoader.createClass({
      className: 'Test',
      constants: [
        () => ({
          tag: CONSTANT_TAG.Utf8,
          length: 4,
          value: 'Test'
        }),
        cPool => {
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
    code.setUint8(0, OPCODE.ARRAYLENGTH)
    const method = testClass.getMethod('test0()V') as Method

    thread.invokeStackFrame(new JavaStackFrame(testClass, method as Method, 0, []))
    thread.pushStack(null)

    thread.runFor(1)

    const lastFrame = thread.peekStackFrame()
    expect(lastFrame.method.getName() + lastFrame.method.getDescriptor()).toBe(
      'dispatchUncaughtException(Ljava/lang/Throwable;)V'
    )
    expect(thread.getPC()).toBe(0)
    const exceptionObj = lastFrame.locals[1] as JvmObject
    expect(exceptionObj.getClass().getName()).toBe('java/lang/NullPointerException')
  })
})

describe('Checkcast', () => {
  test('CHECKCAST: null ok', () => {
    const ab = new ArrayBuffer(24)
    const code = new DataView(ab)
    let classIndex = 0
    const testClass = testLoader.createClass({
      className: 'Test',
      constants: [
        () => ({
          tag: CONSTANT_TAG.Utf8,
          length: 1,
          value: 'SC'
        }),
        cPool => {
          classIndex = cPool.length
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

    code.setUint8(0, OPCODE.CHECKCAST)
    code.setUint16(1, classIndex)
    const method = testClass.getMethod('test0()V') as Method

    thread.invokeStackFrame(new JavaStackFrame(testClass, method as Method, 0, []))
    thread.pushStack(null)

    thread.runFor(1)

    expect((thread.popStack() as SuccessResult<any>).result).toBe(null)
    expect(thread.peekStackFrame().operandStack.length).toBe(0)
    expect(thread.getPC()).toBe(3)
  })

  test('CHECKCAST: null does not link symbol', () => {
    const ab = new ArrayBuffer(24)
    const code = new DataView(ab)
    let classIndex = 0
    const testClass = testLoader.createClass({
      className: 'Test',
      constants: [
        () => ({
          tag: CONSTANT_TAG.Utf8,
          length: 1,
          value: 'SC'
        }),
        cPool => {
          classIndex = cPool.length
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

    code.setUint8(0, OPCODE.CHECKCAST)
    code.setUint16(1, classIndex)
    const method = testClass.getMethod('test0()V') as Method

    thread.invokeStackFrame(new JavaStackFrame(testClass, method as Method, 0, []))
    thread.pushStack(null)

    thread.runFor(1)

    expect((thread.popStack() as SuccessResult<any>).result).toBe(null)
    expect(thread.peekStackFrame().operandStack.length).toBe(0)
    expect(thread.getPC()).toBe(3)
  })

  test('CHECKCAST: same class ok', () => {
    const ab = new ArrayBuffer(24)
    const code = new DataView(ab)
    let classIndex = 0
    const testClass = testLoader.createClass({
      className: 'Test',
      constants: [
        () => ({
          tag: CONSTANT_TAG.Utf8,
          length: 1,
          value: 'SC'
        }),
        cPool => {
          classIndex = cPool.length
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

    const sClass = testLoader.createClass({
      className: 'SC',
      loader: testLoader
    })

    const obj = sClass.instantiate()

    code.setUint8(0, OPCODE.CHECKCAST)
    code.setUint16(1, classIndex)
    const method = testClass.getMethod('test0()V') as Method

    thread.invokeStackFrame(new JavaStackFrame(testClass, method as Method, 0, []))
    thread.pushStack(obj)

    thread.runFor(1)

    expect((thread.popStack() as SuccessResult<any>).result === obj).toBe(true)
    expect(thread.peekStackFrame().operandStack.length).toBe(0)
    expect(thread.getPC()).toBe(3)
  })

  test('CHECKCAST: sub class ok', () => {
    const ab = new ArrayBuffer(24)
    const code = new DataView(ab)
    let classIndex = 0
    const testClass = testLoader.createClass({
      className: 'Test',
      constants: [
        () => ({
          tag: CONSTANT_TAG.Utf8,
          length: 1,
          value: 'SC'
        }),
        cPool => {
          classIndex = cPool.length
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

    const sClass = testLoader.createClass({
      className: 'SC',
      loader: testLoader
    })

    const childClass = testLoader.createClass({
      className: 'child',
      superClass: sClass as ReferenceClassData,
      loader: testLoader
    })

    const obj = childClass.instantiate()

    code.setUint8(0, OPCODE.CHECKCAST)
    code.setUint16(1, classIndex)
    const method = testClass.getMethod('test0()V') as Method

    thread.invokeStackFrame(new JavaStackFrame(testClass, method as Method, 0, []))
    thread.pushStack(obj)

    thread.runFor(1)

    expect((thread.popStack() as SuccessResult<any>).result === obj).toBe(true)
    expect(thread.peekStackFrame().operandStack.length).toBe(0)
    expect(thread.getPC()).toBe(3)
  })

  test('CHECKCAST: interface class ok', () => {
    const ab = new ArrayBuffer(24)
    const code = new DataView(ab)
    let classIndex = 0
    const testClass = testLoader.createClass({
      className: 'Test',
      constants: [
        () => ({
          tag: CONSTANT_TAG.Utf8,
          length: 2,
          value: 'SC'
        }),
        cPool => {
          classIndex = cPool.length
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

    const sClass = testLoader.createClass({
      className: 'SC',
      loader: testLoader
    })

    const childClass = testLoader.createClass({
      className: 'child',
      interfaces: [sClass as ReferenceClassData],
      loader: testLoader
    })

    const obj = childClass.instantiate()

    code.setUint8(0, OPCODE.CHECKCAST)
    code.setUint16(1, classIndex)
    const method = testClass.getMethod('test0()V') as Method

    thread.invokeStackFrame(new JavaStackFrame(testClass, method as Method, 0, []))
    thread.pushStack(obj)

    thread.runFor(1)

    expect((thread.popStack() as SuccessResult<any>).result === obj).toBe(true)
    expect(thread.peekStackFrame().operandStack.length).toBe(0)
    expect(thread.getPC()).toBe(3)
  })

  test('CHECKCAST: Array obj Object class ok', () => {
    const ab = new ArrayBuffer(24)
    const code = new DataView(ab)
    let classIndex = 0
    const testClass = testLoader.createClass({
      className: 'Test',
      constants: [
        () => ({
          tag: CONSTANT_TAG.Utf8,
          length: 16,
          value: 'java/lang/Object'
        }),
        cPool => {
          classIndex = cPool.length
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
    const arrCls = (testLoader.getClass('[I') as any).result as ArrayClassData
    const obj = arrCls.instantiate()

    code.setUint8(0, OPCODE.CHECKCAST)
    code.setUint16(1, classIndex)
    const method = testClass.getMethod('test0()V') as Method

    thread.invokeStackFrame(new JavaStackFrame(testClass, method as Method, 0, []))
    thread.pushStack(obj)

    thread.runFor(1)

    expect((thread.popStack() as SuccessResult<any>).result === obj).toBe(true)
    expect(thread.peekStackFrame().operandStack.length).toBe(0)
    expect(thread.getPC()).toBe(3)
  })

  test('CHECKCAST: Array obj interface class ok', () => {
    const ab = new ArrayBuffer(24)
    const code = new DataView(ab)
    let classIndex = 0
    const testClass = testLoader.createClass({
      className: 'Test',
      constants: [
        () => ({
          tag: CONSTANT_TAG.Utf8,
          length: 16,
          value: 'java/lang/Cloneable'
        }),
        cPool => {
          classIndex = cPool.length
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
    const arrCls = (testLoader.getClass('[I') as any).result as ArrayClassData
    const obj = arrCls.instantiate()

    code.setUint8(0, OPCODE.CHECKCAST)
    code.setUint16(1, classIndex)
    const method = testClass.getMethod('test0()V') as Method

    thread.invokeStackFrame(new JavaStackFrame(testClass, method as Method, 0, []))
    thread.pushStack(obj)

    thread.runFor(1)

    expect((thread.popStack() as SuccessResult<any>).result === obj).toBe(true)
    expect(thread.peekStackFrame().operandStack.length).toBe(0)
    expect(thread.getPC()).toBe(3)
  })

  test('CHECKCAST: Array primitive ok', () => {
    const ab = new ArrayBuffer(24)
    const code = new DataView(ab)
    let classIndex = 0
    const testClass = testLoader.createClass({
      className: 'Test',
      constants: [
        () => ({
          tag: CONSTANT_TAG.Utf8,
          length: 2,
          value: '[I'
        }),
        cPool => {
          classIndex = cPool.length
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
    const arrCls = (testLoader.getClass('[I') as any).result as ArrayClassData
    const obj = arrCls.instantiate()

    code.setUint8(0, OPCODE.CHECKCAST)
    code.setUint16(1, classIndex)
    const method = testClass.getMethod('test0()V') as Method

    thread.invokeStackFrame(new JavaStackFrame(testClass, method as Method, 0, []))
    thread.pushStack(obj)

    thread.runFor(1)

    expect((thread.popStack() as SuccessResult<any>).result === obj).toBe(true)
    expect(thread.peekStackFrame().operandStack.length).toBe(0)
    expect(thread.getPC()).toBe(3)
  })

  test('CHECKCAST: Array subtype ok', () => {
    const ab = new ArrayBuffer(24)
    const code = new DataView(ab)
    let classIndex = 0
    const testClass = testLoader.createClass({
      className: 'Test',
      constants: [
        () => ({
          tag: CONSTANT_TAG.Utf8,
          length: 2,
          value: '[LSC;'
        }),
        cPool => {
          classIndex = cPool.length
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

    const sClass = testLoader.createClass({
      className: 'SC',
      loader: testLoader
    })

    testLoader.createClass({
      className: 'Child',
      loader: testLoader,
      superClass: sClass as ReferenceClassData
    })

    const arrCls = (testLoader.getClass('[LChild;') as any).result as ArrayClassData
    const obj = arrCls.instantiate()

    code.setUint8(0, OPCODE.CHECKCAST)
    code.setUint16(1, classIndex)
    const method = testClass.getMethod('test0()V') as Method

    thread.invokeStackFrame(new JavaStackFrame(testClass, method as Method, 0, []))
    thread.pushStack(obj)

    thread.runFor(1)

    expect((thread.popStack() as SuccessResult<any>).result === obj).toBe(true)
    expect(thread.peekStackFrame().operandStack.length).toBe(0)
    expect(thread.getPC()).toBe(3)
  })

  test('CHECKCAST: Throws ClassCastException on failure', () => {
    const ab = new ArrayBuffer(24)
    const code = new DataView(ab)
    let classIndex = 0
    const testClass = testLoader.createClass({
      className: 'Test',
      constants: [
        () => ({
          tag: CONSTANT_TAG.Utf8,
          length: 2,
          value: '[LSC;'
        }),
        cPool => {
          classIndex = cPool.length
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

    const arrCls = (testLoader.getClass('[LChild;') as any).result as ArrayClassData
    const obj = arrCls.instantiate()

    code.setUint8(0, OPCODE.CHECKCAST)
    code.setUint16(1, classIndex)
    const method = testClass.getMethod('test0()V') as Method

    thread.invokeStackFrame(new JavaStackFrame(testClass, method as Method, 0, []))
    thread.pushStack(obj)

    thread.runFor(1)

    const lastFrame = thread.peekStackFrame()
    expect(lastFrame.method.getName() + lastFrame.method.getDescriptor()).toBe(
      'dispatchUncaughtException(Ljava/lang/Throwable;)V'
    )
    expect(thread.getPC()).toBe(0)
    const exceptionObj = lastFrame.locals[1] as JvmObject
    expect(exceptionObj.getClass().getName()).toBe('java/lang/ClassCastException')
  })
})

describe('Instanceof', () => {
  test('INSTANCEOF: null returns 0', () => {
    const ab = new ArrayBuffer(24)
    const code = new DataView(ab)
    let classIndex = 0
    const testClass = testLoader.createClass({
      className: 'Test',
      constants: [
        () => ({
          tag: CONSTANT_TAG.Utf8,
          length: 1,
          value: 'SC'
        }),
        cPool => {
          classIndex = cPool.length
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

    code.setUint8(0, OPCODE.INSTANCEOF)
    code.setUint16(1, classIndex)
    const method = testClass.getMethod('test0()V') as Method

    thread.invokeStackFrame(new JavaStackFrame(testClass, method as Method, 0, []))
    thread.pushStack(null)

    thread.runFor(1)

    expect((thread.popStack() as SuccessResult<any>).result).toBe(0)
    expect(thread.peekStackFrame().operandStack.length).toBe(0)
    expect(thread.getPC()).toBe(3)
  })

  test('INSTANCEOF: null does not link symbol', () => {
    const ab = new ArrayBuffer(24)
    const code = new DataView(ab)
    let classIndex = 0
    const testClass = testLoader.createClass({
      className: 'Test',
      constants: [
        () => ({
          tag: CONSTANT_TAG.Utf8,
          length: 1,
          value: 'SC'
        }),
        cPool => {
          classIndex = cPool.length
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

    code.setUint8(0, OPCODE.INSTANCEOF)
    code.setUint16(1, classIndex)
    const method = testClass.getMethod('test0()V') as Method

    thread.invokeStackFrame(new JavaStackFrame(testClass, method as Method, 0, []))
    thread.pushStack(null)

    thread.runFor(1)

    expect((thread.popStack() as SuccessResult<any>).result).toBe(0)
    expect(thread.peekStackFrame().operandStack.length).toBe(0)
    expect(thread.getPC()).toBe(3)
  })

  test('INSTANCEOF: same class ok', () => {
    const ab = new ArrayBuffer(24)
    const code = new DataView(ab)
    let classIndex = 0
    const testClass = testLoader.createClass({
      className: 'Test',
      constants: [
        () => ({
          tag: CONSTANT_TAG.Utf8,
          length: 1,
          value: 'SC'
        }),
        cPool => {
          classIndex = cPool.length
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

    const sClass = testLoader.createClass({
      className: 'SC',
      loader: testLoader
    })

    const obj = sClass.instantiate()

    code.setUint8(0, OPCODE.INSTANCEOF)
    code.setUint16(1, classIndex)
    const method = testClass.getMethod('test0()V') as Method

    thread.invokeStackFrame(new JavaStackFrame(testClass, method as Method, 0, []))
    thread.pushStack(obj)

    thread.runFor(1)

    expect((thread.popStack() as SuccessResult<any>).result).toBe(1)
    expect(thread.peekStackFrame().operandStack.length).toBe(0)
    expect(thread.getPC()).toBe(3)
  })

  test('INSTANCEOF: sub class ok', () => {
    const ab = new ArrayBuffer(24)
    const code = new DataView(ab)
    let classIndex = 0
    const testClass = testLoader.createClass({
      className: 'Test',
      constants: [
        () => ({
          tag: CONSTANT_TAG.Utf8,
          length: 1,
          value: 'SC'
        }),
        cPool => {
          classIndex = cPool.length
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

    const sClass = testLoader.createClass({
      className: 'SC',
      loader: testLoader
    })

    const childClass = testLoader.createClass({
      className: 'child',
      superClass: sClass as ReferenceClassData,
      loader: testLoader
    })

    const obj = childClass.instantiate()

    code.setUint8(0, OPCODE.INSTANCEOF)
    code.setUint16(1, classIndex)
    const method = testClass.getMethod('test0()V') as Method

    thread.invokeStackFrame(new JavaStackFrame(testClass, method as Method, 0, []))
    thread.pushStack(obj)

    thread.runFor(1)

    expect((thread.popStack() as SuccessResult<any>).result).toBe(1)
    expect(thread.peekStackFrame().operandStack.length).toBe(0)
    expect(thread.getPC()).toBe(3)
  })

  test('INSTANCEOF: interface class ok', () => {
    const ab = new ArrayBuffer(24)
    const code = new DataView(ab)
    let classIndex = 0
    const testClass = testLoader.createClass({
      className: 'Test',
      constants: [
        () => ({
          tag: CONSTANT_TAG.Utf8,
          length: 2,
          value: 'SC'
        }),
        cPool => {
          classIndex = cPool.length
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

    const sClass = testLoader.createClass({
      className: 'SC',
      loader: testLoader
    })

    const childClass = testLoader.createClass({
      className: 'child',
      interfaces: [sClass as ReferenceClassData],
      loader: testLoader
    })

    const obj = childClass.instantiate()

    code.setUint8(0, OPCODE.INSTANCEOF)
    code.setUint16(1, classIndex)
    const method = testClass.getMethod('test0()V') as Method

    thread.invokeStackFrame(new JavaStackFrame(testClass, method as Method, 0, []))
    thread.pushStack(obj)

    thread.runFor(1)

    expect((thread.popStack() as SuccessResult<any>).result).toBe(1)
    expect(thread.peekStackFrame().operandStack.length).toBe(0)
    expect(thread.getPC()).toBe(3)
  })

  test('INSTANCEOF: Array obj Object class ok', () => {
    const ab = new ArrayBuffer(24)
    const code = new DataView(ab)
    let classIndex = 0
    const testClass = testLoader.createClass({
      className: 'Test',
      constants: [
        () => ({
          tag: CONSTANT_TAG.Utf8,
          length: 16,
          value: 'java/lang/Object'
        }),
        cPool => {
          classIndex = cPool.length
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
    const arrCls = (testLoader.getClass('[I') as any).result as ArrayClassData
    const obj = arrCls.instantiate()

    code.setUint8(0, OPCODE.INSTANCEOF)
    code.setUint16(1, classIndex)
    const method = testClass.getMethod('test0()V') as Method

    thread.invokeStackFrame(new JavaStackFrame(testClass, method as Method, 0, []))
    thread.pushStack(obj)

    thread.runFor(1)

    expect((thread.popStack() as SuccessResult<any>).result).toBe(1)
    expect(thread.peekStackFrame().operandStack.length).toBe(0)
    expect(thread.getPC()).toBe(3)
  })

  test('INSTANCEOF: Array obj interface class ok', () => {
    const ab = new ArrayBuffer(24)
    const code = new DataView(ab)
    let classIndex = 0
    const testClass = testLoader.createClass({
      className: 'Test',
      constants: [
        () => ({
          tag: CONSTANT_TAG.Utf8,
          length: 16,
          value: 'java/lang/Cloneable'
        }),
        cPool => {
          classIndex = cPool.length
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
    const arrCls = (testLoader.getClass('[I') as any).result as ArrayClassData
    const obj = arrCls.instantiate()

    code.setUint8(0, OPCODE.INSTANCEOF)
    code.setUint16(1, classIndex)
    const method = testClass.getMethod('test0()V') as Method

    thread.invokeStackFrame(new JavaStackFrame(testClass, method as Method, 0, []))
    thread.pushStack(obj)

    thread.runFor(1)

    expect((thread.popStack() as SuccessResult<any>).result).toBe(1)
    expect(thread.peekStackFrame().operandStack.length).toBe(0)
    expect(thread.getPC()).toBe(3)
  })

  test('INSTANCEOF: Array primitive ok', () => {
    const ab = new ArrayBuffer(24)
    const code = new DataView(ab)
    let classIndex = 0
    const testClass = testLoader.createClass({
      className: 'Test',
      constants: [
        () => ({
          tag: CONSTANT_TAG.Utf8,
          length: 2,
          value: '[I'
        }),
        cPool => {
          classIndex = cPool.length
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
    const arrCls = (testLoader.getClass('[I') as any).result as ArrayClassData
    const obj = arrCls.instantiate()

    code.setUint8(0, OPCODE.INSTANCEOF)
    code.setUint16(1, classIndex)
    const method = testClass.getMethod('test0()V') as Method

    thread.invokeStackFrame(new JavaStackFrame(testClass, method as Method, 0, []))
    thread.pushStack(obj)

    thread.runFor(1)

    expect((thread.popStack() as SuccessResult<any>).result).toBe(1)
    expect(thread.peekStackFrame().operandStack.length).toBe(0)
    expect(thread.getPC()).toBe(3)
  })

  test('INSTANCEOF: Array subtype ok', () => {
    const ab = new ArrayBuffer(24)
    const code = new DataView(ab)
    let classIndex = 0
    const testClass = testLoader.createClass({
      className: 'Test',
      constants: [
        () => ({
          tag: CONSTANT_TAG.Utf8,
          length: 2,
          value: '[LSC;'
        }),
        cPool => {
          classIndex = cPool.length
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

    const sClass = testLoader.createClass({
      className: 'SC',
      loader: testLoader
    })

    testLoader.createClass({
      className: 'Child',
      loader: testLoader,
      superClass: sClass as ReferenceClassData
    })

    const arrCls = (testLoader.getClass('[LChild;') as any).result as ArrayClassData
    const obj = arrCls.instantiate()

    code.setUint8(0, OPCODE.INSTANCEOF)
    code.setUint16(1, classIndex)
    const method = testClass.getMethod('test0()V') as Method

    thread.invokeStackFrame(new JavaStackFrame(testClass, method as Method, 0, []))
    thread.pushStack(obj)

    thread.runFor(1)

    expect((thread.popStack() as SuccessResult<any>).result).toBe(1)
    expect(thread.peekStackFrame().operandStack.length).toBe(0)
    expect(thread.getPC()).toBe(3)
  })

  test('INSTANCEOF: Returns 0 on failure', () => {
    const ab = new ArrayBuffer(24)
    const code = new DataView(ab)
    let classIndex = 0
    const testClass = testLoader.createClass({
      className: 'Test',
      constants: [
        () => ({
          tag: CONSTANT_TAG.Utf8,
          length: 2,
          value: '[LSC;'
        }),
        cPool => {
          classIndex = cPool.length
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

    const arrCls = (testLoader.getClass('[LChild;') as any).result as ArrayClassData
    const obj = arrCls.instantiate()

    code.setUint8(0, OPCODE.INSTANCEOF)
    code.setUint16(1, classIndex)
    const method = testClass.getMethod('test0()V') as Method

    thread.invokeStackFrame(new JavaStackFrame(testClass, method as Method, 0, []))
    thread.pushStack(obj)

    thread.runFor(1)

    expect((thread.popStack() as SuccessResult<any>).result).toBe(0)
    expect(thread.peekStackFrame().operandStack.length).toBe(0)
    expect(thread.getPC()).toBe(3)
  })
})

describe('Athrow', () => {
  test('ATHROW: null exception throws NullPointerException', () => {
    const ab = new ArrayBuffer(8)
    const code = new DataView(ab)
    const testClass = testLoader.createClass({
      className: 'Test',
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
    code.setUint8(0, OPCODE.ATHROW)
    const method = testClass.getMethod('test0()V') as Method

    thread.invokeStackFrame(new JavaStackFrame(testClass, method as Method, 0, []))
    thread.pushStack(null)
    thread.runFor(1)

    const lastFrame = thread.peekStackFrame()
    expect(lastFrame.method).toBe(
      threadClass.getMethod('dispatchUncaughtException(Ljava/lang/Throwable;)V')
    )
    expect(thread.getPC()).toBe(0)
    const exceptionObj = lastFrame.locals[1] as JvmObject
    expect(exceptionObj.getClass().getName()).toBe('java/lang/NullPointerException')
  })

  test('ATHROW: throws exception', () => {
    const ab = new ArrayBuffer(8)
    const code = new DataView(ab)
    const testClass = testLoader.createClass({
      className: 'Test',
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
    code.setUint8(0, OPCODE.ATHROW)
    const method = testClass.getMethod('test0()V') as Method

    thread.invokeStackFrame(new JavaStackFrame(testClass, method as Method, 0, []))
    const eObj = NullPointerException.instantiate()
    thread.pushStack(eObj)
    thread.runFor(1)

    const lastFrame = thread.peekStackFrame()
    expect(lastFrame.method).toBe(
      threadClass.getMethod('dispatchUncaughtException(Ljava/lang/Throwable;)V')
    )
    expect(thread.getPC()).toBe(0)
    const exceptionObj = lastFrame.locals[1] as JvmObject
    expect(exceptionObj === eObj).toBe(true)
  })

  test('ATHROW: clears operand stack and updates PC', () => {
    const ab = new ArrayBuffer(8)
    const code = new DataView(ab)
    const testClass = testLoader.createClass({
      className: 'Test',
      methods: [
        {
          accessFlags: [METHOD_FLAGS.ACC_PUBLIC],
          name: 'test0',
          descriptor: '()V',
          attributes: [],
          exceptionTable: [
            {
              startPc: 0,
              endPc: 2,
              handlerPc: 99,
              catchType: 'java/lang/NullPointerException'
            }
          ],
          code: code
        }
      ],
      loader: testLoader
    })
    code.setUint8(0, OPCODE.ATHROW)
    const method = testClass.getMethod('test0()V') as Method

    thread.invokeStackFrame(new JavaStackFrame(testClass, method as Method, 0, []))
    const eObj = NullPointerException.instantiate()
    thread.pushStack(0)
    thread.pushStack(1)
    thread.pushStack(eObj)
    thread.runFor(1)
    expect(thread.getMethod().getName()).toBe('test0')
    expect((thread.popStack() as SuccessResult<any>).result === eObj).toBe(true)
    const sf = thread.peekStackFrame()
    expect(sf.operandStack.length).toBe(0)
    expect(thread.getPC()).toBe(99)
  })
})
