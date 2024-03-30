import Thread from "../../../thread";
import { logger } from "../../../utils";

const functions = {
  /**
   * Not implemented. NOP.
   * @param thread
   * @param locals
   */
  "initIDs()V": (thread: Thread, locals: any[]) => {
    logger.warn("FileInputStream.initIDs()V not implemented");
    thread.returnStackFrame();
  },
};

export default functions;
