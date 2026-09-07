import { ThreadStatus } from '../constants'
import { ThreadPool } from '../threadpool'
import { ReferenceClassData } from '../types/class/ClassData'
import { JvmObject } from '../types/reference/Object'
import Thread from '../../jvm/thread'
import JVM from '../../jvm/jvm'
import { JavaStackFrame } from '../../jvm/stackframe'
import { setupTest, TestThreadPool } from './__utils__/test-utils'
import { METHOD_FLAGS } from '../../ClassFile/types/methods'

let thread: Thread
let threadClass: ReferenceClassData
// let testLoader: TestClassLoader
let jvm: JVM
let threadPool: ThreadPool

beforeEach(() => {
  const setup = setupTest()
  thread = setup.thread
  threadClass = setup.classes.threadClass
  // testLoader = setup.testLoader
  threadPool = new TestThreadPool(() => {})
})

describe('Thread', () => {
  test('should initialize a new thread with correct default values', () => {
    const threadObj = {} as JvmObject
  
    thread = new Thread(threadClass, jvm, threadPool, threadObj)

    expect(thread.getStatus()).toBe(ThreadStatus.NEW)
    expect(thread.getFrames()).toEqual([])
    expect(thread.getJavaObject()).toBe(threadObj)
    expect(thread.getThreadPool()).toBe(threadPool)
    expect(thread.getJVM()).toBe(jvm)
    expect(thread.getThreadId()).toBe(1)
    expect(thread.isStackEmpty()).toBe(true)
  })
  
  test('should correctly handle synchronized methods and monitor entering/exiting', () => {
    // TODO
  });
  
  test('should properly manage thread status transitions', () => {
    const threadObj = new JvmObject(threadClass)
    thread = new Thread(threadClass, jvm, threadPool, threadObj)
    threadPool.updateStatus = jest.fn();

    expect(thread.getStatus()).toBe(ThreadStatus.NEW)

    thread.setStatus(ThreadStatus.RUNNABLE)
    expect(thread.getStatus()).toBe(ThreadStatus.RUNNABLE)

    thread.setStatus(ThreadStatus.BLOCKED)
    expect(thread.getStatus()).toBe(ThreadStatus.BLOCKED)

    thread.setStatus(ThreadStatus.WAITING)
    expect(thread.getStatus()).toBe(ThreadStatus.WAITING)

    thread.setStatus(ThreadStatus.TIMED_WAITING)
    expect(thread.getStatus()).toBe(ThreadStatus.TIMED_WAITING)

    thread.setStatus(ThreadStatus.TERMINATED)
    expect(thread.getStatus()).toBe(ThreadStatus.TERMINATED)

    expect(threadPool.updateStatus).toHaveBeenCalledTimes(5)
  })
  
  test('should manage wide (64-bit) values on the operand stack correctly', () => {
    // TODO
  })

  test('should route an exception to a matching try-catch handler in the current method', () => {
    const setup = setupTest()
    const { testLoader, thread: testThread, classes } = setup
    const exceptionMethodClass = testLoader.createClass({
      className: 'TryCatchTest',
      loader: testLoader,
      methods: [
        {
          accessFlags: [METHOD_FLAGS.ACC_PUBLIC],
          name: 'test0',
          descriptor: '()V',
          attributes: [],
          code: new DataView(new ArrayBuffer(1)),
          exceptionTable: [
            {
              startPc: 0,
              endPc: 1,
              handlerPc: 0,
              catchType: 'java/lang/NullPointerException'
            }
          ]
        }
      ],
    }) as ReferenceClassData

    const method = exceptionMethodClass.getMethod('test0()V')
    expect(method).not.toBeNull()

    testThread.invokeStackFrame(
      new JavaStackFrame(exceptionMethodClass, method as any, 0, [])
    )
    const exceptionObj = classes.NullPointerException.instantiate()
    testThread.throwException(exceptionObj)

    expect(testThread.getPC()).toBe(0)
    expect(testThread.peekStackFrame().operandStack).toEqual([exceptionObj])
  })
})
