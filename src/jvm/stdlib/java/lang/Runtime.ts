import Thread from '../../../thread'

const functions = {
  /**
   * @todo Not implemented. Returns 1 (will there be more?).
   * @param thread
   * @param locals
   */
  'availableProcessors()I': (thread: Thread) => {
    thread.returnStackFrame(1)
  }
}
export default functions
