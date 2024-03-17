import Thread from "../thread";
import { ResultType } from "../types/Result";
import { ReferenceClassData } from "../types/class/ClassData";
import {
  ConstantClass,
  ConstantDouble,
  ConstantLong,
} from "../types/class/Constants";

export function runNop(thread: Thread): void {
  thread.offsetPc(1);
  return;
}

export function runAconstNull(thread: Thread): void {
  thread.offsetPc(1);
  thread.pushStack(null);
}

export function runIconstM1(thread: Thread): void {
  thread.offsetPc(1);
  thread.pushStack(-1);
}

export function runIconst0(thread: Thread): void {
  thread.offsetPc(1);
  thread.pushStack(0);
}

export function runIconst1(thread: Thread): void {
  thread.offsetPc(1);
  thread.pushStack(1);
}

export function runIconst2(thread: Thread): void {
  thread.offsetPc(1);
  thread.pushStack(2);
}

export function runIconst3(thread: Thread): void {
  thread.offsetPc(1);
  thread.pushStack(3);
}

export function runIconst4(thread: Thread): void {
  thread.offsetPc(1);
  thread.pushStack(4);
}

export function runIconst5(thread: Thread): void {
  thread.offsetPc(1);
  thread.pushStack(5);
}

export function runLconst0(thread: Thread): void {
  thread.offsetPc(1);
  thread.pushStack64(BigInt(0));
}

export function runLconst1(thread: Thread): void {
  thread.offsetPc(1);
  thread.pushStack64(BigInt(1));
}

export function runFconst0(thread: Thread): void {
  thread.offsetPc(1);
  thread.pushStack(0.0);
}

export function runFconst1(thread: Thread): void {
  thread.offsetPc(1);
  thread.pushStack(1.0);
}

export function runFconst2(thread: Thread): void {
  thread.offsetPc(1);
  thread.pushStack(2.0);
}

export function runDconst0(thread: Thread): void {
  thread.offsetPc(1);
  thread.pushStack64(0.0);
}

export function runDconst1(thread: Thread): void {
  thread.offsetPc(1);
  thread.pushStack64(1.0);
}

export function runBipush(thread: Thread): void {
  const byte = thread.getCode().getInt8(thread.getPC() + 1);
  thread.offsetPc(2);
  thread.pushStack(byte);
}

export function runSipush(thread: Thread): void {
  const short = thread.getCode().getInt16(thread.getPC() + 1);
  thread.offsetPc(3);
  thread.pushStack(short);
}

export function loadConstant(
  thread: Thread,
  index: number,
  onFinish?: () => void
): void {
  const invoker = thread.getClass();
  const constant = invoker.getConstant(index);

  const resolutionRes = constant.resolve(thread, invoker.getLoader());
  if (resolutionRes.status !== ResultType.SUCCESS) {
    if (resolutionRes.status === ResultType.ERROR) {
      thread.throwNewException(resolutionRes.exceptionCls, resolutionRes.msg);
    }
    return;
  }

  let value = resolutionRes.result;
  if (ConstantClass.check(constant)) {
    const clsRef = value as ReferenceClassData;
    const initRes = clsRef.initialize(thread);
    if (initRes.status !== ResultType.SUCCESS) {
      if (initRes.status === ResultType.ERROR) {
        thread.throwNewException(initRes.exceptionCls, initRes.msg);
      }
      return;
    }
    value = clsRef.getJavaObject();
  }
  onFinish && onFinish();
  thread.pushStack(value);
}

export function runLdc(thread: Thread): void {
  const indexbyte = thread.getCode().getUint8(thread.getPC() + 1);
  loadConstant(thread, indexbyte, () => thread.offsetPc(2));
}

export function runLdcW(thread: Thread): void {
  const indexbyte = thread.getCode().getUint16(thread.getPC() + 1);
  loadConstant(thread, indexbyte, () => thread.offsetPc(3));
}

export function runLdc2W(thread: Thread): void {
  const indexbyte = thread.getCode().getUint16(thread.getPC() + 1);
  thread.offsetPc(3);
  const item = thread.getClass().getConstant(indexbyte) as
    | ConstantDouble
    | ConstantLong;
  thread.pushStack64(item.get());
}
