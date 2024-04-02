import Thread from '../../../thread'

const functions = {
  /**
   * @todo Not implemented. Assumes JVM is already initialized.
   * @param thread
   * @param locals
   */
  'initialize()V': (thread: Thread) => {
    thread.returnStackFrame()
  }
}

export default functions
