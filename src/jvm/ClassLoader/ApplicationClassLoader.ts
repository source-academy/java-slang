import AbstractSystem from "../utils/AbstractSystem";
import { ClassData } from "../types/class/ClassData";
import { JvmObject } from "../types/reference/Object";
import { ImmediateResult } from "../utils/Result";
import AbstractClassLoader from "./AbstractClassLoader";

export default class ApplicationClassLoader extends AbstractClassLoader {
  constructor(
    nativeSystem: AbstractSystem,
    classPath: string,
    parentLoader: AbstractClassLoader
  ) {
    super(nativeSystem, classPath, parentLoader);
  }

  /**
   * Attempts to load a class file
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

  getPrimitiveClassRef(className: string): ClassData {
    if (this.parentLoader === null) {
      throw new Error('Primitive class not found');
    }
    return this.parentLoader.getPrimitiveClassRef(className);
  }

  getJavaObject(): JvmObject | null {
    console.error('ApplicationClassloader: Java object not created');
    return null;
  }
}
