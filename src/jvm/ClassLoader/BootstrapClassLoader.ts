import AbstractSystem from "../utils/AbstractSystem";
import { ArrayClassData } from "../types/class/ArrayClassData";
import { ClassData, CLASS_TYPE } from "../types/class/ClassData";
import { JavaType, JvmObject } from "../types/reference/Object";
import { primitiveTypeToName } from "../utils";
import { ImmediateResult, checkError } from "../utils/Result";
import AbstractClassLoader from "./AbstractClassLoader";
import { ACCESS_FLAGS as CLASS_FLAGS } from "../../ClassFile/types";

/**
 * Reads classfile representation and loads it into memory area
 */
export default class BootstrapClassLoader extends AbstractClassLoader {
  private primitiveClasses: { [className: string]: ClassData } = {};

  constructor(nativeSystem: AbstractSystem, classPath: string) {
    super(nativeSystem, classPath, null);
  }

  private loadArray(
    className: string,
    componentCls: ClassData
  ): ImmediateResult<ClassData> {
    // #region load array superclasses/interfaces
    const objRes = this.getClassRef('java/lang/Object');
    if (checkError(objRes)) {
      return objRes;
    }
    const cloneableRes = this.getClassRef('java/lang/Cloneable');
    if (checkError(cloneableRes)) {
      return cloneableRes;
    }
    const serialRes = this.getClassRef('java/io/Serializable');
    if (checkError(serialRes)) {
      return serialRes;
    }
    // #endregion

    const arrayClass = new ArrayClassData(
      [],
      CLASS_FLAGS.ACC_PUBLIC,
      className,
      objRes.result,
      [cloneableRes.result, serialRes.result],
      [],
      [],
      [],
      this
    );
    arrayClass.setComponentClass(componentCls);

    this.loadClass(arrayClass);
    return { result: arrayClass };
  }

  /**
   * Attempts to load a class file. Class should not already be loaded.
   * @param className name of class to load
   */
  protected load(className: string): ImmediateResult<ClassData> {
    const path = this.classPath ? this.classPath + '/' + className : className;

    let classFile;
    try {
      classFile = this.nativeSystem.readFile(path);
    } catch (e) {
      return {
        exceptionCls: 'java/lang/ClassNotFoundException',
        msg: className,
      };
    }

    this.prepareClass(classFile);
    const classData = this.linkClass(classFile);
    return { result: this.loadClass(classData) };
  }

  protected _loadArrayClass(
    className: string,
    componentCls: ClassData
  ): ImmediateResult<ClassData> {
    return this.loadArray(className, componentCls);
  }

  getPrimitiveClassRef(className: string): ClassData {
    if (this.primitiveClasses[className]) {
      return this.primitiveClasses[className];
    }
    const internalName = primitiveTypeToName(className as JavaType);
    if (!internalName) {
      throw new Error(`Invalid primitive class name: ${className}`);
    }

    const cls = new ClassData(
      [],
      CLASS_FLAGS.ACC_PUBLIC,
      internalName,
      null,
      [],
      [],
      [],
      [],
      this,
      CLASS_TYPE.PRIMITIVE
    );
    this.primitiveClasses[className] = cls;
    return cls;
  }

  getJavaObject(): JvmObject | null {
    return null;
  }
}
