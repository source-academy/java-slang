import { ThreadStatus } from '../../../constants'
import { JavaStackFrame } from '../../../stackframe'
import Thread from '../../../thread'
import { ReferenceClassData } from '../../../types/class/ClassData'
import { Method } from '../../../types/class/Method'
import { JvmObject } from '../../../types/reference/Object'
import { j2jsString } from '../../../utils'

const functions = {
  'isAlive()Z': (thread: Thread, locals: any[]) => {
    const threadObj = locals[0] as JvmObject
    const t = threadObj.getNativeField('thread') as Thread
    if (!t) {
      thread.returnStackFrame(0)
    }
    const status = t.getStatus()
    if (status === ThreadStatus.TERMINATED || status === ThreadStatus.NEW) {
      thread.returnStackFrame(0)
    }
    thread.returnStackFrame(1)
  },

  /**
   * @todo Not implemented. NOP.
   * @param thread
   * @param locals
   */
  'setPriority0(I)V': (thread: Thread) => {
    thread.returnStackFrame()
  },

  /**
   * NOP.
   * @param thread
   * @param locals
   */
  'registerNatives()V': (thread: Thread) => {
    thread.returnStackFrame()
  },

  'currentThread()Ljava/lang/Thread;': (thread: Thread) => {
    const threadObj = thread.getJavaObject()
    thread.returnStackFrame(threadObj)
  },

  'sleep(J)V': (thread: Thread, locals: any[]) => {
    thread.setStatus(ThreadStatus.TIMED_WAITING)
    thread.returnStackFrame()
    setTimeout(
      () => {
        thread.setStatus(ThreadStatus.RUNNABLE)
      },
      Number(locals[0] as bigint)
    )
  },

  /**
   * Replaces the JDK's version, which prints the stack trace through classes that are not
   * bundled and that raise further uncaught exceptions, making the thread report forever.
   * Reports the exception once, as the default handler of a real JVM would:
   * Exception in thread "main" java.lang.ArithmeticException: / by zero
   * @param thread
   * @param locals
   */
  'dispatchUncaughtException(Ljava/lang/Throwable;)V': (thread: Thread, locals: any[]) => {
    const threadObj = locals[0] as JvmObject
    const exception = locals[1] as JvmObject

    const nameField = threadObj.getClass().lookupField('nameLjava/lang/String;')
    const name = nameField ? (threadObj.getField(nameField) as JvmObject | null) : null
    const msgField = exception.getClass().lookupField('detailMessageLjava/lang/String;')
    const msg = msgField ? (exception.getField(msgField) as JvmObject | null) : null

    const className = exception.getClass().getName().replace(/\//g, '.')
    thread
      .getJVM()
      .getSystem()
      .stderr(
        `Exception in thread "${name ? j2jsString(name) : 'main'}" ${className}${
          msg ? `: ${j2jsString(msg)}` : ''
        }\n`
      )
    thread.returnStackFrame()
  },

  'start0()V': (thread: Thread, locals: any[]) => {
    const threadObj = locals[0] as JvmObject
    const threadCls = threadObj.getClass() as ReferenceClassData
    const mainTpool = thread.getThreadPool()

    // thread object created from code, native thread not created
    let newThread = threadObj.getNativeField('thread')
    if (!newThread) {
      newThread = new Thread(threadCls, thread.getJVM(), mainTpool, threadObj)
      newThread.invokeStackFrame(
        new JavaStackFrame(threadCls, threadCls.getMethod('run()V') as Method, 0, [threadObj])
      )
      threadObj.putNativeField('thread', newThread)
    }

    mainTpool.addThread(newThread)
    newThread.setStatus(ThreadStatus.RUNNABLE)
    thread.returnStackFrame()
  }
}

export default functions
