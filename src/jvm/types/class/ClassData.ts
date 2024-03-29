import { ClassFile } from "../../../ClassFile/types";
import { AttributeInfo } from "../../../ClassFile/types/attributes";
import AbstractClassLoader from "../../ClassLoader/AbstractClassLoader";
import { ConstantPool } from "../../constant-pool";
import {
  CLASS_FLAGS,
  CLASS_STATUS,
  CLASS_TYPE,
  ThreadStatus,
} from "../../constants";
import { InternalStackFrame } from "../../stackframe";
import Thread from "../../thread";
import { primitiveNameToType, attrInfo2Interface } from "../../utils";
import {
  ImmediateResult,
  checkError,
  checkSuccess,
  Result,
  SuccessResult,
  ErrorResult,
} from "../Result";
import { JvmArray } from "../reference/Array";
import { JvmObject } from "../reference/Object";
import { IAttribute, BootstrapMethod, BootstrapMethods } from "./Attributes";
import {
  Constant,
  ConstantClass,
  ConstantInterfaceMethodref,
  ConstantMethodref,
  ConstantUtf8,
} from "./Constants";
import { Field } from "./Field";
import { Method } from "./Method";

class ClassLock {
  private owner?: Thread;
  private onRelease: Array<() => void> = [];

  constructor() {}

  isOwner(thread: Thread) {
    return this.owner === thread;
  }

  lock(thread: Thread, onInit?: () => void): boolean {
    if (onInit) {
      this.onRelease.push(onInit);
    }

    if (!this.owner) {
      this.owner = thread;
      return true;
    }

    return false;
  }

  release() {
    this.onRelease.forEach((cb) => cb());
    this.onRelease = [];
    this.owner = undefined;
  }
}

export abstract class ClassData {
  protected loader: AbstractClassLoader;
  protected accessFlags: number;
  protected type: CLASS_TYPE;
  public status: CLASS_STATUS = CLASS_STATUS.PREPARED;

  protected classLock?: ClassLock;

  protected thisClass: string;
  protected packageName: string;

  protected javaClassObject?: JvmObject;

  protected superClass: ReferenceClassData | null = null;

  protected interfaces: Array<ReferenceClassData> = [];

  protected constantPool: ConstantPool;

  protected fields: {
    [fieldName: string]: Field;
  } = {};
  protected instanceFields: { [key: string]: Field } | null = null;
  protected vmIndexFields?: Field[];
  protected staticFields: Field[] = [];
  protected methods: {
    [methodName: string]: Method;
  } = {};

  protected attributes: { [attributeName: string]: IAttribute } = {};

  constructor(
    loader: AbstractClassLoader,
    accessFlags: number,
    type: CLASS_TYPE,
    thisClass: string
  ) {
    this.loader = loader;
    this.accessFlags = accessFlags;
    this.type = type;
    this.thisClass = thisClass;
    this.packageName = thisClass.split("/").slice(0, -1).join("/");
    this.constantPool = new ConstantPool(this, []);
  }

  isInitialized(): boolean {
    return this.status === CLASS_STATUS.INITIALIZED;
  }

  checkPrimitive(): this is PrimitiveClassData {
    return false;
  }

  checkArray(): this is ArrayClassData {
    return false;
  }

  checkReference(): this is ReferenceClassData {
    return false;
  }

  /**
   * Gets all fields, including private and protected fields but excluding inherited fields.
   */
  getDeclaredFields(): Field[] {
    let result: Field[] = [];

    for (const field of Object.values(this.fields)) {
      result.push(field);
    }

    return result;
  }

  checkPublic() {
    return (this.accessFlags & CLASS_FLAGS.ACC_PUBLIC) !== 0;
  }

  checkFinal() {
    return (this.accessFlags & CLASS_FLAGS.ACC_FINAL) !== 0;
  }

  checkSuper() {
    return (this.accessFlags & CLASS_FLAGS.ACC_SUPER) !== 0;
  }

  checkInterface() {
    return (this.accessFlags & CLASS_FLAGS.ACC_INTERFACE) !== 0;
  }

  checkAbstract() {
    return (this.accessFlags & CLASS_FLAGS.ACC_ABSTRACT) !== 0;
  }

  checkSynthetic() {
    return (this.accessFlags & CLASS_FLAGS.ACC_SYNTHETIC) !== 0;
  }

  checkAnnotation() {
    return (this.accessFlags & CLASS_FLAGS.ACC_ANNOTATION) !== 0;
  }

  checkEnum() {
    return (this.accessFlags & CLASS_FLAGS.ACC_ENUM) !== 0;
  }

  checkModule() {
    return (this.accessFlags & CLASS_FLAGS.ACC_MODULE) !== 0;
  }

  resolveClass(toResolve: string): ImmediateResult<ClassData> {
    const res = this.loader.getClass(toResolve);
    if (checkError(res)) {
      return res;
    }
    const cls = res.result;

    if (!cls.checkPublic() && cls.getPackageName() !== this.getPackageName()) {
      return { exceptionCls: "java/lang/IllegalAccessError", msg: "" };
    }

    return res;
  }

  getInstanceFields(): {
    [fieldName: string]: Field;
  } {
    if (this.instanceFields !== null) {
      return this.instanceFields;
    }

    let res: { [key: string]: Field } = {};

    if (this.superClass) {
      res = this.superClass.getInstanceFields();
    }

    this.interfaces?.forEach((constantInterfaceCls) => {
      const fields = constantInterfaceCls.getInstanceFields();
      for (const [fieldName, fieldRef] of Object.entries(fields)) {
        res[fieldName] = fieldRef;
      }
    });

    for (const [fieldName, fieldRef] of Object.entries(this.fields).filter(
      ([fn, fr]) => !fr.checkStatic()
    )) {
      res[`${this.thisClass}.${fieldName}`] = fieldRef;
    }

    return res;
  }

  getSuperClass(): ReferenceClassData | null {
    return this.superClass;
  }

  getInterfaces(): ReferenceClassData[] {
    return this.interfaces;
  }

  private _checkOverrides(
    overrideMethod: Method,
    parentMethod: Method
  ): boolean {
    if (overrideMethod === parentMethod) {
      return true;
    }

    const overrideClass = overrideMethod.getClass();
    const parentClass = parentMethod.getClass();
    return (
      overrideMethod.getClass().checkCast(parentMethod.getClass()) &&
      overrideMethod.getName() === parentMethod.getName() &&
      overrideMethod.getDescriptor() === parentMethod.getDescriptor() &&
      !overrideMethod.checkPrivate() &&
      (parentMethod.checkPublic() ||
        parentMethod.checkProtected() ||
        (!parentMethod.checkPrivate() &&
          parentClass.getPackageName() === overrideClass.getPackageName()))
    );
  }

  private _getSignaturePolyMethod(signature: string): Method | null {
    if (this.thisClass !== "java/lang/invoke/MethodHandle") {
      return null;
    }

    const method = this.methods[signature];
    if (!method) {
      return null;
    }

    if (method.checkVarargs() && method.checkNative()) {
      return method;
    }

    return null;
  }

  private _lookupMethodSuper(
    signature: string,
    resolvedMethod: Method,
    checkOverride?: boolean,
    polySignature?: string
  ): Method | null {
    // If C contains a declaration for an instance method m that overrides the resolved method, then m is the method to be invoked.
    if (
      this.methods[signature] &&
      (!checkOverride ||
        this._checkOverrides(this.methods[signature], resolvedMethod))
    ) {
      return this.methods[signature];
    }

    let m;
    if (polySignature && (m = this._getSignaturePolyMethod(polySignature))) {
      return m;
    }

    // Otherwise, if C has a superclass, step 2 of method resolution is recursively invoked on the direct superclass of C.
    const superClass = this.getSuperClass();
    if (superClass === null) {
      return null;
    }
    return superClass?._lookupMethodSuper(
      signature,
      resolvedMethod,
      checkOverride,
      polySignature
    );
  }

  private _lookupMethodInterface(
    signature: string,
    polySignature?: string
  ): ImmediateResult<Method> {
    let res: Method | null = null;
    for (const interfaceCls of this.interfaces) {
      let method = interfaceCls.getMethod(signature);

      let m;
      if (polySignature && (m = this._getSignaturePolyMethod(polySignature))) {
        return { result: m };
      }

      if (!method) {
        const interRes = interfaceCls._lookupMethodInterface(signature);
        if (checkSuccess(interRes)) {
          method = interRes.result;
        }
      }

      if (
        method &&
        !method.checkPrivate() &&
        !method.checkStatic() &&
        !method.checkAbstract()
      ) {
        if (res) {
          return {
            exceptionCls: "java/lang/IncompatibleClassChangeError",
            msg: "",
          };
        }
        res = method;
      }
    }

    if (res) {
      return { result: res };
    }
    return { exceptionCls: "java/lang/AbstractMethodError", msg: "" };
  }

  lookupMethod(
    signature: string,
    resolvedMethod: Method,
    checkOverride?: boolean,
    checkInterface?: boolean,
    checkSigPoly?: boolean,
    acceptAbstract?: boolean
  ): ImmediateResult<Method> {
    let polySignature;
    if (checkSigPoly) {
      polySignature = `${
        signature.split("(")[0]
      }([Ljava/lang/Object;)Ljava/lang/Object;`;
    }
    // If C contains a declaration for an instance method m that overrides
    // the resolved method, then m is the method to be invoked.
    let methodRef = this._lookupMethodSuper(
      signature,
      resolvedMethod,
      checkOverride,
      polySignature
    );
    if (methodRef) {
      if (checkInterface && !methodRef.checkPublic()) {
        return { exceptionCls: "java/lang/IllegalAccessError", msg: "" };
      }

      if (!acceptAbstract && methodRef.checkAbstract()) {
        return { exceptionCls: "java/lang/AbstractMethodError", msg: "" };
      }
      return { result: methodRef };
    }

    return this._lookupMethodInterface(signature, polySignature);
  }

  /**
   * Gets a method declared in the current class. does not search superclasses/interfaces.
   */
  getMethod(methodName: string): Method | null {
    return this.methods[methodName] ?? null;
  }

  addMethod(method: Method) {
    this.methods[method.getName() + method.getDescriptor()] = method;
  }

  /**
   * Gets all methods declared in this class, including private methods.
   * Excludes inherited methods.
   */
  getDeclaredMethods(): { [methodName: string]: Method } {
    return this.methods;
  }

  getMethodFromSlot(slot: number): Method | null {
    for (const method of Object.values(this.methods)) {
      if (method.getSlot() === slot) {
        return method;
      }
    }

    return null;
  }

  getFieldFromSlot(slot: number): Field | null {
    for (const field of Object.values(this.fields)) {
      if (field.getSlot() === slot) {
        return field;
      }
    }

    return null;
  }

  getFieldVmIndex(field: Field): number {
    const fieldArr = this.vmIndexFields
      ? this.vmIndexFields
      : this._fillVmIndexFieldArr();
    return fieldArr.indexOf(field);
  }

  getFieldFromVmIndex(index: number): Field | null {
    const fieldArr = this.vmIndexFields
      ? this.vmIndexFields
      : this._fillVmIndexFieldArr();
    return fieldArr[index] ?? null;
  }

  lookupField(fieldName: string): Field | null {
    if (this.fields[fieldName]) {
      return this.fields[fieldName];
    }

    for (let i = 0; i < this.interfaces.length; i++) {
      let interfaceCls = this.interfaces[i];
      const field = interfaceCls.lookupField(fieldName);

      if (field) {
        return field;
      }
    }

    const superClass = this.getSuperClass();

    if (superClass === null) {
      return null;
    }

    return superClass.lookupField(fieldName);
  }

  /**
   * 5.4.3.3.2 Method resolution in superclass
   * @param name
   * @param descriptor
   * @returns MethodRef, if any
   */
  private _resolveMethodSuper(name: string, descriptor: string): Method | null {
    const signature = name + descriptor;
    // If C declares a method with the name and descriptor specified by the method reference, method lookup succeeds.
    if (this.methods[signature]) {
      return this.methods[signature];
    }

    // If C declares exactly one method with the name specified by the method reference,
    // and the declaration is a signature polymorphic method (§2.9.3), then method lookup succeeds.
    if (this.thisClass === "java/lang/invoke/MethodHandle") {
      const polyMethod =
        this.methods[name + "([Ljava/lang/Object;)Ljava/lang/Object;"];
      if (
        polyMethod &&
        polyMethod.checkVarargs() &&
        polyMethod.checkNative() &&
        Object.keys(this.methods).filter((x) => x.startsWith(name + "("))
          .length === 1
      ) {
        return polyMethod;
      }
    }

    // Otherwise, if C has a superclass, step 2 of method resolution is recursively invoked on the direct superclass of C.
    const superClass = this.getSuperClass();
    if (superClass === null) {
      return null;
    }
    return superClass._resolveMethodSuper(name, descriptor);
  }

  /**
   * 5.4.3.3.2 Method resolution in superinterfaces
   * @param methodName
   * @returns MethodRef, if any
   */
  private _resolveMethodInterface(
    name: string,
    descriptor: string
  ): Method | null {
    let abstractMethod = null;
    const signature = name + descriptor;
    for (const inter of this.interfaces) {
      let method = inter.getMethod(signature);

      if (!method) {
        method = (inter as ReferenceClassData)._resolveMethodInterface(
          name,
          descriptor
        );
      }

      if (method && !method.checkPrivate() && !method.checkStatic()) {
        if (method.checkAbstract()) {
          abstractMethod = method;
          continue;
        }
        return method;
      }
    }
    if (abstractMethod !== null) {
      return abstractMethod;
    }
    return null;
  }

  /**
   * Resolves method reference from the current class.
   * Returns exception if any.
   * @param methodKey method name + method descriptor
   * @param accessingClass class that is accessing the method
   * @returns
   */
  resolveMethod(
    name: string,
    descriptor: string,
    accessingClass: ClassData
  ): ImmediateResult<Method> {
    // Otherwise, method resolution attempts to locate the referenced method in C and its superclasses
    let result = this._resolveMethodSuper(name, descriptor);

    if (result !== null) {
      const method = result;
      const accessCheckResult = method.checkAccess(accessingClass, this);
      if (checkError(accessCheckResult)) {
        return accessCheckResult;
      }
      return { result };
    }

    // Otherwise, method resolution attempts to locate the referenced method in the superinterfaces of the specified class C
    result = this._resolveMethodInterface(name, descriptor);
    if (result !== null) {
      const accessCheckResult = result.checkAccess(accessingClass, this);
      if (checkError(accessCheckResult)) {
        return accessCheckResult;
      }
      return { result };
    }
    // If method lookup fails, method resolution throws a NoSuchMethodError
    return { exceptionCls: "java/lang/NoSuchMethodError", msg: "" };
  }

  getConstant(constantIndex: number): Constant {
    const constItem = this.constantPool.get(constantIndex);
    return constItem;
  }

  getMethodConstantIndex(method: Method): number {
    const isInterface = this.checkInterface();
    for (let i = 1; i < this.constantPool.size(); i++) {
      const constItem = this.getConstant(i);
      if (
        (!isInterface && ConstantMethodref.check(constItem)) ||
        (isInterface && ConstantInterfaceMethodref.check(constItem))
      ) {
        const clsname = constItem.getClassName();
        if (clsname !== this.thisClass) {
          continue;
        }

        const nameAndType = constItem.getNameAndType();

        if (
          nameAndType.name === method.getName() &&
          nameAndType.descriptor === method.getDescriptor()
        ) {
          return i;
        }
      }
    }
    return -1;
  }

  insertConstant(con: Constant): number {
    return this.constantPool.insert(con);
  }

  /**
   * Getters
   */
  getLoader(): AbstractClassLoader {
    return this.loader;
  }

  getPackageName(): string {
    return this.packageName;
  }

  private _fillVmIndexFieldArr(): Field[] {
    if (this.vmIndexFields) {
      return this.vmIndexFields;
    }

    this.vmIndexFields = this.superClass
      ? [...this.superClass._fillVmIndexFieldArr()]
      : [];
    this.interfaces.forEach((interfaceCls) => {
      this.vmIndexFields?.push(...interfaceCls._fillVmIndexFieldArr());
    });
    this.vmIndexFields.push(...Object.values(this.fields));

    return this.vmIndexFields;
  }

  /**
   * Initializes the class. If the class has a static initializer, it is invoked.
   * @param thread used to invoke the static initializer
   * @param onDefer callback to be called before invoking the static initializer.
   * @param onInitialized callback to be called after the class has been initialized.
   */
  initialize(
    thread: Thread,
    onDefer?: () => void | null,
    onInitialized?: () => void | null
  ): Result<ClassData> {
    onInitialized && onInitialized();
    return { result: this };
  }

  getJavaObject(): JvmObject {
    if (!this.javaClassObject) {
      // We assume that java/lang/Class has been loaded at JVM initialization
      const clsCls = (
        this.loader.getClass("java/lang/Class") as SuccessResult<ClassData>
      ).result;

      this.javaClassObject = clsCls.instantiate();
      this.javaClassObject.putNativeField("classRef", this);
      this.javaClassObject._putField(
        "classLoader",
        "Ljava/lang/ClassLoader;",
        "java/lang/Class",
        this.loader.getJavaObject()
      );
    }

    return this.javaClassObject;
  }

  getProtectionDomain(): JvmObject | null {
    return null;
  }

  getAccessFlags(): number {
    return this.accessFlags;
  }

  /**
   *  Gets the classname for the current class, e.g. package/Class
   */
  getClassname(): string {
    return this.thisClass;
  }

  /**
   * Gets the descriptor for the current class, e.g. Lpackage/Class;
   */
  abstract getDescriptor(): string;

  /**
   * Checks if the current class can be cast to the specified class
   * @param castTo classref of supertype
   * @returns
   */
  abstract checkCast(castTo: ClassData): boolean;

  instantiate(): JvmObject {
    return new JvmObject(this);
  }

  getAttribute(key: string) {
    return this.attributes[key];
  }

  getBootstrapMethod(methodIndex: number): BootstrapMethod | null {
    return null;
  }
}

export class PrimitiveClassData extends ClassData {
  private primitiveType: string;
  constructor(loader: AbstractClassLoader, primitiveName: string) {
    super(
      loader,
      CLASS_FLAGS.ACC_ABSTRACT & CLASS_FLAGS.ACC_FINAL & CLASS_FLAGS.ACC_PUBLIC,
      CLASS_TYPE.PRIMITIVE,
      primitiveName
    );

    this.primitiveType = primitiveNameToType(primitiveName) as string;
    this.status = CLASS_STATUS.INITIALIZED;
  }

  checkPrimitive(): this is PrimitiveClassData {
    return true;
  }

  getDescriptor(): string {
    return this.primitiveType;
  }

  checkCast(castTo: ClassData): boolean {
    return this === castTo;
  }
}

export class ReferenceClassData extends ClassData {
  protected bootstrapMethods: Array<BootstrapMethod> = [];
  private protectionDomain: JvmObject | null;

  constructor(
    classfile: ClassFile,
    loader: AbstractClassLoader,
    className: string,
    onError: (error: ErrorResult) => void,
    cpOverrides?: JvmArray,
    protectionDomain?: JvmObject
  ) {
    super(loader, classfile.accessFlags, CLASS_TYPE.REFERENCE, className);

    this.loader = loader;
    this.protectionDomain = protectionDomain ?? null;

    this.constantPool = new ConstantPool(
      this,
      classfile.constantPool,
      cpOverrides
    );

    // get superclass
    // superclass is 0 for object.
    if (classfile.superClass !== 0) {
      const superResolution = (
        this.constantPool.get(classfile.superClass) as ConstantClass
      ).resolve();
      if (checkError(superResolution)) {
        onError(superResolution);
        return;
      }
      this.superClass = superResolution.result as ReferenceClassData;
    }

    // interfaces
    classfile.interfaces.forEach((interfaceIndex) => {
      const interfaceResolution = (
        this.constantPool.get(interfaceIndex) as ConstantClass
      ).resolve();
      if (checkError(interfaceResolution)) {
        onError(interfaceResolution);
        return;
      }
      this.interfaces.push(interfaceResolution.result as ReferenceClassData);
    });

    // attributes
    this.attributes = attrInfo2Interface(
      classfile.attributes,
      this.constantPool
    );

    // fields
    this.fields = {};
    classfile.fields.forEach((field, index) => {
      const fieldRef = Field.fromFieldInfo(
        this,
        field,
        index,
        this.constantPool
      );
      this.fields[fieldRef.getName() + fieldRef.getFieldDesc()] = fieldRef;
    });

    // methods
    this.methods = {};
    classfile.methods.forEach((methodInfo, index) => {
      const methodAttributes: { [attributeName: string]: AttributeInfo[] } = {};
      methodInfo.attributes.forEach((attr) => {
        const attrName = (
          this.constantPool.get(attr.attributeNameIndex) as ConstantUtf8
        ).get();
        if (!methodAttributes[attrName]) {
          methodAttributes[attrName] = [];
        }
        methodAttributes[attrName].push(attr);
      });
      const method = Method.fromInfo(
        this,
        methodInfo,
        index,
        this.constantPool
      );

      this.methods[method.getName() + method.getDescriptor()] = method;
    });

    if (this.attributes["BootstrapMethods"]) {
      this.bootstrapMethods = (
        this.attributes["BootstrapMethods"] as BootstrapMethods
      ).bootstrapMethods;
    }
  }

  checkReference(): this is ReferenceClassData {
    return true;
  }

  initialize(
    thread: Thread,
    onDefer?: () => void | null,
    onInitialized?: () => void
  ): Result<ClassData> {
    if (this.status === CLASS_STATUS.INITIALIZED) {
      onInitialized && onInitialized();
      return { result: this };
    }

    if (this.status === CLASS_STATUS.INITIALIZING) {
      if (!this.classLock) {
        throw new Error("Class lock not set during initialization");
      }

      onDefer && onDefer();
      if (this.classLock.isOwner(thread)) {
        // Object's static initializer invokes static method Object.registerNatives()
        // Invokestatic initializes Object again.
        // We return a success result so the clinit can complete.
        return { result: this };
      }

      this.classLock.lock(thread, () =>
        thread.setStatus(ThreadStatus.RUNNABLE)
      );
      thread.setStatus(ThreadStatus.WAITING);
      return { isDefer: true };
    }

    if (
      this.superClass &&
      this.superClass.status !== CLASS_STATUS.INITIALIZED
    ) {
      const superInit = this.superClass.initialize(thread);
      if (!checkSuccess(superInit)) {
        return superInit;
      }
    }

    this.status = CLASS_STATUS.INITIALIZING;
    this.classLock = new ClassLock();
    this.classLock.lock(thread, onInitialized);

    // has static initializer
    if (this.methods["<clinit>()V"]) {
      onDefer && onDefer();
      thread.invokeStackFrame(
        new InternalStackFrame(this, this.methods["<clinit>()V"], 0, [], () => {
          this.status = CLASS_STATUS.INITIALIZED;
          this.classLock?.release();
        })
      );
      return { isDefer: true };
    }

    this.status = CLASS_STATUS.INITIALIZED;
    onInitialized && onInitialized();
    this.classLock.release();
    return { result: this };
  }

  getDescriptor(): string {
    return `L${this.thisClass};`;
  }

  getBootstrapMethod(methodIndex: number): BootstrapMethod | null {
    return this.bootstrapMethods[methodIndex] ?? null;
  }

  /**
   * Checks if the current class can be cast to the specified class
   * @param castTo classref of supertype
   * @returns
   */
  checkCast(castTo: ClassData): boolean {
    if (this === castTo) {
      return true;
    }

    for (let i = 0; i < this.interfaces.length; i++) {
      let inter = this.interfaces[i];
      if (inter.checkCast(castTo)) {
        return true;
      }
    }

    const superClass = this.getSuperClass();

    if (superClass === null) {
      return false;
    }

    return superClass.checkCast(castTo);
  }

  getProtectionDomain(): JvmObject | null {
    return this.protectionDomain;
  }

  _addAttribute(attr: IAttribute) {
    this.attributes[attr.name] = attr;
  }
}

export class ArrayClassData extends ClassData {
  private componentClass?: ClassData;

  constructor(
    accessFlags: number,
    thisClass: string,
    loader: AbstractClassLoader,
    componentClass: ClassData,
    onError: (error: ErrorResult) => void
  ) {
    super(loader, accessFlags, CLASS_TYPE.ARRAY, thisClass);
    this.packageName = "java/lang";
    this.componentClass = componentClass;

    // #region load array superclasses/interfaces
    const objRes = loader.getClass("java/lang/Object");
    if (checkError(objRes)) {
      onError(objRes);
      return;
    }
    const cloneableRes = loader.getClass("java/lang/Cloneable");
    if (checkError(cloneableRes)) {
      onError(cloneableRes);
      return;
    }
    const serialRes = loader.getClass("java/io/Serializable");
    if (checkError(serialRes)) {
      onError(serialRes);
      return;
    }
    // #endregion
    this.superClass = objRes.result as ReferenceClassData;
    this.interfaces.push(cloneableRes.result as ReferenceClassData);
    this.interfaces.push(serialRes.result as ReferenceClassData);
  }

  getDescriptor(): string {
    return this.getClassname();
  }

  getComponentClass(): ClassData {
    if (this.componentClass === undefined) {
      throw new Error("Array item class not set");
    }
    return this.componentClass;
  }

  instantiate(): JvmArray {
    return new JvmArray(this);
  }

  checkArray(): this is ArrayClassData {
    return true;
  }

  checkCast(castTo: ClassData): boolean {
    if (this === castTo) {
      return true;
    }

    // Not an array class
    if (!castTo.checkArray()) {
      // is a class
      if (!castTo.checkInterface()) {
        // If T is a class type, then T must be Object.
        // array superclass is Object.
        return this.superClass === castTo;
      }

      // is an interface
      for (let i = 0; i < this.interfaces.length; i++) {
        let inter = this.interfaces[i];
        // If T is an interface type, then T must be one of the interfaces implemented by arrays
        if (inter === castTo) {
          return true;
        }
      }
      return false;
    }

    // TC and SC are reference types, and type SC can be cast to TC by recursive application of these rules.
    // Primitive classes are loaded as well anyways, we can use the same logic.
    return this.getComponentClass().checkCast(castTo.getComponentClass());
  }
}
