import { ClassFile } from "../../ClassFile/types";
import AbstractSystem from "../AbstractSystem";
import { ClassRef } from "../ConstantRef";
import NativeThread from "../NativeThread";


export default abstract class AbstractClassLoader {
  protected nativeSystem: AbstractSystem;
  protected classPath: string;
  protected loadedClasses: {
    [className: string]: ClassRef;
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
  prepareClass(cls: ClassFile): void | Error {
    return;
  }

  /**
   * Resolves symbolic references in the constant pool.
   * @param cls class data to resolve
   * @returns class data with resolved references
   */
  linkClass(cls: ClassFile): ClassRef {
    const data = new ClassRef(cls, this);
    return data;
  }

  /**
   * Adds the resolved class data to the memory area.
   * @param cls resolved class data
   */
  loadClass(cls: ClassRef): ClassRef {
    this.loadedClasses[this.getClassName(cls)] = cls;
    return cls;
  }

  getClassName(cls: ClassRef): string {
    return cls.getClassname();
  }

  protected getClassRef(className: string): ClassRef | undefined {
    if (this.loadedClasses[className]) {
      return this.loadedClasses[className];
    }

    if (this.parentLoader) {
      const res = this.parentLoader.getClassRef(className);
      if (res) {
        return res;
      }
    }

    return this.load(className);
  }

  resolveClass(thread: NativeThread, className: string): ClassRef {
    const cls = this.getClassRef(className);

    if (!cls) {
      thread.throwNewException('java/lang/ClassNotFoundException', className);
      return thread.getClass();
    }

    return cls;
  }

  _resolveClass(className: string): ClassRef {
    const cls = this.getClassRef(className);

    if (!cls) {
      throw new Error();
    }

    return cls;
  }

  /**
   * Attempts to load a class file.
   * @param className name of class to load
   * @param onFinish callback if successful
   * @param onError callback if an error occurs
   */
  abstract load(className: string): ClassRef | undefined;
}
