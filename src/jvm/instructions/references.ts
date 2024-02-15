import { NativeStackFrame, JavaStackFrame } from "../stackframe";
import Thread from "../thread";
import {
  checkSuccess,
  checkError,
  Result,
  ImmediateResult,
} from "../types/Result";
import { ReferenceClassData } from "../types/class/ClassData";
import {
  ConstantFieldref,
  ConstantMethodref,
  ConstantInterfaceMethodref,
  ConstantInvokeDynamic,
  ConstantClass,
} from "../types/class/Constants";
import { Method } from "../types/class/Method";
import { ArrayPrimitiveType, JvmArray } from "../types/reference/Array";
import { JavaType, JvmObject } from "../types/reference/Object";
import { asDouble, asFloat, getArgs } from "../utils";

export function runGetstatic(thread: Thread): void {
  const indexbyte = thread.getCode().getUint16(thread.getPC() + 1);

  const constantField = thread
    .getClass()
    .getConstant(indexbyte) as ConstantFieldref;
  const fieldRes = constantField.resolve();

  if (!checkSuccess(fieldRes)) {
    if (checkError(fieldRes)) {
      thread.throwNewException(fieldRes.exceptionCls, fieldRes.msg);
      return;
    }
    return;
  }
  const field = fieldRes.result;

  const accessCheck = field.checkAccess(thread, true, false);
  if (checkError(accessCheck)) {
    thread.throwNewException(accessCheck.exceptionCls, accessCheck.msg);
    return;
  }

  const fieldClass = field.getClass();
  const initRes = fieldClass.initialize(thread);
  if (!checkSuccess(initRes)) {
    if (checkError(initRes)) {
      thread.throwNewException(initRes.exceptionCls, initRes.msg);
      return;
    }
    return;
  }

  if (field.getFieldDesc() === "J" || field.getFieldDesc() === "D") {
    thread.pushStack64(field.getValue());
  } else {
    thread.pushStack(field.getValue());
  }
  thread.offsetPc(3);
}

export function runPutstatic(thread: Thread): void {
  const indexbyte = thread.getCode().getUint16(thread.getPC() + 1);

  const constantField = thread
    .getClass()
    .getConstant(indexbyte) as ConstantFieldref;
  const fieldRes = constantField.resolve();

  if (!checkSuccess(fieldRes)) {
    if (checkError(fieldRes)) {
      thread.throwNewException(fieldRes.exceptionCls, fieldRes.msg);
      return;
    }
    return;
  }
  const field = fieldRes.result;

  const accessCheck = field.checkAccess(thread, true, true);
  if (checkError(accessCheck)) {
    thread.throwNewException(accessCheck.exceptionCls, accessCheck.msg);
    return;
  }

  const fieldClass = field.getClass();
  const initRes = fieldClass.initialize(thread);
  if (!checkSuccess(initRes)) {
    if (checkError(initRes)) {
      thread.throwNewException(initRes.exceptionCls, initRes.msg);
      return;
    }
    return;
  }

  const desc = field.getFieldDesc();
  thread.offsetPc(3);
  let popResult;
  switch (desc) {
    case JavaType.long:
      popResult = thread.popStack64();
      if (checkError(popResult)) {
        return;
      }
      field.putValue(popResult.result);
      return;
    case JavaType.double:
      popResult = thread.popStack64();
      if (checkError(popResult)) {
        return;
      }
      field.putValue(asDouble(popResult.result));
      return;
    case JavaType.float:
      popResult = thread.popStack();
      if (checkError(popResult)) {
        return;
      }
      field.putValue(asFloat(popResult.result));
      return;
    case JavaType.boolean:
      popResult = thread.popStack();
      if (checkError(popResult)) {
        return;
      }
      field.putValue(popResult.result & 1);
      return;
    case JavaType.int:
    default:
      popResult = thread.popStack();
      if (checkError(popResult)) {
        return;
      }
      field.putValue(popResult.result);
      return;
  }
}

export function runGetfield(thread: Thread): void {
  const indexbyte = thread.getCode().getUint16(thread.getPC() + 1);

  const constantField = thread
    .getClass()
    .getConstant(indexbyte) as ConstantFieldref;
  const fieldRes = constantField.resolve();

  if (!checkSuccess(fieldRes)) {
    if (checkError(fieldRes)) {
      thread.throwNewException(fieldRes.exceptionCls, fieldRes.msg);
      return;
    }
    return;
  }
  const field = fieldRes.result;

  const accessCheck = field.checkAccess(thread, false, false);
  if (checkError(accessCheck)) {
    thread.throwNewException(accessCheck.exceptionCls, accessCheck.msg);
    return;
  }

  const popResult = thread.popStack();
  if (checkError(popResult)) {
    return;
  }
  const objRef = popResult.result as JvmObject;
  if (objRef === null) {
    thread.throwNewException("java/lang/NullPointerException", "");
    return;
  }

  const value = objRef.getField(field);
  if (field.getFieldDesc() === "J" || field.getFieldDesc() === "D") {
    thread.pushStack64(value as number | bigint);
  } else {
    thread.pushStack(value);
  }
  thread.offsetPc(3);
}

export function runPutfield(thread: Thread): void {
  const indexbyte = thread.getCode().getUint16(thread.getPC() + 1);
  const constantField = thread
    .getClass()
    .getConstant(indexbyte) as ConstantFieldref;
  const fieldRes = constantField.resolve();

  if (!checkSuccess(fieldRes)) {
    if (checkError(fieldRes)) {
      thread.throwNewException(fieldRes.exceptionCls, fieldRes.msg);
      return;
    }
    return;
  }
  const field = fieldRes.result;

  const accessCheck = field.checkAccess(thread, false, false);
  if (checkError(accessCheck)) {
    thread.throwNewException(accessCheck.exceptionCls, accessCheck.msg);
    return;
  }

  let vpopResult;
  if (field.getFieldDesc() === "J" || field.getFieldDesc() === "D") {
    vpopResult = thread.popStack64();
  } else {
    vpopResult = thread.popStack();
  }

  const popResult = thread.popStack();
  if (checkError(vpopResult) || checkError(popResult)) {
    return;
  }
  const objRef = popResult.result as JvmObject;
  if (objRef === null) {
    thread.throwNewException("java/lang/NullPointerException", "");
    return;
  }
  objRef.putField(field, vpopResult.result);
  thread.offsetPc(3);
}

function invokeInit(
  thread: Thread,
  constant: ConstantMethodref | ConstantInterfaceMethodref
): Result<{ methodRef: Method; args: any[]; polyMethod?: Method }> {
  const methodRes = constant.resolve(thread);
  if (!checkSuccess(methodRes)) {
    return methodRes;
  }
  const methodRef = methodRes.result;

  const classRef = methodRef.getClass();
  const initRes = classRef.initialize(thread);
  if (!checkSuccess(initRes)) {
    return initRes;
  }

  if (methodRef.checkSignaturePolymorphic()) {
    const { appendix, memberName, originalDescriptor } =
      constant.getPolymorphic();

    let target: Method;
    let args: any[] = [];
    const name = methodRef.getName();
    let mh, mn, popResult;
    switch (name) {
      case "invokeBasic":
        target = methodRef;
        args = getArgs(thread, originalDescriptor, target.checkNative());
        popResult = thread.popStack();
        if (checkError(popResult)) {
          return popResult;
        }
        mh = popResult.result as JvmObject;
        if (mh === null) {
          return { exceptionCls: "java/lang/NullPointerException", msg: "" };
        }
        args = [mh, ...args];
        break;
      case "invoke":
      case "invokeExact":
        if (!memberName) {
          return { exceptionCls: "java/lang/NullPointerException", msg: "" };
        }
        target = memberName.getNativeField("vmtarget") as Method;
        args = getArgs(thread, originalDescriptor, target.checkNative());
        if (appendix !== null) {
          args.push(appendix);
        }
        popResult = thread.popStack();
        if (checkError(popResult)) {
          return popResult;
        }
        mh = popResult.result as JvmObject;
        if (mh === null) {
          return { exceptionCls: "java/lang/NullPointerException", msg: "" };
        }
        args = [mh, ...args];
        break;
      case "linkToVirtual":
      case "linkToInterface":
      case "linkToSpecial":
      case "linkToStatic":
        popResult = thread.popStack();
        if (checkError(popResult)) {
          return popResult;
        }
        mn = popResult.result as JvmObject;
        target = mn.getNativeField("vmtarget") as Method;
        thread.pushStack(mn);
        args = getArgs(thread, originalDescriptor, target.checkNative());
        args.pop();
        if (mn === null) {
          return { exceptionCls: "java/lang/NullPointerException", msg: "" };
        }
        break;
      default:
        return { exceptionCls: "java/lang/LinkageError", msg: "" };
    }

    return {
      result: { methodRef: target, args, polyMethod: methodRef },
    };
  } else {
    const args = methodRef.getArgs(thread);
    return { result: { methodRef, args } };
  }
}

// looks up method for invokevirtual/invokeinterface.
// checks interface for invokeinterface, otherwise checks override
function lookupMethod(
  thread: Thread,
  methodRef: Method,
  checkInterface: boolean,
  checkCastTo?: ReferenceClassData
): ImmediateResult<{ toInvoke: Method; objRef: JvmObject }> {
  const popResult = thread.popStack();
  if (checkError(popResult)) {
    return popResult;
  }
  const objRef = popResult.result as JvmObject;
  if (objRef === null) {
    return { exceptionCls: "java/lang/NullPointerException", msg: "" };
  }

  if (checkCastTo && !objRef.getClass().checkCast(checkCastTo)) {
    return { exceptionCls: "java/lang/IncompatibleClassChangeError", msg: "" };
  }

  const runtimeClassRef = objRef.getClass();
  // method lookup
  const lookupResult = runtimeClassRef.lookupMethod(
    methodRef.getName() + methodRef.getDescriptor(),
    methodRef,
    !checkInterface,
    checkInterface
  );
  if (checkError(lookupResult)) {
    return lookupResult;
  }
  const toInvoke = lookupResult.result;
  if (toInvoke.checkAbstract()) {
    return { exceptionCls: "java/lang/NoSuchMethodError", msg: "" };
  }

  return { result: { toInvoke, objRef } };
}

function invokePoly(
  thread: Thread,
  polyMethod: Method,
  vmtarget: Method,
  args: any[],
  returnOffset: number
): void {
  let toInvoke = vmtarget;
  if (polyMethod.getName() === "invokeBasic") {
    const mh = args[0] as JvmObject;
    const lambdaForm = mh._getField(
      "form",
      "Ljava/lang/invoke/LambdaForm;",
      "java/lang/invoke/MethodHandle"
    ) as JvmObject;
    const memberName = lambdaForm._getField(
      "vmentry",
      "Ljava/lang/invoke/MemberName;",
      "java/lang/invoke/LambdaForm"
    ) as JvmObject;
    toInvoke = memberName.getNativeField("vmtarget") as Method;
  }

  thread.invokeStackFrame(
    toInvoke.checkNative()
      ? new NativeStackFrame(
          toInvoke.getClass(),
          toInvoke,
          0,
          args,
          returnOffset,
          thread.getJVM().getJNI()
        )
      : new JavaStackFrame(toInvoke.getClass(), toInvoke, 0, args, returnOffset)
  );
}

function invokeVirtual(
  thread: Thread,
  constant: ConstantMethodref | ConstantInterfaceMethodref,
  returnOffset: number
): void {
  const resolutionRes = invokeInit(thread, constant);
  if (!checkSuccess(resolutionRes)) {
    if (checkError(resolutionRes)) {
      thread.throwNewException(resolutionRes.exceptionCls, resolutionRes.msg);
      return;
    }
    return;
  }
  const { methodRef, args, polyMethod } = resolutionRes.result;

  if (polyMethod) {
    invokePoly(thread, polyMethod, methodRef, args, returnOffset);
    return;
  }

  // method lookup
  const toInvokeRes = lookupMethod(thread, methodRef, false);
  if (checkError(toInvokeRes)) {
    thread.throwNewException(toInvokeRes.exceptionCls, toInvokeRes.msg);
    return;
  }
  const { toInvoke, objRef } = toInvokeRes.result;

  if (toInvoke.checkNative()) {
    thread.invokeStackFrame(
      new NativeStackFrame(
        toInvoke.getClass(),
        toInvoke,
        0,
        [objRef, ...args],
        returnOffset,
        thread.getJVM().getJNI()
      )
    );
  } else {
    thread.invokeStackFrame(
      new JavaStackFrame(
        toInvoke.getClass(),
        toInvoke,
        0,
        [objRef, ...args],
        returnOffset
      )
    );
  }
}

export function runInvokevirtual(thread: Thread): void {
  const indexbyte = thread.getCode().getUint16(thread.getPC() + 1);
  const constant = thread
    .getClass()
    .getConstant(indexbyte) as ConstantMethodref;

  invokeVirtual(thread, constant, 3);
}

export function runInvokespecial(thread: Thread): void {
  const indexbyte = thread.getCode().getUint16(thread.getPC() + 1);
  const constant = thread.getClass().getConstant(indexbyte) as
    | ConstantMethodref
    | ConstantInterfaceMethodref;
  const resolutionRes = invokeInit(thread, constant);
  if (!checkSuccess(resolutionRes)) {
    if (checkError(resolutionRes)) {
      thread.throwNewException(resolutionRes.exceptionCls, resolutionRes.msg);
      return;
    }
    return;
  }
  const { methodRef, args } = resolutionRes.result;

  const popResult = thread.popStack();
  if (checkError(popResult)) {
    return;
  }
  const objRef = popResult.result as JvmObject;
  if (objRef === null) {
    thread.throwNewException("java/lang/NullPointerException", "");
    return;
  }

  if (methodRef.checkAbstract()) {
    thread.throwNewException("java/lang/AbstractMethodError", "");
    return;
  }

  if (methodRef.checkNative()) {
    thread.invokeStackFrame(
      new NativeStackFrame(
        methodRef.getClass(),
        methodRef,
        0,
        [objRef, ...args],
        3,
        thread.getJVM().getJNI()
      )
    );
  } else {
    thread.invokeStackFrame(
      new JavaStackFrame(
        methodRef.getClass(),
        methodRef,
        0,
        [objRef, ...args],
        3
      )
    );
  }
}

export function runInvokestatic(thread: Thread): void {
  const indexbyte = thread.getCode().getUint16(thread.getPC() + 1);
  const constant = thread.getClass().getConstant(indexbyte) as
    | ConstantMethodref
    | ConstantInterfaceMethodref;

  const resolutionRes = invokeInit(thread, constant);
  if (!checkSuccess(resolutionRes)) {
    if (checkError(resolutionRes)) {
      thread.throwNewException(resolutionRes.exceptionCls, resolutionRes.msg);
      return;
    }
    return;
  }
  const { methodRef, args } = resolutionRes.result;

  if (!methodRef.checkStatic()) {
    thread.throwNewException("java/lang/IncompatibleClassChangeError", "");
    return;
  }

  if (methodRef.checkNative()) {
    thread.invokeStackFrame(
      new NativeStackFrame(
        methodRef.getClass(),
        methodRef,
        0,
        args,
        3,
        thread.getJVM().getJNI()
      )
    );
  } else {
    thread.invokeStackFrame(
      new JavaStackFrame(methodRef.getClass(), methodRef, 0, args, 3)
    );
  }
}

export function runInvokeinterface(thread: Thread): void {
  const indexbyte = thread.getCode().getUint16(thread.getPC() + 1);

  const constant = thread
    .getClass()
    .getConstant(indexbyte) as ConstantInterfaceMethodref;
  const resolutionRes = invokeInit(thread, constant);
  if (!checkSuccess(resolutionRes)) {
    if (checkError(resolutionRes)) {
      thread.throwNewException(resolutionRes.exceptionCls, resolutionRes.msg);
      return;
    }
    return;
  }
  const { methodRef, args } = resolutionRes.result;

  const toInvokeRes = lookupMethod(thread, methodRef, true);
  if (checkError(toInvokeRes)) {
    thread.throwNewException(toInvokeRes.exceptionCls, toInvokeRes.msg);
    return;
  }
  const { toInvoke, objRef } = toInvokeRes.result;

  if (toInvoke.checkNative()) {
    thread.invokeStackFrame(
      new NativeStackFrame(
        toInvoke.getClass(),
        toInvoke,
        0,
        [objRef, ...args],
        5,
        thread.getJVM().getJNI()
      )
    );
  } else {
    thread.invokeStackFrame(
      new JavaStackFrame(toInvoke.getClass(), toInvoke, 0, [objRef, ...args], 5)
    );
  }
}

export function runInvokedynamic(thread: Thread): void {
  const index = thread.getCode().getUint16(thread.getPC() + 1);

  const invoker = thread.getClass();
  const callsiteConstant = invoker.getConstant(index) as ConstantInvokeDynamic;

  const cssRes = callsiteConstant.resolve(thread);
  if (!checkSuccess(cssRes)) {
    if (checkError(cssRes)) {
      thread.throwNewException(cssRes.exceptionCls, cssRes.msg);
      return;
    }
    return;
  }
  const [callsite, appendix] = cssRes.result;
  const toInvoke = callsite.getNativeField("vmtarget") as Method;
  const args = getArgs(
    thread,
    callsiteConstant.getNameAndType().get().descriptor,
    toInvoke.checkNative()
  );
  args.push(appendix);
  thread.offsetPc(5);
  thread.invokeStackFrame(
    new JavaStackFrame(toInvoke.getClass(), toInvoke, 0, args)
  );
  return;
}

export function runNew(thread: Thread): void {
  const indexbyte = thread.getCode().getUint16(thread.getPC() + 1);
  const invoker = thread.getClass();
  const res = (invoker.getConstant(indexbyte) as ConstantClass).resolve();
  if (!checkSuccess(res)) {
    if (checkError(res)) {
      thread.throwNewException(res.exceptionCls, res.msg);
      return;
    }
    return;
  }

  const objCls = res.result;
  if (objCls.checkAbstract() || objCls.checkInterface()) {
    thread.throwNewException("java/lang/InstantiationError", "");
    return;
  }

  // Load + initialize if needed
  const initRes = objCls.initialize(thread);
  if (!checkSuccess(initRes)) {
    if (checkError(initRes)) {
      thread.throwNewException(initRes.exceptionCls, initRes.msg);
      return;
    }
    return;
  }

  thread.offsetPc(3);
  thread.pushStack(objCls.instantiate());
}

export function runNewarray(thread: Thread): void {
  const atype = thread.getCode().getUint8(thread.getPC() + 1);
  thread.offsetPc(2);

  const popResult = thread.popStack();
  if (checkError(popResult)) {
    return;
  }
  const count = popResult.result;
  if (count < 0) {
    thread.throwNewException("java/lang/NegativeArraySizeException", "");
    return;
  }

  let className = "";
  switch (atype) {
    case ArrayPrimitiveType.boolean:
      className = "[" + JavaType.boolean;
      break;
    case ArrayPrimitiveType.char:
      className = "[" + JavaType.char;
      break;
    case ArrayPrimitiveType.float:
      className = "[" + JavaType.float;
      break;
    case ArrayPrimitiveType.double:
      className = "[" + JavaType.double;
      break;
    case ArrayPrimitiveType.byte:
      className = "[" + JavaType.byte;
      break;
    case ArrayPrimitiveType.short:
      className = "[" + JavaType.short;
      break;
    case ArrayPrimitiveType.int:
      className = "[" + JavaType.int;
      break;
    case ArrayPrimitiveType.long:
      className = "[" + JavaType.long;
      break;
    default:
      throw new Error("Invalid atype, reference types should use anewarray");
  }
  const classResolutionResult = thread
    .getClass()
    .getLoader()
    .getClass(className);
  if (checkError(classResolutionResult)) {
    throw new Error("Failed to load primitive array class");
  }

  const arrayCls = classResolutionResult.result;
  const arrayref = arrayCls.instantiate() as unknown as JvmArray;
  arrayref.initArray(count);
  thread.pushStack(arrayref);
}

export function runAnewarray(thread: Thread): void {
  const indexbyte = thread.getCode().getUint16(thread.getPC() + 1);
  const invoker = thread.getClass();
  const popResult = thread.popStack();
  if (checkError(popResult)) {
    return;
  }
  const count = popResult.result;
  thread.offsetPc(3);

  if (count < 0) {
    thread.throwNewException("java/lang/NegativeArraySizeException", "");
    return;
  }

  const res = (invoker.getConstant(indexbyte) as ConstantClass).resolve();
  if (checkError(res)) {
    thread.throwNewException(res.exceptionCls, res.msg);
    return;
  }
  const objCls = res.result;

  const arrayClassRes = invoker
    .getLoader()
    .getClass("[L" + objCls.getClassname() + ";");
  if (checkError(arrayClassRes)) {
    throw new Error("Failed to load array class");
  }
  const arrayCls = arrayClassRes.result;

  const arrayref = arrayCls.instantiate() as unknown as JvmArray;
  arrayref.initArray(count);
  thread.pushStack(arrayref);
}

export function runArraylength(thread: Thread): void {
  const popResult = thread.popStack();
  if (checkError(popResult)) {
    return;
  }
  const arrayref = popResult.result as JvmArray;
  if (arrayref === null) {
    thread.throwNewException("java/lang/NullPointerException", "");
    return;
  }
  thread.offsetPc(1);
  thread.pushStack(arrayref.len());
}

export function runAthrow(thread: Thread): void {
  const popResult = thread.popStack();
  if (checkError(popResult)) {
    return;
  }
  const exception = popResult.result;

  if (exception === null) {
    thread.pushStack(exception);
    thread.throwNewException("java/lang/NullPointerException", "");
    return;
  }

  thread.offsetPc(1);
  thread.throwException(exception);
}

function _checkCast(
  thread: Thread,
  indexbyte: number,
  isCC: boolean = true
): void {
  const popResult = thread.popStack();
  if (checkError(popResult)) {
    return;
  }
  const objectref = popResult.result as JvmObject;

  if (objectref === null) {
    isCC ? thread.pushStack(null) : thread.pushStack(0);
    return;
  }

  const clsConstant = thread.getClass().getConstant(indexbyte);
  const resolutionResult = clsConstant.resolve();
  if (!checkSuccess(resolutionResult)) {
    if (checkError(resolutionResult)) {
      thread.throwNewException(
        resolutionResult.exceptionCls,
        resolutionResult.msg
      );
      return;
    }
    return;
  }

  // S is the class of the object referred to by objectref and T is the resolved class
  const objClsS = objectref.getClass();
  const targetClsT = resolutionResult.result;

  let value = 0;
  if (objClsS.checkCast(targetClsT)) {
    value = 1;
  }
  if (!isCC) {
    thread.pushStack(value);
  } else {
    value === 1
      ? thread.pushStack(objectref)
      : thread.throwNewException("java/lang/ClassCastException", "");
  }
  return;
}

export function runCheckcast(thread: Thread): void {
  const indexbyte = thread.getCode().getUint16(thread.getPC() + 1);
  thread.offsetPc(3);
  _checkCast(thread, indexbyte, true);
}

export function runInstanceof(thread: Thread): void {
  const indexbyte = thread.getCode().getUint16(thread.getPC() + 1);
  thread.offsetPc(3);
  _checkCast(thread, indexbyte, false);
}

export function runMonitorenter(thread: Thread): void {
  const popResult = thread.popStack();
  if (checkError(popResult)) {
    return;
  }
  const obj = popResult.result as JvmObject | null;
  if (obj === null) {
    thread.throwNewException("java/lang/NullPointerException", "");
    return;
  }

  obj.getMonitor().enter(thread, () => thread.offsetPc(1));
}

export function runMonitorexit(thread: Thread): void {
  const popResult = thread.popStack();
  if (checkError(popResult)) {
    return;
  }
  const obj = popResult.result as JvmObject | null;
  if (obj === null) {
    thread.throwNewException("java/lang/NullPointerException", "");
    return;
  }

  obj.getMonitor().exit(thread, () => thread.offsetPc(1));
}
