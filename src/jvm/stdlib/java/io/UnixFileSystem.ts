import Thread from '../../../thread'
import { JvmObject } from '../../../types/reference/Object'
import { j2jsString, js2jString, logger } from '../../../utils'

const functions = {
  /**
   * We should resolve the path here, but we don't have a filesystem.
   * @param thread
   * @param locals
   */
  'canonicalize0(Ljava/lang/String;)Ljava/lang/String;': (thread: Thread, locals: any[]) => {
    const pathStr = j2jsString(locals[1] as JvmObject)
    thread.returnStackFrame(js2jString(thread.getClass().getLoader(), pathStr))
  },

  /**
   * Not implemented. NOP.
   * @param thread
   * @param locals
   */
  'initIDs()V': (thread: Thread) => {
    thread.returnStackFrame()
  },

  /**
   * Not implemented. returns 0 (file does not exist).
   * @param thread
   * @param locals
   */
  'getBooleanAttributes0(Ljava/io/File;)I': (thread: Thread) => {
    logger.warn('Native method not implemented: getBooleanAttributes0(Ljava/io/File;)I')
    thread.returnStackFrame(0)
  },

  /**
   * Not implemented. Returns null.
   * @param thread
   * @param locals
   */
  'list(Ljava/io/File;)[Ljava/lang/String;': (thread: Thread) => {
    logger.warn('Native method not implemented: list(Ljava/io/File;)[Ljava/lang/String;')
    thread.returnStackFrame(null)
  }
}

export default functions
