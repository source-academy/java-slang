import Thread from "../thread";

export function runBreakpoint(thread: Thread): void {
  thread.offsetPc(1);
  throw new Error('BREAKPOINT: Not implemented');
}

export function runImpdep1(thread: Thread): void {
  thread.offsetPc(1);
  throw new Error('IMPDEP1: Not implemented');
}

export function runImpdep2(thread: Thread): void {
  thread.offsetPc(1);
  throw new Error('IMPDEP2: Not implemented');
}
