import Thread from "../thread";
import { JvmArray } from "../types/reference/Array";
import { asFloat, asDouble } from "../utils";


export function runIstore(thread: Thread): void {
  thread.offsetPc(1);
  const index = thread.getCode().getUint8(thread.getPC());
  thread.offsetPc(1);
  thread.storeLocal(index, thread.popStack());
}

export function runLstore(thread: Thread): void {
  thread.offsetPc(1);
  const index = thread.getCode().getUint8(thread.getPC());
  thread.offsetPc(1);
  thread.storeLocal64(index, thread.popStack64());
}

export function runFstore(thread: Thread): void {
  thread.offsetPc(1);
  const index = thread.getCode().getUint8(thread.getPC());
  thread.offsetPc(1);
  thread.storeLocal(index, asFloat(thread.popStack()));
}

export function runDstore(thread: Thread): void {
  thread.offsetPc(1);
  const index = thread.getCode().getUint8(thread.getPC());
  thread.offsetPc(1);
  thread.storeLocal64(index, asDouble(thread.popStack64()));
}

export function runAstore(thread: Thread): void {
  thread.offsetPc(1);
  const index = thread.getCode().getUint8(thread.getPC());
  thread.offsetPc(1);
  thread.storeLocal(index, thread.popStack());
}

export function runIstore0(thread: Thread): void {
  thread.offsetPc(1);
  const value = thread.popStack();
  thread.storeLocal(0, value);
}

export function runIstore1(thread: Thread): void {
  thread.offsetPc(1);
  const value = thread.popStack();
  thread.storeLocal(1, value);
}

export function runIstore2(thread: Thread): void {
  thread.offsetPc(1);
  const value = thread.popStack();
  thread.storeLocal(2, value);
}

export function runIstore3(thread: Thread): void {
  thread.offsetPc(1);
  const value = thread.popStack();
  thread.storeLocal(3, value);
}

export function runLstore0(thread: Thread): void {
  thread.offsetPc(1);
  const value = thread.popStack64();
  thread.storeLocal64(0, value);
}

export function runLstore1(thread: Thread): void {
  thread.offsetPc(1);
  const value = thread.popStack64();
  thread.storeLocal64(1, value);
}

export function runLstore2(thread: Thread): void {
  thread.offsetPc(1);
  const value = thread.popStack64();
  thread.storeLocal64(2, value);
}

export function runLstore3(thread: Thread): void {
  thread.offsetPc(1);
  const value = thread.popStack64();
  thread.storeLocal64(3, value);
}

export function runFstore0(thread: Thread): void {
  thread.offsetPc(1);
  const value = thread.popStack();
  thread.storeLocal(0, asFloat(value));
}

export function runFstore1(thread: Thread): void {
  thread.offsetPc(1);
  const value = thread.popStack();
  thread.storeLocal(1, asFloat(value));
}

export function runFstore2(thread: Thread): void {
  thread.offsetPc(1);
  const value = thread.popStack();
  thread.storeLocal(2, asFloat(value));
}

export function runFstore3(thread: Thread): void {
  thread.offsetPc(1);
  const value = thread.popStack();
  thread.storeLocal(3, asFloat(value));
}

export function runDstore0(thread: Thread): void {
  thread.offsetPc(1);
  const value = asDouble(thread.popStack64());
  thread.storeLocal64(0, value);
}

export function runDstore1(thread: Thread): void {
  thread.offsetPc(1);
  const value = asDouble(thread.popStack64());
  thread.storeLocal64(1, value);
}

export function runDstore2(thread: Thread): void {
  thread.offsetPc(1);
  const value = asDouble(thread.popStack64());
  thread.storeLocal64(2, value);
}

export function runDstore3(thread: Thread): void {
  thread.offsetPc(1);
  const value = asDouble(thread.popStack64());
  thread.storeLocal64(3, value);
}

export function runAstore0(thread: Thread): void {
  thread.offsetPc(1);
  const value = thread.popStack();
  thread.storeLocal(0, value);
}

export function runAstore1(thread: Thread): void {
  thread.offsetPc(1);
  const value = thread.popStack();
  thread.storeLocal(1, value);
}

export function runAstore2(thread: Thread): void {
  thread.offsetPc(1);
  const value = thread.popStack();
  thread.storeLocal(2, value);
}

export function runAstore3(thread: Thread): void {
  thread.offsetPc(1);
  const value = thread.popStack();
  thread.storeLocal(3, value);
}

export function runIastore(thread: Thread): void {
  thread.offsetPc(1);
  const value = thread.popStack();
  const index = thread.popStack();
  const arrayref = thread.popStack() as JvmArray;

  if (arrayref === null) {
    thread.throwNewException('java/lang/NullPointerException', '');
    return;
  }

  if (index < 0 || index >= arrayref.len()) {
    thread.throwNewException('java/lang/ArrayIndexOutOfBoundsException', '');
    return;
  }

  arrayref.set(index, value);
}

export function runLastore(thread: Thread): void {
  thread.offsetPc(1);
  const value = thread.popStack64();
  const index = thread.popStack();
  const arrayref = thread.popStack() as JvmArray;

  if (arrayref === null) {
    thread.throwNewException('java/lang/NullPointerException', '');
    return;
  }

  if (index < 0 || index >= arrayref.len()) {
    thread.throwNewException('java/lang/ArrayIndexOutOfBoundsException', '');
    return;
  }

  arrayref.set(index, value);
}

export function runFastore(thread: Thread): void {
  thread.offsetPc(1);
  const value = thread.popStack();
  const index = thread.popStack();
  const arrayref = thread.popStack() as JvmArray;

  if (arrayref === null) {
    thread.throwNewException('java/lang/NullPointerException', '');
    return;
  }

  if (index < 0 || index >= arrayref.len()) {
    thread.throwNewException('java/lang/ArrayIndexOutOfBoundsException', '');
    return;
  }

  arrayref.set(index, value);
}

export function runDastore(thread: Thread): void {
  thread.offsetPc(1);
  const value = thread.popStack64();
  const index = thread.popStack();
  const arrayref = thread.popStack() as JvmArray;

  if (arrayref === null) {
    thread.throwNewException('java/lang/NullPointerException', '');
    return;
  }

  if (index < 0 || index >= arrayref.len()) {
    thread.throwNewException('java/lang/ArrayIndexOutOfBoundsException', '');
    return;
  }

  arrayref.set(index, value);
}

export function runAastore(thread: Thread): void {
  thread.offsetPc(1);
  const value = thread.popStack();
  const index = thread.popStack();
  const arrayref = thread.popStack() as JvmArray;

  if (arrayref === null) {
    thread.throwNewException('java/lang/NullPointerException', '');
    return;
  }

  if (index < 0 || index >= arrayref.len()) {
    thread.throwNewException('java/lang/ArrayIndexOutOfBoundsException', '');
    return;
  }

  arrayref.set(index, value);
}

export function runBastore(thread: Thread): void {
  thread.offsetPc(1);
  const value = thread.popStack();
  const index = thread.popStack();
  const arrayref = thread.popStack() as JvmArray;

  if (arrayref === null) {
    thread.throwNewException('java/lang/NullPointerException', '');
    return;
  }

  if (index < 0 || index >= arrayref.len()) {
    thread.throwNewException('java/lang/ArrayIndexOutOfBoundsException', '');
    return;
  }

  arrayref.set(index, (value << 24) >> 24);
}

export function runCastore(thread: Thread): void {
  thread.offsetPc(1);
  const value = thread.popStack();
  const index = thread.popStack();
  const arrayref = thread.popStack() as JvmArray;

  if (arrayref === null) {
    thread.throwNewException('java/lang/NullPointerException', '');
    return;
  }

  if (index < 0 || index >= arrayref.len()) {
    thread.throwNewException('java/lang/ArrayIndexOutOfBoundsException', '');
    return;
  }

  arrayref.set(index, value & 0xffff);
}

export function runSastore(thread: Thread): void {
  thread.offsetPc(1);
  const value = thread.popStack();
  const index = thread.popStack();
  const arrayref = thread.popStack() as JvmArray;

  if (arrayref === null) {
    thread.throwNewException('java/lang/NullPointerException', '');
    return;
  }

  if (index < 0 || index >= arrayref.len()) {
    thread.throwNewException('java/lang/ArrayIndexOutOfBoundsException', '');
    return;
  }

  arrayref.set(index, (value << 16) >> 16);
}
