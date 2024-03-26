import { OPCODE } from "../../ClassFile/constants/instructions";
import Thread from "../thread";
import { ArrayClassData } from "../types/class/ClassData";
import { ConstantClass } from "../types/class/Constants";
import { JvmArray } from "../types/reference/Array";
import { JvmObject } from "../types/reference/Object";
import { ResultType } from "../types/Result";
import { asFloat, asDouble } from "../utils";

export function runWide(thread: Thread): void {
  const opcode = thread.getCode().getUint8(thread.getPC() + 1);

  const indexbyte = thread.getCode().getUint16(thread.getPC() + 2);

  let store;
  switch (opcode) {
    case OPCODE.ILOAD:
    case OPCODE.FLOAD:
    case OPCODE.ALOAD:
      thread.pushStack(thread.loadLocal(indexbyte)) && thread.offsetPc(4);
      return;
    case OPCODE.LLOAD:
    case OPCODE.DLOAD:
      thread.pushStack64(thread.loadLocal(indexbyte) as bigint | number) &&
        thread.offsetPc(4);
      return;
    case OPCODE.ISTORE:
    case OPCODE.ASTORE:
      store = thread.popStack();
      if (store.status === ResultType.ERROR) {
        return;
      } else {
        thread.storeLocal(indexbyte, store.result);
        thread.offsetPc(4);
        return;
      }
    case OPCODE.FSTORE:
      store = thread.popStack();
      if (store.status === ResultType.ERROR) {
        return;
      } else {
        thread.storeLocal(indexbyte, asFloat(store.result));
        thread.offsetPc(4);
        return;
      }
    case OPCODE.LSTORE:
      store = thread.popStack64();
      if (store.status === ResultType.ERROR) {
        return;
      } else {
        thread.storeLocal(indexbyte, store.result);
        thread.offsetPc(4);
        return;
      }
    case OPCODE.DSTORE:
      store = thread.popStack64();
      if (store.status === ResultType.ERROR) {
        return;
      } else {
        thread.storeLocal(indexbyte, asDouble(store.result));
        thread.offsetPc(4);
        return;
      }
    case OPCODE.IINC:
      const constbyte = thread.getCode().getInt16(thread.getPC() + 4);

      thread.storeLocal(
        indexbyte,
        ((thread.loadLocal(indexbyte) as number) + constbyte) | 0
      );
      thread.offsetPc(6);
      return;
  }
  throw new Error('Invalid opcode');
}

export function runMultianewarray(thread: Thread): void {
  const indexbyte = thread.getCode().getUint16(thread.getPC() + 1);
  const arrayClsConstant = thread
    .getClass()
    .getConstant(indexbyte) as ConstantClass;

  const dimensions = thread.getCode().getUint8(thread.getPC() + 3);

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
        'java/lang/NegativeArraySizeException',
        'Negative array size'
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

  thread.pushStack(res) && thread.offsetPc(4);
}

export function runIfnull(thread: Thread): void {
  const branchbyte = thread.getCode().getInt16(thread.getPC() + 1);

  const popResult = thread.popStack();
  if (popResult.status === ResultType.ERROR) {
    return;
  }
  const ref = popResult.result as JvmObject;
  if (ref === null) {
    thread.offsetPc(branchbyte);
  } else {
    thread.offsetPc(3);
  }
}

export function runIfnonnull(thread: Thread): void {
  const branchbyte = thread.getCode().getInt16(thread.getPC() + 1);

  const popResult = thread.popStack();
  if (popResult.status === ResultType.ERROR) {
    return;
  }
  const ref = popResult.result as JvmObject;
  if (ref !== null) {
    thread.offsetPc(branchbyte);
  } else {
    thread.offsetPc(3);
  }
}

export function runGotoW(thread: Thread): void {
  const branchbyte = thread.getCode().getInt32(thread.getPC() + 1);
  thread.offsetPc(branchbyte);
}

export function runJsrW(thread: Thread): void {
  const branchbyte = thread.getCode().getInt32(thread.getPC() + 1);
  thread.pushStack(thread.getPC() + 5);
  thread.setPc(thread.getPC() + branchbyte);
}
