import Thread from "../../../thread";
import { JvmObject } from "../../../types/reference/Object";
import { j2jsString, js2jString } from "../../../utils";

const functions = {
  "canonicalize0(Ljava/lang/String;)Ljava/lang/String;": (
    thread: Thread,
    locals: any[]
  ) => {
    const pathStr = j2jsString(locals[1] as JvmObject);

    thread.returnStackFrame(js2jString(thread.getClass().getLoader(), pathStr));
  },

  "initIDs()V": (thread: Thread, locals: any[]) => {
    thread.returnStackFrame();
  },

  "getBooleanAttributes0(Ljava/io/File;)I": (thread: Thread, locals: any[]) => {
    console.warn(
      "Native method not implemented: getBooleanAttributes0(Ljava/io/File;)I"
    );
    thread.returnStackFrame(0);
  },

  "list(Ljava/io/File;)[Ljava/lang/String;": (
    thread: Thread,
    locals: any[]
  ) => {
    console.warn(
      "Native method not implemented: list(Ljava/io/File;)[Ljava/lang/String;"
    );
    thread.returnStackFrame(null);
  },
};

export default functions;
