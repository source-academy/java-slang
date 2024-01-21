import { MethodInfo, METHOD_FLAGS } from "../../../ClassFile/types/methods";
import { ConstantPool } from "../../constant-pool";
import { NativeStackFrame, JavaStackFrame } from "../../stackframe";
import Thread from "../../thread";
import {
  attrInfo2Interface,
  parseMethodDescriptor,
  getArgs,
} from "../../utils";
import {
  ImmediateResult,
  checkError,
  ErrorResult,
  checkSuccess,
} from "../Result";
import { JvmObject } from "../reference/Object";
import { Code, IAttribute } from "./Attributes";
import { ReferenceClassData, ArrayClassData, ClassData } from "./ClassData";
import { ConstantUtf8 } from "./Constants";

export interface MethodHandler {
  startPc: number;
  endPc: number;
  handlerPc: number;
  catchType: null | ReferenceClassData;
}

export class Method {
  private cls: ReferenceClassData;
  private code: Code | null; // native methods have no code
  private accessFlags: number;
  private name: string;
  private descriptor: string;

  private static reflectMethodClass: ReferenceClassData | null = null;
  private static reflectConstructorClass: ReferenceClassData | null = null;
  private javaObject?: JvmObject;
  private slot: number;

  constructor(
    cls: ReferenceClassData,
    accessFlags: number,
    name: string,
    descriptor: string,
    attributes: { [attributeName: string]: IAttribute[] },
    slot: number
  ) {
    this.cls = cls;
    this.code = (attributes["Code"]?.[0] as Code) ?? null;
    this.accessFlags = accessFlags;
    this.name = name;
    this.descriptor = descriptor;
    this.slot = slot;
  }

  /**
   * factory method for class loaders to create a method
   */
  static fromInfo(
    cls: ReferenceClassData,
    method: MethodInfo,
    slot: number,
    constantPool: ConstantPool
  ) {
    // get name and descriptor
    const name = (cls.getConstant(method.nameIndex) as ConstantUtf8).get();
    const descriptor = (
      cls.getConstant(method.descriptorIndex) as ConstantUtf8
    ).get();
    const accessFlags = method.accessFlags;

    // get attributes
    const attributes = attrInfo2Interface(method.attributes, constantPool);

    return new Method(cls, accessFlags, name, descriptor, attributes, slot);
  }

  /**
   * Type guard function to check if an object is a Method.
   */
  static checkMethod(obj: any): obj is Method {
    return obj.code !== undefined;
  }

  checkSignaturePolymorphic() {
    return (
      this.cls.getClassname() === "java/lang/invoke/MethodHandle" &&
      this.descriptor === "([Ljava/lang/Object;)Ljava/lang/Object;" &&
      this.checkVarargs() &&
      this.checkNative()
    );
  }

  /**
   * Gets the reflected java object for this method.
   */
  getReflectedObject(thread: Thread): ImmediateResult<JvmObject> {
    if (this.javaObject) {
      return { result: this.javaObject };
    }

    const loader = this.cls.getLoader();
    const caRes = loader.getClass("[Ljava/lang/Class;");
    if (checkError(caRes)) {
      return caRes;
    }
    const caCls = caRes.result as ArrayClassData;

    // #region create parameter class array
    const { args, ret } = parseMethodDescriptor(this.descriptor);
    const parameterTypes = caCls.instantiate();
    let error: ErrorResult | null = null;
    parameterTypes.initArray(
      args.length,
      args.map((arg) => {
        if (arg.referenceCls) {
          const res = loader.getClass(arg.referenceCls);
          if (checkError(res)) {
            error = res;
            return null;
          }
          return res.result.getJavaObject();
        }

        return loader.getPrimitiveClass(arg.type).getJavaObject();
      })
    );
    if (error !== null) {
      return error;
    }
    // #endregion

    // #region create return class
    let returnType: JvmObject;
    if (ret.referenceCls) {
      const res = loader.getClass(ret.referenceCls);
      if (checkError(res)) {
        return res;
      }
      returnType = res.result.getJavaObject();
    } else {
      returnType = loader.getPrimitiveClass(ret.type).getJavaObject();
    }
    // #endregion

    // create exception class array
    const exceptionTypes = caCls.instantiate();
    exceptionTypes.initArray(0, []);

    // modifiers
    const modifiers = this.accessFlags;

    // signature
    const signature = null;

    // annotations
    const annotations = null;

    // parameter annotations
    const parameterAnnotations = null;

    let javaObject: JvmObject;

    // #region create method object
    // constructor
    const isConstructor = this.name === "<init>";
    if (isConstructor) {
      // load constructor class
      if (!Method.reflectConstructorClass) {
        const fRes = loader.getClass("java/lang/reflect/Constructor");
        if (checkError(fRes)) {
          return fRes;
        }
        Method.reflectConstructorClass = fRes.result as ReferenceClassData;
      }

      javaObject = Method.reflectConstructorClass.instantiate();
      const initRes = javaObject.initialize(thread);
      if (!checkSuccess(initRes)) {
        if (checkError(initRes)) {
          return initRes;
        }
        throw new Error("Reflected method should not have static initializer");
      }
    } else {
      if (!Method.reflectMethodClass) {
        const fRes = thread
          .getClass()
          .getLoader()
          .getClass("java/lang/reflect/Method");
        if (checkError(fRes)) {
          return fRes;
        }
        Method.reflectMethodClass = fRes.result as ReferenceClassData;
      }

      javaObject = Method.reflectMethodClass.instantiate();
      const initRes = javaObject.initialize(thread);
      if (!checkSuccess(initRes)) {
        if (checkError(initRes)) {
          return initRes;
        }
        throw new Error("Reflected method should not have static initializer");
      }

      javaObject._putField(
        "name",
        "Ljava/lang/String;",
        "java/lang/reflect/Method",
        thread.getJVM().getInternedString(this.name)
      );

      javaObject._putField(
        "returnType",
        "Ljava/lang/Class;",
        "java/lang/reflect/Method",
        returnType
      );
      javaObject._putField(
        "annotationDefault",
        "[B",
        "java/lang/reflect/Method",
        null
      );
    }
    // #endregion

    // #region put common fields
    javaObject._putField(
      "clazz",
      "Ljava/lang/Class;",
      isConstructor
        ? "java/lang/reflect/Constructor"
        : "java/lang/reflect/Method",
      this.cls.getJavaObject()
    );
    javaObject._putField(
      "parameterTypes",
      "[Ljava/lang/Class;",
      isConstructor
        ? "java/lang/reflect/Constructor"
        : "java/lang/reflect/Method",
      parameterTypes
    );
    javaObject._putField(
      "exceptionTypes",
      "[Ljava/lang/Class;",
      isConstructor
        ? "java/lang/reflect/Constructor"
        : "java/lang/reflect/Method",
      exceptionTypes
    );
    javaObject._putField(
      "modifiers",
      "I",
      isConstructor
        ? "java/lang/reflect/Constructor"
        : "java/lang/reflect/Method",
      modifiers
    );
    javaObject._putField(
      "slot",
      "I",
      isConstructor
        ? "java/lang/reflect/Constructor"
        : "java/lang/reflect/Method",
      this.slot
    );
    javaObject._putField(
      "signature",
      "Ljava/lang/String;",
      isConstructor
        ? "java/lang/reflect/Constructor"
        : "java/lang/reflect/Method",
      signature
    );
    javaObject._putField(
      "annotations",
      "[B",
      isConstructor
        ? "java/lang/reflect/Constructor"
        : "java/lang/reflect/Method",
      annotations
    );
    javaObject._putField(
      "parameterAnnotations",
      "[B",
      isConstructor
        ? "java/lang/reflect/Constructor"
        : "java/lang/reflect/Method",
      parameterAnnotations
    );
    // #endregion

    javaObject.putNativeField("methodRef", this);

    this.javaObject = javaObject;
    return { result: javaObject };
  }

  getName() {
    return this.name;
  }

  getDescriptor() {
    return this.descriptor;
  }

  /**
   * Gets the slot number of this method in the class.
   * Slot numbers can be used find a method given a class.
   */
  getSlot() {
    return this.slot;
  }

  getClass() {
    return this.cls;
  }

  getMaxStack() {
    return this.code ? this.code.maxStack : 0;
  }

  getExceptionHandlers() {
    if (!this.code) {
      return [];
    }
    return this.code.exceptionTable;
  }

  getAccessFlags() {
    return this.accessFlags;
  }

  /**
   * Pops and returns the arguments of this method from the stack.
   * Wide primitives occupy 2 indexes for non native methods.
   */
  getArgs(thread: Thread): any[] {
    return getArgs(thread, this.descriptor, this.checkNative());
  }

  getBridgeMethod() {
    return (thread: Thread, returnOffset: number) => {
      let sf;

      const args = this.getArgs(thread);
      let locals;

      // push object for non static invokes
      if (!this.checkStatic()) {
        const obj = thread.popStack();
        if (obj === null) {
          thread.throwNewException("java/lang/NullPointerException", "");
          return;
        }
        locals = [obj, ...args];
      } else {
        locals = args;
      }

      if (this.checkNative()) {
        sf = new NativeStackFrame(
          this.cls,
          this,
          0,
          locals,
          returnOffset,
          thread.getJVM().getJNI()
        );
      } else {
        sf = new JavaStackFrame(this.cls, this, 0, locals, returnOffset);
      }
      thread.invokeStackFrame(sf);
    };
  }

  /**
   * flags
   */
  checkPublic() {
    return (this.accessFlags & METHOD_FLAGS.ACC_PUBLIC) !== 0;
  }

  checkPrivate() {
    return (this.accessFlags & METHOD_FLAGS.ACC_PRIVATE) !== 0;
  }

  checkProtected() {
    return (this.accessFlags & METHOD_FLAGS.ACC_PROTECTED) !== 0;
  }

  checkDefault() {
    return (
      !this.checkPublic() && !this.checkPrivate() && !this.checkProtected()
    );
  }

  checkStatic() {
    return (this.accessFlags & METHOD_FLAGS.ACC_STATIC) !== 0;
  }

  checkFinal() {
    return (this.accessFlags & METHOD_FLAGS.ACC_FINAL) !== 0;
  }

  checkSynchronized() {
    return (this.accessFlags & METHOD_FLAGS.ACC_SYNCHRONIZED) !== 0;
  }

  checkBridge() {
    return (this.accessFlags & METHOD_FLAGS.ACC_BRIDGE) !== 0;
  }

  checkVarargs() {
    return (this.accessFlags & METHOD_FLAGS.ACC_VARARGS) !== 0;
  }

  checkNative() {
    return (this.accessFlags & METHOD_FLAGS.ACC_NATIVE) !== 0;
  }

  checkAbstract() {
    return (this.accessFlags & METHOD_FLAGS.ACC_ABSTRACT) !== 0;
  }

  checkStrict() {
    return (this.accessFlags & METHOD_FLAGS.ACC_STRICT) !== 0;
  }

  checkSynthetic() {
    return (this.accessFlags & METHOD_FLAGS.ACC_SYNTHETIC) !== 0;
  }

  /**
   * Checks if this method is accessible to a given class through a symbolic reference.
   */
  checkAccess(accessingClass: ClassData, symbolicClass: ClassData) {
    const declaringCls = this.getClass();

    // this is public
    if (this.checkPublic()) {
      return true;
    }

    const isSamePackage =
      declaringCls.getPackageName() === accessingClass.getPackageName();

    if (this.checkDefault()) {
      return isSamePackage;
    }

    if (this.checkProtected()) {
      if (isSamePackage) {
        return true;
      }

      // this is protected and is declared in a class C, and D is either a subclass of C or C itself
      if (!accessingClass.checkCast(declaringCls)) {
        return false;
      }

      // if this is not static, then the symbolic reference to this must contain a symbolic reference to a class T,
      // such that T is either a subclass of D, a superclass of D, or D itself.
      return (
        this.checkStatic() ||
        declaringCls.checkCast(symbolicClass) ||
        symbolicClass.checkCast(declaringCls)
      );
    }

    // R is private
    // FIXME: test inner class
    return accessingClass === declaringCls;
  }

  _getCode() {
    return this.code;
  }
}
