import Thread from "../../../thread";

const functions = {
  "getLookupCacheURLs(Ljava/lang/ClassLoader;)[Ljava/net/URL;": (
    thread: Thread,
    locals: any[]
  ) => {
    console.warn(
      "Native method not implemented: getLookupCacheURLs(Ljava/lang/ClassLoader;)[Ljava/net/URL;"
    );
    thread.returnStackFrame(null);
  },
};

export default functions;
