import { CodeAttribute, AttributeInfo } from "../../../ClassFile/types/attributes";
import { MethodInfo, METHOD_FLAGS } from "../../../ClassFile/types/methods";
import Thread from "../../thread";
import { parseMethodDescriptor } from "../../utils";
import { JvmObject } from "../reference/Object";
import { ImmediateResult, checkError, ErrorResult, checkSuccess } from "../Result";
import { ArrayClassData } from "./ArrayClassData";
import { ClassData } from "./ClassData";
import { ConstantUtf8 } from "./Constants";


export interface MethodHandler {
  startPc: number;
  endPc: number;
  handlerPc: number;
  catchType: null | ClassData;
}

export class Method {
  private cls: ClassData;
  private code: CodeAttribute | null; // native methods have no code
  private accessFlags: number;
  private name: string;
  private descriptor: string;
  private attributes: Array<AttributeInfo>;
  private exceptionHandlers: MethodHandler[];

  private static reflectMethodClass: ClassData | null = null;
  private static reflectConstructorClass: ClassData | null = null;
  private javaObject?: JvmObject;
  private slot: number;

  constructor(
    cls: ClassData,
    code: CodeAttribute | null,
    accessFlags: number,
    name: string,
    descriptor: string,
    attributes: Array<AttributeInfo>,
    exceptionHandlers: {
      startPc: number;
      endPc: number;
      handlerPc: number;
      catchType: null | ClassData;
    }[],
    slot: number
  ) {
    this.cls = cls;
    this.code = code;
    this.accessFlags = accessFlags;
    this.name = name;
    this.descriptor = descriptor;
    this.attributes = attributes;
    this.exceptionHandlers = exceptionHandlers;
    this.slot = slot;
  }

  /**
   * factory method for class loaders to create a method
   */
  static fromLinkedInfo(
    cls: ClassData,
    method: MethodInfo,
    exceptionHandlers: MethodHandler[],
    code: CodeAttribute | null,
    slot: number
  ) {
    // get name and descriptor
    const name = (cls.getConstant(method.nameIndex) as ConstantUtf8).get();
    const descriptor = (
      cls.getConstant(method.descriptorIndex) as ConstantUtf8
    ).get();

    const accessFlags = method.accessFlags;
    const attributes = method.attributes;

    return new Method(
      cls,
      code,
      accessFlags,
      name,
      descriptor,
      attributes,
      exceptionHandlers,
      slot
    );
  }

  /**
   * Type guard function to check if an object is a Method.
   */
  static checkMethod(obj: any): obj is Method {
    return obj.code !== undefined;
  }

  /**
   * Gets the reflected java object for this method.
   */
  getReflectedObject(thread: Thread): ImmediateResult<JvmObject> {
    if (this.javaObject) {
      return { result: this.javaObject };
    }

    const loader = this.cls.getLoader();
    const caRes = loader.getClassRef('[Ljava/lang/Class;');
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
      args.map(arg => {
        if (arg.referenceCls) {
          const res = loader.getClassRef(arg.referenceCls);
          if (checkError(res)) {
            error = res;
            return null;
          }
          return res.result.getJavaObject();
        }

        return loader.getPrimitiveClassRef(arg.type).getJavaObject();
      })
    );
    if (error !== null) {
      return error;
    }
    // #endregion

    // #region create return class
    let returnType: JvmObject;
    if (ret.referenceCls) {
      const res = loader.getClassRef(ret.referenceCls);
      if (checkError(res)) {
        return res;
      }
      returnType = res.result.getJavaObject();
    } else {
      returnType = loader.getPrimitiveClassRef(ret.type).getJavaObject();
    }
    // #endregion

    // create exception class array
    const exceptionTypes = caCls.instantiate();
    exceptionTypes.initArray(0, []);
    console.error('reflected method exception array not initialized');

    // modifiers
    const modifiers = this.accessFlags;

    // signature
    const signature = null;
    console.error('reflected method signature not initialized');

    // annotations
    const annotations = null;
    console.error('reflected method annotations not initialized');

    // parameter annotations
    const parameterAnnotations = null;
    console.error('reflected method parameter annotations not initialized');

    let javaObject: JvmObject;

    // #region create method object
    // constructor
    const isConstructor = this.name === '<init>';
    if (isConstructor) {
      // load constructor class
      if (!Method.reflectConstructorClass) {
        const fRes = loader.getClassRef('java/lang/reflect/Constructor');
        if (checkError(fRes)) {
          return fRes;
        }
        Method.reflectConstructorClass = fRes.result;
      }

      javaObject = Method.reflectConstructorClass.instantiate();
      const initRes = javaObject.initialize(thread);
      if (!checkSuccess(initRes)) {
        if (checkError(initRes)) {
          return initRes;
        }
        throw new Error('Reflected method should not have static initializer');
      }
    } else {
      if (!Method.reflectMethodClass) {
        const fRes = thread
          .getClass()
          .getLoader()
          .getClassRef('java/lang/reflect/Method');
        if (checkError(fRes)) {
          return fRes;
        }
        Method.reflectMethodClass = fRes.result;
      }

      javaObject = Method.reflectMethodClass.instantiate();
      const initRes = javaObject.initialize(thread);
      if (!checkSuccess(initRes)) {
        if (checkError(initRes)) {
          return initRes;
        }
        throw new Error('Reflected method should not have static initializer');
      }

      javaObject._putField(
        'name',
        'Ljava/lang/String;',
        'java/lang/reflect/Method',
        thread.getJVM().getInternedString(this.name)
      );

      javaObject._putField(
        'returnType',
        'Ljava/lang/Class;',
        'java/lang/reflect/Method',
        returnType
      );

      console.error('reflected method annotationDefault not initialized');
      javaObject._putField(
        'annotationDefault',
        'Ljava/lang/annotation/Annotation;',
        'java/lang/reflect/Method',
        null
      );
    }
    // #endregion

    // #region put common fields
    javaObject._putField(
      'clazz',
      'Ljava/lang/Class;',
      isConstructor
        ? 'java/lang/reflect/Constructor'
        : 'java/lang/reflect/Method',
      this.cls.getJavaObject()
    );
    javaObject._putField(
      'parameterTypes',
      '[Ljava/lang/Class;',
      isConstructor
        ? 'java/lang/reflect/Constructor'
        : 'java/lang/reflect/Method',
      parameterTypes
    );
    javaObject._putField(
      'exceptionTypes',
      '[Ljava/lang/Class;',
      isConstructor
        ? 'java/lang/reflect/Constructor'
        : 'java/lang/reflect/Method',
      exceptionTypes
    );
    javaObject._putField(
      'modifiers',
      'I',
      isConstructor
        ? 'java/lang/reflect/Constructor'
        : 'java/lang/reflect/Method',
      modifiers
    );
    javaObject._putField(
      'slot',
      'I',
      isConstructor
        ? 'java/lang/reflect/Constructor'
        : 'java/lang/reflect/Method',
      this.slot
    );
    javaObject._putField(
      'signature',
      'Ljava/lang/String;',
      isConstructor
        ? 'java/lang/reflect/Constructor'
        : 'java/lang/reflect/Method',
      signature
    );
    javaObject._putField(
      'annotations',
      '[B',
      isConstructor
        ? 'java/lang/reflect/Constructor'
        : 'java/lang/reflect/Method',
      annotations
    );
    javaObject._putField(
      'parameterAnnotations',
      '[B',
      isConstructor
        ? 'java/lang/reflect/Constructor'
        : 'java/lang/reflect/Method',
      parameterAnnotations
    );
    // #endregion

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
    if (this.exceptionHandlers === undefined) {
      throw new Error('Class not initialized');
    }
    return this.exceptionHandlers;
  }

  getAttributes() {
    return this.attributes;
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
    // nestmate test se17 5.4.4. for inner classes
    return (
      accessingClass === declaringCls ||
      declaringCls.getNestedHost() === accessingClass.getNestedHost()
    );
  }

  _getCode() {
    return this.code;
  }
}
