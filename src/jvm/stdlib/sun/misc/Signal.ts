import Thread from "../../../thread";
import { logger } from "../../../utils";

const functions = {
  /**
   * @todo Not implemented. Returns -1 (not found).
   * @param thread
   * @param locals
   */
  "findSignal(Ljava/lang/String;)I": (thread: Thread, locals: any[]) => {
    logger.warn("Signal.findSignal(Ljava/lang/String;)I not implemented");
    thread.returnStackFrame(-1);
  },
};

export default functions;
