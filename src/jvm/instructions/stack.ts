import Thread from "../thread";
import { checkSuccess, checkError } from "../types/Result";

export function runPop(thread: Thread): void {
  checkSuccess(thread.popStack()) && thread.offsetPc(1);
}

export function runPop2(thread: Thread): void {
  thread.popStack();
  checkSuccess(thread.popStack()) && thread.offsetPc(1);
}

export function runDup(thread: Thread): void {
  const popResult = thread.popStack();
  if (checkError(popResult)) {
    return;
  }
  const value = popResult.result;
  thread.pushStack(value);
  thread.pushStack(value) && thread.offsetPc(1);
}

export function runDupX1(thread: Thread): void {
  thread.offsetPc(1);
  const popResult = thread.popStack();
  const popResult2 = thread.popStack();
  if (checkError(popResult) || checkError(popResult2)) {
    return;
  }
  const value1 = popResult.result;
  const value2 = popResult2.result;
  thread.pushStack(value1);
  thread.pushStack(value2);
  thread.pushStack(value1);
}

export function runDupX2(thread: Thread): void {
  thread.offsetPc(1);
  const popResult = thread.popStack();
  const popResult2 = thread.popStack();
  const popResult3 = thread.popStack();
  if (
    checkError(popResult) ||
    checkError(popResult2) ||
    checkError(popResult3)
  ) {
    return;
  }
  const value1 = popResult.result;
  const value2 = popResult2.result;
  const value3 = popResult3.result;
  thread.pushStack(value1);
  thread.pushStack(value3);
  thread.pushStack(value2);
  thread.pushStack(value1);
}

export function runDup2(thread: Thread): void {
  thread.offsetPc(1);
  const popResult = thread.popStack();
  const popResult2 = thread.popStack();
  if (checkError(popResult) || checkError(popResult2)) {
    return;
  }
  const value1 = popResult.result;
  const value2 = popResult2.result;
  thread.pushStack(value2);
  thread.pushStack(value1);
  thread.pushStack(value2);
  thread.pushStack(value1);
}

export function runDup2X1(thread: Thread): void {
  thread.offsetPc(1);
  const popResult = thread.popStack();
  const popResult2 = thread.popStack();
  const popResult3 = thread.popStack();
  if (
    checkError(popResult) ||
    checkError(popResult2) ||
    checkError(popResult3)
  ) {
    return;
  }
  const value1 = popResult.result;
  const value2 = popResult2.result;
  const value3 = popResult3.result;
  thread.pushStack(value2);
  thread.pushStack(value1);
  thread.pushStack(value3);
  thread.pushStack(value2);
  thread.pushStack(value1);
}

export function runDup2X2(thread: Thread): void {
  thread.offsetPc(1);
  const popResult = thread.popStack();
  const popResult2 = thread.popStack();
  const popResult3 = thread.popStack();
  const popResult4 = thread.popStack();
  if (
    checkError(popResult) ||
    checkError(popResult2) ||
    checkError(popResult3) ||
    checkError(popResult4)
  ) {
    return;
  }
  const value1 = popResult.result;
  const value2 = popResult2.result;
  const value3 = popResult3.result;
  const value4 = popResult4.result;
  thread.pushStack(value2);
  thread.pushStack(value1);
  thread.pushStack(value4);
  thread.pushStack(value3);
  thread.pushStack(value2);
  thread.pushStack(value1);
}

export function runSwap(thread: Thread): void {
  thread.offsetPc(1);
  const popResult = thread.popStack();
  const popResult2 = thread.popStack();
  if (checkError(popResult) || checkError(popResult2)) {
    return;
  }
  const value1 = popResult.result;
  const value2 = popResult2.result;
  thread.pushStack(value1);
  thread.pushStack(value2);
}
