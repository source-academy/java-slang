import Thread from "../../../thread";
import { JvmObject } from "../../../types/reference/Object";
import { j2jsString } from "../../../utils";

const functions = {
  "intern()Ljava/lang/String;": (thread: Thread, locals: any[]) => {
    const strObj = locals[0] as JvmObject;
    const strVal = j2jsString(strObj);
    const internedStr = thread.getJVM().getInternedString(strVal);
    thread.returnStackFrame(internedStr);
  },
};
export default functions;
