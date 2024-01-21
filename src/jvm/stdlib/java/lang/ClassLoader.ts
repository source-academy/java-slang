import AbstractClassLoader from "../../../ClassLoader/AbstractClassLoader";
import Thread from "../../../thread";
import { checkError } from "../../../types/Result";
import { JvmObject } from "../../../types/reference/Object";
import { j2jsString } from "../../../utils";

const functions = {
  "findLoadedClass0(Ljava/lang/String;)Ljava/lang/Class;": (
    thread: Thread,
    locals: any[]
  ) => {
    const className = j2jsString(locals[1] as JvmObject).replaceAll(".", "/");
    const loader: AbstractClassLoader =
      (locals[0] as JvmObject).getNativeField("$loader") ??
      thread.getJVM().getBootstrapClassLoader();

    const res = loader.getClass(className);

    if (checkError(res)) {
      thread.throwNewException(res.exceptionCls, res.msg);
      return;
    }
    const cls = res.result;

    thread.returnStackFrame(cls.getJavaObject());
  },
};

export default functions;
