import Thread from '../../../thread'

const functions = {
  'doubleToRawLongBits(D)J': (thread: Thread, locals: any[]) => {
    const double = locals[0]
    const dataview = new DataView(new ArrayBuffer(8))
    dataview.setFloat64(0, double)
    thread.returnStackFrame64(dataview.getBigInt64(0))
  },

  'longBitsToDouble(J)D': (thread: Thread, locals: any[]) => {
    const long = locals[0]
    const dataview = new DataView(new ArrayBuffer(8))
    dataview.getBigInt64(0, long)
    thread.returnStackFrame64(dataview.getFloat64(0))
  }
}

export default functions
