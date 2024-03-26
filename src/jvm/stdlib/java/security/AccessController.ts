import { InternalStackFrame } from "../../../stackframe";
import Thread from "../../../thread";
import { Method } from "../../../types/class/Method";
import { JvmObject } from "../../../types/reference/Object";
import { ResultType } from "../../../types/Result";
import { logger } from "../../../utils";

const doPrivileged = (thread: Thread, locals: any[]) => {
  const action = locals[0] as JvmObject;
  const actionCls = action.getClass();
  const methodRes = actionCls.resolveMethod(
    'run()',
    'Ljava/lang/Object;',
    thread.getClass()
  );

  if (methodRes.status !== ResultType.SUCCESS) {
    thread.throwNewException(methodRes.exceptionCls, methodRes.msg);
    return;
  }

  const methodRef = methodRes.result as Method;
  thread.invokeStackFrame(
    new InternalStackFrame(
      methodRef.getClass(),
      methodRef,
      0,
      [action],
      (ret: JvmObject) => {
        thread.returnStackFrame(ret);
      }
    )
  );
};
const functions = {
  'doPrivileged(Ljava/security/PrivilegedExceptionAction;Ljava/security/AccessControlContext;)Ljava/lang/Object;':
    doPrivileged,

  'doPrivileged(Ljava/security/PrivilegedExceptionAction;)Ljava/lang/Object;':
    doPrivileged,

  'doPrivileged(Ljava/security/PrivilegedAction;Ljava/security/AccessControlContext;)Ljava/lang/Object;':
    doPrivileged,

  'doPrivileged(Ljava/security/PrivilegedAction;)Ljava/lang/Object;': (
    thread: Thread,
    locals: any[]
  ) => {
    const action = locals[0] as JvmObject;
    const loader = thread.getClass().getLoader();
    const acRes = loader.getClass('java/security/AccessController');
    if (acRes.status === ResultType.ERROR) {
      thread.throwNewException(acRes.exceptionCls, acRes.msg);
      return;
    }
    const acCls = acRes.result;

    const paRes = loader.getClass('java/security/PrivilegedAction');
    if (paRes.status === ResultType.ERROR) {
      thread.throwNewException(paRes.exceptionCls, paRes.msg);
      return;
    }

    const paCls = paRes.result;
    const mRes = paCls.resolveMethod('run()', 'Ljava/lang/Object;', acCls);
    if (mRes.status === ResultType.ERROR) {
      thread.throwNewException(mRes.exceptionCls, mRes.msg);
      return;
    }
    const mRef = mRes.result;

    const runtimeCls = action.getClass();
    const lRes = runtimeCls.lookupMethod('run()Ljava/lang/Object;', mRef);
    if (lRes.status === ResultType.ERROR) {
      thread.throwNewException(lRes.exceptionCls, lRes.msg);
      return;
    }
    const method = lRes.result;
    if (!method) {
      thread.throwNewException(
        'java/lang/NoSuchMethodException',
        'run()Ljava/lang/Object;'
      );
      return;
    }

    thread.invokeStackFrame(
      new InternalStackFrame(runtimeCls, method, 0, [action], ret => {
        thread.returnStackFrame(ret);
      })
    );
  },

  'getStackAccessControlContext()Ljava/security/AccessControlContext;': (
    thread: Thread,
    locals: any[]
  ) => {
    logger.warn(
      'getStackAccessControlContext()Ljava/security/AccessControlContext; not implemented'
    );
    thread.returnStackFrame(null);
  },
};
export default functions;
