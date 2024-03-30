import Thread from "../../../thread";
import { logger } from "../../../utils";

const functions = {
  /**
   * @todo Not implemented. Returns this.
   * @param thread
   * @param locals
   */
  "fillInStackTrace(I)Ljava/lang/Throwable;": (
    thread: Thread,
    locals: any[]
  ) => {
    logger.warn(
      "Throwable.fillInStackTrace(I)Ljava/lang/Throwable; not implemented"
    );
    thread.returnStackFrame(locals[0]);
  },

  /**
   * @todo Not implemented. Returns 0.
   * @param thread
   * @param locals
   */
  "getStackTraceDepth()I": (thread: Thread, locals: any[]) => {
    logger.warn("Throwable.getStackTraceDepth()I not implemented");
    thread.returnStackFrame(0);
  },
};

export default functions;
