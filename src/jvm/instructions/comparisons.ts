import Thread from "../thread";
import { ResultType } from "../types/Result";
import { asFloat, asDouble } from "../utils";

function cmp(value1: number, value2: number, checkNan: number = 0): number {
  if (checkNan !== 0 && (Number.isNaN(value1) || Number.isNaN(value2))) {
    return checkNan;
  }

  if (value1 == value2) {
    return 0;
  }

  if (value1 > value2) {
    return 1;
  }

  return -1;
}

export function runLcmp(thread: Thread): void {
  const popResult2 = thread.popStack64();
  const popResult1 = thread.popStack64();
  if (
    popResult1.status === ResultType.ERROR ||
    popResult2.status === ResultType.ERROR
  ) {
    return;
  }

  thread.pushStack(cmp(popResult1.result, popResult2.result));
  thread.offsetPc(1);
}

export function runFcmpl(thread: Thread): void {
  const popResult2 = thread.popStack();
  const popResult1 = thread.popStack();
  if (
    popResult1.status === ResultType.ERROR ||
    popResult2.status === ResultType.ERROR
  ) {
    return;
  }
  thread.pushStack(
    cmp(asFloat(popResult1.result), asFloat(popResult2.result), -1)
  );
  thread.offsetPc(1);
}

export function runFcmpg(thread: Thread): void {
  const popResult2 = thread.popStack();
  const popResult1 = thread.popStack();
  if (
    popResult1.status === ResultType.ERROR ||
    popResult2.status === ResultType.ERROR
  ) {
    return;
  }

  thread.pushStack(
    cmp(asFloat(popResult1.result), asFloat(popResult2.result), 1)
  );
  thread.offsetPc(1);
}

export function runDcmpl(thread: Thread): void {
  const popResult2 = thread.popStack64();
  const popResult1 = thread.popStack64();
  if (
    popResult1.status === ResultType.ERROR ||
    popResult2.status === ResultType.ERROR
  ) {
    return;
  }
  thread.pushStack(
    cmp(asDouble(popResult1.result), asDouble(popResult2.result), -1)
  );
  thread.offsetPc(1);
}

export function runDcmpg(thread: Thread): void {
  const popResult2 = thread.popStack64();
  const popResult1 = thread.popStack64();
  if (
    popResult1.status === ResultType.ERROR ||
    popResult2.status === ResultType.ERROR
  ) {
    return;
  }
  thread.pushStack(
    cmp(asDouble(popResult1.result), asDouble(popResult2.result), 1)
  );
  thread.offsetPc(1);
}

export function runIfeq(thread: Thread): void {
  const branchbyte = thread.getCode().getInt16(thread.getPC() + 1);
  const popResult = thread.popStack();
  if (popResult.status === ResultType.ERROR) {
    return;
  }

  if (popResult.result === 0) {
    thread.offsetPc(branchbyte);
  } else {
    thread.offsetPc(3);
  }
}

export function runIfne(thread: Thread): void {
  const branchbyte = thread.getCode().getInt16(thread.getPC() + 1);
  const popResult = thread.popStack();
  if (popResult.status === ResultType.ERROR) {
    return;
  }

  if (popResult.result !== 0) {
    thread.offsetPc(branchbyte);
  } else {
    thread.offsetPc(3);
  }
}

export function runIflt(thread: Thread): void {
  const branchbyte = thread.getCode().getInt16(thread.getPC() + 1);
  const popResult = thread.popStack();
  if (popResult.status === ResultType.ERROR) {
    return;
  }

  if (popResult.result < 0) {
    thread.offsetPc(branchbyte);
  } else {
    thread.offsetPc(3);
  }
}

export function runIfge(thread: Thread): void {
  const branchbyte = thread.getCode().getInt16(thread.getPC() + 1);
  const popResult = thread.popStack();
  if (popResult.status === ResultType.ERROR) {
    return;
  }

  if (popResult.result >= 0) {
    thread.offsetPc(branchbyte);
  } else {
    thread.offsetPc(3);
  }
}

export function runIfgt(thread: Thread): void {
  const branchbyte = thread.getCode().getInt16(thread.getPC() + 1);
  const popResult = thread.popStack();
  if (popResult.status === ResultType.ERROR) {
    return;
  }

  if (popResult.result > 0) {
    thread.offsetPc(branchbyte);
  } else {
    thread.offsetPc(3);
  }
}

export function runIfle(thread: Thread): void {
  const branchbyte = thread.getCode().getInt16(thread.getPC() + 1);
  const popResult = thread.popStack();
  if (popResult.status === ResultType.ERROR) {
    return;
  }

  if (popResult.result <= 0) {
    thread.offsetPc(branchbyte);
  } else {
    thread.offsetPc(3);
  }
}

export function runIfIcmpeq(thread: Thread): void {
  const branchbyte = thread.getCode().getInt16(thread.getPC() + 1);
  const popResult1 = thread.popStack();
  const popResult2 = thread.popStack();
  if (
    popResult1.status === ResultType.ERROR ||
    popResult2.status === ResultType.ERROR
  ) {
    return;
  }

  if (popResult1.result === popResult2.result) {
    thread.offsetPc(branchbyte);
  } else {
    thread.offsetPc(3);
  }
}

export function runIfIcmpne(thread: Thread): void {
  const branchbyte = thread.getCode().getInt16(thread.getPC() + 1);
  const popResult1 = thread.popStack();
  const popResult2 = thread.popStack();
  if (
    popResult1.status === ResultType.ERROR ||
    popResult2.status === ResultType.ERROR
  ) {
    return;
  }

  if (popResult1.result !== popResult2.result) {
    thread.offsetPc(branchbyte);
  } else {
    thread.offsetPc(3);
  }
}

export function runIfIcmplt(thread: Thread): void {
  const branchbyte = thread.getCode().getInt16(thread.getPC() + 1);
  const popResult2 = thread.popStack();
  const popResult1 = thread.popStack();
  if (
    popResult1.status === ResultType.ERROR ||
    popResult2.status === ResultType.ERROR
  ) {
    return;
  }

  if (popResult1.result < popResult2.result) {
    thread.offsetPc(branchbyte);
  } else {
    thread.offsetPc(3);
  }
}

export function runIfIcmpge(thread: Thread): void {
  const branchbyte = thread.getCode().getInt16(thread.getPC() + 1);
  const popResult2 = thread.popStack();
  const popResult1 = thread.popStack();
  if (
    popResult1.status === ResultType.ERROR ||
    popResult2.status === ResultType.ERROR
  ) {
    return;
  }

  if (popResult1.result >= popResult2.result) {
    thread.offsetPc(branchbyte);
  } else {
    thread.offsetPc(3);
  }
}

export function runIfIcmpgt(thread: Thread): void {
  const branchbyte = thread.getCode().getInt16(thread.getPC() + 1);
  const popResult2 = thread.popStack();
  const popResult1 = thread.popStack();
  if (
    popResult1.status === ResultType.ERROR ||
    popResult2.status === ResultType.ERROR
  ) {
    return;
  }

  if (popResult1.result > popResult2.result) {
    thread.offsetPc(branchbyte);
  } else {
    thread.offsetPc(3);
  }
}

export function runIfIcmple(thread: Thread): void {
  const branchbyte = thread.getCode().getInt16(thread.getPC() + 1);
  const popResult2 = thread.popStack();
  const popResult1 = thread.popStack();
  if (
    popResult1.status === ResultType.ERROR ||
    popResult2.status === ResultType.ERROR
  ) {
    return;
  }

  if (popResult1.result <= popResult2.result) {
    thread.offsetPc(branchbyte);
  } else {
    thread.offsetPc(3);
  }
}

export function runIfAcmpeq(thread: Thread): void {
  const branchbyte = thread.getCode().getInt16(thread.getPC() + 1);
  const popResult2 = thread.popStack();
  const popResult1 = thread.popStack();
  if (
    popResult1.status === ResultType.ERROR ||
    popResult2.status === ResultType.ERROR
  ) {
    return;
  }

  if (popResult1.result === popResult2.result) {
    thread.offsetPc(branchbyte);
  } else {
    thread.offsetPc(3);
  }
}

export function runIfAcmpne(thread: Thread): void {
  const branchbyte = thread.getCode().getInt16(thread.getPC() + 1);
  const popResult2 = thread.popStack();
  const popResult1 = thread.popStack();
  if (
    popResult1.status === ResultType.ERROR ||
    popResult2.status === ResultType.ERROR
  ) {
    return;
  }

  if (popResult1.result !== popResult2.result) {
    thread.offsetPc(branchbyte);
  } else {
    thread.offsetPc(3);
  }
}
