import Thread from "../../../../../thread";

const functions = {
  "VMSupportsCS8()Z": (thread: Thread, locals: any[]) => {
    thread.returnStackFrame(1); // support compare and swap
  },
};

export default functions;
