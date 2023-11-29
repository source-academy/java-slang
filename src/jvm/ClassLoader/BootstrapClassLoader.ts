import { ImmediateResult, ErrorResult } from "../types/Result";
import { PrimitiveClassData, ClassData, ArrayClassData } from "../types/class/ClassData";
import { JavaType, JvmObject } from "../types/reference/Object";
import { primitiveTypeToName } from "../utils";
import AbstractSystem from "../utils/AbstractSystem";
import AbstractClassLoader from "./AbstractClassLoader";
import { ACCESS_FLAGS as CLASS_FLAGS } from "../../ClassFile/types";

/**
 * Reads classfile representation and loads it into memory area
 */
export default class BootstrapClassLoader extends AbstractClassLoader {
  private primitiveClasses: { [className: string]: PrimitiveClassData } = {};

  constructor(nativeSystem: AbstractSystem, classPath: string) {
    super(nativeSystem, classPath, null);
  }

  private loadArray(
    className: string,
    componentCls: ClassData
  ): ImmediateResult<ArrayClassData> {
    let error: ErrorResult | null = null;
    const arrayClass = new ArrayClassData(
      CLASS_FLAGS.ACC_PUBLIC,
      className,
      this,
      componentCls,
      e => (error = e)
    );
    if (error) {
      return error;
    }

    this.loadClass(arrayClass);
    return { result: arrayClass };
  }

  /**
   * Attempts to load a class file. Class should not already be loaded.
   * @param className name of class to load
   */
  protected load(className: string): ImmediateResult<ClassData> {
    console.debug(`BsCL: loading ${className}`);

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
  ): ImmediateResult<ArrayClassData> {
    return this.loadArray(className, componentCls);
  }

  getPrimitiveClassRef(className: string): PrimitiveClassData {
    const internalName = primitiveTypeToName(className as JavaType);
    if (!internalName) {
      throw new Error(`Invalid primitive class name: ${className}`);
    }

    if (this.primitiveClasses[internalName]) {
      return this.primitiveClasses[internalName];
    }

    const cls = new PrimitiveClassData(this, internalName);
    this.primitiveClasses[internalName] = cls;

    if (internalName === 'char') {
      console.log('CHAR PRIMITIVE LOADED');
    }

    return cls;
  }

  getJavaObject(): JvmObject | null {
    return null;
  }
}
