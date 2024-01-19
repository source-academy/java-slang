import { CONSTANT_TAG } from "../../../ClassFile/constants/constants";
import { OPCODE } from "../../../ClassFile/constants/instructions";
import { ClassFile } from "../../../ClassFile/types";
import { CodeAttribute } from "../../../ClassFile/types/attributes";
import { METHOD_FLAGS } from "../../../ClassFile/types/methods";
import AbstractClassLoader from "../../ClassLoader/AbstractClassLoader";
import { MethodHandleReferenceKind } from "../../constants";
import { InternalStackFrame } from "../../stackframe";
import Thread from "../../thread";
import {
  parseMethodDescriptor,
  js2jString,
  parseFieldDescriptor,
} from "../../utils";
import {
  Result,
  checkError,
  checkSuccess,
  ErrorResult,
  ImmediateResult,
  checkDefer,
  SuccessResult,
} from "../Result";
import { JvmArray } from "../reference/Array";
import { JvmObject, JavaType } from "../reference/Object";
import { BootstrapMethod } from "./Attributes";
import { ClassData, ReferenceClassData, ArrayClassData } from "./ClassData";
import { Field } from "./Field";
import { Method } from "./Method";
import * as info from "../../../ClassFile/types/constants";

export abstract class Constant {
  private tag: CONSTANT_TAG;
  protected cls: ClassData;
  protected isResolved: boolean = true;

  constructor(tag: CONSTANT_TAG, cls: ClassData) {
    this.cls = cls;
    this.tag = tag;
  }

  public resolve(
    thread?: Thread,
    loader?: AbstractClassLoader,
    ...args: any[]
  ): Result<any> {
    return { result: this.get() };
  }

  public abstract get(): any;

  public getTag(): CONSTANT_TAG {
    return this.tag;
  }
}

// #region static values

export class ConstantInteger extends Constant {
  private value: number;

  constructor(cls: ClassData, value: number) {
    super(CONSTANT_TAG.Integer, cls);
    this.value = value;
  }

  static check(c: Constant): c is ConstantInteger {
    return c.getTag() === CONSTANT_TAG.Integer;
  }

  public get(): number {
    return this.value;
  }
}

export class ConstantFloat extends Constant {
  private value: number;

  constructor(cls: ClassData, value: number) {
    super(CONSTANT_TAG.Float, cls);
    this.value = value;
  }

  static check(c: Constant): c is ConstantFloat {
    return c.getTag() === CONSTANT_TAG.Float;
  }

  public get(): number {
    return this.value;
  }

  static fromInfo(
    cls: ClassData,
    constant: info.ConstantFloatInfo
  ): ConstantFloat {
    return new ConstantFloat(cls, constant.value);
  }
}

export class ConstantLong extends Constant {
  private value: bigint;

  constructor(cls: ClassData, value: bigint) {
    super(CONSTANT_TAG.Long, cls);
    this.value = value;
  }

  static check(c: Constant): c is ConstantLong {
    return c.getTag() === CONSTANT_TAG.Long;
  }

  public get(): bigint {
    return this.value;
  }

  static fromInfo(
    cls: ClassData,
    constant: info.ConstantLongInfo
  ): ConstantLong {
    return new ConstantLong(cls, constant.value);
  }
}

export class ConstantDouble extends Constant {
  private value: number;

  constructor(cls: ClassData, value: number) {
    super(CONSTANT_TAG.Double, cls);
    this.value = value;
  }

  static check(c: Constant): c is ConstantDouble {
    return c.getTag() === CONSTANT_TAG.Double;
  }

  public get(): number {
    return this.value;
  }

  static fromInfo(
    cls: ClassData,
    constant: info.ConstantDoubleInfo
  ): ConstantDouble {
    return new ConstantDouble(cls, constant.value);
  }
}

export class ConstantUtf8 extends Constant {
  private value: string;

  constructor(cls: ClassData, value: string) {
    super(CONSTANT_TAG.Utf8, cls);
    this.value = value;
  }

  static check(c: Constant): c is ConstantUtf8 {
    return c.getTag() === CONSTANT_TAG.Utf8;
  }

  public get(): string {
    return this.value;
  }

  static fromInfo(
    cls: ClassData,
    constant: info.ConstantUtf8Info
  ): ConstantUtf8 {
    return new ConstantUtf8(cls, constant.value);
  }
}
// #endregion

function createMethodType(
  thread: Thread,
  loader: AbstractClassLoader,
  descriptor: string,
  cb: (mt: JvmObject) => void
): Result<JvmObject> {
  const mhnRes = loader.getClass("java/lang/invoke/MethodHandleNatives");
  if (checkError(mhnRes)) {
    return mhnRes;
  }

  const mhnCls = mhnRes.result;
  const result = mhnCls.initialize(thread);
  if (!checkSuccess(result)) {
    if (checkError(result)) {
      return result;
    }
    return { isDefer: true };
  }

  // #region create Class object array
  const classes = parseMethodDescriptor(descriptor);
  const classArray: JvmObject[] = [];
  let error: ErrorResult | null = null;
  const resolver = ({
    type,
    referenceCls,
  }: {
    type: string;
    referenceCls: string | undefined;
  }) => {
    // primitive
    if (!referenceCls) {
      const pClsRes = loader.getPrimitiveClass(type);
      classArray.push(pClsRes.getJavaObject());
      return;
    }

    const clsRes = loader.getClass(referenceCls);
    if (!checkSuccess(clsRes)) {
      if (!error) {
        error = clsRes;
      }
      return;
    }
    classArray.push(clsRes.result.getJavaObject());
  };
  classes.args.forEach(resolver);
  resolver(classes.ret);
  if (error) {
    return error;
  }

  const clArrRes = loader.getClass("[Ljava/lang/Class;");
  if (checkError(clArrRes)) {
    if (!error) {
      return clArrRes;
    }
    return error;
  }
  const paramClsArr = clArrRes.result.instantiate() as JvmArray;
  const retCls = classArray.pop();
  paramClsArr.initialize(thread, classArray.length, classArray);
  // #endregion

  // #region create MethodType object
  const toInvoke = mhnCls.getMethod(
    "findMethodHandleType(Ljava/lang/Class;[Ljava/lang/Class;)Ljava/lang/invoke/MethodType;"
  );
  if (!toInvoke) {
    return { exceptionCls: "java/lang/NoSuchMethodError", msg: "" };
  }
  thread.invokeStackFrame(
    new InternalStackFrame(
      mhnCls as ReferenceClassData,
      toInvoke,
      0,
      [retCls, paramClsArr],
      cb
    )
  );
  // #endregion

  return { isDefer: true };
}

// #region utf8 dependency

export class ConstantString extends Constant {
  private str: ConstantUtf8;
  private result?: Result<JvmObject>;

  constructor(cls: ClassData, str: ConstantUtf8) {
    super(CONSTANT_TAG.String, cls);
    this.str = str;
    this.isResolved = false;
  }

  static check(c: Constant): c is ConstantString {
    return c.getTag() === CONSTANT_TAG.String;
  }

  public resolve(
    thread: Thread,
    loader: AbstractClassLoader
  ): Result<JvmObject> {
    if (this.result) {
      return this.result;
    }

    const strVal = this.str.get();
    this.result = { result: js2jString(loader, strVal) };
    return this.result;
  }

  public get() {
    if (!this.result || !checkSuccess(this.result)) {
      throw new Error("Resolution incomplete or failed");
    }

    return this.result.result;
  }
}

export class ConstantNameAndType extends Constant {
  private name: ConstantUtf8;
  private descriptor: ConstantUtf8;

  constructor(cls: ClassData, name: ConstantUtf8, descriptor: ConstantUtf8) {
    super(CONSTANT_TAG.NameAndType, cls);
    this.name = name;
    this.descriptor = descriptor;
  }

  static check(c: Constant): c is ConstantNameAndType {
    return c.getTag() === CONSTANT_TAG.NameAndType;
  }

  public get(): { name: string; descriptor: string } {
    return { name: this.name.get(), descriptor: this.descriptor.get() };
  }
}

export class ConstantMethodType extends Constant {
  private descriptor: ConstantUtf8;
  private result?: Result<JvmObject>;

  constructor(cls: ClassData, descriptor: ConstantUtf8) {
    super(CONSTANT_TAG.MethodType, cls);
    this.descriptor = descriptor;
    this.isResolved = false;
  }

  static check(c: Constant): c is ConstantMethodType {
    return c.getTag() === CONSTANT_TAG.MethodType;
  }

  public get(): JvmObject {
    if (this.result && checkSuccess(this.result)) {
      return this.result.result;
    }
    throw new Error("Resolution incomplete or failed");
  }

  public resolve(thread: Thread): Result<JvmObject> {
    if (this.result) {
      return this.result;
    }
    const descriptor = this.descriptor.get();
    const loader = this.cls.getLoader();
    return createMethodType(thread, loader, descriptor, (mt) => {
      this.result = { result: mt };
    });
  }

  getDescriptor() {
    return this.descriptor.get();
  }
}

export class ConstantClass extends Constant {
  private className: ConstantUtf8;
  private result?: ImmediateResult<ClassData>;

  constructor(cls: ClassData, className: ConstantUtf8) {
    super(CONSTANT_TAG.Class, cls);
    this.className = className;
  }

  static check(c: Constant): c is ConstantClass {
    return c.getTag() === CONSTANT_TAG.Class;
  }

  public resolve(): ImmediateResult<ClassData> {
    // resolved before
    if (this.result) {
      return this.result;
    }

    this.result = this.cls.resolveClass(this.className.get());

    return this.result;
  }

  public get() {
    if (!this.result) {
      this.resolve();
    }

    if (!this.result || !checkSuccess(this.result)) {
      throw new Error("Resolution incomplete or failed");
    }

    return this.result.result;
  }
}

// #endregion

// #region name and type dependency
export class ConstantInvokeDynamic extends Constant {
  private bootstrapMethodAttrIndex: number;
  private nameAndType: ConstantNameAndType;
  private methodTypeObj?: JvmObject;
  private methodName?: JvmObject;
  private result?: Result<JvmObject>;

  constructor(
    cls: ClassData,
    bootstrapMethodAttrIndex: number,
    nameAndType: ConstantNameAndType
  ) {
    super(CONSTANT_TAG.MethodType, cls);
    this.bootstrapMethodAttrIndex = bootstrapMethodAttrIndex;
    this.nameAndType = nameAndType;
    this.isResolved = false;
  }

  static check(c: Constant): c is ConstantMethodType {
    return c.getTag() === CONSTANT_TAG.InvokeDynamic;
  }

  public get(): JvmObject {
    throw new Error("ConstantInvokeDynamic: get Method not implemented.");
  }

  public constructCso(thread: Thread) {}

  public resolve(thread: Thread): Result<JvmObject> {
    if (this.result) {
      return this.result;
    }

    // Get MethodType from NameAndType
    if (!this.methodTypeObj) {
      // resolve nameAndType
      const nameAndTypeRes = this.nameAndType.get();
      this.methodName = thread.getJVM().getInternedString(nameAndTypeRes.name);

      createMethodType(
        thread,
        this.cls.getLoader(),
        nameAndTypeRes.descriptor,
        (mt) => {
          this.methodTypeObj = mt;
        }
      );

      return { isDefer: true };
    }
    const loader = this.cls.getLoader();

    // #region bootstrap method
    const bootstrapMethod = (this.cls as ReferenceClassData).getBootstrapMethod(
      this.bootstrapMethodAttrIndex
    ) as BootstrapMethod;

    // resolve bootstrap method handle
    const bootstrapMhConst = bootstrapMethod.bootstrapMethodRef;
    const mhRes = bootstrapMhConst.resolve(thread);
    if (!checkSuccess(mhRes)) {
      if (checkError(mhRes)) {
        this.result = mhRes;
      }
      return mhRes;
    }
    const bootstrapMhn = bootstrapMhConst.get();

    // resolve args
    const bootstrapArgs = bootstrapMethod.bootstrapArguments;
    const resolvedArgs = [];
    let shouldDefer = false;
    for (const constant of bootstrapArgs) {
      const constRes = constant.resolve(thread, loader);
      if (checkDefer(constRes)) {
        shouldDefer = true;
      }
      if (checkError(constRes)) {
        this.result = constRes;
        return constRes;
      }
      if (checkSuccess(constRes)) {
        resolvedArgs.push(constRes.result);
      }
    }
    if (shouldDefer) {
      return { isDefer: true };
    }
    // #endregion

    // #region get arguments
    const objArrRes = loader.getClass("[Ljava/lang/Object;");
    if (checkError(objArrRes)) {
      return { exceptionCls: "java/lang/ClassNotFoundException", msg: "" };
    }
    const arrCls = objArrRes.result as ArrayClassData;
    const argsArr = arrCls.instantiate();
    argsArr.initArray(bootstrapArgs.length, resolvedArgs);

    const appendixArr = arrCls.instantiate();
    appendixArr.initArray(1);
    // #endregion

    // #region run bootstrap method
    console.log("RUNNING LINK CALL SITE");

    const mhnRes = loader.getClass("java/lang/invoke/MethodHandleNatives");
    if (checkError(mhnRes)) {
      return { exceptionCls: "java/lang/ClassNotFoundException", msg: "" };
    }
    const mhn = mhnRes.result as ClassData;
    const mhnInitRes = mhn.initialize(thread);
    if (!checkSuccess(mhnInitRes)) {
      return mhnInitRes;
    }

    const linkCssMethod = mhn.getMethod(
      "linkCallSite(Ljava/lang/Object;Ljava/lang/Object;Ljava/lang/Object;Ljava/lang/Object;Ljava/lang/Object;[Ljava/lang/Object;)Ljava/lang/invoke/MemberName;"
    );
    if (!linkCssMethod) {
      this.result = { exceptionCls: "java/lang/NoSuchMethodError", msg: "" };
      return this.result;
    }

    /**
     *   * Do what all OpenJDK-based JVMs do: Call
     * MethodHandleNatives.linkCallSite with:
     * - The class w/ the invokedynamic instruction `this.cls.getJavaObject()`
     * - The bootstrap method `bootstrapMhn`
     * - The name string from the nameAndTypeInfo `methodNameStr`
     * - The methodType object from the nameAndTypeInfo `methodType`
     * - The static arguments from the bootstrap method. `argsArr`
     * - A 1-length appendix box. `appendixArr`
     *
     * On finish:
     * returns a MemberName object, which contains:
     * - The class containing the invokedynamic instruction
     * - method to be run
     */
    this.cls.getJavaObject(),
      thread.invokeStackFrame(
        new InternalStackFrame(
          mhn,
          linkCssMethod,
          0,
          [
            this.cls.getJavaObject(),
            bootstrapMhn,
            this.methodName,
            this.methodTypeObj,
            argsArr,
            appendixArr,
          ],
          (css) => {
            console.log("LINK CSS FINISH. ", css);
            this.result = { result: css };
          }
        )
      );
    return { isDefer: true };
    // #endregion
  }

  public tempResolve(thread: Thread): Result<JvmObject> {
    const nameAndTypeRes = this.nameAndType.get();

    if (!this.cls.checkReference()) {
      throw new Error("Indy resolution only on reference classes");
    }

    const bootstrapMethod = this.cls.getBootstrapMethod(
      this.bootstrapMethodAttrIndex
    );
    if (!bootstrapMethod) {
      throw new Error("Bootstrap method not found");
    }

    console.log("BOOTSTRAP METHOD: ", bootstrapMethod);
    const bootstrapMhConst = bootstrapMethod.bootstrapMethodRef;
    const constref = bootstrapMhConst.tempGetReference();
    const refres = constref.resolve(thread);
    if (!checkSuccess<Field | Method>(refres)) {
      if (checkError(refres)) {
        return refres;
      }
      return { isDefer: true };
    }
    const res = refres.result;

    const bsArgIdx = bootstrapMethod.bootstrapArguments;
    const argConst = bsArgIdx[0] as ConstantMethodType;
    const mhConst = bsArgIdx[1] as ConstantMethodHandle;
    const invokeRes = mhConst.tempGetReference().resolve(thread);
    if (!checkSuccess<Field | Method>(invokeRes)) {
      if (checkError(invokeRes)) {
        return invokeRes;
      }
      return { isDefer: true };
    }
    const { ret } = parseMethodDescriptor(nameAndTypeRes.descriptor);

    const clsName = ret.referenceCls;
    if (!clsName) {
      throw new Error("Only lambdas are supported at the moment");
    }
    const loader = this.cls.getLoader();
    const clsRes = loader.getClass(clsName);
    const objRes = loader.getClass("java/lang/Object");
    if (checkError(clsRes) || checkError(objRes)) {
      return (checkError(clsRes) ? clsRes : objRes) as ErrorResult;
    }

    const thisClsName = this.cls.getClassname();
    const intercls = clsRes.result;
    const erasedDesc = argConst.getDescriptor();
    const methodName = nameAndTypeRes.name;
    const toInvoke = invokeRes.result as Method;
    const invokerName = toInvoke.getName();
    const invokerDesc = toInvoke.getDescriptor();
    const parsedDesc = parseMethodDescriptor(invokerDesc);
    const methodArgs = parsedDesc.args;
    const methodRet = parsedDesc.ret;

    // #region Create code
    // load(1) * n -> invoke(3) -> return(1)
    const codeSize = 3 + methodArgs.length * 2 + 1;
    const code = new DataView(new ArrayBuffer(codeSize));
    let maxStack = methodArgs.length;
    let invokeIndex = -1;
    let ptr = 0;
    // load params
    methodArgs.forEach((arg, index) => {
      switch (arg.type) {
        case JavaType.char:
        case JavaType.byte:
        case JavaType.int:
        case JavaType.boolean:
        case JavaType.short:
          code.setUint8(ptr, OPCODE.ILOAD);
          code.setUint8(ptr + 1, index + 1);
          break;
        case JavaType.double:
          maxStack += 1;
          code.setUint8(ptr, OPCODE.DLOAD);
          code.setUint8(ptr + 1, index + 1);
          break;
        case JavaType.float:
          code.setUint8(ptr, OPCODE.FLOAD);
          code.setUint8(ptr + 1, index + 1);
          break;
        case JavaType.long:
          maxStack += 1;
          code.setUint8(ptr, OPCODE.LLOAD);
          code.setUint8(ptr + 1, index + 1);
          break;
        case JavaType.reference:
          code.setUint8(ptr, OPCODE.ALOAD);
          code.setUint8(ptr + 1, index + 1);
          break;
        case JavaType.array:
          code.setUint8(ptr, OPCODE.ALOAD);
          code.setUint8(ptr + 1, index + 1);
          break;
        case JavaType.void:
          throw new Error("Void type in params");
      }
      ptr += 2;
    });
    // invoke lambda
    code.setUint8(ptr, OPCODE.INVOKESTATIC);
    invokeIndex = ptr + 1;
    code.setUint16(ptr + 1, -1); // We fix this index later
    ptr += 3;
    // return value
    let retStack = 1;
    switch (methodRet.type) {
      case JavaType.char:
      case JavaType.byte:
      case JavaType.int:
      case JavaType.boolean:
      case JavaType.short:
        code.setUint8(ptr, OPCODE.IRETURN);
        break;
      case JavaType.double:
        retStack += 1;
        code.setUint8(ptr, OPCODE.DRETURN);
        break;
      case JavaType.float:
        code.setUint8(ptr, OPCODE.FRETURN);
        break;
      case JavaType.long:
        retStack += 1;
        code.setUint8(ptr, OPCODE.LRETURN);
        break;
      case JavaType.reference:
        code.setUint8(ptr, OPCODE.ARETURN);
        break;
      case JavaType.array:
        code.setUint8(ptr, OPCODE.ARETURN);
        break;
      case JavaType.void:
        retStack = 0;
        code.setUint8(ptr, OPCODE.RETURN);
    }
    // empty args still requries stack for return
    maxStack = Math.max(maxStack, retStack);
    // #endregion

    let methodRefIndex = -1;
    const constantPool: info.ConstantInfo[] = [];
    constantPool.push({
      tag: CONSTANT_TAG.Utf8,
      length: 0,
      value: "",
    } as info.ConstantUtf8Info);
    constantPool.push({
      tag: CONSTANT_TAG.Class,
      nameIndex: 2,
    } as info.ConstantClassInfo);
    constantPool.push({
      tag: CONSTANT_TAG.Utf8,
      length: thisClsName.length,
      value: thisClsName,
    } as info.ConstantUtf8Info);
    constantPool.push({
      tag: CONSTANT_TAG.Utf8,
      length: 4,
      value: "Code",
    } as info.ConstantUtf8Info);
    constantPool.push({
      tag: CONSTANT_TAG.Class,
      nameIndex: 5,
    } as info.ConstantClassInfo);
    constantPool.push({
      tag: CONSTANT_TAG.Utf8,
      length: 16,
      value: "java/lang/Object",
    } as info.ConstantUtf8Info);
    constantPool.push({
      tag: CONSTANT_TAG.Class,
      nameIndex: 7,
    } as info.ConstantClassInfo);
    constantPool.push({
      tag: CONSTANT_TAG.Utf8,
      length: clsName.length,
      value: clsName,
    } as info.ConstantUtf8Info);
    constantPool.push({
      tag: CONSTANT_TAG.Utf8,
      value: invokerDesc,
      length: invokerDesc.length,
    });
    constantPool.push({
      tag: CONSTANT_TAG.Utf8,
      value: invokerName,
      length: invokerName.length,
    });
    constantPool.push({
      tag: CONSTANT_TAG.NameAndType,
      nameIndex: 9,
      descriptorIndex: 8,
    });
    constantPool.push({
      tag: CONSTANT_TAG.Methodref,
      classIndex: 1,
      nameAndTypeIndex: 10,
    });

    const clsFile: ClassFile = {
      magic: 0xcafebabe,
      minorVersion: 0,
      majorVersion: 0,
      constantPoolCount: constantPool.length,
      constantPool: constantPool,
      accessFlags: 0,
      thisClass: 1,
      superClass: 4,
      interfacesCount: 0,
      interfaces: [6],
      fieldsCount: 0,
      fields: [],
      methodsCount: 0,
      methods: [
        {
          accessFlags: METHOD_FLAGS.ACC_PUBLIC,
          nameIndex: 9,
          descriptorIndex: 8,
          attributesCount: 0,
          attributes: [
            {
              attributeLength: 999,
              attributeNameIndex: 3,
              info: code.buffer,
              maxStack,
              maxLocals: methodArgs.length * 2,
              code,
              codeLength: codeSize,
              exceptionTable: [],
              exceptionTableLength: 0,
              attributesCount: 0,
              attributes: [],
            } as CodeAttribute,
          ],
        },
      ],
      attributesCount: 0,
      attributes: [],
    };
    const anonCls = new ReferenceClassData(
      clsFile,
      this.cls.getLoader(),
      thisClsName,
      () => {}
    );

    // Fix constant index for invoke
    code.setUint16(invokeIndex, methodRefIndex);

    const lambdaObj = anonCls.instantiate();

    return { result: lambdaObj };
  }
}

export class ConstantFieldref extends Constant {
  private classConstant: ConstantClass;
  private nameAndTypeConstant: ConstantNameAndType;
  private result?: Result<Field>;

  constructor(
    cls: ClassData,
    classConstant: ConstantClass,
    nameAndTypeConstant: ConstantNameAndType
  ) {
    super(CONSTANT_TAG.Fieldref, cls);
    this.classConstant = classConstant;
    this.nameAndTypeConstant = nameAndTypeConstant;
  }

  public get() {
    throw new Error("ConstantFieldref.get: Method not implemented.");
  }

  static check(c: Constant): c is ConstantFieldref {
    return c.getTag() === CONSTANT_TAG.Fieldref;
  }

  public resolve(): Result<Field> {
    if (this.result) {
      return this.result;
    }

    // resolve class
    const clsRes = this.classConstant.resolve();
    if (!checkSuccess(clsRes)) {
      if (checkError(clsRes)) {
        this.result = clsRes;
        return this.result;
      }
      // Should not happen
      throw new Error("Class resolution should not defer");
    }
    const fieldClass = clsRes.result;
    const { name, descriptor } = this.nameAndTypeConstant.get();
    const fieldRef = fieldClass.lookupField(name + descriptor);

    if (fieldRef === null) {
      this.result = { exceptionCls: "java/lang/NoSuchFieldError", msg: "" };
      return this.result;
    }

    this.result = { result: fieldRef };
    return this.result;
  }
}

/**
 * Resolves the vmtarget, appendix, and appendix for invoke and invokeExact
 */
function resolveSignaturePolymorphic(
  thread: Thread,
  symbolClass: ClassData,
  selfClass: ClassData,
  polyMethod: Method,
  name: string,
  descriptor: string,
  onError: (err?: ErrorResult) => void,
  onSuccess: (
    method: Method,
    appendix?: JvmObject,
    memberName?: JvmObject
  ) => void
) {
  // Check signature polymorphic methods
  const polyName = polyMethod.getName();
  // invokebasic
  if (polyName !== "invoke" && polyName !== "invokeExact") {
    onSuccess(polyMethod);
    return;
  }
  const loader = selfClass.getLoader();

  const mhnResolution = loader.getClass("java/lang/invoke/MethodHandleNatives");
  if (checkError(mhnResolution)) {
    return onError(mhnResolution);
  }
  const objArrResolution = loader.getClass("[Ljava/lang/Object;");
  if (checkError(objArrResolution)) {
    return onError(objArrResolution);
  }
  const clsArrResolution = loader.getClass("[Ljava/lang/Class;");
  if (checkError(clsArrResolution)) {
    return onError(clsArrResolution);
  }

  const mhn = mhnResolution.result;
  const objArrCls = objArrResolution.result as ArrayClassData;
  const clsArrCls = clsArrResolution.result as ArrayClassData;
  const ptypes = clsArrCls.instantiate();
  const appendix = objArrCls.instantiate();
  appendix.initArray(1);
  const mhnInitResult = mhn.initialize(thread);
  if (!checkSuccess(mhnInitResult)) {
    if (checkError(mhnInitResult)) {
      return onError(mhnInitResult);
    }
    return;
  }
  const findMHType = mhn.getMethod(
    "findMethodHandleType(Ljava/lang/Class;[Ljava/lang/Class;)Ljava/lang/invoke/MethodType;"
  );
  if (!findMHType) {
    return onError({
      exceptionCls: "java/lang/NoSuchMethodError",
      msg: "findMethodHandleType(Ljava/lang/Class;[Ljava/lang/Class;)Ljava/lang/invoke/MethodType;",
    });
  }
  const descriptorClasses = parseMethodDescriptor(descriptor);
  let argResolutionError: ErrorResult | null = null;
  const argsCls = descriptorClasses.args.map((arg) => {
    if (arg.type === JavaType.reference || arg.type === JavaType.array) {
      const loadResult = loader.getClass(arg.referenceCls as string);
      if (checkError(loadResult)) {
        argResolutionError = loadResult;
        return null;
      }
      return loadResult.result.getJavaObject();
    }
    return loader.getPrimitiveClass(arg.type).getJavaObject();
  });
  if (argResolutionError) {
    return onError(argResolutionError);
  }
  let rtype: JvmObject;
  if (descriptorClasses.ret.referenceCls) {
    const loadResult = loader.getClass(
      descriptorClasses.ret.referenceCls as string
    );
    if (checkError(loadResult)) {
      return onError(loadResult);
    }
    rtype = loadResult.result.getJavaObject();
  } else {
    rtype = loader
      .getPrimitiveClass(descriptorClasses.ret.type)
      .getJavaObject();
  }
  ptypes.initArray(argsCls.length, argsCls);

  const linkMethod = mhn.getMethod(
    "linkMethod(Ljava/lang/Class;ILjava/lang/Class;Ljava/lang/String;Ljava/lang/Object;[Ljava/lang/Object;)Ljava/lang/invoke/MemberName;"
  );
  if (!linkMethod) {
    return onError({
      exceptionCls: "java/lang/NoSuchMethodError",
      msg: "linkMethod(Ljava/lang/Class;ILjava/lang/Class;Ljava/lang/String;Ljava/lang/Object;[Ljava/lang/Object;)Ljava/lang/invoke/MemberName;",
    });
  }
  const linkFrame = new InternalStackFrame(
    mhn,
    linkMethod,
    0,
    [
      selfClass.getJavaObject(),
      MethodHandleReferenceKind.REF_invokeVirtual,
      symbolClass.getJavaObject(),
      thread.getJVM().getInternedString(name),
      null, // findMHType sets this to the method type later
      appendix,
    ],
    (mn, err) => {
      if (err) {
        return;
      }
      onSuccess(polyMethod, appendix.get(0), mn);
    }
  );
  thread.invokeStackFrame(linkFrame);
  thread.invokeStackFrame(
    new InternalStackFrame(mhn, findMHType, 0, [rtype, ptypes], (mt, err) => {
      if (err) {
        return;
      }
      linkFrame.locals[4] = mt;
    })
  );
}

export class ConstantMethodref extends Constant {
  private classConstant: ConstantClass;
  private nameAndTypeConstant: ConstantNameAndType;
  private result?: Result<Method>;
  private appendix?: any;
  private memberName?: JvmObject;

  constructor(
    cls: ClassData,
    classConstant: ConstantClass,
    nameAndTypeConstant: ConstantNameAndType
  ) {
    super(CONSTANT_TAG.Methodref, cls);
    this.classConstant = classConstant;
    this.nameAndTypeConstant = nameAndTypeConstant;
  }

  public get() {
    throw new Error("ConstantMethodref: get Method not implemented.");
  }

  static check(c: Constant): c is ConstantMethodref {
    return c.getTag() === CONSTANT_TAG.Methodref;
  }

  public resolve(thread: Thread): Result<Method> {
    // 5.4.3 if initial attempt to resolve a symbolic reference fails
    // then subsequent attempts to resolve the reference always fail with the same error
    if (this.result) {
      return this.result;
    }

    // resolve class
    const clsResResult = this.classConstant.resolve();
    if (!checkSuccess(clsResResult)) {
      if (checkError(clsResResult)) {
        this.result = clsResResult;
        return this.result;
      }
      return { isDefer: true };
    }
    const symbolClass = clsResResult.result;

    // resolve name and type
    if (!checkSuccess(this.nameAndTypeConstant.resolve())) {
      throw new Error("Name and type resolution failed");
    }

    // 5.4.3.3. Method Resolution
    // 1. If C is an interface, method resolution throws an IncompatibleClassChangeError
    if (symbolClass.checkInterface()) {
      this.result = {
        exceptionCls: "java/lang/IncompatibleClassChangeError",
        msg: "",
      };
      return this.result;
    }

    const nt = this.nameAndTypeConstant.get();
    const resolutionResult = symbolClass.resolveMethod(
      nt.name,
      nt.descriptor,
      this.cls
    );

    if (checkError(resolutionResult)) {
      this.result = resolutionResult;
      return this.result;
    }

    const resolvedMethod = resolutionResult.result;
    if (resolvedMethod.checkSignaturePolymorphic()) {
      const onSuccess = (
        method: Method,
        appendix?: JvmObject,
        memberName?: JvmObject
      ) => {
        this.appendix = appendix ?? null;
        this.memberName = memberName;
        this.result = { result: method };
      };
      const onError = (err?: ErrorResult) => {
        if (!err) {
          this.result = resolutionResult;
        }
        this.result = err;
      };
      resolveSignaturePolymorphic(
        thread,
        symbolClass,
        this.cls,
        resolvedMethod,
        nt.name,
        nt.descriptor,
        onError,
        onSuccess
      );
      if (this.result) {
        return this.result;
      }
      return { isDefer: true };
    }

    this.result = resolutionResult;
    return this.result;
  }

  public getPolymorphic() {
    if (!this.result || !checkSuccess(this.result)) {
      throw new Error("Not resolved");
    }

    return {
      appendix: this.appendix,
      memberName: this.memberName,
      method: this.result.result,
      originalDescriptor: this.nameAndTypeConstant.get().descriptor,
    };
  }
}

export class ConstantInterfaceMethodref extends Constant {
  private classConstant: ConstantClass;
  private nameAndTypeConstant: ConstantNameAndType;
  private result?: Result<Method>;

  constructor(
    cls: ClassData,
    classConstant: ConstantClass,
    nameAndTypeConstant: ConstantNameAndType
  ) {
    super(CONSTANT_TAG.InterfaceMethodref, cls);
    this.classConstant = classConstant;
    this.nameAndTypeConstant = nameAndTypeConstant;
  }

  public get() {
    throw new Error("ConstantInterfaceMethodref: get Method not implemented.");
  }

  static check(c: Constant): c is ConstantInterfaceMethodref {
    return c.getTag() === CONSTANT_TAG.InterfaceMethodref;
  }

  public resolve(thread: Thread): Result<Method> {
    // 5.4.3 if initial attempt to resolve a symbolic reference fails
    // then subsequent attempts to resolve the reference always fail with the same error
    if (this.result) {
      return this.result;
    }

    // resolve class
    const clsResResult = this.classConstant.resolve();
    if (!checkSuccess(clsResResult)) {
      if (checkError(clsResResult)) {
        this.result = clsResResult;
        return this.result;
      }
      return { isDefer: true };
    }
    const symbolClass = clsResResult.result;

    // resolve name and type
    if (!checkSuccess(this.nameAndTypeConstant.resolve())) {
      throw new Error("Name and type resolution failed");
    }

    // 5.4.3.4. Interface Method Resolution
    // 1. If C is not an interface, interface method resolution throws an IncompatibleClassChangeError.
    if (!symbolClass.checkInterface()) {
      this.result = {
        exceptionCls: "java/lang/IncompatibleClassChangeError",
        msg: "",
      };
      return this.result;
    }

    const nt = this.nameAndTypeConstant.get();
    const resolutionResult = symbolClass.resolveMethod(
      nt.name,
      nt.descriptor,
      this.cls
    );

    this.result = resolutionResult;
    return this.result;
  }

  public getPolymorphic(): {
    appendix: any;
    memberName?: JvmObject;
    method: Method;
    originalDescriptor: string;
  } {
    throw new Error("Interface method not signature polymorphic");
  }
}

// #endregion

// #region rest
export class ConstantMethodHandle extends Constant {
  private referenceKind: info.REFERENCE_KIND;
  private reference:
    | ConstantFieldref
    | ConstantMethodref
    | ConstantInterfaceMethodref;
  private result?: Result<JvmObject>;

  constructor(
    cls: ClassData,
    referenceKind: info.REFERENCE_KIND,
    reference: ConstantFieldref | ConstantMethodref | ConstantInterfaceMethodref
  ) {
    super(CONSTANT_TAG.MethodHandle, cls);
    this.referenceKind = referenceKind;
    this.reference = reference;
    this.isResolved = false;
  }

  static check(c: Constant): c is ConstantMethodHandle {
    return c.getTag() === CONSTANT_TAG.MethodHandle;
  }

  public get(): JvmObject {
    if (this.result && checkSuccess(this.result)) {
      return this.result.result;
    }
    throw new Error("methodhandle not resolved!");
  }

  public resolve(thread: Thread): Result<JvmObject> {
    if (this.result) {
      return this.result;
    }

    // #region Step 1: resolve field/method
    const refRes = this.reference.resolve(thread);
    if (!checkSuccess<Field | Method>(refRes)) {
      if (checkError(refRes)) {
        this.result = refRes;
        return this.result;
      }
      return { isDefer: true };
    }
    const ref = refRes.result;
    // #endregion

    // #region Step 3: callback lambda
    const cb = (obj: JvmObject) => {
      // MethodHandleNatives should be resolved by this time
      const mhnCls = (
        this.cls
          .getLoader()
          .getClass(
            "java/lang/invoke/MethodHandleNatives"
          ) as SuccessResult<ReferenceClassData>
      ).result;

      const method = mhnCls.getMethod(
        "linkMethodHandleConstant(Ljava/lang/Class;ILjava/lang/Class;Ljava/lang/String;Ljava/lang/Object;)Ljava/lang/invoke/MethodHandle;"
      );
      if (!method) {
        this.result = { exceptionCls: "java/lang/NoSuchMethodError", msg: "" };
        return this.result;
      }
      // Should intern string here, i.e. same string value same object
      const nameStr = thread.getJVM().getInternedString(ref.getName());

      thread.invokeStackFrame(
        new InternalStackFrame(
          mhnCls,
          method,
          0,
          [
            this.cls.getJavaObject(),
            this.referenceKind,
            ref.getClass().getJavaObject(),
            nameStr,
            obj,
          ],
          (mh: JvmObject, err?: any) => {
            if (!mh || err) {
              thread.throwException(err);
            }
            this.result = { result: mh };
          }
        )
      );
    };
    // #endregion

    // #region Step 2:resolve type
    if (Field.checkField(ref)) {
      // #region init MethodHandleNatives. MethodType initializes it already.
      const mhnRes = this.cls
        .getLoader()
        .getClass("java/lang/invoke/MethodHandleNatives");
      if (checkError(mhnRes)) {
        return mhnRes;
      }

      const mhnCls = mhnRes.result;
      const result = mhnCls.initialize(thread);
      if (!checkSuccess(result)) {
        return result;
      }
      // #endregion

      const parsedField = parseFieldDescriptor(ref.getFieldDesc(), 0);
      if (!parsedField.referenceCls) {
        cb(
          this.cls
            .getLoader()
            .getPrimitiveClass(parsedField.type)
            .getJavaObject()
        );
      } else {
        const fieldClsRes = this.cls
          .getLoader()
          .getClass(parsedField.referenceCls);
        if (checkError(fieldClsRes)) {
          this.result = fieldClsRes;
          return this.result;
        }
        cb(fieldClsRes.result.getJavaObject());
      }
    } else {
      const descriptor = ref.getDescriptor();
      const loader = this.cls.getLoader();

      return createMethodType(thread, loader, descriptor, cb);
    }
    // #endregion

    return { isDefer: true };
  }

  public tempGetReference() {
    return this.reference;
  }
}
// #endregion
