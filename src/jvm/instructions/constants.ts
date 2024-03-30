import Thread from '../thread'
import { ReferenceClassData } from '../types/class/ClassData'
import { ConstantClass, ConstantDouble, ConstantLong } from '../types/class/Constants'
import { ResultType } from '../types/Result'

export function runNop(thread: Thread): void {
  thread.offsetPc(1)
  return
}

export function runAconstNull(thread: Thread): void {
  thread.pushStack(null) && thread.offsetPc(1)
}

export function runIconstM1(thread: Thread): void {
  thread.pushStack(-1) && thread.offsetPc(1)
}

export function runIconst0(thread: Thread): void {
  thread.pushStack(0) && thread.offsetPc(1)
}

export function runIconst1(thread: Thread): void {
  thread.pushStack(1) && thread.offsetPc(1)
}

export function runIconst2(thread: Thread): void {
  thread.pushStack(2) && thread.offsetPc(1)
}

export function runIconst3(thread: Thread): void {
  thread.pushStack(3) && thread.offsetPc(1)
}

export function runIconst4(thread: Thread): void {
  thread.pushStack(4) && thread.offsetPc(1)
}

export function runIconst5(thread: Thread): void {
  thread.pushStack(5) && thread.offsetPc(1)
}

export function runLconst0(thread: Thread): void {
  thread.pushStack64(BigInt(0)) && thread.offsetPc(1)
}

export function runLconst1(thread: Thread): void {
  thread.pushStack64(BigInt(1)) && thread.offsetPc(1)
}

export function runFconst0(thread: Thread): void {
  thread.pushStack(0.0) && thread.offsetPc(1)
}

export function runFconst1(thread: Thread): void {
  thread.pushStack(1.0) && thread.offsetPc(1)
}

export function runFconst2(thread: Thread): void {
  thread.pushStack(2.0) && thread.offsetPc(1)
}

export function runDconst0(thread: Thread): void {
  thread.pushStack64(0.0) && thread.offsetPc(1)
}

export function runDconst1(thread: Thread): void {
  thread.pushStack64(1.0) && thread.offsetPc(1)
}

export function runBipush(thread: Thread): void {
  thread.pushStack(thread.getCode().getInt8(thread.getPC() + 1)) && thread.offsetPc(2)
}

export function runSipush(thread: Thread): void {
  thread.pushStack(thread.getCode().getInt16(thread.getPC() + 1)) && thread.offsetPc(3)
}

export function loadConstant(thread: Thread, index: number, onFinish?: () => void): void {
  const invoker = thread.getClass()
  const constant = invoker.getConstant(index)

  const resolutionRes = constant.resolve(thread, invoker.getLoader())
  if (resolutionRes.status !== ResultType.SUCCESS) {
    if (resolutionRes.status === ResultType.ERROR) {
      thread.throwNewException(resolutionRes.exceptionCls, resolutionRes.msg)
    }
    return
  }

  let value = resolutionRes.result
  if (ConstantClass.check(constant)) {
    const clsRef = value as ReferenceClassData
    const initRes = clsRef.initialize(thread)
    if (initRes.status !== ResultType.SUCCESS) {
      if (initRes.status === ResultType.ERROR) {
        thread.throwNewException(initRes.exceptionCls, initRes.msg)
      }
      return
    }
    value = clsRef.getJavaObject()
  }

  thread.pushStack(value) && onFinish && onFinish()
}

export function runLdc(thread: Thread): void {
  const indexbyte = thread.getCode().getUint8(thread.getPC() + 1)
  loadConstant(thread, indexbyte, () => thread.offsetPc(2))
}

export function runLdcW(thread: Thread): void {
  const indexbyte = thread.getCode().getUint16(thread.getPC() + 1)
  loadConstant(thread, indexbyte, () => thread.offsetPc(3))
}

export function runLdc2W(thread: Thread): void {
  const indexbyte = thread.getCode().getUint16(thread.getPC() + 1)
  const item = thread.getClass().getConstant(indexbyte) as ConstantDouble | ConstantLong
  // The constant does not need to be resolved since it is a number.
  // We can directly push the value to the stack.
  thread.pushStack64(item.get()) && thread.offsetPc(3)
}
