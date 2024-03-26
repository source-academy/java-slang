import Thread from "../thread";
import { JvmObject } from "../types/reference/Object";
import { ResultType } from "../types/Result";
import { asFloat, asDouble } from "../utils";

export function runGoto(thread: Thread): void {
  const branchbyte = thread.getCode().getInt16(thread.getPC() + 1);
  thread.offsetPc(branchbyte);
}

export function runJsr(thread: Thread): void {
  const branchbyte = thread.getCode().getInt16(thread.getPC() + 1);
  thread.pushStack(thread.getPC() + 3);
  thread.setPc(thread.getPC() + branchbyte);
}

export function runRet(thread: Thread): void {
  const index = thread.getCode().getUint8(thread.getPC() + 1);
  const retAddr = thread.loadLocal(index) as number;
  thread.setPc(retAddr);
}

export function runTableswitch(thread: Thread): void {
  let offset = thread.getPC() + 1;
  if (offset % 4 !== 0) {
    offset += 4 - (offset % 4); // padding
  }

  const def = thread.getCode().getInt32(offset);
  offset += 4;
  const low = thread.getCode().getInt32(offset);
  offset += 4;
  const high = thread.getCode().getInt32(offset);
  offset += 4;

  const popResult = thread.popStack();
  if (popResult.status === ResultType.ERROR) {
    return;
  }
  const index = popResult.result;
  if (index < low || index > high) {
    thread.offsetPc(def);
    return;
  }

  const offsets = []; // 0 indexed
  for (let i = 0; i < high - low + 1; i++) {
    offsets.push(thread.getCode().getInt32(offset));
    offset += 4;
  }

  thread.offsetPc(offsets[index - low]);
}

export function runLookupswitch(thread: Thread): void {
  let offset = thread.getPC() + 1;
  if (offset % 4 !== 0) {
    offset += 4 - (offset % 4); // padding
  }

  const def = thread.getCode().getInt32(offset);
  offset += 4;
  const npairCount = thread.getCode().getInt32(offset);
  offset += 4;

  const popResult = thread.popStack();
  if (popResult.status === ResultType.ERROR) {
    return;
  }

  for (let i = 0; i < npairCount; i++) {
    const key = thread.getCode().getInt32(offset);
    if (key === popResult.result) {
      const nextPcOffset = thread.getCode().getInt32(offset + 4);
      thread.offsetPc(nextPcOffset);
      return;
    }
    offset += 8;
  }

  thread.offsetPc(def);
}

function _return(thread: Thread, ret?: any, isWide?: boolean): void {
  const method = thread.getMethod();
  if (method.checkSynchronized()) {
    if (method.checkStatic()) {
      method.getClass().getJavaObject().getMonitor().exit(thread);
    } else {
      (thread.loadLocal(0) as JvmObject).getMonitor().exit(thread);
    }
  }

  if (isWide) {
    thread.offsetPc(1);
    thread.returnStackFrame64(ret);
  } else {
    thread.offsetPc(1);
    thread.returnStackFrame(ret);
  }
}

export function runIreturn(thread: Thread): void {
  const popResult = thread.popStack();
  if (popResult.status === ResultType.ERROR) {
    return;
  }
  const ret = popResult.result;
  _return(thread, ret);
}

export function runLreturn(thread: Thread): void {
  const popResult = thread.popStack64();
  if (popResult.status === ResultType.ERROR) {
    return;
  }
  const ret = popResult.result;
  _return(thread, ret, true);
}

export function runFreturn(thread: Thread): void {
  const popResult = thread.popStack();
  if (popResult.status === ResultType.ERROR) {
    return;
  }
  const ret = asFloat(popResult.result);
  _return(thread, ret);
}

export function runDreturn(thread: Thread): void {
  const popResult = thread.popStack64();
  if (popResult.status === ResultType.ERROR) {
    return;
  }
  const ret = asDouble(popResult.result);
  _return(thread, ret, true);
}

export function runAreturn(thread: Thread): void {
  const popResult = thread.popStack();
  if (popResult.status === ResultType.ERROR) {
    return;
  }
  const ret = popResult.result;
  _return(thread, ret);
}

export function runReturn(thread: Thread): void {
  _return(thread);
}
