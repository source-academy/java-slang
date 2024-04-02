import Thread from '../../../thread'
import { logger } from '../../../utils'

const functions = {
  /**
   * @todo Not implemented. Returns null.
   * @param thread
   */
  'getLookupCacheURLs(Ljava/lang/ClassLoader;)[Ljava/net/URL;': (thread: Thread) => {
    logger.warn(
      'Native method not implemented: getLookupCacheURLs(Ljava/lang/ClassLoader;)[Ljava/net/URL;'
    )
    thread.returnStackFrame(null)
  }
}

export default functions
