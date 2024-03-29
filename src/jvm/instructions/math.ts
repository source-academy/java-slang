import Thread from "../thread";
import { checkError } from "../types/Result";
import { asFloat, asDouble } from "../utils";

const MIN_INT = -2147483648;
const MIN_LONG = BigInt("-9223372036854775808");

export function runIadd(thread: Thread): void {
  thread.offsetPc(1);
  const popResult2 = thread.popStack();
  const popResult = thread.popStack();
  if (checkError(popResult) || checkError(popResult2)) {
    return;
  }
  const value2 = popResult2.result;
  const value1 = popResult.result;
  // 2 * MAX_INT is within max type safe int
  thread.pushStack((value1 + value2) | 0);
}

export function runLadd(thread: Thread): void {
  thread.offsetPc(1);
  const popResult2 = thread.popStack64();
  const popResult = thread.popStack64();
  if (checkError(popResult) || checkError(popResult2)) {
    return;
  }
  const value2 = popResult2.result;
  const value1 = popResult.result;
  thread.pushStack64(BigInt.asIntN(64, value1 + value2));
}

export function runFadd(thread: Thread): void {
  thread.offsetPc(1);
  const popResult2 = thread.popStack();
  const popResult = thread.popStack();
  if (checkError(popResult) || checkError(popResult2)) {
    return;
  }
  const value2 = asFloat(popResult2.result);
  const value1 = asFloat(popResult.result);

  if (value1 === 0 && value2 !== 0) {
    thread.pushStack(value2);
    return;
  } else if (value1 !== 0 && value2 === 0) {
    thread.pushStack(value1);
    return;
  }

  thread.pushStack(asFloat(value1 + value2));
}

export function runDadd(thread: Thread): void {
  thread.offsetPc(1);
  const popResult2 = thread.popStack64();
  const popResult = thread.popStack64();
  if (checkError(popResult) || checkError(popResult2)) {
    return;
  }
  const value2 = asDouble(popResult2.result);
  const value1 = asDouble(popResult.result);
  thread.pushStack64(value1 + value2);
}

export function runIsub(thread: Thread): void {
  thread.offsetPc(1);
  const popResult2 = thread.popStack();
  const popResult = thread.popStack();
  if (checkError(popResult) || checkError(popResult2)) {
    return;
  }
  const value2 = popResult2.result;
  const value1 = popResult.result;
  // 2 * MIN_INT within type safe int
  thread.pushStack((value1 - value2) | 0);
}

export function runLsub(thread: Thread): void {
  thread.offsetPc(1);
  const popResult2 = thread.popStack64();
  const popResult = thread.popStack64();
  if (checkError(popResult) || checkError(popResult2)) {
    return;
  }
  const value2: bigint = popResult2.result;
  const value1: bigint = popResult.result;
  thread.pushStack64(BigInt.asIntN(64, value1 - value2));
}

export function runFsub(thread: Thread): void {
  thread.offsetPc(1);
  const popResult2 = thread.popStack();
  const popResult = thread.popStack();
  if (checkError(popResult) || checkError(popResult2)) {
    return;
  }
  const value2 = asFloat(popResult2.result);
  const value1 = asFloat(popResult.result);

  if (value1 === 0 && value2 !== 0) {
    thread.pushStack(value2);
    return;
  } else if (value1 !== 0 && value2 === 0) {
    thread.pushStack(value1);
    return;
  }

  thread.pushStack(asFloat(value1 - value2));
}

export function runDsub(thread: Thread): void {
  thread.offsetPc(1);
  const popResult2 = thread.popStack64();
  const popResult = thread.popStack64();
  if (checkError(popResult) || checkError(popResult2)) {
    return;
  }
  const value2 = asDouble(popResult2.result);
  const value1 = asDouble(popResult.result);
  thread.pushStack64(value1 - value2);
}

export function runImul(thread: Thread): void {
  thread.offsetPc(1);
  const popResult2 = thread.popStack();
  const popResult = thread.popStack();
  if (checkError(popResult) || checkError(popResult2)) {
    return;
  }
  const value2 = popResult2.result;
  const value1 = popResult.result;
  thread.pushStack(Math.imul(value1, value2) | 0);
}

export function runLmul(thread: Thread): void {
  thread.offsetPc(1);
  const popResult2 = thread.popStack64();
  const popResult = thread.popStack64();
  if (checkError(popResult) || checkError(popResult2)) {
    return;
  }
  const value2: bigint = popResult2.result;
  const value1: bigint = popResult.result;
  thread.pushStack64(BigInt.asIntN(64, value1 * value2));
}

export function runFmul(thread: Thread): void {
  thread.offsetPc(1);
  const popResult2 = thread.popStack();
  const popResult = thread.popStack();
  if (checkError(popResult) || checkError(popResult2)) {
    return;
  }
  const value2 = asFloat(popResult2.result);
  const value1 = asFloat(popResult.result);
  thread.pushStack(asFloat(value1 * value2));
}

export function runDmul(thread: Thread): void {
  thread.offsetPc(1);
  const popResult2 = thread.popStack64();
  const popResult = thread.popStack64();
  if (checkError(popResult) || checkError(popResult2)) {
    return;
  }
  const value2 = asDouble(popResult2.result);
  const value1 = asDouble(popResult.result);
  thread.pushStack64(value1 * value2);
}

export function runIdiv(thread: Thread): void {
  thread.offsetPc(1);
  const popResult2 = thread.popStack();
  const popResult = thread.popStack();
  if (checkError(popResult) || checkError(popResult2)) {
    return;
  }
  const value2 = popResult2.result;
  const value1 = popResult.result;

  if (value2 === 0) {
    thread.throwNewException("java/lang/ArithmeticException", "Division by 0");
    return;
  }

  if (value1 === MIN_INT && value2 === -1) {
    thread.pushStack(value1);
    return;
  }

  thread.pushStack((value1 / value2) | 0);
}

export function runLdiv(thread: Thread): void {
  thread.offsetPc(1);
  const popResult2 = thread.popStack64();
  const popResult = thread.popStack64();
  if (checkError(popResult) || checkError(popResult2)) {
    return;
  }
  const value2: bigint = popResult2.result;
  const value1: bigint = popResult.result;

  if (value2 === BigInt(0)) {
    thread.throwNewException("java/lang/ArithmeticException", "Division by 0");
    return;
  }

  if (value1 === MIN_LONG && value2 === -BigInt(1)) {
    thread.pushStack64(value1);
    return;
  }

  thread.pushStack64(BigInt.asIntN(64, value1 / value2));
}

export function runFdiv(thread: Thread): void {
  thread.offsetPc(1);
  const popResult2 = thread.popStack();
  const popResult = thread.popStack();
  if (checkError(popResult) || checkError(popResult2)) {
    return;
  }
  const value2 = asFloat(popResult2.result);
  const value1 = asFloat(popResult.result);
  thread.pushStack(asFloat(value1 / value2));
}

export function runDdiv(thread: Thread): void {
  thread.offsetPc(1);
  const popResult2 = thread.popStack64();
  const popResult = thread.popStack64();
  if (checkError(popResult) || checkError(popResult2)) {
    return;
  }
  const value2 = asDouble(popResult2.result);
  const value1 = asDouble(popResult.result);
  thread.pushStack64(value1 / value2);
}

export function runIrem(thread: Thread): void {
  thread.offsetPc(1);
  const popResult2 = thread.popStack();
  const popResult = thread.popStack();
  if (checkError(popResult) || checkError(popResult2)) {
    return;
  }
  const value2 = popResult2.result;
  const value1 = popResult.result;

  if (value2 === 0) {
    thread.throwNewException("java/lang/ArithmeticException", "Division by 0");
    return;
  }
  // JS bitwise can only return 32-bit ints
  thread.pushStack(value1 % value2 | 0);
}

export function runLrem(thread: Thread): void {
  thread.offsetPc(1);
  const popResult2 = thread.popStack64();
  const popResult = thread.popStack64();
  if (checkError(popResult) || checkError(popResult2)) {
    return;
  }
  const value2: bigint = popResult2.result;
  const value1: bigint = popResult.result;

  if (value2 === BigInt(0)) {
    thread.throwNewException("java/lang/ArithmeticException", "Division by 0");
    return;
  }

  thread.pushStack64(BigInt.asIntN(64, value1 % value2));
}

export function runFrem(thread: Thread): void {
  thread.offsetPc(1);
  const popResult2 = thread.popStack();
  const popResult = thread.popStack();
  if (checkError(popResult) || checkError(popResult2)) {
    return;
  }
  const value2 = asFloat(popResult2.result);
  const value1 = asFloat(popResult.result);
  thread.pushStack(asFloat(value1 % value2));
}

export function runDrem(thread: Thread): void {
  thread.offsetPc(1);
  const popResult2 = thread.popStack64();
  const popResult = thread.popStack64();
  if (checkError(popResult) || checkError(popResult2)) {
    return;
  }
  const value2 = asDouble(popResult2.result);
  const value1 = asDouble(popResult.result);
  thread.pushStack64(value1 % value2);
}

export function runIneg(thread: Thread): void {
  thread.offsetPc(1);
  const popResult = thread.popStack();
  if (checkError(popResult)) {
    return;
  }
  const value = popResult.result;
  thread.pushStack(-value | 0);
}

export function runLneg(thread: Thread): void {
  thread.offsetPc(1);
  const popResult = thread.popStack64();
  if (checkError(popResult)) {
    return;
  }
  const value: bigint = popResult.result;
  thread.pushStack64(BigInt.asIntN(64, -value));
}

export function runFneg(thread: Thread): void {
  thread.offsetPc(1);
  const popResult = thread.popStack();
  if (checkError(popResult)) {
    return;
  }
  const value = asFloat(popResult.result);
  thread.pushStack(asFloat(-value));
}

export function runDneg(thread: Thread): void {
  thread.offsetPc(1);
  const popResult = thread.popStack64();
  if (checkError(popResult)) {
    return;
  }
  const value = asDouble(popResult.result);
  thread.pushStack64(-value);
}

export function runIshl(thread: Thread): void {
  thread.offsetPc(1);
  const popResult2 = thread.popStack();
  const popResult = thread.popStack();
  if (checkError(popResult) || checkError(popResult2)) {
    return;
  }
  const value2 = popResult2.result;
  const value1 = popResult.result;
  thread.pushStack((value1 << (value2 & 0x1f)) | 0);
}

export function runLshl(thread: Thread): void {
  thread.offsetPc(1);
  const popResult2 = thread.popStack();
  const popResult = thread.popStack64();
  if (checkError(popResult) || checkError(popResult2)) {
    return;
  }
  const value2: number = popResult2.result;
  const value1: bigint = popResult.result;
  thread.pushStack64(BigInt.asIntN(64, value1 << BigInt(value2 & 0x3f)));
}

export function runIshr(thread: Thread): void {
  thread.offsetPc(1);
  const popResult2 = thread.popStack();
  const popResult = thread.popStack();
  if (checkError(popResult) || checkError(popResult2)) {
    return;
  }
  const value2 = popResult2.result;
  const value1 = popResult.result;
  thread.pushStack((value1 >> (value2 & 0x1f)) | 0);
}

export function runLshr(thread: Thread): void {
  thread.offsetPc(1);
  const popResult2 = thread.popStack();
  const popResult = thread.popStack64();
  if (checkError(popResult) || checkError(popResult2)) {
    return;
  }
  const value2: number = popResult2.result;
  const value1: bigint = popResult.result;
  thread.pushStack64(BigInt.asIntN(64, value1 >> BigInt(value2 & 0x3f)));
}

export function runIushr(thread: Thread): void {
  thread.offsetPc(1);
  const popResult2 = thread.popStack();
  const popResult = thread.popStack();
  if (checkError(popResult) || checkError(popResult2)) {
    return;
  }

  const value2: number = popResult2.result & 0x1f;
  const value1: number = popResult.result;

  thread.pushStack((value1 >>> value2) | 0);
}

export function runLushr(thread: Thread): void {
  thread.offsetPc(1);
  const popResult2 = thread.popStack();
  const popResult = thread.popStack64();
  if (checkError(popResult) || checkError(popResult2)) {
    return;
  }

  const value2: number = popResult2.result & 0x3f;
  const value1: bigint = popResult.result;

  if (value1 >= 0) {
    thread.pushStack64(BigInt.asIntN(64, value1 >> BigInt(value2)));
    return;
  }

  // convert leading 1's to zeros
  thread.pushStack64((value1 & BigInt("0xffffffffffffffff")) >> BigInt(value2));
}

export function runIand(thread: Thread): void {
  thread.offsetPc(1);
  const popResult2 = thread.popStack();
  const popResult = thread.popStack();
  if (checkError(popResult) || checkError(popResult2)) {
    return;
  }
  const value2 = popResult2.result;
  const value1 = popResult.result;
  thread.pushStack((value1 & value2) | 0);
}

export function runLand(thread: Thread): void {
  thread.offsetPc(1);
  const popResult2 = thread.popStack64();
  const popResult = thread.popStack64();
  if (checkError(popResult) || checkError(popResult2)) {
    return;
  }
  const value2: bigint = popResult2.result;
  const value1: bigint = popResult.result;
  thread.pushStack64(BigInt.asIntN(64, value1 & value2));
}

export function runIor(thread: Thread): void {
  thread.offsetPc(1);
  const popResult2 = thread.popStack();
  const popResult = thread.popStack();
  if (checkError(popResult) || checkError(popResult2)) {
    return;
  }
  const value2 = popResult2.result;
  const value1 = popResult.result;
  thread.pushStack(value1 | value2 | 0);
}

export function runLor(thread: Thread): void {
  thread.offsetPc(1);
  const popResult2 = thread.popStack64();
  const popResult = thread.popStack64();
  if (checkError(popResult) || checkError(popResult2)) {
    return;
  }
  const value2: bigint = popResult2.result;
  const value1: bigint = popResult.result;
  thread.pushStack64(BigInt.asIntN(64, value1 | value2));
}

export function runIxor(thread: Thread): void {
  thread.offsetPc(1);
  const popResult2 = thread.popStack();
  const popResult = thread.popStack();
  if (checkError(popResult) || checkError(popResult2)) {
    return;
  }
  const value2 = popResult2.result;
  const value1 = popResult.result;
  thread.pushStack((value1 ^ value2) | 0);
}

export function runLxor(thread: Thread): void {
  thread.offsetPc(1);
  const popResult2 = thread.popStack64();
  const popResult = thread.popStack64();
  if (checkError(popResult) || checkError(popResult2)) {
    return;
  }
  const value2: bigint = popResult2.result;
  const value1: bigint = popResult.result;
  thread.pushStack64(BigInt.asIntN(64, value1 ^ value2));
}

export function runIinc(thread: Thread): void {
  thread.offsetPc(1);
  const index = thread.getCode().getUint8(thread.getPC());
  thread.offsetPc(1);
  const constant = thread.getCode().getInt8(thread.getPC());
  thread.offsetPc(1);
  thread.storeLocal(
    index,
    ((thread.loadLocal(index) as number) + constant) | 0
  );
}
