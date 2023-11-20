import { ClassFile } from "../../ClassFile/types";
import { CodeAttribute } from "../../ClassFile/types/attributes";
import { ConstantInfo, ConstantUtf8Info, ConstantClassInfo } from "../../ClassFile/types/constants";
import { MethodInfo } from "../../ClassFile/types/methods";
import AbstractSystem from "../utils/AbstractSystem";
import { ClassData } from "../types/class/ClassData";
import { MethodHandler } from "../types/class/Method";
import { JvmObject } from "../types/reference/Object";
import { ImmediateResult, checkError, checkSuccess } from "../utils/Result";
import { ACCESS_FLAGS as CLASS_FLAGS } from "../../ClassFile/types";


export default abstract class AbstractClassLoader {
  protected nativeSystem: AbstractSystem;
  protected classPath: string;
  protected loadedClasses: {
    [className: string]: ClassData;
  };
  parentLoader: AbstractClassLoader | null;

  constructor(
    nativeSystem: AbstractSystem,
    classPath: string,
    parentLoader: AbstractClassLoader | null
  ) {
    this.nativeSystem = nativeSystem;
    this.classPath = classPath;
    this.loadedClasses = {};
    this.parentLoader = parentLoader;
  }

  /**
   * Prepares the class data by checking jvm constraints.
   * @param cls class data to check
   * @returns Error, if any
   */
  protected prepareClass(cls: ClassFile): void | Error {
    return;
  }

  private _linkMethod(
    constantPool: ConstantInfo[],
    method: MethodInfo
  ): ImmediateResult<{
    method: MethodInfo;
    exceptionHandlers: MethodHandler[];
    code: CodeAttribute | null;
  }> {
    // get code attribute
    let code: CodeAttribute | null = null;
    for (const attr of method.attributes) {
      const attrname = (
        constantPool[attr.attributeNameIndex] as ConstantUtf8Info
      ).value;
      if (attrname === 'Code') {
        code = attr as CodeAttribute;
      }
    }

    const handlderTable: MethodHandler[] = [];
    if (code) {
      for (const handler of code.exceptionTable) {
        const ctIndex = handler.catchType;
        if (ctIndex === 0) {
          handlderTable.push({
            startPc: handler.startPc,
            endPc: handler.endPc,
            handlerPc: handler.handlerPc,
            catchType: null,
          });
          continue;
        }

        const catchType = constantPool[
          (constantPool[ctIndex] as ConstantClassInfo).nameIndex
        ] as ConstantUtf8Info;
        const ctRes = this.getClassRef(catchType.value);
        if (checkError(ctRes)) {
          return { exceptionCls: 'java/lang/NoClassDefFoundError', msg: '' };
        }
        const clsRef = ctRes.result;

        handlderTable.push({
          startPc: handler.startPc,
          endPc: handler.endPc,
          handlerPc: handler.handlerPc,
          catchType: clsRef,
        });
      }
    }

    return {
      result: {
        method,
        exceptionHandlers: handlderTable,
        code,
      },
    };
  }

  /**
   * Resolves symbolic references in the constant pool.
   * @param cls class data to resolve
   * @returns class data with resolved references
   */
  protected linkClass(cls: ClassFile): ClassData {
    const constantPool = cls.constantPool;
    const accessFlags = cls.accessFlags;

    // resolve classname
    const clsInfo = cls.constantPool[cls.thisClass] as ConstantClassInfo;
    const clsName = cls.constantPool[clsInfo.nameIndex] as ConstantUtf8Info;
    const thisClass = clsName.value;

    // resolve superclass
    let superClass = null;
    if (cls.superClass !== 0) {
      const superClassIndex = cls.constantPool[
        cls.superClass
      ] as ConstantClassInfo;
      const superClassName = cls.constantPool[
        superClassIndex.nameIndex
      ] as ConstantUtf8Info;
      const res = this.getClassRef(superClassName.value);

      if (checkError(res)) {
        throw new Error(res.exceptionCls);
      }

      superClass = res.result;
    }

    if ((accessFlags & CLASS_FLAGS.ACC_INTERFACE) !== 0 && !superClass) {
      // Some compilers set superclass to object by default.
      // We force it to be java/lang/Object if it's not set.
      // assume object is loaded at initialization.
      superClass = (this.getClassRef('java/lang/Object') as any)
        .result as ClassData;
    }

    // resolve interfaces
    const interfaces: ClassData[] = [];
    cls.interfaces.forEach(interfaceIndex => {
      const interfaceNameIdx = (
        cls.constantPool[interfaceIndex] as ConstantClassInfo
      ).nameIndex;
      const interfaceName = (
        cls.constantPool[interfaceNameIdx] as ConstantUtf8Info
      ).value;
      const res = this.getClassRef(interfaceName);
      if (checkError(res)) {
        throw new Error(res.exceptionCls);
      }
      interfaces.push(res.result);
    });

    const methods: {
      method: MethodInfo;
      exceptionHandlers: MethodHandler[];
      code: CodeAttribute | null;
    }[] = [];
    cls.methods.forEach(method => {
      const res = this._linkMethod(constantPool, method);
      if (checkError(res)) {
        throw new Error(res.exceptionCls);
      }
      const mData = res.result;
      methods.push(mData);
    });

    const attributes = cls.attributes;

    const data = new ClassData(
      constantPool,
      accessFlags,
      thisClass,
      superClass,
      interfaces,
      cls.fields,
      methods,
      attributes,
      this
    );
    return data;
  }

  /**
   * Adds the resolved class data to the memory area.
   * @param cls resolved class data
   */
  protected loadClass(cls: ClassData): ClassData {
    this.loadedClasses[cls.getClassname()] = cls;
    return cls;
  }

  protected _loadArrayClass(
    className: string,
    componentCls: ClassData
  ): ImmediateResult<ClassData> {
    // array classes should be loaded by bootstrap loader
    if (!this.parentLoader) {
      throw new Error('ClassLoader has no parent loader');
    }

    return this.parentLoader._loadArrayClass(className, componentCls);
  }

  protected _getClassRef(
    className: string,
    initiator: AbstractClassLoader
  ): ImmediateResult<ClassData> {
    if (this.loadedClasses[className]) {
      return { result: this.loadedClasses[className] };
    }

    // We might need the current loader to load its component class
    if (className.startsWith('[')) {
      const itemClsName = className.slice(1);
      let arrayObjCls;
      // link array component class
      if (itemClsName.startsWith('L')) {
        const itemRes = this._getClassRef(itemClsName.slice(1, -1), initiator);
        if (checkError(itemRes)) {
          return itemRes;
        }
        arrayObjCls = itemRes.result;
      } else if (itemClsName.startsWith('[')) {
        const itemRes = this._getClassRef(itemClsName, initiator);
        if (checkError(itemRes)) {
          return itemRes;
        }
        arrayObjCls = itemRes.result;
      } else {
        arrayObjCls = this.getPrimitiveClassRef(itemClsName);
      }

      const res = this._loadArrayClass(className, arrayObjCls);
      return res;
    }

    if (this.parentLoader) {
      const res = this.parentLoader._getClassRef(className, initiator);
      if (checkSuccess(res)) {
        return res;
      }
    }

    const res = this.load(className);
    return res;
  }

  /**
   * Gets the class data given the classname, loads the class if not loaded.
   *
   * @param className
   * @returns
   */
  getClassRef(className: string): ImmediateResult<ClassData> {
    return this._getClassRef(className, this);
  }

  /**
   * Special method for loading primitive classes.
   * @throws Error if class is not a primitive
   * @param className
   */
  abstract getPrimitiveClassRef(className: string): ClassData;

  protected abstract load(className: string): ImmediateResult<ClassData>;

  abstract getJavaObject(): JvmObject | null;
}
