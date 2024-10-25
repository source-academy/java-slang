import { ThreadStatus } from '../constants'
import { RoundRobinThreadPool, ThreadPool } from '../threadpool'
import { ReferenceClassData } from '../types/class/ClassData'
import { JvmObject } from '../types/reference/Object'
import Thread from '../../jvm/thread'
import JVM from '../../jvm/jvm'
import { setupTest } from './__utils__/test-utils'

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
  threadPool = new RoundRobinThreadPool(() => {})
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
})
