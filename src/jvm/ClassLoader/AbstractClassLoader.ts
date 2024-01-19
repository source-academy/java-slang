import { ClassFile } from "../../ClassFile/types";
import {
  ConstantClassInfo,
  ConstantUtf8Info,
} from "../../ClassFile/types/constants";
import {
  ErrorResult,
  ImmediateResult,
  checkError,
  checkSuccess,
} from "../types/Result";
import {
  ClassData,
  ReferenceClassData,
  ArrayClassData,
  PrimitiveClassData,
} from "../types/class/ClassData";
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

  getClassPath(): string {
    return this.classPath;
  }

  /**
   * Loads a given classfile. Used to support Unsafe operations.
   * @param classFile
   * @returns
   */
  defineClass(classFile: ClassFile): ClassData {
    const cls = this.linkClass(classFile);
    return this.loadClass(cls);
  }

  /**
   * Resolves symbolic references in the classfile. Eagerly loads
   * @param classFile
   * @returns
   * */
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
      (e) => (hasError = e)
    );

    if (hasError) {
      throw new Error((hasError as ErrorResult).exceptionCls);
    }
    return data;
  }

  /**
   * Stores the resolved class data in the classloader.
   * The same class loaded by a different classloader is considered a different class.
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
      throw new Error("ClassLoader has no parent loader");
    }

    return this.parentLoader._loadArrayClass(className, componentCls);
  }

  protected _getClass(
    className: string,
    initiator: AbstractClassLoader
  ): ImmediateResult<ClassData> {
    if (this.loadedClasses[className]) {
      return { result: this.loadedClasses[className] };
    }

    if (className.startsWith("[")) {
      const itemClsName = className.slice(1);
      let arrayObjCls;
      if (itemClsName.startsWith("L")) {
        const itemRes = this._getClass(itemClsName.slice(1, -1), initiator);
        if (checkError(itemRes)) {
          return itemRes;
        }
        arrayObjCls = itemRes.result;
      } else if (itemClsName.startsWith("[")) {
        const itemRes = this._getClass(itemClsName, initiator);
        if (checkError(itemRes)) {
          return itemRes;
        }
        arrayObjCls = itemRes.result;
      } else {
        arrayObjCls = this.getPrimitiveClass(itemClsName);
      }

      const res = this._loadArrayClass(className, arrayObjCls);
      return res;
    }

    if (this.parentLoader) {
      const res = this.parentLoader._getClass(className, initiator);
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
  getClass(className: string): ImmediateResult<ClassData> {
    return this._getClass(className, this);
  }

  /**
   * Special method for loading primitive classes. Overriden by BootstrapClassLoader.
   * @throws Error if class is not a primitive
   * @param className
   */
  getPrimitiveClass(className: string): PrimitiveClassData {
    if (this.parentLoader === null) {
      throw new Error("Primitive class not found");
    }
    return this.parentLoader.getPrimitiveClass(className);
  }

  /**
   * Attempts to load a class file
   * @param className name of class to load, e.g. [Ljava/lang/Object;
   * @returns
   */
  protected load(className: string): ImmediateResult<ClassData> {
    const path = this.classPath ? this.classPath + "/" + className : className;

    let classFile;
    try {
      classFile = this.nativeSystem.readFile(path);
    } catch (e) {
      return {
        exceptionCls: "java/lang/ClassNotFoundException",
        msg: className,
      };
    }

    const classData = this.linkClass(classFile);
    return { result: this.loadClass(classData) };
  }

  getJavaObject(): JvmObject | null {
    console.error("ApplicationClassloader: Java object not created");
    return null;
  }
}

export class ApplicationClassLoader extends AbstractClassLoader {
  constructor(
    nativeSystem: AbstractSystem,
    classPath: string,
    parentLoader: AbstractClassLoader
  ) {
    super(nativeSystem, classPath, parentLoader);
  }
}
