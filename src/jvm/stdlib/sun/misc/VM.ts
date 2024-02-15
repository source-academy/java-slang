import Thread from "../../../thread";

const functions = {
  "initialize()V": (thread: Thread, locals: any[]) => {
    thread.returnStackFrame();
  },
};

export default functions;
