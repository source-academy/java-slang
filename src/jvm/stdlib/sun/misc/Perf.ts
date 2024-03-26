import { InternalStackFrame } from "../../../stackframe";
import Thread from "../../../thread";
import { ReferenceClassData } from "../../../types/class/ClassData";
import { JvmObject } from "../../../types/reference/Object";
import { ResultType } from "../../../types/Result";

const functions = {
  'createLong(Ljava/lang/String;IIJ)Ljava/nio/ByteBuffer;': (
    thread: Thread,
    locals: any[]
  ) => {
    const value = locals[4] as bigint;

    const bbRes = thread
      .getMethod()
      .getClass()
      .getLoader()
      .getClass('java/nio/DirectByteBuffer');
    if (bbRes.status === ResultType.ERROR) {
      thread.throwNewException(bbRes.exceptionCls, bbRes.msg);
      return;
    }

    const bbCls = bbRes.result as ReferenceClassData;
    const heap = thread.getJVM().getUnsafeHeap();
    const addr = heap.allocate(BigInt(8));
    const buff = bbCls.instantiate();

    const bbInit = bbCls.getMethod('<init>(JI)V');
    if (!bbInit) {
      thread.throwNewException('java/lang/NoSuchMethodError', '<init>(JI)V');
      return;
    }

    thread.invokeStackFrame(
      new InternalStackFrame(
        bbCls,
        bbInit,
        0,
        [buff, addr, addr, 8], // Longs occupy 2 indexes
        (ret: JvmObject, err?: any) => {
          if (err) {
            thread.throwNewException(err.exceptionCls, err.msg);
            return;
          }
          heap.get(addr).setBigInt64(0, value);
          thread.returnStackFrame(buff);
        }
      )
    );
  },
};

export default functions;
