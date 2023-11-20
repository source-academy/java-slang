import { BootstrapMethodsAttribute, AttributeInfo, CodeAttribute } from "../../../ClassFile/types/attributes";
import { ConstantInfo } from "../../../ClassFile/types/constants";
import { FieldInfo } from "../../../ClassFile/types/fields";
import { MethodInfo } from "../../../ClassFile/types/methods";
import AbstractClassLoader from "../../ClassLoader/AbstractClassLoader";
import { ConstantPool } from "../../constant-pool";
import { InternalStackFrame } from "../../stackframe";
import Thread from "../../thread";
import { Result, checkError, SuccessResult, ImmediateResult, checkSuccess } from "../../utils/Result";
import { JvmObject } from "../reference/Object";
import { ConstantUtf8, Constant } from "./Constants";
import { Field } from "./Field";
import { Method, MethodHandler } from "./Method";
import { ACCESS_FLAGS as CLASS_FLAGS } from "../../../ClassFile/types";

export enum CLASS_STATUS {
  PREPARED,
  INITIALIZING,
  INITIALIZED,
  ERROR,
}

export enum CLASS_TYPE {
  NORMAL,
  ARRAY,
  PRIMITIVE,
}

export class ClassData {
  protected type: CLASS_TYPE = CLASS_TYPE.NORMAL;
  public status: CLASS_STATUS = CLASS_STATUS.PREPARED;

  protected loader: AbstractClassLoader;

  protected constantPool: ConstantPool;
  protected accessFlags: number;

  protected thisClass: string;
  protected packageName: string;
  protected superClass: ClassData | null;

  protected interfaces: Array<ClassData>;

  protected fields: {
    [fieldName: string]: Field;
  };
  protected instanceFields: { [key: string]: Field } | null = null;
  protected allFields: Field[] = [];
  protected staticFields: Field[] = [];

  protected methods: {
    [methodName: string]: Method;
  };

  protected bootstrapMethods?: BootstrapMethodsAttribute;
  protected attributes: Array<AttributeInfo>;

  protected javaObj?: JvmObject;

  private nestedHost: ClassData;
  private nestedMembers: ClassData[] = [];
  private anonymousInnerId: number = 0;

  constructor(
    constantPool: Array<ConstantInfo>,
    accessFlags: number,
    thisClass: string,
    superClass: ClassData | null,
    interfaces: Array<ClassData>,
    fields: Array<FieldInfo>,
    methods: {
      method: MethodInfo;
      exceptionHandlers: MethodHandler[];
      code: CodeAttribute | null;
    }[],
    attributes: Array<AttributeInfo>,
    loader: AbstractClassLoader,
    type?: CLASS_TYPE,
    nestedHost?: ClassData
  ) {
    this.nestedHost = nestedHost ?? this;
    this.constantPool = new ConstantPool(this, constantPool);
    this.accessFlags = accessFlags;
    this.thisClass = thisClass;
    this.packageName = thisClass.split('/').slice(0, -1).join('/');
    this.superClass = superClass;
    this.interfaces = interfaces;
    this.fields = {};
    fields.forEach((field, index) => {
      const fieldRef = Field.fromFieldInfo(this, field, index);
      this.fields[fieldRef.getName() + fieldRef.getFieldDesc()] = fieldRef;
    });
    this.methods = {};
    methods.forEach((method, index) => {
      const methodRef = Method.fromLinkedInfo(
        this,
        method.method,
        method.exceptionHandlers,
        method.code,
        index
      );
      this.methods[methodRef.getName() + methodRef.getDescriptor()] = methodRef;
    });
    this.attributes = attributes;
    this.loader = loader;

    if (type) {
      this.type = type;
    }

    for (const attribute of attributes) {
      const attrName = (
        this.constantPool.get(attribute.attributeNameIndex) as ConstantUtf8
      ).get();
      if (attrName === 'BootstrapMethods') {
        this.bootstrapMethods = attribute as BootstrapMethodsAttribute;
      }
    }
  }

  checkPrimitive() {
    return this.type === CLASS_TYPE.PRIMITIVE;
  }

  /**
   * Initializes the class. If the class has a static initializer, it is invoked.
   * @param thread used to invoke the static initializer
   * @param onDefer callback to be called before invoking the static initializer.
   */
  initialize(thread: Thread, onDefer?: () => void): Result<ClassData> {
    if (
      this.status === CLASS_STATUS.INITIALIZED ||
      this.status === CLASS_STATUS.INITIALIZING
    ) {
      return { result: this };
    }

    const clsRes = this.loader.getClassRef('java/lang/Class');
    if (checkError(clsRes)) {
      onDefer && onDefer();
      return clsRes;
    }

    if (!this.javaObj) {
      this.getJavaObject();
    }

    // has static initializer
    if (this.methods['<clinit>()V']) {
      this.status = CLASS_STATUS.INITIALIZING;
      onDefer && onDefer();
      thread.invokeStackFrame(
        new InternalStackFrame(
          this,
          this.methods['<clinit>()V'],
          0,
          [],
          () => (this.status = CLASS_STATUS.INITIALIZED)
        )
      );
      return { isDefer: true };
    }

    this.status = CLASS_STATUS.INITIALIZED;
    return { result: this };
  }

  getJavaObject(): JvmObject {
    if (!this.javaObj) {
      const clsCls = (
        this.loader.getClassRef('java/lang/Class') as SuccessResult<ClassData>
      ).result;

      this.javaObj = new JvmObject(clsCls);
      this.javaObj.putNativeField('classRef', this);
      this.javaObj._putField(
        'classLoader',
        'Ljava/lang/ClassLoader;',
        'java/lang/Class',
        this.loader.getJavaObject()
      );
    }

    return this.javaObj;
  }

  getFields(): Field[] {
    let result: Field[] = [];

    if (this.superClass) {
      result = this.superClass.getFields();
    }

    if (this.interfaces.length === 0) {
      for (const inter of this.interfaces) {
        result = result.concat(inter.getFields());
      }
    }

    for (const field of Object.values(this.fields)) {
      result.push(field);
    }

    return result;
  }

  resolveClass(toResolve: string): ImmediateResult<ClassData> {
    const res = this.loader.getClassRef(toResolve);
    if (checkError(res)) {
      return res;
    }
    const cls = res.result;

    if (!cls.checkPublic() && cls.getPackageName() !== this.getPackageName()) {
      return { exceptionCls: 'java/lang/IllegalAccessError', msg: '' };
    }

    return res;
  }
  /**
   * 5.4.3 method resolution
   */

  /**
   * 5.4.3.3.2 Method resolution in superclass
   * @param methodName
   * @returns MethodRef, if any
   */
  private _resolveMethodSuper(methodName: string): Method | null {
    // SKIPPED: If C declares exactly one method with the name specified by the method reference,
    // and the declaration is a signature polymorphic method (§2.9.3), then method lookup succeeds.

    // Otherwise, if C declares a method with the name and descriptor specified by the method reference, method lookup succeeds.
    if (this.methods[methodName]) {
      return this.methods[methodName];
    }

    // Otherwise, if C has a superclass, step 2 of method resolution is recursively invoked on the direct superclass of C.
    const superClass = this.getSuperClass();
    return superClass ? superClass._resolveMethodSuper(methodName) : null;
  }

  /**
   * 5.4.3.3.2 Method resolution in superinterfaces
   * @param methodName
   * @returns MethodRef, if any
   */
  private _resolveMethodInterface(methodName: string): Method | null {
    let abstractMethod = null;
    for (const inter of this.interfaces) {
      let method = inter.getMethod(methodName);

      if (!method) {
        method = inter._resolveMethodInterface(methodName);
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
    methodKey: string,
    accessingClass: ClassData
  ): ImmediateResult<Method> {
    // Otherwise, method resolution attempts to locate the referenced method in C and its superclasses
    let result = this._resolveMethodSuper(methodKey);
    if (result !== null) {
      const res = { result: result };
      const method = res.result;
      if (!method.checkAccess(accessingClass, this)) {
        return { exceptionCls: 'java/lang/IllegalAccessError', msg: '' };
      }
      return res;
    }

    // Otherwise, method resolution attempts to locate the referenced method in the superinterfaces of the specified class C
    result = this._resolveMethodInterface(methodKey);
    if (result !== null) {
      if (!result.checkAccess(accessingClass, this)) {
        return { exceptionCls: 'java/lang/IllegalAccessError', msg: '' };
      }
      return { result: result };
    }
    // If method lookup fails, method resolution throws a NoSuchMethodError
    return { exceptionCls: 'java/lang/NoSuchMethodError', msg: '' };
  }

  /**
   * Getters
   */
  getLoader(): AbstractClassLoader {
    return this.loader;
  }

  getConstant(constantIndex: number): Constant {
    const constItem = this.constantPool.get(constantIndex);
    return constItem;
  }

  getAccessFlags(): number {
    return this.accessFlags;
  }

  getClassname(): string {
    return this.thisClass;
  }

  getPackageName(): string {
    return this.packageName;
  }

  getInstanceFields(): {
    [fieldName: string]: Field;
  } {
    if (this.instanceFields !== null) {
      return this.instanceFields;
    }

    const res = this.superClass?.getInstanceFields() ?? {};
    this.interfaces?.forEach(inter => {
      const fields = inter.getInstanceFields();
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

  getSuperClass(): ClassData | null {
    return this.superClass;
  }

  getInterfaces() {
    return this.interfaces;
  }

  private _checkOverrides(overrideMethod: Method, parentMethod: Method) {
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

  private _lookupMethodSuper(
    methodName: string,
    resolvedMethod: Method,
    checkOverride?: boolean
  ): Method | null {
    // If C contains a declaration for an instance method m that overrides the resolved method, then m is the method to be invoked.
    if (
      this.methods[methodName] &&
      (!checkOverride ||
        this._checkOverrides(this.methods[methodName], resolvedMethod))
    ) {
      return this.methods[methodName];
    }

    // Otherwise, if C has a superclass, step 2 of method resolution is recursively invoked on the direct superclass of C.
    const superClass = this.getSuperClass();
    return superClass ? superClass._resolveMethodSuper(methodName) : null;
  }

  private _lookupMethodInterface(methodName: string): ImmediateResult<Method> {
    let res: Method | null = null;
    for (const inter of this.interfaces) {
      let method = inter.getMethod(methodName);

      if (!method) {
        const interRes = inter._lookupMethodInterface(methodName);
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
            exceptionCls: 'java/lang/IncompatibleClassChangeError',
            msg: '',
          };
        }
        res = method;
      }
    }

    if (res) {
      return { result: res };
    }
    return { exceptionCls: 'java/lang/AbstractMethodError', msg: '' };
  }

  lookupMethod(
    methodName: string,
    resolvedMethod: Method,
    checkOverride?: boolean,
    checkInterface?: boolean
  ): ImmediateResult<Method> {
    // If C contains a declaration for an instance method m that overrides
    // the resolved method, then m is the method to be invoked.
    let methodRef = this._lookupMethodSuper(
      methodName,
      resolvedMethod,
      checkOverride
    );
    if (methodRef) {
      if (checkInterface && !methodRef.checkPublic()) {
        return { exceptionCls: 'java/lang/IllegalAccessError', msg: '' };
      }

      if (methodRef.checkAbstract()) {
        return { exceptionCls: 'java/lang/AbstractMethodError', msg: '' };
      }
      return { result: methodRef };
    }

    return this._lookupMethodInterface(methodName);
  }

  getMethod(methodName: string): Method | null {
    return this.methods[methodName] ?? null;
  }

  getMethods() {
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

  getFieldRef(fieldName: string): Field | null {
    if (this.fields[fieldName]) {
      return this.fields[fieldName];
    }

    for (let i = 0; i < this.interfaces.length; i++) {
      let inter = this.interfaces[i];
      const field = inter.getFieldRef(fieldName);

      if (field) {
        return field;
      }
    }

    const superClass = this.getSuperClass();

    if (superClass === null) {
      return null;
    }

    return superClass.getFieldRef(fieldName);
  }

  getBootstrapMethod(methodIndex: number) {
    if (!this.bootstrapMethods) {
      throw new Error('No bootstrap methods');
    }

    return this.bootstrapMethods.bootstrapMethods[methodIndex];
  }

  /**
   * Setters
   */

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

  instantiate(): JvmObject {
    return new JvmObject(this);
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

  getAnonymousInnerId(): number {
    return this.anonymousInnerId++;
  }

  nestMember(cls: ClassData) {
    this.nestedMembers.push(cls);
  }

  nestHost(cls: ClassData) {
    this.nestedHost = cls;
  }

  getNestedMembers(): ClassData[] {
    return this.nestedMembers;
  }

  getNestedHost(): ClassData {
    return this.nestedHost;
  }
}
