import { ThreadStatus } from '../../jvm/constants'
import { ThreadPool } from '../../jvm/threadpool'
import { RoundRobinThreadPool } from '../../jvm/threadpool'
import { ReferenceClassData } from '../../jvm/types/class/ClassData'
import { JvmObject } from '../../jvm/types/reference/Object'
import Thread from '../../jvm/thread'
import JVM from '../../jvm/jvm'
import { setupTest, TestSystem } from './__utils__/test-utils'

let thread: Thread
let threadClass: ReferenceClassData
let jvm: JVM
let threadPool: ThreadPool
let threadObj: JvmObject
let testSystem: TestSystem

beforeEach(() => {
  const setup = setupTest()
  thread = setup.thread
  threadClass = setup.classes.threadClass
  testSystem = new TestSystem()
  jvm = new JVM(testSystem)
  threadPool = new RoundRobinThreadPool(() => {})
  threadObj = new JvmObject(threadClass)
})

describe('Thread', () => {
  test('Should initialize a new thread with correct default values', () => {
    expect(thread.getStatus()).toBe(ThreadStatus.NEW)
    expect(thread.getFrames()).toEqual([])
    expect(thread.getJavaObject()).toBe(threadObj)
    expect(thread.getThreadPool()).toBe(threadPool)
    expect(thread.getJVM()).toBe(jvm)
    expect(thread.isStackEmpty()).toBe(true)
    expect(thread.getThreadId()).toBe(1)

    const secondThread = new Thread(threadClass, jvm, threadPool, threadObj)
    expect(secondThread.getThreadId()).toBe(2)
  })
})