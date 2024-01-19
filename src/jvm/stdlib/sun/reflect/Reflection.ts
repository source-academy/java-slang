import { StackFrame } from "../../../stackframe";
import Thread from "../../../thread";
import { ReferenceClassData } from "../../../types/class/ClassData";
import { JvmObject } from "../../../types/reference/Object";

/**
 * From Doppio
 */
function getCallerClass(
  thread: Thread,
  framesToSkip: number
): JvmObject | null {
  const caller = thread.getFrames();
  let idx = caller.length - 1 - framesToSkip;
  let frame: StackFrame = caller[idx];

  while (
    frame.method.getClass().getClassname() === "java/lang/reflect/Method" &&
    frame.method.getName() === "invoke"
  ) {
    if (idx === 0) {
      // No more stack to search!
      // XXX: What does the JDK do here, throw an exception?
      return null;
    }
    frame = caller[--idx];
  }

  return frame.method.getClass().getJavaObject();
}

const functions = {
  "getCallerClass()Ljava/lang/Class;": (thread: Thread, locals: any[]) => {
    const callerclass = getCallerClass(thread, 2);
    thread.returnStackFrame(callerclass);
  },
  "getClassAccessFlags(Ljava/lang/Class;)I": (
    thread: Thread,
    locals: any[]
  ) => {
    const clsObj = locals[0] as JvmObject;
    const clsRef = clsObj.getNativeField("classRef") as ReferenceClassData;
    thread.returnStackFrame(clsRef.getAccessFlags());
  },
};

export default functions;
