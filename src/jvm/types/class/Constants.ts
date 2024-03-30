import { CONSTANT_TAG } from '../../../ClassFile/constants/constants'
import AbstractClassLoader from '../../ClassLoader/AbstractClassLoader'
import { MethodHandleReferenceKind } from '../../constants'
import { InternalStackFrame } from '../../stackframe'
import Thread from '../../thread'
import { parseMethodDescriptor, js2jString, parseFieldDescriptor } from '../../utils'
import { Result, ErrorResult, ImmediateResult, SuccessResult, ResultType } from '../Result'
import { JvmArray } from '../reference/Array'
import { JvmObject, JavaType } from '../reference/Object'
import * as info from '../../../ClassFile/types/constants'
import { BootstrapMethod } from './Attributes'
import { ClassData, ReferenceClassData, ArrayClassData } from './ClassData'
import { Field } from './Field'
import { Method } from './Method'

export abstract class Constant {
  private tag: CONSTANT_TAG
  protected cls: ClassData
  protected isResolved: boolean = true

  constructor(tag: CONSTANT_TAG, cls: ClassData) {
    this.cls = cls
    this.tag = tag
  }

  public resolve(_thread?: Thread, _loader?: AbstractClassLoader, ..._args: any[]): Result<any> {
    return { status: ResultType.SUCCESS, result: this.get() }
  }

  public abstract get(): any

  public getTag(): CONSTANT_TAG {
    return this.tag
  }
}

// #region static values

export class ConstantInteger extends Constant {
  private value: number

  constructor(cls: ClassData, value: number) {
    super(CONSTANT_TAG.Integer, cls)
    this.value = value
  }

  static check(c: Constant): c is ConstantInteger {
    return c.getTag() === CONSTANT_TAG.Integer
  }

  public get(): number {
    return this.value
  }
}

export class ConstantFloat extends Constant {
  private value: number

  constructor(cls: ClassData, value: number) {
    super(CONSTANT_TAG.Float, cls)
    this.value = value
  }

  static check(c: Constant): c is ConstantFloat {
    return c.getTag() === CONSTANT_TAG.Float
  }

  public get(): number {
    return this.value
  }

  static fromInfo(cls: ClassData, constant: info.ConstantFloatInfo): ConstantFloat {
    return new ConstantFloat(cls, constant.value)
  }
}

export class ConstantLong extends Constant {
  private value: bigint

  constructor(cls: ClassData, value: bigint) {
    super(CONSTANT_TAG.Long, cls)
    this.value = value
  }

  static check(c: Constant): c is ConstantLong {
    return c.getTag() === CONSTANT_TAG.Long
  }

  public get(): bigint {
    return this.value
  }

  static fromInfo(cls: ClassData, constant: info.ConstantLongInfo): ConstantLong {
    return new ConstantLong(cls, constant.value)
  }
}

export class ConstantDouble extends Constant {
  private value: number

  constructor(cls: ClassData, value: number) {
    super(CONSTANT_TAG.Double, cls)
    this.value = value
  }

  static check(c: Constant): c is ConstantDouble {
    return c.getTag() === CONSTANT_TAG.Double
  }

  public get(): number {
    return this.value
  }

  static fromInfo(cls: ClassData, constant: info.ConstantDoubleInfo): ConstantDouble {
    return new ConstantDouble(cls, constant.value)
  }
}

export class ConstantUtf8 extends Constant {
  private value: string

  constructor(cls: ClassData, value: string) {
    super(CONSTANT_TAG.Utf8, cls)
    this.value = value
  }

  static check(c: Constant): c is ConstantUtf8 {
    return c.getTag() === CONSTANT_TAG.Utf8
  }

  public get(): string {
    return this.value
  }

  static fromInfo(cls: ClassData, constant: info.ConstantUtf8Info): ConstantUtf8 {
    return new ConstantUtf8(cls, constant.value)
  }
}
// #endregion

/**
 * adapted from {@link https://github.com/plasma-umass/doppio/blob/master/src/util.ts#L704}
 * @param thread
 * @param loader
 * @param descriptor
 * @param cb
 * @returns
 */
function createMethodType(
  thread: Thread,
  loader: AbstractClassLoader,
  descriptor: string,
  cb: (mt: JvmObject) => void
): Result<JvmObject> {
  const mhnRes = loader.getClass('java/lang/invoke/MethodHandleNatives')
  if (mhnRes.status === ResultType.ERROR) {
    return mhnRes
  }

  const mhnCls = mhnRes.result
  const result = mhnCls.initialize(thread)
  if (result.status !== ResultType.SUCCESS) {
    if (result.status === ResultType.ERROR) {
      return result
    }
    return { status: ResultType.DEFER }
  }

  // #region create Class object array
  const classes = parseMethodDescriptor(descriptor)
  const classArray: JvmObject[] = []
  let error: ErrorResult | null = null
  const resolver = ({ type, referenceCls }: { type: string; referenceCls: string | undefined }) => {
    // primitive
    if (!referenceCls) {
      const pClsRes = loader.getPrimitiveClass(type)
      classArray.push(pClsRes.getJavaObject())
      return
    }

    const clsRes = loader.getClass(referenceCls)
    if (clsRes.status !== ResultType.SUCCESS) {
      if (!error) {
        error = clsRes
      }
      return
    }
    classArray.push(clsRes.result.getJavaObject())
  }
  classes.args.forEach(resolver)
  resolver(classes.ret)
  if (error) {
    return error
  }

  const clArrRes = loader.getClass('[Ljava/lang/Class;')
  if (clArrRes.status === ResultType.ERROR) {
    if (!error) {
      return clArrRes
    }
    return error
  }
  const paramClsArr = clArrRes.result.instantiate() as JvmArray
  const retCls = classArray.pop()
  paramClsArr.initialize(thread, classArray.length, classArray)
  // #endregion

  // #region create MethodType object
  const toInvoke = mhnCls.getMethod(
    'findMethodHandleType(Ljava/lang/Class;[Ljava/lang/Class;)Ljava/lang/invoke/MethodType;'
  )
  if (!toInvoke) {
    return {
      status: ResultType.ERROR,
      exceptionCls: 'java/lang/NoSuchMethodError',
      msg: 'findMethodHandleType(Ljava/lang/Class;[Ljava/lang/Class;)Ljava/lang/invoke/MethodType;'
    }
  }
  thread.invokeStackFrame(
    new InternalStackFrame(mhnCls as ReferenceClassData, toInvoke, 0, [retCls, paramClsArr], cb)
  )
  // #endregion

  return { status: ResultType.DEFER }
}

// #region utf8 dependency

export class ConstantString extends Constant {
  private str: ConstantUtf8
  private result?: Result<JvmObject>

  constructor(cls: ClassData, str: ConstantUtf8) {
    super(CONSTANT_TAG.String, cls)
    this.str = str
    this.isResolved = false
  }

  static check(c: Constant): c is ConstantString {
    return c.getTag() === CONSTANT_TAG.String
  }

  public resolve(thread: Thread, loader: AbstractClassLoader): Result<JvmObject> {
    if (this.result) {
      return this.result
    }

    const strVal = this.str.get()
    this.result = {
      status: ResultType.SUCCESS,
      result: js2jString(loader, strVal)
    }
    return this.result
  }

  public get() {
    if (!this.result || this.result.status !== ResultType.SUCCESS) {
      throw new Error('Resolution incomplete or failed')
    }

    return this.result.result
  }
}

export class ConstantNameAndType extends Constant {
  private name: ConstantUtf8
  private descriptor: ConstantUtf8

  constructor(cls: ClassData, name: ConstantUtf8, descriptor: ConstantUtf8) {
    super(CONSTANT_TAG.NameAndType, cls)
    this.name = name
    this.descriptor = descriptor
  }

  static check(c: Constant): c is ConstantNameAndType {
    return c.getTag() === CONSTANT_TAG.NameAndType
  }

  public get(): { name: string; descriptor: string } {
    return { name: this.name.get(), descriptor: this.descriptor.get() }
  }
}

export class ConstantMethodType extends Constant {
  private descriptor: ConstantUtf8
  private result?: Result<JvmObject>

  constructor(cls: ClassData, descriptor: ConstantUtf8) {
    super(CONSTANT_TAG.MethodType, cls)
    this.descriptor = descriptor
    this.isResolved = false
  }

  static check(c: Constant): c is ConstantMethodType {
    return c.getTag() === CONSTANT_TAG.MethodType
  }

  public get(): JvmObject {
    if (this.result && this.result.status === ResultType.SUCCESS) {
      return this.result.result
    }
    throw new Error('Resolution incomplete or failed')
  }

  public resolve(thread: Thread): Result<JvmObject> {
    if (this.result) {
      return this.result
    }
    const descriptor = this.descriptor.get()
    const loader = this.cls.getLoader()
    return createMethodType(thread, loader, descriptor, mt => {
      this.result = { status: ResultType.SUCCESS, result: mt }
    })
  }

  getDescriptor() {
    return this.descriptor.get()
  }
}

export class ConstantClass extends Constant {
  private className: ConstantUtf8
  private result?: ImmediateResult<ClassData>

  constructor(cls: ClassData, className: ConstantUtf8) {
    super(CONSTANT_TAG.Class, cls)
    this.className = className
  }

  static check(c: Constant): c is ConstantClass {
    return c.getTag() === CONSTANT_TAG.Class
  }

  public resolve(): ImmediateResult<ClassData> {
    // resolved before
    if (this.result) {
      return this.result
    }
    const res = this.cls.getLoader().getClass(this.className.get())
    if (res.status === ResultType.ERROR) {
      this.result = res
      return this.result
    }

    const cls = res.result
    if (!cls.checkPublic() && cls.getPackageName() !== this.cls.getPackageName()) {
      this.result = {
        status: ResultType.ERROR,
        exceptionCls: 'java/lang/IllegalAccessError',
        msg: ''
      }
    } else {
      this.result = { status: ResultType.SUCCESS, result: cls }
    }

    return this.result
  }

  public getClassName(): string {
    return this.className.get()
  }

  public get() {
    if (!this.result) {
      this.resolve()
    }

    if (!this.result || this.result.status !== ResultType.SUCCESS) {
      throw new Error('Resolution incomplete or failed')
    }

    return this.result.result
  }

  static asResolved(
    cls: ClassData,
    className: ConstantUtf8,
    referringClass: ClassData
  ): ConstantClass {
    const constant = new ConstantClass(cls, className)
    constant.result = { status: ResultType.SUCCESS, result: referringClass }
    return constant
  }
}

// #endregion

// #region name and type dependency
export class ConstantInvokeDynamic extends Constant {
  private bootstrapMethodAttrIndex: number
  private nameAndType: ConstantNameAndType
  private methodTypeObj?: JvmObject
  private methodNameString?: JvmObject
  private result?: Result<Array<JvmObject>>

  constructor(cls: ClassData, bootstrapMethodAttrIndex: number, nameAndType: ConstantNameAndType) {
    super(CONSTANT_TAG.MethodType, cls)
    this.bootstrapMethodAttrIndex = bootstrapMethodAttrIndex
    this.nameAndType = nameAndType
    this.isResolved = false
  }

  static check(c: Constant): c is ConstantMethodType {
    return c.getTag() === CONSTANT_TAG.InvokeDynamic
  }

  public get(): JvmObject {
    throw new Error('ConstantInvokeDynamic: get Method not implemented.')
  }

  /**
   * adapted from {@link https://github.com/plasma-umass/doppio/blob/master/src/ConstantPool.ts#L893}
   * @param thread
   * @returns
   */
  public resolve(thread: Thread): Result<Array<JvmObject>> {
    if (this.result) {
      return this.result
    }

    // Get MethodType from NameAndType
    if (!this.methodTypeObj) {
      // resolve nameAndType
      const nameAndTypeRes = this.nameAndType.get()
      this.methodNameString = thread.getJVM().getInternedString(nameAndTypeRes.name)

      createMethodType(thread, this.cls.getLoader(), nameAndTypeRes.descriptor, mt => {
        this.methodTypeObj = mt
      })

      return { status: ResultType.DEFER }
    }
    const loader = this.cls.getLoader()

    // #region bootstrap method
    const bootstrapMethod = (this.cls as ReferenceClassData).getBootstrapMethod(
      this.bootstrapMethodAttrIndex
    ) as BootstrapMethod

    // resolve bootstrap method handle
    const bootstrapMhConst = bootstrapMethod.bootstrapMethodRef
    const mhRes = bootstrapMhConst.resolve(thread)
    if (mhRes.status !== ResultType.SUCCESS) {
      if (mhRes.status === ResultType.ERROR) {
        this.result = mhRes
      }
      return mhRes
    }
    const bootstrapMhn = bootstrapMhConst.get()

    // resolve args
    const bootstrapArgs = bootstrapMethod.bootstrapArguments
    const resolvedArgs = []
    let shouldDefer = false
    for (const constant of bootstrapArgs) {
      const constRes = constant.resolve(thread, loader)
      if (constRes.status === ResultType.DEFER) {
        shouldDefer = true
      }
      if (constRes.status === ResultType.ERROR) {
        this.result = constRes
        return constRes
      }
      if (constRes.status === ResultType.SUCCESS) {
        resolvedArgs.push(constRes.result)
      }
    }
    if (shouldDefer) {
      return { status: ResultType.DEFER }
    }
    // #endregion

    // #region get arguments
    const objArrRes = loader.getClass('[Ljava/lang/Object;')
    if (objArrRes.status === ResultType.ERROR) {
      return {
        status: ResultType.ERROR,
        exceptionCls: 'java/lang/ClassNotFoundException',
        msg: '[Ljava/lang/Object;'
      }
    }
    const arrCls = objArrRes.result as ArrayClassData
    const argsArr = arrCls.instantiate()
    argsArr.initArray(bootstrapArgs.length, resolvedArgs)

    const appendixArr = arrCls.instantiate()
    appendixArr.initArray(1)
    // #endregion

    // #region run bootstrap method
    const mhnRes = loader.getClass('java/lang/invoke/MethodHandleNatives')
    if (mhnRes.status === ResultType.ERROR) {
      return {
        status: ResultType.ERROR,
        exceptionCls: 'java/lang/ClassNotFoundException',
        msg: 'java/lang/invoke/MethodHandleNatives'
      }
    }
    const mhn = mhnRes.result
    const mhnInitRes = mhn.initialize(thread)
    if (mhnInitRes.status !== ResultType.SUCCESS) {
      return mhnInitRes
    }

    const linkCssMethod = mhn.getMethod(
      'linkCallSite(Ljava/lang/Object;Ljava/lang/Object;Ljava/lang/Object;Ljava/lang/Object;Ljava/lang/Object;[Ljava/lang/Object;)Ljava/lang/invoke/MemberName;'
    )
    if (!linkCssMethod) {
      this.result = {
        status: ResultType.ERROR,
        exceptionCls: 'java/lang/NoSuchMethodError',
        msg: 'linkCallSite(Ljava/lang/Object;Ljava/lang/Object;Ljava/lang/Object;Ljava/lang/Object;Ljava/lang/Object;[Ljava/lang/Object;)Ljava/lang/invoke/MemberName;'
      }
      return this.result
    }

    this.cls.getJavaObject(),
      thread.invokeStackFrame(
        new InternalStackFrame(
          mhn,
          linkCssMethod,
          0,
          [
            this.cls.getJavaObject(),
            bootstrapMhn,
            this.methodNameString,
            this.methodTypeObj,
            argsArr,
            appendixArr
          ],
          css => {
            this.result = {
              status: ResultType.SUCCESS,
              result: [css, appendixArr.get(0)]
            }
          }
        )
      )
    return { status: ResultType.DEFER }
    // #endregion
  }

  public getNameAndType() {
    return this.nameAndType
  }
}

export class ConstantFieldref extends Constant {
  private classConstant: ConstantClass
  private nameAndTypeConstant: ConstantNameAndType
  private result?: Result<Field>

  constructor(
    cls: ClassData,
    classConstant: ConstantClass,
    nameAndTypeConstant: ConstantNameAndType
  ) {
    super(CONSTANT_TAG.Fieldref, cls)
    this.classConstant = classConstant
    this.nameAndTypeConstant = nameAndTypeConstant
  }

  public get() {
    throw new Error('ConstantFieldref.get: Method not implemented.')
  }

  static check(c: Constant): c is ConstantFieldref {
    return c.getTag() === CONSTANT_TAG.Fieldref
  }

  public resolve(): Result<Field> {
    if (this.result) {
      return this.result
    }

    // resolve class
    const clsRes = this.classConstant.resolve()
    if (clsRes.status !== ResultType.SUCCESS) {
      if (clsRes.status === ResultType.ERROR) {
        this.result = clsRes
        return this.result
      }
      // Should not happen
      throw new Error('Class resolution should not defer')
    }
    const fieldClass = clsRes.result
    const { name, descriptor } = this.nameAndTypeConstant.get()
    const fieldRef = fieldClass.lookupField(name + descriptor)

    if (fieldRef === null) {
      this.result = {
        status: ResultType.ERROR,
        exceptionCls: 'java/lang/NoSuchFieldError',
        msg: ''
      }
      return this.result
    }

    this.result = { status: ResultType.SUCCESS, result: fieldRef }
    return this.result
  }
}

/**
 * Resolves the vmtarget, appendix, and appendix for invoke and invokeExact
 * adapted from {@link https://github.com/plasma-umass/doppio/blob/master/src/util.ts#L704}
 */
function resolveSignaturePolymorphic(
  thread: Thread,
  symbolClass: ClassData,
  selfClass: ClassData,
  polyMethod: Method,
  name: string,
  descriptor: string,
  onError: (err?: ErrorResult) => void,
  onSuccess: (method: Method, appendix?: JvmObject, memberName?: JvmObject) => void
) {
  // Check signature polymorphic methods
  const polyName = polyMethod.getName()
  // invokebasic
  if (polyName !== 'invoke' && polyName !== 'invokeExact') {
    onSuccess(polyMethod)
    return
  }
  const loader = selfClass.getLoader()

  const mhnResolution = loader.getClass('java/lang/invoke/MethodHandleNatives')
  if (mhnResolution.status === ResultType.ERROR) {
    return onError(mhnResolution)
  }
  const objArrResolution = loader.getClass('[Ljava/lang/Object;')
  if (objArrResolution.status === ResultType.ERROR) {
    return onError(objArrResolution)
  }
  const clsArrResolution = loader.getClass('[Ljava/lang/Class;')
  if (clsArrResolution.status === ResultType.ERROR) {
    return onError(clsArrResolution)
  }

  const mhn = mhnResolution.result
  const objArrCls = objArrResolution.result as ArrayClassData
  const clsArrCls = clsArrResolution.result as ArrayClassData
  const ptypes = clsArrCls.instantiate()
  const appendix = objArrCls.instantiate()
  appendix.initArray(1)
  const mhnInitResult = mhn.initialize(thread)
  if (mhnInitResult.status !== ResultType.SUCCESS) {
    if (mhnInitResult.status === ResultType.ERROR) {
      return onError(mhnInitResult)
    }
    return
  }
  const findMHType = mhn.getMethod(
    'findMethodHandleType(Ljava/lang/Class;[Ljava/lang/Class;)Ljava/lang/invoke/MethodType;'
  )
  if (!findMHType) {
    return onError({
      status: ResultType.ERROR,
      exceptionCls: 'java/lang/NoSuchMethodError',
      msg: 'findMethodHandleType(Ljava/lang/Class;[Ljava/lang/Class;)Ljava/lang/invoke/MethodType;'
    })
  }
  const descriptorClasses = parseMethodDescriptor(descriptor)
  let argResolutionError: ErrorResult | null = null
  const argsCls = descriptorClasses.args.map(arg => {
    if (arg.type === JavaType.reference || arg.type === JavaType.array) {
      const loadResult = loader.getClass(arg.referenceCls as string)
      if (loadResult.status === ResultType.ERROR) {
        argResolutionError = loadResult
        return null
      }
      return loadResult.result.getJavaObject()
    }
    return loader.getPrimitiveClass(arg.type).getJavaObject()
  })
  if (argResolutionError) {
    return onError(argResolutionError)
  }
  let rtype: JvmObject
  if (descriptorClasses.ret.referenceCls) {
    const loadResult = loader.getClass(descriptorClasses.ret.referenceCls)
    if (loadResult.status === ResultType.ERROR) {
      return onError(loadResult)
    }
    rtype = loadResult.result.getJavaObject()
  } else {
    rtype = loader.getPrimitiveClass(descriptorClasses.ret.type).getJavaObject()
  }
  ptypes.initArray(argsCls.length, argsCls)

  const linkMethod = mhn.getMethod(
    'linkMethod(Ljava/lang/Class;ILjava/lang/Class;Ljava/lang/String;Ljava/lang/Object;[Ljava/lang/Object;)Ljava/lang/invoke/MemberName;'
  )
  if (!linkMethod) {
    return onError({
      status: ResultType.ERROR,
      exceptionCls: 'java/lang/NoSuchMethodError',
      msg: 'linkMethod(Ljava/lang/Class;ILjava/lang/Class;Ljava/lang/String;Ljava/lang/Object;[Ljava/lang/Object;)Ljava/lang/invoke/MemberName;'
    })
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
      appendix
    ],
    (mn, err) => {
      if (err) {
        return
      }
      onSuccess(polyMethod, appendix.get(0), mn)
    }
  )
  thread.invokeStackFrame(linkFrame)
  thread.invokeStackFrame(
    new InternalStackFrame(mhn, findMHType, 0, [rtype, ptypes], (mt, err) => {
      if (err) {
        return
      }
      linkFrame.locals[4] = mt
    })
  )
}

export class ConstantMethodref extends Constant {
  private classConstant: ConstantClass
  private nameAndTypeConstant: ConstantNameAndType
  private result?: Result<Method>
  private appendix?: any
  private memberName?: JvmObject

  constructor(
    cls: ClassData,
    classConstant: ConstantClass,
    nameAndTypeConstant: ConstantNameAndType
  ) {
    super(CONSTANT_TAG.Methodref, cls)
    this.classConstant = classConstant
    this.nameAndTypeConstant = nameAndTypeConstant
  }

  public get() {
    throw new Error('ConstantMethodref: get Method not implemented.')
  }

  static check(c: Constant): c is ConstantMethodref {
    return c.getTag() === CONSTANT_TAG.Methodref
  }

  public resolve(thread: Thread): Result<Method> {
    // 5.4.3 if initial attempt to resolve a symbolic reference fails
    // then subsequent attempts to resolve the reference always fail with the same error
    if (this.result) {
      return this.result
    }

    // resolve class
    const clsResResult = this.classConstant.resolve()
    if (clsResResult.status !== ResultType.SUCCESS) {
      if (clsResResult.status === ResultType.ERROR) {
        this.result = clsResResult
        return this.result
      }
      return { status: ResultType.DEFER }
    }
    const symbolClass = clsResResult.result

    // resolve name and type
    if (this.nameAndTypeConstant.resolve().status !== ResultType.SUCCESS) {
      throw new Error('Name and type resolution failed')
    }

    // 5.4.3.3. Method Resolution
    // 1. If C is an interface, method resolution throws an IncompatibleClassChangeError
    if (symbolClass.checkInterface()) {
      this.result = {
        status: ResultType.ERROR,
        exceptionCls: 'java/lang/IncompatibleClassChangeError',
        msg: ''
      }
      return this.result
    }

    const nt = this.nameAndTypeConstant.get()

    const resolutionResult = symbolClass.resolveMethod(nt.name, nt.descriptor, this.cls)

    if (resolutionResult.status === ResultType.ERROR) {
      this.result = resolutionResult
      return this.result
    }

    const resolvedMethod = resolutionResult.result
    if (resolvedMethod.checkSignaturePolymorphic()) {
      const onSuccess = (method: Method, appendix?: JvmObject, memberName?: JvmObject) => {
        this.appendix = appendix ?? null
        this.memberName = memberName
        this.result = { status: ResultType.SUCCESS, result: method }
      }
      const onError = (err?: ErrorResult) => {
        if (!err) {
          this.result = resolutionResult
        }
        this.result = err
      }
      resolveSignaturePolymorphic(
        thread,
        symbolClass,
        this.cls,
        resolvedMethod,
        nt.name,
        nt.descriptor,
        onError,
        onSuccess
      )
      if (this.result) {
        return this.result
      }
      return { status: ResultType.DEFER }
    }

    this.result = resolutionResult
    return this.result
  }

  public getPolymorphic() {
    if (!this.result || this.result.status !== ResultType.SUCCESS) {
      throw new Error('Not resolved')
    }

    return {
      appendix: this.appendix,
      memberName: this.memberName,
      method: this.result.result,
      originalDescriptor: this.nameAndTypeConstant.get().descriptor
    }
  }

  public getNameAndType() {
    return this.nameAndTypeConstant.get()
  }

  public getClassName() {
    return this.classConstant.getClassName()
  }

  static asResolved(
    cls: ClassData,
    classConstant: ConstantClass,
    nameAndTypeConstant: ConstantNameAndType,
    method: Method
  ): ConstantMethodref {
    const constant = new ConstantMethodref(cls, classConstant, nameAndTypeConstant)
    constant.result = { status: ResultType.SUCCESS, result: method }
    return constant
  }
}

export class ConstantInterfaceMethodref extends Constant {
  private classConstant: ConstantClass
  private nameAndTypeConstant: ConstantNameAndType
  private result?: Result<Method>

  constructor(
    cls: ClassData,
    classConstant: ConstantClass,
    nameAndTypeConstant: ConstantNameAndType
  ) {
    super(CONSTANT_TAG.InterfaceMethodref, cls)
    this.classConstant = classConstant
    this.nameAndTypeConstant = nameAndTypeConstant
  }

  public get() {
    throw new Error('ConstantInterfaceMethodref: get Method not implemented.')
  }

  static check(c: Constant): c is ConstantInterfaceMethodref {
    return c.getTag() === CONSTANT_TAG.InterfaceMethodref
  }

  public resolve(): Result<Method> {
    // 5.4.3 if initial attempt to resolve a symbolic reference fails
    // then subsequent attempts to resolve the reference always fail with the same error
    if (this.result) {
      return this.result
    }

    // resolve class
    const clsResResult = this.classConstant.resolve()
    if (clsResResult.status !== ResultType.SUCCESS) {
      if (clsResResult.status === ResultType.ERROR) {
        this.result = clsResResult
        return this.result
      }
      return { status: ResultType.DEFER }
    }
    const symbolClass = clsResResult.result

    // resolve name and type
    if (this.nameAndTypeConstant.resolve().status !== ResultType.SUCCESS) {
      throw new Error('Name and type resolution failed')
    }

    // 5.4.3.4. Interface Method Resolution
    // 1. If C is not an interface, interface method resolution throws an IncompatibleClassChangeError.
    if (!symbolClass.checkInterface()) {
      this.result = {
        status: ResultType.ERROR,
        exceptionCls: 'java/lang/IncompatibleClassChangeError',
        msg: ''
      }
      return this.result
    }

    const nt = this.nameAndTypeConstant.get()
    const resolutionResult = symbolClass.resolveMethod(nt.name, nt.descriptor, this.cls)

    this.result = resolutionResult
    return this.result
  }

  public getPolymorphic(): {
    appendix: any
    memberName?: JvmObject
    method: Method
    originalDescriptor: string
  } {
    throw new Error('Interface method not signature polymorphic')
  }

  public getNameAndType() {
    return this.nameAndTypeConstant.get()
  }

  public getClassName() {
    return this.classConstant.getClassName()
  }

  static asResolved(
    cls: ClassData,
    classConstant: ConstantClass,
    nameAndTypeConstant: ConstantNameAndType,
    method: Method
  ): ConstantInterfaceMethodref {
    const constant = new ConstantInterfaceMethodref(cls, classConstant, nameAndTypeConstant)
    constant.result = { status: ResultType.SUCCESS, result: method }
    return constant
  }
}

// #endregion

// #region rest
export class ConstantMethodHandle extends Constant {
  private referenceKind: info.REFERENCE_KIND
  private reference: ConstantFieldref | ConstantMethodref | ConstantInterfaceMethodref
  private result?: Result<JvmObject>

  constructor(
    cls: ClassData,
    referenceKind: info.REFERENCE_KIND,
    reference: ConstantFieldref | ConstantMethodref | ConstantInterfaceMethodref
  ) {
    super(CONSTANT_TAG.MethodHandle, cls)
    this.referenceKind = referenceKind
    this.reference = reference
    this.isResolved = false
  }

  static check(c: Constant): c is ConstantMethodHandle {
    return c.getTag() === CONSTANT_TAG.MethodHandle
  }

  public get(): JvmObject {
    if (this.result && this.result.status === ResultType.SUCCESS) {
      return this.result.result
    }
    throw new Error('methodhandle not resolved!')
  }

  /**
   * adapted from {@link https://github.com/plasma-umass/doppio/blob/master/src/ConstantPool.ts#L1118}
   * @param thread
   * @returns
   */
  public resolve(thread: Thread): Result<JvmObject> {
    if (this.result) {
      return this.result
    }

    // #region Step 1: resolve field/method
    const refRes = this.reference.resolve(thread)
    if (refRes.status !== ResultType.SUCCESS) {
      if (refRes.status === ResultType.ERROR) {
        this.result = refRes
        return this.result
      }
      return { status: ResultType.DEFER }
    }
    const ref = refRes.result
    // #endregion

    // #region Step 3: callback lambda
    const cb = (obj: JvmObject) => {
      // MethodHandleNatives should be resolved by this time
      const mhnCls = (
        this.cls
          .getLoader()
          .getClass('java/lang/invoke/MethodHandleNatives') as SuccessResult<ReferenceClassData>
      ).result

      const method = mhnCls.getMethod(
        'linkMethodHandleConstant(Ljava/lang/Class;ILjava/lang/Class;Ljava/lang/String;Ljava/lang/Object;)Ljava/lang/invoke/MethodHandle;'
      )
      if (!method) {
        this.result = {
          status: ResultType.ERROR,
          exceptionCls: 'java/lang/NoSuchMethodError',
          msg: 'linkMethodHandleConstant(Ljava/lang/Class;ILjava/lang/Class;Ljava/lang/String;Ljava/lang/Object;)Ljava/lang/invoke/MethodHandle;'
        }
        return this.result
      }
      // Should intern string here, i.e. same string value same object
      const nameStr = thread.getJVM().getInternedString(ref.getName())

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
            obj
          ],
          (mh: JvmObject, err?: any) => {
            if (!mh || err) {
              thread.throwException(err)
            }
            this.result = { status: ResultType.SUCCESS, result: mh }
          }
        )
      )
      return { isDefer: true }
    }
    // #endregion

    // #region Step 2:resolve type
    if (Field.checkField(ref)) {
      // #region init MethodHandleNatives. MethodType initializes it already.
      const mhnRes = this.cls.getLoader().getClass('java/lang/invoke/MethodHandleNatives')
      if (mhnRes.status === ResultType.ERROR) {
        return mhnRes
      }

      const mhnCls = mhnRes.result
      const result = mhnCls.initialize(thread)
      if (result.status !== ResultType.SUCCESS) {
        return result
      }
      // #endregion

      const parsedField = parseFieldDescriptor(ref.getFieldDesc(), 0)
      if (!parsedField.referenceCls) {
        cb(this.cls.getLoader().getPrimitiveClass(parsedField.type).getJavaObject())
      } else {
        const fieldClsRes = this.cls.getLoader().getClass(parsedField.referenceCls)
        if (fieldClsRes.status === ResultType.ERROR) {
          this.result = fieldClsRes
          return this.result
        }
        cb(fieldClsRes.result.getJavaObject())
      }
    } else {
      const descriptor = ref.getDescriptor()
      const loader = this.cls.getLoader()

      return createMethodType(thread, loader, descriptor, cb)
    }
    // #endregion

    return { status: ResultType.DEFER }
  }

  public tempGetReference() {
    return this.reference
  }
}
// #endregion
