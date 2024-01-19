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
};

export default functions;
