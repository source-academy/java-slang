import { ThreadStatus } from "../../../constants";
import { JavaStackFrame } from "../../../stackframe";
import Thread from "../../../thread";
import { ReferenceClassData } from "../../../types/class/ClassData";
import { Method } from "../../../types/class/Method";
import { JvmObject } from "../../../types/reference/Object";

const functions = {
  "isAlive()Z": (thread: Thread, locals: any[]) => {
    const threadObj = locals[0] as JvmObject;
    const t = threadObj.getNativeField("thread") as Thread;
    if (!t) {
      thread.returnStackFrame(0);
    }
    const status = t.getStatus();
    if (status === ThreadStatus.TERMINATED || status === ThreadStatus.NEW) {
      thread.returnStackFrame(0);
    }
    thread.returnStackFrame(1);
  },

  "setPriority0(I)V": (thread: Thread, locals: any[]) => {
    thread.returnStackFrame();
  },

  "registerNatives()V": (thread: Thread, locals: any[]) => {
    thread.returnStackFrame();
  },

  "currentThread()Ljava/lang/Thread;": (thread: Thread, locals: any[]) => {
    const threadObj = thread.getJavaObject();
    thread.returnStackFrame(threadObj);
  },

  "sleep(J)V": (thread: Thread, locals: any[]) => {
    thread.setStatus(ThreadStatus.TIMED_WAITING);
    thread.returnStackFrame();
    setTimeout(() => {
      thread.setStatus(ThreadStatus.RUNNABLE);
    }, Number(locals[0] as BigInt));
  },

  "start0()V": (thread: Thread, locals: any[]) => {
    const threadObj = locals[0] as JvmObject;
    const threadCls = threadObj.getClass() as ReferenceClassData;
    const mainTpool = thread.getThreadPool();

    // thread object created from code, native thread not created
    let newThread = threadObj.getNativeField("thread");
    if (!newThread) {
      newThread = new Thread(threadCls, thread.getJVM(), mainTpool, threadObj);
      newThread.invokeStackFrame(
        new JavaStackFrame(
          threadCls,
          threadCls.getMethod("run()V") as Method,
          0,
          [threadObj]
        )
      );
      threadObj.putNativeField("thread", newThread);
    }

    mainTpool.addThread(newThread);
    newThread.setStatus(ThreadStatus.RUNNABLE);
    thread.returnStackFrame();
  },
};

export default functions;
