import Thread from '../../../../../thread'

const functions = {
  'VMSupportsCS8()Z': (thread: Thread) => {
    thread.returnStackFrame(1) // support compare and swap
  }
}

export default functions
