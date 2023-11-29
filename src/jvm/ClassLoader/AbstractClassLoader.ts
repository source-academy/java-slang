import { ClassFile } from "../../ClassFile/types";
import { ConstantClassInfo, ConstantUtf8Info } from "../../ClassFile/types/constants";
import { ErrorResult, ImmediateResult, checkError, checkSuccess } from "../types/Result";
import { ClassData, ReferenceClassData, ArrayClassData, PrimitiveClassData } from "../types/class/ClassData";
import { JvmObject } from "../types/reference/Object";
import AbstractSystem from "../utils/AbstractSystem";


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

  /**
   * Loads superclasses etc. for reference classes
   */
  protected linkClass(cls: ClassFile): ReferenceClassData {
    // resolve classname
    const clsInfo = cls.constantPool[cls.thisClass] as ConstantClassInfo;
    const clsName = cls.constantPool[clsInfo.nameIndex] as ConstantUtf8Info;
    const thisClass = clsName.value;

    let hasError: ErrorResult | null = null;
    const data = new ReferenceClassData(
      cls,
      this,
      thisClass,
      e => (hasError = e)
    );

    if (hasError) {
      throw new Error((hasError as ErrorResult).exceptionCls);
    }
    return data;
  }

  /**
   * Stores the resolved class data.
   */
  protected loadClass(cls: ClassData): ClassData {
    this.loadedClasses[cls.getClassname()] = cls;
    return cls;
  }

  protected _loadArrayClass(
    className: string,
    componentCls: ClassData
  ): ImmediateResult<ArrayClassData> {
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
   * Gets the reference class data given the classname, loads the class if not loaded.
   * Not for primitive classes, use getPrimitiveClassRef for primitive classes.
   */
  getClassRef(className: string): ImmediateResult<ClassData> {
    return this._getClassRef(className, this);
  }

  /**
   * Special method for loading primitive classes.
   * @throws Error if class is not a primitive
   * @param className
   */
  abstract getPrimitiveClassRef(className: string): PrimitiveClassData;

  protected abstract load(className: string): ImmediateResult<ClassData>;

  abstract getJavaObject(): JvmObject | null;
}
