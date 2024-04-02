import Thread from '../thread'
import { ResultType } from '../types/Result'
import { JvmArray } from '../types/reference/Array'
import { asFloat, asDouble } from '../utils'

export function runIstore(thread: Thread): void {
  const index = thread.getCode().getUint8(thread.getPC() + 1)
  const popResult = thread.popStack()
  if (popResult.status === ResultType.ERROR) {
    return
  }
  thread.offsetPc(2)
  thread.storeLocal(index, popResult.result)
}

export function runLstore(thread: Thread): void {
  const index = thread.getCode().getUint8(thread.getPC() + 1)
  const popResult = thread.popStack64()
  if (popResult.status === ResultType.ERROR) {
    return
  }
  thread.offsetPc(2)
  thread.storeLocal64(index, popResult.result)
}

export function runFstore(thread: Thread): void {
  const index = thread.getCode().getUint8(thread.getPC() + 1)
  const popResult = thread.popStack()
  if (popResult.status === ResultType.ERROR) {
    return
  }
  thread.offsetPc(2)
  thread.storeLocal(index, asFloat(popResult.result))
}

export function runDstore(thread: Thread): void {
  const index = thread.getCode().getUint8(thread.getPC() + 1)
  const popResult = thread.popStack64()
  if (popResult.status === ResultType.ERROR) {
    return
  }
  thread.offsetPc(2)
  thread.storeLocal64(index, asDouble(popResult.result))
}

export function runAstore(thread: Thread): void {
  const index = thread.getCode().getUint8(thread.getPC() + 1)
  const popResult = thread.popStack()
  if (popResult.status === ResultType.ERROR) {
    return
  }
  thread.offsetPc(2)
  thread.storeLocal(index, popResult.result)
}

export function runIstore0(thread: Thread): void {
  const popResult = thread.popStack()
  if (popResult.status === ResultType.ERROR) {
    return
  }
  thread.offsetPc(1)
  thread.storeLocal(0, popResult.result)
}

export function runIstore1(thread: Thread): void {
  const popResult = thread.popStack()
  if (popResult.status === ResultType.ERROR) {
    return
  }
  thread.offsetPc(1)
  thread.storeLocal(1, popResult.result)
}

export function runIstore2(thread: Thread): void {
  const popResult = thread.popStack()
  if (popResult.status === ResultType.ERROR) {
    return
  }
  thread.offsetPc(1)
  thread.storeLocal(2, popResult.result)
}

export function runIstore3(thread: Thread): void {
  const popResult = thread.popStack()
  if (popResult.status === ResultType.ERROR) {
    return
  }
  thread.offsetPc(1)
  thread.storeLocal(3, popResult.result)
}

export function runLstore0(thread: Thread): void {
  const popResult = thread.popStack64()
  if (popResult.status === ResultType.ERROR) {
    return
  }
  thread.offsetPc(1)
  thread.storeLocal64(0, popResult.result)
}

export function runLstore1(thread: Thread): void {
  const popResult = thread.popStack64()
  if (popResult.status === ResultType.ERROR) {
    return
  }
  thread.offsetPc(1)
  thread.storeLocal64(1, popResult.result)
}

export function runLstore2(thread: Thread): void {
  const popResult = thread.popStack64()
  if (popResult.status === ResultType.ERROR) {
    return
  }
  thread.offsetPc(1)
  thread.storeLocal64(2, popResult.result)
}

export function runLstore3(thread: Thread): void {
  const popResult = thread.popStack64()
  if (popResult.status === ResultType.ERROR) {
    return
  }
  thread.offsetPc(1)
  thread.storeLocal64(3, popResult.result)
}

export function runFstore0(thread: Thread): void {
  const popResult = thread.popStack()
  if (popResult.status === ResultType.ERROR) {
    return
  }
  thread.offsetPc(1)
  thread.storeLocal(0, asFloat(popResult.result))
}

export function runFstore1(thread: Thread): void {
  const popResult = thread.popStack()
  if (popResult.status === ResultType.ERROR) {
    return
  }
  thread.offsetPc(1)
  thread.storeLocal(1, asFloat(popResult.result))
}

export function runFstore2(thread: Thread): void {
  const popResult = thread.popStack()
  if (popResult.status === ResultType.ERROR) {
    return
  }
  thread.offsetPc(1)
  thread.storeLocal(2, asFloat(popResult.result))
}

export function runFstore3(thread: Thread): void {
  const popResult = thread.popStack()
  if (popResult.status === ResultType.ERROR) {
    return
  }
  thread.offsetPc(1)
  thread.storeLocal(3, asFloat(popResult.result))
}

export function runDstore0(thread: Thread): void {
  const popResult = thread.popStack64()
  if (popResult.status === ResultType.ERROR) {
    return
  }
  thread.offsetPc(1)
  thread.storeLocal64(0, asDouble(popResult.result))
}

export function runDstore1(thread: Thread): void {
  const popResult = thread.popStack64()
  if (popResult.status === ResultType.ERROR) {
    return
  }
  thread.offsetPc(1)
  thread.storeLocal64(1, asDouble(popResult.result))
}

export function runDstore2(thread: Thread): void {
  const popResult = thread.popStack64()
  if (popResult.status === ResultType.ERROR) {
    return
  }
  thread.offsetPc(1)
  thread.storeLocal64(2, asDouble(popResult.result))
}

export function runDstore3(thread: Thread): void {
  const popResult = thread.popStack64()
  if (popResult.status === ResultType.ERROR) {
    return
  }
  thread.offsetPc(1)
  thread.storeLocal64(3, asDouble(popResult.result))
}

export function runAstore0(thread: Thread): void {
  const popResult = thread.popStack()
  if (popResult.status === ResultType.ERROR) {
    return
  }
  thread.offsetPc(1)
  thread.storeLocal(0, popResult.result)
}

export function runAstore1(thread: Thread): void {
  const popResult = thread.popStack()
  if (popResult.status === ResultType.ERROR) {
    return
  }
  thread.offsetPc(1)
  thread.storeLocal(1, popResult.result)
}

export function runAstore2(thread: Thread): void {
  const popResult = thread.popStack()
  if (popResult.status === ResultType.ERROR) {
    return
  }
  thread.offsetPc(1)
  thread.storeLocal(2, popResult.result)
}

export function runAstore3(thread: Thread): void {
  const popResult = thread.popStack()
  if (popResult.status === ResultType.ERROR) {
    return
  }
  thread.offsetPc(1)
  thread.storeLocal(3, popResult.result)
}

function arraystore32(thread: Thread, func: (value: any) => any): void {
  const vpopResult = thread.popStack()
  const ipopResult = thread.popStack()
  const apopResult = thread.popStack()
  if (
    vpopResult.status === ResultType.ERROR ||
    ipopResult.status === ResultType.ERROR ||
    apopResult.status === ResultType.ERROR
  ) {
    return
  }
  const value = vpopResult.result
  const index = ipopResult.result
  const arrayref = apopResult.result as JvmArray

  if (arrayref === null) {
    thread.throwNewException('java/lang/NullPointerException', '')
    return
  }

  if (index < 0 || index >= arrayref.len()) {
    thread.throwNewException('java/lang/ArrayIndexOutOfBoundsException', '')
    return
  }

  thread.offsetPc(1)
  arrayref.set(index, func(value))
}

export function runIastore(thread: Thread): void {
  arraystore32(thread, v => v)
}

export function runLastore(thread: Thread): void {
  const vpopResult = thread.popStack64()
  const ipopResult = thread.popStack()
  const apopResult = thread.popStack()
  if (
    vpopResult.status === ResultType.ERROR ||
    ipopResult.status === ResultType.ERROR ||
    apopResult.status === ResultType.ERROR
  ) {
    return
  }
  const value = vpopResult.result
  const index = ipopResult.result
  const arrayref = apopResult.result as JvmArray

  if (arrayref === null) {
    thread.throwNewException('java/lang/NullPointerException', '')
    return
  }

  if (index < 0 || index >= arrayref.len()) {
    thread.throwNewException('java/lang/ArrayIndexOutOfBoundsException', '')
    return
  }

  thread.offsetPc(1)
  arrayref.set(index, value)
}

export function runFastore(thread: Thread): void {
  arraystore32(thread, v => v)
}

export function runDastore(thread: Thread): void {
  const vpopResult = thread.popStack64()
  const ipopResult = thread.popStack()
  const apopResult = thread.popStack()
  if (
    vpopResult.status === ResultType.ERROR ||
    ipopResult.status === ResultType.ERROR ||
    apopResult.status === ResultType.ERROR
  ) {
    return
  }
  const value = vpopResult.result
  const index = ipopResult.result
  const arrayref = apopResult.result as JvmArray

  if (arrayref === null) {
    thread.throwNewException('java/lang/NullPointerException', '')
    return
  }

  if (index < 0 || index >= arrayref.len()) {
    thread.throwNewException('java/lang/ArrayIndexOutOfBoundsException', '')
    return
  }

  thread.offsetPc(1)
  arrayref.set(index, value)
}

export function runAastore(thread: Thread): void {
  arraystore32(thread, v => v)
}

export function runBastore(thread: Thread): void {
  arraystore32(thread, value => (value << 24) >> 24)
}

export function runCastore(thread: Thread): void {
  arraystore32(thread, value => value & 0xffff)
}

export function runSastore(thread: Thread): void {
  arraystore32(thread, value => (value << 16) >> 16)
}
