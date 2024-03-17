import { OPCODE } from "../../ClassFile/constants/instructions";
import Thread from "../thread";
import { ResultType } from "../types/Result";
import { ArrayClassData } from "../types/class/ClassData";
import { ConstantClass } from "../types/class/Constants";
import { JvmArray } from "../types/reference/Array";
import { JvmObject } from "../types/reference/Object";
import { asFloat, asDouble } from "../utils";

export function runWide(thread: Thread): void {
  thread.offsetPc(1);
  const opcode = thread.getCode().getUint8(thread.getPC());
  thread.offsetPc(1);

  const indexbyte = thread.getCode().getUint16(thread.getPC());
  thread.offsetPc(2);

  let store;
  switch (opcode) {
    case OPCODE.ILOAD:
    case OPCODE.FLOAD:
    case OPCODE.ALOAD:
      thread.pushStack(thread.loadLocal(indexbyte));
      return;
    case OPCODE.LLOAD:
    case OPCODE.DLOAD:
      thread.pushStack64(thread.loadLocal(indexbyte) as bigint | number);
      return;
    case OPCODE.ISTORE:
    case OPCODE.ASTORE:
      store = thread.popStack();
      if (store.status === ResultType.ERROR) {
        return;
      } else {
        thread.storeLocal(indexbyte, store.result);
        return;
      }
    case OPCODE.FSTORE:
      store = thread.popStack();
      if (store.status === ResultType.ERROR) {
        return;
      } else {
        thread.storeLocal(indexbyte, asFloat(store.result));
        return;
      }
    case OPCODE.LSTORE:
      store = thread.popStack64();
      if (store.status === ResultType.ERROR) {
        return;
      } else {
        thread.storeLocal(indexbyte, store.result);
        return;
      }
    case OPCODE.DSTORE:
      store = thread.popStack64();
      if (store.status === ResultType.ERROR) {
        return;
      } else {
        thread.storeLocal(indexbyte, asDouble(store.result));
        return;
      }
    case OPCODE.IINC:
      const constbyte = thread.getCode().getInt16(thread.getPC());
      thread.offsetPc(2);

      thread.storeLocal(
        indexbyte,
        ((thread.loadLocal(indexbyte) as number) + constbyte) | 0
      );
      return;
  }
  throw new Error("Invalid opcode");
}

export function runMultianewarray(thread: Thread): void {
  const indexbyte = thread.getCode().getUint16(thread.getPC() + 1);
  const arrayClsConstant = thread
    .getClass()
    .getConstant(indexbyte) as ConstantClass;

  const dimensions = thread.getCode().getUint8(thread.getPC() + 3);
  thread.offsetPc(4);

  // get dimensions array: [2][3] == [2,3]
  const dimArray = [];
  for (let i = 0; i < dimensions; i++) {
    const popResult = thread.popStack();
    if (popResult.status === ResultType.ERROR) {
      return;
    }
    const dim = popResult.result;

    if (dim < 0) {
      thread.throwNewException(
        "java/lang/NegativeArraySizeException",
        "Negative array size"
      );
      return;
    }
    dimArray[dimensions - i - 1] = dim;
  }

  const clsRes = arrayClsConstant.resolve();
  if (clsRes.status !== ResultType.SUCCESS) {
    if (clsRes.status === ResultType.ERROR) {
      thread.throwNewException(clsRes.exceptionCls, clsRes.msg);
    }
    return;
  }

  const arrayCls = clsRes.result as ArrayClassData;
  const res = arrayCls.instantiate() as JvmArray;
  res.initArray(dimArray[0]);

  let pendingInit = [res];
  let nextInit = [];
  let currentType = arrayCls.getName();

  for (let i = 1; i < dimensions; i++) {
    currentType = currentType.slice(1); // remove leading '[', array type should be '[[[...'
    const len = dimArray[i];

    const classResolutionResult = thread
      .getClass()
      .getLoader()
      .getClass(currentType);
    if (classResolutionResult.status === ResultType.ERROR) {
      thread.throwNewException(
        classResolutionResult.exceptionCls,
        classResolutionResult.msg
      );
      return;
    }
    const arrayCls = classResolutionResult.result;

    for (const arr of pendingInit) {
      for (let j = 0; j < dimArray[i]; j++) {
        const obj = arrayCls.instantiate() as JvmArray;
        obj.initArray(dimArray[i]);
        arr.set(j, obj);
        nextInit.push(obj);
      }
    }

    if (len === 0) {
      break;
    }

    pendingInit = nextInit;
    nextInit = [];
  }

  thread.pushStack(res);
}

export function runIfnull(thread: Thread): void {
  thread.offsetPc(1);
  const branchbyte = thread.getCode().getInt16(thread.getPC());
  thread.offsetPc(2);

  const popResult = thread.popStack();
  if (popResult.status === ResultType.ERROR) {
    return;
  }
  const ref = popResult.result as JvmObject;
  if (ref === null) {
    thread.offsetPc(branchbyte - 3);
    return;
  }
}

export function runIfnonnull(thread: Thread): void {
  thread.offsetPc(1);
  const branchbyte = thread.getCode().getInt16(thread.getPC());
  thread.offsetPc(2);

  const popResult = thread.popStack();
  if (popResult.status === ResultType.ERROR) {
    return;
  }
  const ref = popResult.result as JvmObject;
  if (ref !== null) {
    thread.offsetPc(branchbyte - 3);
    return;
  }
}

export function runGotoW(thread: Thread): void {
  thread.offsetPc(1);
  const branchbyte = thread.getCode().getInt32(thread.getPC());
  thread.offsetPc(branchbyte - 1);
}

export function runJsrW(thread: Thread): void {
  thread.offsetPc(1);
  const branchbyte = thread.getCode().getInt32(thread.getPC());
  thread.offsetPc(4);
  thread.pushStack(thread.getPC());
  thread.setPc(thread.getPC() + branchbyte - 5);
}
