import { ThreadStatus } from '../constants'
import { Deque, RoundRobinThreadPool } from '../threadpool'
import { setupTest, TestClassLoader, TestThread } from './__utils__/test-utils'
import { ReferenceClassData } from '../types/class/ClassData'

let testLoader: TestClassLoader

beforeEach(() => {
  const setup = setupTest()
  testLoader = setup.testLoader
})

describe('Deque', () => {
  test('Should throw an error when popFront() is called on an empty deque', () => {
    const deque = new Deque<number>()
    expect(() => deque.popFront()).toThrow('Deque is empty')
  })

  test('Should throw an error when popBack() is called on an empty deque', () => {
    const deque = new Deque<number>()
    expect(() => deque.popBack()).toThrow('Deque is empty')
  })

  test('Deque: Should correctly pushfront and popfront elements', () => {
    const deque = new Deque<number>()

    deque.pushFront(1)
    deque.pushFront(2)
    deque.pushFront(3)

    expect(deque.popFront()).toBe(3)
    expect(deque.popFront()).toBe(2)
    expect(deque.popFront()).toBe(1)

    expect(deque.isEmpty()).toBe(true)

    expect(() => deque.popFront()).toThrow('Deque is empty')
  })

  test('Should correctly pushback and popback elements in a deque', () => {
    const deque = new Deque<number>()

    deque.pushBack(1)
    deque.pushBack(2)
    deque.pushBack(3)

    expect(deque.popBack()).toBe(3)
    expect(deque.popBack()).toBe(2)
    expect(deque.popBack()).toBe(1)

    expect(deque.isEmpty()).toBe(true)

    expect(() => deque.popBack()).toThrow('Deque is empty')
  })
})

describe('RoundRobinThreadPool', () => {
  test('Should not change thread status when updateStatus is called with the same status', () => {
    const onEmpty = jest.fn()
    const pool = new RoundRobinThreadPool(onEmpty)

    const threadClass = testLoader.createClass({
      className: 'java/lang/Thread',
      loader: testLoader
    }) as ReferenceClassData

    const thread = new TestThread(threadClass, null as any, pool)

    jest.spyOn(thread, 'getStatus').mockReturnValue(ThreadStatus.RUNNABLE)

    pool.addThread(thread)

    const initialQueueSize = (pool as any).threadQueue.size

    pool.updateStatus(thread, ThreadStatus.RUNNABLE)

    expect((pool as any).threadQueue.size).toBe(initialQueueSize)
    expect(pool.getCurrentThread()).toBe(thread)
    expect(onEmpty).not.toHaveBeenCalled()
  })

  test('RoundRobinThreadPool: Should correctly manage quantumOver() for a non-currentThread', () => {
    const onEmpty = jest.fn()
    const pool = new RoundRobinThreadPool(onEmpty)

    const threadClass = testLoader.createClass({
      className: 'java/lang/Thread',
      loader: testLoader
    }) as ReferenceClassData

    const thread1 = new TestThread(threadClass, null as any, pool)
    const thread2 = new TestThread(threadClass, null as any, pool)
    const thread3 = new TestThread(threadClass, null as any, pool)

    jest.spyOn(thread1, 'getStatus').mockReturnValue(ThreadStatus.RUNNABLE)
    jest.spyOn(thread2, 'getStatus').mockReturnValue(ThreadStatus.RUNNABLE)
    jest.spyOn(thread3, 'getStatus').mockReturnValue(ThreadStatus.RUNNABLE)

    pool.addThread(thread1)
    pool.addThread(thread2)
    pool.addThread(thread3)

    expect(pool.getCurrentThread()).toBe(thread1)

    // Call quantumOver for thread2 (not the currentThread)
    pool.quantumOver(thread2)

    // Verify that the currentThread hasn't changed
    expect(pool.getCurrentThread()).toBe(thread1)

    // Verify that thread2 is still in the queue
    pool.quantumOver(thread1)
    expect(pool.getCurrentThread()).toBe(thread2)
  })

  test('Should properly handle the scenario when run() is called with no threads in the pool', () => {
    const onEmpty = jest.fn()
    const pool = new RoundRobinThreadPool(onEmpty)
    const onFinish = jest.fn()

    jest.useFakeTimers()

    pool.run(onFinish)

    jest.runAllTimers()

    expect(onFinish).toHaveBeenCalledTimes(1)
    expect(onEmpty).not.toHaveBeenCalled()
  })
})
