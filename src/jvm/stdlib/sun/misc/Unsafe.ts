import {
  ConstantClassInfo,
  ConstantUtf8Info,
} from "../../../../ClassFile/types/constants";
import Thread from "../../../thread";
import { ErrorResult } from "../../../types/Result";
import {
  ReferenceClassData,
  ArrayClassData,
  ClassData,
} from "../../../types/class/ClassData";
import { Field } from "../../../types/class/Field";
import { JvmArray } from "../../../types/reference/Array";
import { JvmObject } from "../../../types/reference/Object";
import { typeIndexScale } from "../../../utils";
import parseBin from "../../../utils/disassembler";

function getFieldInfo(
  thread: Thread,
  unsafe: JvmObject,
  obj: JvmObject,
  offset: bigint
): any {
  // obj is a class obj
  const objCls = obj.getClass();
  // unsafe should be loaded at initialization
  // also init unsafe at JVM startup?
  const unsafeCls = unsafe.getClass();
  if (objCls.getClassname() === "java/lang/Object") {
    throw new Error("not implemented");
  } else if (objCls.checkArray()) {
    // obj is an array. offset represents index * unit space
    const compCls = objCls.getComponentClass();
    const stride = typeIndexScale(compCls);
    const objBase = (obj as JvmArray).getJsArray();
    return [objBase, Math.floor(Number(offset) / stride)];
  } else {
    // normal class
    const objBase = obj;
    const fieldRef = obj.getFieldFromVMIndex(Number(offset));
    return [objBase, fieldRef];
  }
}

const setFromVMIndex = (thread: Thread, locals: any[]) => {
  const unsafe = locals[0] as JvmObject;
  const obj = locals[1] as JvmObject;
  const offset = locals[2] as bigint;

  const fi = getFieldInfo(thread, unsafe, obj, offset);
  const objBase = fi[0];
  const ref = fi[1];
  if (typeof ref === "number") {
    // array type
    objBase[ref] = locals[3];
    thread.returnStackFrame();
    return;
  }
  (ref as Field).putValue(locals[3]);
  thread.returnStackFrame();
};

const getFromVMIndex = (thread: Thread, locals: any[]) => {
  const unsafe = locals[0] as JvmObject;
  const obj = locals[1] as JvmObject;
  const offset = locals[2] as bigint;

  const fi = getFieldInfo(thread, unsafe, obj, offset);
  const objBase = fi[0];
  const ref = fi[1];
  if (typeof ref === "number") {
    // array type
    thread.returnStackFrame(objBase[ref]);
    return;
  }
  thread.returnStackFrame((ref as Field).getValue());
};

/**
 * Checks if the field at the given offset in the given object
 * is equals to the expected value. If so, sets the field to
 * newValue and returns true. Otherwise, returns false.
 * @param thread
 * @param unsafe
 * @param obj
 * @param offset
 * @param expected
 * @param newValue
 * @returns
 */
function unsafeCompareAndSwap(
  thread: Thread,
  unsafe: JvmObject,
  obj: JvmObject,
  offset: bigint,
  expected: any,
  newValue: any
): number {
  // obj: Class object w/ field reflectionData
  // offset: field slot of field reflectionData
  // expected: SoftReference object
  // newValue: SoftReference object

  const fi = getFieldInfo(thread, unsafe, obj, offset);
  const objBase = fi[0];
  const ref = fi[1];
  if (typeof ref === "number") {
    // array type
    const actual = objBase[ref];
    if (actual === expected) {
      objBase[ref] = newValue;
      return 1;
    } else {
      return 0;
    }
  }
  const actual = (ref as Field).getValue();

  if (actual === expected) {
    ref.putValue(newValue);
    return 1;
  } else {
    return 0;
  }
}

const functions = {
  "registerNatives()V": (thread: Thread, locals: any[]) => {
    thread.returnStackFrame();
  },

  "arrayBaseOffset(Ljava/lang/Class;)I": (thread: Thread, locals: any[]) => {
    thread.returnStackFrame(0);
  },
  "objectFieldOffset(Ljava/lang/reflect/Field;)J": (
    thread: Thread,
    locals: any[]
  ) => {
    const unsafe = locals[0] as JvmObject;
    const field = locals[1] as JvmObject;
    const slot = field._getField("slot", "I", "java/lang/reflect/Field");

    // #region debug
    const fstr = field._getField(
      "name",
      "Ljava/lang/String;",
      "java/lang/reflect/Field"
    );
    const cArr = fstr._getField("value", "[C", "java/lang/String");
    const chars = cArr.getJsArray();
    // #endregion

    thread.returnStackFrame64(BigInt(slot));
  },
  // Used for bitwise operations
  "arrayIndexScale(Ljava/lang/Class;)I": (thread: Thread, locals: any[]) => {
    const clsObj = locals[1] as JvmObject;
    const clsRef = clsObj.getNativeField("classRef") as ReferenceClassData;

    // Should be array. return -1 for invalid class
    if (!clsRef.checkArray()) {
      thread.returnStackFrame(-1);
      return;
    }

    const scale = typeIndexScale(
      (clsRef as ArrayClassData).getComponentClass()
    );
    thread.returnStackFrame(scale);
  },
  "addressSize()I": (thread: Thread, locals: any[]) => {
    thread.returnStackFrame(4);
  },
  "compareAndSwapObject(Ljava/lang/Object;JLjava/lang/Object;Ljava/lang/Object;)Z":
    (thread: Thread, locals: any[]) => {
      const unsafe = locals[0] as JvmObject;
      const obj1 = locals[1] as JvmObject;
      const offset = locals[2] as bigint;
      const expected = locals[3] as JvmObject;
      const newValue = locals[4] as JvmObject;
      // obj1: Class object w/ field reflectionData
      // offset: field slot of field reflectionData
      // expected: SoftReference object
      // newValue: SoftReference object

      thread.returnStackFrame(
        unsafeCompareAndSwap(thread, unsafe, obj1, offset, expected, newValue)
      );
    },
  "compareAndSwapInt(Ljava/lang/Object;JII)Z": (
    thread: Thread,
    locals: any[]
  ) => {
    const unsafe = locals[0] as JvmObject;
    const obj1 = locals[1] as JvmObject;
    const offset = locals[2] as bigint;
    const expected = locals[3] as number;
    const newValue = locals[4] as number;

    thread.returnStackFrame(
      unsafeCompareAndSwap(thread, unsafe, obj1, offset, expected, newValue)
    );
  },
  "compareAndSwapLong(Ljava/lang/Object;JJJ)Z": (
    thread: Thread,
    locals: any[]
  ) => {
    const unsafe = locals[0] as JvmObject;
    const obj1 = locals[1] as JvmObject;
    const offset = locals[2] as bigint;
    const expected = locals[3] as bigint;
    const newValue = locals[4] as bigint;

    thread.returnStackFrame(
      unsafeCompareAndSwap(thread, unsafe, obj1, offset, expected, newValue)
    );
  },
  "getIntVolatile(Ljava/lang/Object;J)I": getFromVMIndex,

  "getObjectVolatile(Ljava/lang/Object;J)Ljava/lang/Object;": getFromVMIndex,

  "putObjectVolatile(Ljava/lang/Object;JLjava/lang/Object;)V": setFromVMIndex,

  "allocateMemory(J)J": (thread: Thread, locals: any[]) => {
    const size = locals[1] as bigint;
    const heap = thread.getJVM().getUnsafeHeap();
    const addr = heap.allocate(size);
    thread.returnStackFrame64(addr);
  },
  "putLong(JJ)V": (thread: Thread, locals: any[]) => {
    const address = locals[1] as bigint;
    const value = locals[2] as bigint;
    const heap = thread.getJVM().getUnsafeHeap();
    const view = heap.get(address);
    view.setBigInt64(0, value);
    thread.returnStackFrame();
  },
  "getByte(J)B": (thread: Thread, locals: any[]) => {
    const address = locals[1] as bigint;
    const heap = thread.getJVM().getUnsafeHeap();
    const view = heap.get(address);
    thread.returnStackFrame(view.getInt8(0));
  },
  "freeMemory(J)V": (thread: Thread, locals: any[]) => {
    const address = locals[1] as bigint;
    const heap = thread.getJVM().getUnsafeHeap();
    heap.free(address);
    thread.returnStackFrame();
  },
  "defineAnonymousClass(Ljava/lang/Class;[B[Ljava/lang/Object;)Ljava/lang/Class;":
    (thread: Thread, locals: any[]) => {
      const unsafe = locals[0] as JvmObject;
      const hostClassObj = locals[1] as JvmObject;
      const byteArray = locals[2] as JvmArray;
      const cpPatches = locals[3] as JvmArray;

      const bytecode = new DataView(
        new Uint8Array(byteArray.getJsArray()).buffer
      );
      const classfile = parseBin(bytecode);

      // resolve classname
      const clsInfo = classfile.constantPool[
        classfile.thisClass
      ] as ConstantClassInfo;
      const clsName = classfile.constantPool[
        clsInfo.nameIndex
      ] as ConstantUtf8Info;
      const lambdaName = clsName.value;
      const hostClass = hostClassObj.getNativeField("classRef") as ClassData;

      let error: ErrorResult | null = null;
      const newClass = new ReferenceClassData(
        classfile,
        hostClass.getLoader(),
        lambdaName,
        (e) => (error = e),
        cpPatches
      );

      if (error) {
        thread.throwNewException(
          (error as ErrorResult).exceptionCls,
          (error as ErrorResult).msg
        );
        return;
      }

      const clsObj = newClass.getJavaObject();
      thread.returnStackFrame(clsObj);
    },
  // sun/misc/Unsafe.defineClass(Ljava/lang/String;[BIILjava/lang/ClassLoader;Ljava/security/ProtectionDomain;)Ljava/lang/Class;
  "defineClass(Ljava/lang/String;[BIILjava/lang/ClassLoader;Ljava/security/ProtectionDomain;)Ljava/lang/Class;":
    (thread: Thread, locals: any[]) => {
      const unsafe = locals[0] as JvmObject;
      const nameObj = locals[1] as JvmObject;
      const byteArray = locals[2] as JvmArray;
      const offset = locals[3] as number;
      const len = locals[4] as number;

      let loader = thread.getJVM().getBootstrapClassLoader();
      // load with provided loader
      if (locals[5]) {
        throw new Error("loaderObject to loader not implemnented");
      }
      const bytecode = new DataView(
        new Uint8Array(byteArray.getJsArray()).buffer
      );
      const classfile = parseBin(bytecode);
      const clsData = loader.defineClass(classfile);
      thread.returnStackFrame(clsData.getJavaObject());
    },
};

export default functions;
