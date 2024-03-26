import Thread from "../thread";
import { ResultType } from "../types/Result";
import { asFloat, asDouble } from "../utils";

const MIN_INT = -2147483648;
const MIN_LONG = BigInt('-9223372036854775808');

export function runIadd(thread: Thread): void {
  const popResult2 = thread.popStack();
  const popResult = thread.popStack();
  if (
    popResult.status === ResultType.ERROR ||
    popResult2.status === ResultType.ERROR
  ) {
    return;
  }
  const value2 = popResult2.result;
  const value1 = popResult.result;
  // 2 * MAX_INT is within max type safe int
  thread.pushStack((value1 + value2) | 0) && thread.offsetPc(1);
}

export function runLadd(thread: Thread): void {
  const popResult2 = thread.popStack64();
  const popResult = thread.popStack64();
  if (
    popResult.status === ResultType.ERROR ||
    popResult2.status === ResultType.ERROR
  ) {
    return;
  }
  const value2 = popResult2.result;
  const value1 = popResult.result;
  thread.pushStack64(BigInt.asIntN(64, value1 + value2)) && thread.offsetPc(1);
}

export function runFadd(thread: Thread): void {
  const popResult2 = thread.popStack();
  const popResult = thread.popStack();
  if (
    popResult.status === ResultType.ERROR ||
    popResult2.status === ResultType.ERROR
  ) {
    return;
  }
  const value2 = asFloat(popResult2.result);
  const value1 = asFloat(popResult.result);

  if (value1 === 0 && value2 !== 0) {
    thread.pushStack(value2) && thread.offsetPc(1);
    return;
  } else if (value1 !== 0 && value2 === 0) {
    thread.pushStack(value1) && thread.offsetPc(1);
    return;
  }

  thread.pushStack(asFloat(value1 + value2)) && thread.offsetPc(1);
}

export function runDadd(thread: Thread): void {
  const popResult2 = thread.popStack64();
  const popResult = thread.popStack64();
  if (
    popResult.status === ResultType.ERROR ||
    popResult2.status === ResultType.ERROR
  ) {
    return;
  }
  const value2 = asDouble(popResult2.result);
  const value1 = asDouble(popResult.result);
  thread.pushStack64(value1 + value2) && thread.offsetPc(1);
}

export function runIsub(thread: Thread): void {
  const popResult2 = thread.popStack();
  const popResult = thread.popStack();
  if (
    popResult.status === ResultType.ERROR ||
    popResult2.status === ResultType.ERROR
  ) {
    return;
  }
  const value2 = popResult2.result;
  const value1 = popResult.result;
  // 2 * MIN_INT within type safe int
  thread.pushStack((value1 - value2) | 0) && thread.offsetPc(1);
}

export function runLsub(thread: Thread): void {
  const popResult2 = thread.popStack64();
  const popResult = thread.popStack64();
  if (
    popResult.status === ResultType.ERROR ||
    popResult2.status === ResultType.ERROR
  ) {
    return;
  }
  const value2: bigint = popResult2.result;
  const value1: bigint = popResult.result;
  thread.pushStack64(BigInt.asIntN(64, value1 - value2)) && thread.offsetPc(1);
}

export function runFsub(thread: Thread): void {
  const popResult2 = thread.popStack();
  const popResult = thread.popStack();
  if (
    popResult.status === ResultType.ERROR ||
    popResult2.status === ResultType.ERROR
  ) {
    return;
  }
  const value2 = asFloat(popResult2.result);
  const value1 = asFloat(popResult.result);

  if (value1 === 0 && value2 !== 0) {
    thread.pushStack(value2) && thread.offsetPc(1);
    return;
  } else if (value1 !== 0 && value2 === 0) {
    thread.pushStack(value1) && thread.offsetPc(1);
    return;
  }

  thread.pushStack(asFloat(value1 - value2)) && thread.offsetPc(1);
}

export function runDsub(thread: Thread): void {
  const popResult2 = thread.popStack64();
  const popResult = thread.popStack64();
  if (
    popResult.status === ResultType.ERROR ||
    popResult2.status === ResultType.ERROR
  ) {
    return;
  }
  const value2 = asDouble(popResult2.result);
  const value1 = asDouble(popResult.result);
  thread.pushStack64(value1 - value2) && thread.offsetPc(1);
}

export function runImul(thread: Thread): void {
  const popResult2 = thread.popStack();
  const popResult = thread.popStack();
  if (
    popResult.status === ResultType.ERROR ||
    popResult2.status === ResultType.ERROR
  ) {
    return;
  }
  const value2 = popResult2.result;
  const value1 = popResult.result;
  thread.pushStack(Math.imul(value1, value2) | 0) && thread.offsetPc(1);
}

export function runLmul(thread: Thread): void {
  const popResult2 = thread.popStack64();
  const popResult = thread.popStack64();
  if (
    popResult.status === ResultType.ERROR ||
    popResult2.status === ResultType.ERROR
  ) {
    return;
  }
  const value2: bigint = popResult2.result;
  const value1: bigint = popResult.result;
  thread.pushStack64(BigInt.asIntN(64, value1 * value2)) && thread.offsetPc(1);
}

export function runFmul(thread: Thread): void {
  const popResult2 = thread.popStack();
  const popResult = thread.popStack();
  if (
    popResult.status === ResultType.ERROR ||
    popResult2.status === ResultType.ERROR
  ) {
    return;
  }
  const value2 = asFloat(popResult2.result);
  const value1 = asFloat(popResult.result);
  thread.pushStack(asFloat(value1 * value2)) && thread.offsetPc(1);
}

export function runDmul(thread: Thread): void {
  const popResult2 = thread.popStack64();
  const popResult = thread.popStack64();
  if (
    popResult.status === ResultType.ERROR ||
    popResult2.status === ResultType.ERROR
  ) {
    return;
  }
  const value2 = asDouble(popResult2.result);
  const value1 = asDouble(popResult.result);
  thread.pushStack64(value1 * value2) && thread.offsetPc(1);
}

export function runIdiv(thread: Thread): void {
  const popResult2 = thread.popStack();
  const popResult = thread.popStack();
  if (
    popResult.status === ResultType.ERROR ||
    popResult2.status === ResultType.ERROR
  ) {
    return;
  }
  const value2 = popResult2.result;
  const value1 = popResult.result;

  if (value2 === 0) {
    thread.throwNewException('java/lang/ArithmeticException', 'Division by 0');
    return;
  }

  if (value1 === MIN_INT && value2 === -1) {
    thread.pushStack(value1) && thread.offsetPc(1);
    return;
  }

  thread.pushStack((value1 / value2) | 0) && thread.offsetPc(1);
}

export function runLdiv(thread: Thread): void {
  const popResult2 = thread.popStack64();
  const popResult = thread.popStack64();
  if (
    popResult.status === ResultType.ERROR ||
    popResult2.status === ResultType.ERROR
  ) {
    return;
  }
  const value2: bigint = popResult2.result;
  const value1: bigint = popResult.result;

  if (value2 === BigInt(0)) {
    thread.throwNewException('java/lang/ArithmeticException', 'Division by 0');
    return;
  }

  if (value1 === MIN_LONG && value2 === -BigInt(1)) {
    thread.pushStack64(value1) && thread.offsetPc(1);
    return;
  }

  thread.pushStack64(BigInt.asIntN(64, value1 / value2)) && thread.offsetPc(1);
}

export function runFdiv(thread: Thread): void {
  const popResult2 = thread.popStack();
  const popResult = thread.popStack();
  if (
    popResult.status === ResultType.ERROR ||
    popResult2.status === ResultType.ERROR
  ) {
    return;
  }
  const value2 = asFloat(popResult2.result);
  const value1 = asFloat(popResult.result);
  thread.pushStack(asFloat(value1 / value2)) && thread.offsetPc(1);
}

export function runDdiv(thread: Thread): void {
  const popResult2 = thread.popStack64();
  const popResult = thread.popStack64();
  if (
    popResult.status === ResultType.ERROR ||
    popResult2.status === ResultType.ERROR
  ) {
    return;
  }
  const value2 = asDouble(popResult2.result);
  const value1 = asDouble(popResult.result);
  thread.pushStack64(value1 / value2) && thread.offsetPc(1);
}

export function runIrem(thread: Thread): void {
  const popResult2 = thread.popStack();
  const popResult = thread.popStack();
  if (
    popResult.status === ResultType.ERROR ||
    popResult2.status === ResultType.ERROR
  ) {
    return;
  }
  const value2 = popResult2.result;
  const value1 = popResult.result;

  if (value2 === 0) {
    thread.throwNewException('java/lang/ArithmeticException', 'Division by 0');
    return;
  }
  // JS bitwise can only return 32-bit ints
  thread.pushStack(value1 % value2 | 0) && thread.offsetPc(1);
}

export function runLrem(thread: Thread): void {
  const popResult2 = thread.popStack64();
  const popResult = thread.popStack64();
  if (
    popResult.status === ResultType.ERROR ||
    popResult2.status === ResultType.ERROR
  ) {
    return;
  }
  const value2: bigint = popResult2.result;
  const value1: bigint = popResult.result;

  if (value2 === BigInt(0)) {
    thread.throwNewException('java/lang/ArithmeticException', 'Division by 0');
    return;
  }

  thread.pushStack64(BigInt.asIntN(64, value1 % value2)) && thread.offsetPc(1);
}

export function runFrem(thread: Thread): void {
  const popResult2 = thread.popStack();
  const popResult = thread.popStack();
  if (
    popResult.status === ResultType.ERROR ||
    popResult2.status === ResultType.ERROR
  ) {
    return;
  }
  const value2 = asFloat(popResult2.result);
  const value1 = asFloat(popResult.result);
  thread.pushStack(asFloat(value1 % value2)) && thread.offsetPc(1);
}

export function runDrem(thread: Thread): void {
  const popResult2 = thread.popStack64();
  const popResult = thread.popStack64();
  if (
    popResult.status === ResultType.ERROR ||
    popResult2.status === ResultType.ERROR
  ) {
    return;
  }
  const value2 = asDouble(popResult2.result);
  const value1 = asDouble(popResult.result);
  thread.pushStack64(value1 % value2) && thread.offsetPc(1);
}

export function runIneg(thread: Thread): void {
  const popResult = thread.popStack();
  if (popResult.status === ResultType.ERROR) {
    return;
  }
  const value = popResult.result;
  thread.pushStack(-value | 0) && thread.offsetPc(1);
}

export function runLneg(thread: Thread): void {
  const popResult = thread.popStack64();
  if (popResult.status === ResultType.ERROR) {
    return;
  }
  const value: bigint = popResult.result;
  thread.pushStack64(BigInt.asIntN(64, -value)) && thread.offsetPc(1);
}

export function runFneg(thread: Thread): void {
  const popResult = thread.popStack();
  if (popResult.status === ResultType.ERROR) {
    return;
  }
  const value = asFloat(popResult.result);
  thread.pushStack(asFloat(-value)) && thread.offsetPc(1);
}

export function runDneg(thread: Thread): void {
  const popResult = thread.popStack64();
  if (popResult.status === ResultType.ERROR) {
    return;
  }
  const value = asDouble(popResult.result);
  thread.pushStack64(-value) && thread.offsetPc(1);
}

export function runIshl(thread: Thread): void {
  const popResult2 = thread.popStack();
  const popResult = thread.popStack();
  if (
    popResult.status === ResultType.ERROR ||
    popResult2.status === ResultType.ERROR
  ) {
    return;
  }
  const value2 = popResult2.result;
  const value1 = popResult.result;
  thread.pushStack((value1 << (value2 & 0x1f)) | 0) && thread.offsetPc(1);
}

export function runLshl(thread: Thread): void {
  const popResult2 = thread.popStack();
  const popResult = thread.popStack64();
  if (
    popResult.status === ResultType.ERROR ||
    popResult2.status === ResultType.ERROR
  ) {
    return;
  }
  const value2: number = popResult2.result;
  const value1: bigint = popResult.result;
  thread.pushStack64(BigInt.asIntN(64, value1 << BigInt(value2 & 0x3f))) &&
    thread.offsetPc(1);
}

export function runIshr(thread: Thread): void {
  const popResult2 = thread.popStack();
  const popResult = thread.popStack();
  if (
    popResult.status === ResultType.ERROR ||
    popResult2.status === ResultType.ERROR
  ) {
    return;
  }
  const value2 = popResult2.result;
  const value1 = popResult.result;
  thread.pushStack((value1 >> (value2 & 0x1f)) | 0) && thread.offsetPc(1);
}

export function runLshr(thread: Thread): void {
  const popResult2 = thread.popStack();
  const popResult = thread.popStack64();
  if (
    popResult.status === ResultType.ERROR ||
    popResult2.status === ResultType.ERROR
  ) {
    return;
  }
  const value2: number = popResult2.result;
  const value1: bigint = popResult.result;
  thread.pushStack64(BigInt.asIntN(64, value1 >> BigInt(value2 & 0x3f))) &&
    thread.offsetPc(1);
}

export function runIushr(thread: Thread): void {
  const popResult2 = thread.popStack();
  const popResult = thread.popStack();
  if (
    popResult.status === ResultType.ERROR ||
    popResult2.status === ResultType.ERROR
  ) {
    return;
  }

  const value2: number = popResult2.result & 0x1f;
  const value1: number = popResult.result;

  thread.pushStack((value1 >>> value2) | 0) && thread.offsetPc(1);
}

export function runLushr(thread: Thread): void {
  const popResult2 = thread.popStack();
  const popResult = thread.popStack64();
  if (
    popResult.status === ResultType.ERROR ||
    popResult2.status === ResultType.ERROR
  ) {
    return;
  }

  const value2: number = popResult2.result & 0x3f;
  const value1: bigint = popResult.result;

  if (value1 >= 0) {
    thread.pushStack64(BigInt.asIntN(64, value1 >> BigInt(value2))) &&
      thread.offsetPc(1);
    return;
  }

  // convert leading 1's to zeros
  thread.pushStack64(
    (value1 & BigInt('0xffffffffffffffff')) >> BigInt(value2)
  ) && thread.offsetPc(1);
}

export function runIand(thread: Thread): void {
  const popResult2 = thread.popStack();
  const popResult = thread.popStack();
  if (
    popResult.status === ResultType.ERROR ||
    popResult2.status === ResultType.ERROR
  ) {
    return;
  }
  const value2 = popResult2.result;
  const value1 = popResult.result;
  thread.pushStack((value1 & value2) | 0) && thread.offsetPc(1);
}

export function runLand(thread: Thread): void {
  const popResult2 = thread.popStack64();
  const popResult = thread.popStack64();
  if (
    popResult.status === ResultType.ERROR ||
    popResult2.status === ResultType.ERROR
  ) {
    return;
  }
  const value2: bigint = popResult2.result;
  const value1: bigint = popResult.result;
  thread.pushStack64(BigInt.asIntN(64, value1 & value2)) && thread.offsetPc(1);
}

export function runIor(thread: Thread): void {
  const popResult2 = thread.popStack();
  const popResult = thread.popStack();
  if (
    popResult.status === ResultType.ERROR ||
    popResult2.status === ResultType.ERROR
  ) {
    return;
  }
  const value2 = popResult2.result;
  const value1 = popResult.result;
  thread.pushStack(value1 | value2 | 0) && thread.offsetPc(1);
}

export function runLor(thread: Thread): void {
  const popResult2 = thread.popStack64();
  const popResult = thread.popStack64();
  if (
    popResult.status === ResultType.ERROR ||
    popResult2.status === ResultType.ERROR
  ) {
    return;
  }
  const value2: bigint = popResult2.result;
  const value1: bigint = popResult.result;
  thread.pushStack64(BigInt.asIntN(64, value1 | value2)) && thread.offsetPc(1);
}

export function runIxor(thread: Thread): void {
  const popResult2 = thread.popStack();
  const popResult = thread.popStack();
  if (
    popResult.status === ResultType.ERROR ||
    popResult2.status === ResultType.ERROR
  ) {
    return;
  }
  const value2 = popResult2.result;
  const value1 = popResult.result;
  thread.pushStack((value1 ^ value2) | 0) && thread.offsetPc(1);
}

export function runLxor(thread: Thread): void {
  const popResult2 = thread.popStack64();
  const popResult = thread.popStack64();
  if (
    popResult.status === ResultType.ERROR ||
    popResult2.status === ResultType.ERROR
  ) {
    return;
  }
  const value2: bigint = popResult2.result;
  const value1: bigint = popResult.result;
  thread.pushStack64(BigInt.asIntN(64, value1 ^ value2)) && thread.offsetPc(1);
}

export function runIinc(thread: Thread): void {
  const index = thread.getCode().getUint8(thread.getPC() + 1);
  const constant = thread.getCode().getInt8(thread.getPC() + 2);
  thread.offsetPc(3);
  thread.storeLocal(
    index,
    ((thread.loadLocal(index) as number) + constant) | 0
  );
}
