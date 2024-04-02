import { ThreadStatus } from './constants'
import Thread from './thread'

export default class Monitor {
  notifyArray: {
    thread: Thread
    locks: number
    timeout?: number
    callback?: () => void
  }[] = []
  acquireArray: {
    thread: Thread
    locks: number
    timeout?: number
    callback?: () => void
  }[] = []
  owner: Thread | null = null
  entryCount: number = 0

  /**
   * Enters the monitor. If the monitor is already owned, the thread is blocked.
   * @param thread
   * @param onEnter callback when the thread enters the monitor
   * @returns boolean if the monitor can be immediately entered
   */
  enter(thread: Thread, onEnter?: () => void): boolean {
    if (this.owner === thread) {
      this.entryCount++
      onEnter && onEnter()
      return true
    } else if (this.owner === null) {
      this.owner = thread
      this.entryCount = 1
      onEnter && onEnter()
      return true
    } else {
      thread.setStatus(ThreadStatus.BLOCKED)
      this.acquireArray.push({ thread, locks: 1, callback: onEnter })
      return false
    }
  }

  exit(thread: Thread, onExit?: () => void) {
    if (this.owner === thread) {
      this.entryCount -= 1
      if (this.entryCount === 0) {
        this.owner = null
        this.unblock()
      }
      onExit && onExit()
    } else {
      thread.throwNewException(
        'java/lang/IllegalMonitorStateException',
        'Cannot exit a monitor that you do not own.'
      )
    }
  }

  /**
   * Sets the thread to wait until notify or notifyAll is called.
   * @param thread
   */
  wait(thread: Thread, timeout: number = 0, nanos: number = 0) {
    if (this.owner !== thread) {
      thread.throwNewException(
        'java.lang.IllegalMonitorStateException',
        'current thread is not owner'
      )
    }

    const state: { thread: Thread; locks: number; timeout?: number } = {
      thread,
      locks: this.entryCount
    }
    this.notifyArray.push(state)

    // revoke ownership
    this.owner = null
    this.entryCount = 0

    // wait for notify
    if (timeout > 0 || nanos > 0) {
      timeout += Math.min(nanos, 1) // settimeout uses millis
      state.timeout = setTimeout(() => {}, timeout) as any
      thread.setStatus(ThreadStatus.TIMED_WAITING)
    } else {
      thread.setStatus(ThreadStatus.WAITING)
    }

    this.unblock()
  }

  /**
   * Unblocks a thread in the acquire array
   */
  unblock() {
    if (this.acquireArray.length > 0) {
      const state = this.acquireArray.shift()!
      state.thread.setStatus(ThreadStatus.RUNNABLE)
      this.owner = state.thread
      this.entryCount = state.locks
      state.callback && state.callback()
    }
  }

  /**
   * Sets all threads waiting on this monitor to runnable and calls the callback if provided.
   * @param thread
   */
  notifyAll() {
    for (const state of this.notifyArray) {
      const thread = state.thread
      thread.setStatus(ThreadStatus.RUNNABLE)
      state.callback && state.callback()
    }
  }
}
