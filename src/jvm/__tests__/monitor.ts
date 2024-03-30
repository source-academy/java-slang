import Monitor from '../monitor'
import { ReferenceClassData } from '../types/class/ClassData'
import { TestSystem, TestClassLoader, TestThreadPool, TestThread } from './__utils__/test-utils'

let monitor: Monitor
let threadClass: ReferenceClassData
let testSystem: TestSystem
let testLoader: TestClassLoader
let tpool: TestThreadPool

beforeEach(() => {
  monitor = new Monitor()
  testSystem = new TestSystem()
  testLoader = new TestClassLoader(testSystem, '', null)
  testLoader.createClass({
    className: 'java/lang/Object',
    loader: testLoader,
    superClass: null
  })
  threadClass = testLoader.createClass({
    className: 'java/lang/Thread',
    loader: testLoader
  }) as ReferenceClassData
  tpool = new TestThreadPool(() => {})
})

describe('Monitor', () => {
  test('Monitor: thread enters empty monitor', () => {
    const thread = new TestThread(threadClass, null as any, tpool)
    const onEnter = jest.fn()
    const hasEntered = monitor.enter(thread, onEnter)

    expect(hasEntered).toBe(true)
    expect(onEnter).toHaveBeenCalled()
  })

  test('Monitor: thread reenters owned monitor', () => {
    const thread = new TestThread(threadClass, null as any, tpool)
    const onEnter = jest.fn()
    const hasEntered = monitor.enter(thread, onEnter)
    const hasEntered2 = monitor.enter(thread, onEnter)

    expect(hasEntered).toBe(true)
    expect(hasEntered2).toBe(true)
    expect(onEnter).toHaveBeenCalledTimes(2)
  })

  test('Monitor: thread exits owned monitor', () => {
    const thread = new TestThread(threadClass, null as any, tpool)
    const onExit = jest.fn()
    monitor.enter(thread)
    monitor.exit(thread, onExit)
    expect(onExit).toHaveBeenCalled()
  })

  test('Monitor: thread exit wrong monitor throws IllegalMonitorStateException', () => {
    const thread = new TestThread(threadClass, null as any, tpool)
    const thread2 = new TestThread(threadClass, null as any, tpool)
    const throwNewException = jest.spyOn(thread2, 'throwNewException').mockImplementation(() => {})
    const onExit = jest.fn()
    monitor.enter(thread)
    monitor.exit(thread2, onExit)
    expect(onExit).toHaveBeenCalledTimes(0)
    expect(throwNewException).toBeCalledWith(
      'java/lang/IllegalMonitorStateException',

      'Cannot exit a monitor that you do not own.'
    )
  })

  test('Monitor: thread waits on monitor', () => {
    const thread = new TestThread(threadClass, null as any, tpool)
    const thread2 = new TestThread(threadClass, null as any, tpool)
    const onEnter = jest.fn()
    monitor.enter(thread)
    const hasEntered = monitor.enter(thread2, onEnter)
    expect(hasEntered).toBe(false)
    expect(onEnter).toHaveBeenCalledTimes(0)
    monitor.exit(thread)
    expect(onEnter).toHaveBeenCalledTimes(1)
  })
})
