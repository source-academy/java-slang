import Thread from "../../../thread";
import { logger } from "../../../utils";

const functions = {
  'initIDs()V': (thread: Thread, locals: any[]) => {
    logger.warn('FileInputStream.initIDs()V not implemented');
    thread.returnStackFrame();
  },
};

export default functions;
