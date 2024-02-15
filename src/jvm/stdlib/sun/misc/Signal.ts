import Thread from "../../../thread";

const functions = {
  "findSignal(Ljava/lang/String;)I": (thread: Thread, locals: any[]) => {
    console.warn("Signal.findSignal(Ljava/lang/String;)I not implemented");
    thread.returnStackFrame(-1);
  },
};

export default functions;
