import Thread from "../thread";


export function runPop(thread: Thread): void {
  thread.offsetPc(1);
  thread.popStack();
}

export function runPop2(thread: Thread): void {
  thread.offsetPc(1);
  thread.popStack64();
}

export function runDup(thread: Thread): void {
  thread.offsetPc(1);
  const value = thread.popStack();
  thread.pushStack(value);
  thread.pushStack(value);
}

export function runDupX1(thread: Thread): void {
  thread.offsetPc(1);
  const value1 = thread.popStack();
  const value2 = thread.popStack();
  thread.pushStack(value1);
  thread.pushStack(value2);
  thread.pushStack(value1);
}

export function runDupX2(thread: Thread): void {
  thread.offsetPc(1);
  const value1 = thread.popStack();
  const value2 = thread.popStack();
  const value3 = thread.popStack();
  thread.pushStack(value1);
  thread.pushStack(value3);
  thread.pushStack(value2);
  thread.pushStack(value1);
}

export function runDup2(thread: Thread): void {
  thread.offsetPc(1);
  const value1 = thread.popStack();
  const value2 = thread.popStack();
  thread.pushStack(value2);
  thread.pushStack(value1);
  thread.pushStack(value2);
  thread.pushStack(value1);
}

export function runDup2X1(thread: Thread): void {
  thread.offsetPc(1);
  const value1 = thread.popStack();
  const value2 = thread.popStack();
  const value3 = thread.popStack();
  thread.pushStack(value2);
  thread.pushStack(value1);
  thread.pushStack(value3);
  thread.pushStack(value2);
  thread.pushStack(value1);
}

export function runDup2X2(thread: Thread): void {
  thread.offsetPc(1);
  const value1 = thread.popStack();
  const value2 = thread.popStack();
  const value3 = thread.popStack();
  const value4 = thread.popStack();
  thread.pushStack(value2);
  thread.pushStack(value1);
  thread.pushStack(value4);
  thread.pushStack(value3);
  thread.pushStack(value2);
  thread.pushStack(value1);
}

export function runSwap(thread: Thread): void {
  thread.offsetPc(1);
  const value1 = thread.popStack();
  const value2 = thread.popStack();
  thread.pushStack(value1);
  thread.pushStack(value2);
}
