import { InternalStackFrame } from "../../../stackframe";
import Thread from "../../../thread";
import { ReferenceClassData } from "../../../types/class/ClassData";
import { JvmArray } from "../../../types/reference/Array";
import { JvmObject } from "../../../types/reference/Object";
import { ResultType } from "../../../types/Result";

const functions = {
  'newInstance0(Ljava/lang/reflect/Constructor;[Ljava/lang/Object;)Ljava/lang/Object;':
    (thread: Thread, locals: any[]) => {
      const constructor = locals[0] as JvmObject;
      const paramArr = locals[1] as JvmArray;
      const clsObj = constructor._getField(
        'clazz',
        'Ljava/lang/Class;',
        'java/lang/reflect/Constructor'
      ) as JvmObject;
      const methodSlot = constructor._getField(
        'slot',
        'I',
        'java/lang/reflect/Constructor'
      ) as number;
      const clsRef = clsObj.getNativeField('classRef') as ReferenceClassData;
      const methodRef = clsRef.getMethodFromSlot(methodSlot);
      if (!methodRef) {
        throw new Error('Invalid slot?');
      }

      const initRes = clsRef.initialize(thread);
      if (initRes.status !== ResultType.SUCCESS) {
        if (initRes.status === ResultType.ERROR) {
          thread.throwNewException(initRes.exceptionCls, initRes.msg);
        }
        return;
      }

      const retObj = clsRef.instantiate();
      // FIXME: unbox args if required
      if (paramArr) {
        console.error('newInstance0: Auto unboxing not implemented');
      }
      const params = [retObj, ...(paramArr ? paramArr.getJsArray() : [])];
      thread.invokeStackFrame(
        new InternalStackFrame(clsRef, methodRef, 0, params, () => {
          thread.returnStackFrame();
          thread.returnStackFrame(retObj);
        })
      );
    },
};

export default functions;
