import BootstrapClassLoader from "./ClassLoader/BootstrapClassLoader";
import { JNI } from "./jni";
import { ClassData } from "./types/class/ClassData";
import { Field } from "./types/class/Field";
import { JvmArray } from "./types/reference/Array";
import { JvmObject } from "./types/reference/Object";
import { UnsafeHeap } from "./unsafe-heap";
import AbstractSystem from "./utils/AbstractSystem";
import { checkError, checkSuccess, ImmediateResult } from "./utils/Result";

export default class JVM {
  private bootstrapClassLoader: BootstrapClassLoader;
  private nativeSystem: AbstractSystem;
  private jni: JNI;

  cachedClasses: { [key: string]: ClassData } = {};
  private internedStrings: { [key: string]: JvmObject } = {};
  private unsafeHeap: UnsafeHeap = new UnsafeHeap();

  private jvmOptions: {
    javaClassPath: string;
    userDir: string;
  };

  constructor(
    nativeSystem: AbstractSystem,
    options?: {
      javaClassPath?: string;
      userDir?: string;
    }
  ) {
    this.jvmOptions = {
      javaClassPath: 'natives',
      userDir: 'example',
      ...options,
    };

    this.nativeSystem = nativeSystem;
    this.bootstrapClassLoader = new BootstrapClassLoader(
      this.nativeSystem,
      this.jvmOptions.javaClassPath
    );
    this.jni = new JNI();
  }

  initialize() {
    throw new Error("Not implemented")
  }

  runClass(className: string) {
    throw new Error("Not implemented")
  }

  private newCharArr(str: string): ImmediateResult<JvmArray> {
    const cArrRes = this.bootstrapClassLoader.getClassRef('[C');
    if (checkError(cArrRes)) {
      return cArrRes;
    }

    const cArrCls = cArrRes.result;
    const cArr = cArrCls.instantiate() as JvmArray;
    const jsArr = [];
    for (let i = 0; i < str.length; i++) {
      jsArr.push(str.charCodeAt(i));
    }
    cArr.initArray(str.length, jsArr);
    return { result: cArr };
  }

  private newString(str: string): ImmediateResult<JvmObject> {
    const charArr = this.newCharArr(str);

    if (!checkSuccess(charArr)) {
      return charArr;
    }

    const strRes = this.bootstrapClassLoader.getClassRef('java/lang/String');

    if (checkError(strRes)) {
      return strRes;
    }
    const strCls = strRes.result;
    const strObj = strCls.instantiate();
    const fieldRef = strCls.getFieldRef('value[C') as Field;
    strObj.putField(fieldRef as Field, charArr.result);
    return { result: strObj };
  }

  getInternedString(str: string) {
    if (this.internedStrings[str]) {
      return this.internedStrings[str];
    }
    const strRes = this.newString(str);
    if (checkError(strRes)) {
      throw new Error('String creation failed');
    }

    this.internedStrings[str] = strRes.result;
    return this.internedStrings[str];
  }

  getBootstrapClassLoader() {
    return this.bootstrapClassLoader;
  }

  getUnsafeHeap() {
    return this.unsafeHeap;
  }

  getSystem() {
    return this.nativeSystem;
  }

  getJNI() {
    return this.jni;
  }
}
