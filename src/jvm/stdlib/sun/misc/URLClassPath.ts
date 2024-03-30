import Thread from "../../../thread";
import { logger } from "../../../utils";

const functions = {
  /**
   * @todo Not implemented. Returns null.
   * @param thread
   * @param locals
   */
  "getLookupCacheURLs(Ljava/lang/ClassLoader;)[Ljava/net/URL;": (
    thread: Thread,
    locals: any[]
  ) => {
    logger.warn(
      "Native method not implemented: getLookupCacheURLs(Ljava/lang/ClassLoader;)[Ljava/net/URL;"
    );
    thread.returnStackFrame(null);
  },
};

export default functions;
