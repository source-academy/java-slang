import Thread from "../../../thread";
import { logger } from "../../../utils";

const functions = {
  'fillInStackTrace(I)Ljava/lang/Throwable;': (
    thread: Thread,
    locals: any[]
  ) => {
    logger.warn(
      'Throwable.fillInStackTrace(I)Ljava/lang/Throwable; not implemented'
    );
    thread.returnStackFrame(locals[0]);
  },

  'getStackTraceDepth()I': (thread: Thread, locals: any[]) => {
    logger.warn('Throwable.getStackTraceDepth()I not implemented');
    thread.returnStackFrame(0);
  },
};

export default functions;
