import Thread from "../thread";

/**
 * @todo Not implemented. Pause the threadpool perhaps.
 */
export function runBreakpoint(thread: Thread): void {
  thread.offsetPc(1);
  // TODO: set some kind of breakpoint flag in threadpool, then pause all execution?
  throw new Error("BREAKPOINT: Not implemented");
}

/**
 * @todo Not implemented.
 */
export function runImpdep1(thread: Thread): void {
  thread.offsetPc(1);
  throw new Error("IMPDEP1: Not implemented");
}

/**
 * @todo Not implemented.
 */
export function runImpdep2(thread: Thread): void {
  thread.offsetPc(1);
  throw new Error("IMPDEP2: Not implemented");
}
