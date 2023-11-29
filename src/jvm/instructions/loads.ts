import Thread from "../thread";
import { JvmArray } from "../types/reference/Array";

export function runIload(thread: Thread): void {
  thread.offsetPc(1);
  const index = thread.getCode().getUint8(thread.getPC());
  thread.offsetPc(1);
  thread.pushStack(thread.loadLocal(index));
}

export function runLload(thread: Thread): void {
  thread.offsetPc(1);
  const index = thread.getCode().getUint8(thread.getPC());
  thread.offsetPc(1);
  thread.pushStack64(thread.loadLocal(index));
}

export function runFload(thread: Thread): void {
  thread.offsetPc(1);
  const index = thread.getCode().getUint8(thread.getPC());
  thread.offsetPc(1);
  thread.pushStack(thread.loadLocal(index));
}

export function runDload(thread: Thread): void {
  thread.offsetPc(1);
  const index = thread.getCode().getUint8(thread.getPC());
  thread.offsetPc(1);
  thread.pushStack64(thread.loadLocal(index));
}

export function runAload(thread: Thread): void {
  thread.offsetPc(1);
  const index = thread.getCode().getUint8(thread.getPC());
  thread.offsetPc(1);
  thread.pushStack(thread.loadLocal(index));
}

export function runIload0(thread: Thread): void {
  thread.offsetPc(1);
  thread.pushStack(thread.loadLocal(0));
}

export function runIload1(thread: Thread): void {
  thread.offsetPc(1);
  thread.pushStack(thread.loadLocal(1));
}

export function runIload2(thread: Thread): void {
  thread.offsetPc(1);
  thread.pushStack(thread.loadLocal(2));
}

export function runIload3(thread: Thread): void {
  thread.offsetPc(1);
  thread.pushStack(thread.loadLocal(3));
}

export function runLload0(thread: Thread): void {
  thread.offsetPc(1);
  thread.pushStack64(thread.loadLocal(0));
}

export function runLload1(thread: Thread): void {
  thread.offsetPc(1);
  thread.pushStack64(thread.loadLocal(1));
}

export function runLload2(thread: Thread): void {
  thread.offsetPc(1);
  thread.pushStack64(thread.loadLocal(2));
}

export function runLload3(thread: Thread): void {
  thread.offsetPc(1);
  thread.pushStack64(thread.loadLocal(3));
}

export function runFload0(thread: Thread): void {
  thread.offsetPc(1);
  thread.pushStack(thread.loadLocal(0));
}

export function runFload1(thread: Thread): void {
  thread.offsetPc(1);
  thread.pushStack(thread.loadLocal(1));
}

export function runFload2(thread: Thread): void {
  thread.offsetPc(1);
  thread.pushStack(thread.loadLocal(2));
}

export function runFload3(thread: Thread): void {
  thread.offsetPc(1);
  thread.pushStack(thread.loadLocal(3));
}

export function runDload0(thread: Thread): void {
  thread.offsetPc(1);
  thread.pushStack64(thread.loadLocal(0));
}

export function runDload1(thread: Thread): void {
  thread.offsetPc(1);
  thread.pushStack64(thread.loadLocal(1));
}

export function runDload2(thread: Thread): void {
  thread.offsetPc(1);
  thread.pushStack64(thread.loadLocal(2));
}

export function runDload3(thread: Thread): void {
  thread.offsetPc(1);
  thread.pushStack64(thread.loadLocal(3));
}

export function runAload0(thread: Thread): void {
  thread.offsetPc(1);
  thread.pushStack(thread.loadLocal(0));
}

export function runAload1(thread: Thread): void {
  thread.offsetPc(1);
  thread.pushStack(thread.loadLocal(1));
}

export function runAload2(thread: Thread): void {
  thread.offsetPc(1);
  thread.pushStack(thread.loadLocal(2));
}

export function runAload3(thread: Thread): void {
  thread.offsetPc(1);
  thread.pushStack(thread.loadLocal(3));
}

export function runIaload(thread: Thread): void {
  thread.offsetPc(1);
  const index: number = thread.popStack();
  const arrayref: JvmArray | null = thread.popStack();
  if (arrayref === null) {
    thread.throwNewException('java/lang/NullPointerException', '');
    return;
  }
  if (arrayref.len() <= index || index < 0) {
    thread.throwNewException(
      'java/lang/ArrayIndexOutOfBoundsException',
      `Index ${index} out of bounds for length ${arrayref.len()}`
    );
    return;
  }
  thread.pushStack(arrayref.get(index));
}

export function runLaload(thread: Thread): void {
  thread.offsetPc(1);
  const index: number = thread.popStack();
  const arrayref: JvmArray | null = thread.popStack();
  if (arrayref === null) {
    thread.throwNewException('java/lang/NullPointerException', '');
    return;
  }
  if (arrayref.len() <= index || index < 0) {
    thread.throwNewException(
      'java/lang/ArrayIndexOutOfBoundsException',
      `Index ${index} out of bounds for length ${arrayref.len()}`
    );
    return;
  }
  thread.pushStack64(arrayref.get(index));
}

export function runFaload(thread: Thread): void {
  thread.offsetPc(1);
  const index: number = thread.popStack();
  const arrayref: JvmArray | null = thread.popStack();
  if (arrayref === null) {
    thread.throwNewException('java/lang/NullPointerException', '');
    return;
  }
  if (arrayref.len() <= index || index < 0) {
    thread.throwNewException(
      'java/lang/ArrayIndexOutOfBoundsException',
      `Index ${index} out of bounds for length ${arrayref.len()}`
    );
    return;
  }
  thread.pushStack(arrayref.get(index));
}

export function runDaload(thread: Thread): void {
  thread.offsetPc(1);
  const index: number = thread.popStack();
  const arrayref: JvmArray | null = thread.popStack();
  if (arrayref === null) {
    thread.throwNewException('java/lang/NullPointerException', '');
    return;
  }
  if (arrayref.len() <= index || index < 0) {
    thread.throwNewException(
      'java/lang/ArrayIndexOutOfBoundsException',
      `Index ${index} out of bounds for length ${arrayref.len()}`
    );
    return;
  }
  thread.pushStack64(arrayref.get(index));
}

export function runAaload(thread: Thread): void {
  thread.offsetPc(1);
  const index: number = thread.popStack();
  const arrayref: JvmArray | null = thread.popStack();
  if (arrayref === null) {
    thread.throwNewException('java/lang/NullPointerException', '');
    return;
  }
  if (arrayref.len() <= index || index < 0) {
    thread.throwNewException(
      'java/lang/ArrayIndexOutOfBoundsException',
      `Index ${index} out of bounds for length ${arrayref.len()}`
    );
    return;
  }
  thread.pushStack(arrayref.get(index));
}

export function runBaload(thread: Thread): void {
  thread.offsetPc(1);
  const index: number = thread.popStack();
  const arrayref: JvmArray | null = thread.popStack();
  if (arrayref === null) {
    thread.throwNewException('java/lang/NullPointerException', '');
    return;
  }
  if (arrayref.len() <= index || index < 0) {
    thread.throwNewException(
      'java/lang/ArrayIndexOutOfBoundsException',
      `Index ${index} out of bounds for length ${arrayref.len()}`
    );
    return;
  }
  thread.pushStack(arrayref.get(index));
}

export function runCaload(thread: Thread): void {
  thread.offsetPc(1);
  const index: number = thread.popStack();
  const arrayref: JvmArray | null = thread.popStack();
  if (arrayref === null) {
    thread.throwNewException('java/lang/NullPointerException', '');
    return;
  }
  if (arrayref.len() <= index || index < 0) {
    thread.throwNewException(
      'java/lang/ArrayIndexOutOfBoundsException',
      `Index ${index} out of bounds for length ${arrayref.len()}`
    );
    return;
  }
  thread.pushStack(arrayref.get(index));
}

export function runSaload(thread: Thread): void {
  thread.offsetPc(1);
  const index: number = thread.popStack();
  const arrayref: JvmArray | null = thread.popStack();
  if (arrayref === null) {
    thread.throwNewException('java/lang/NullPointerException', '');
    return;
  }
  if (arrayref.len() <= index || index < 0) {
    thread.throwNewException(
      'java/lang/ArrayIndexOutOfBoundsException',
      `Index ${index} out of bounds for length ${arrayref.len()}`
    );
    return;
  }
  thread.pushStack(arrayref.get(index));
}
