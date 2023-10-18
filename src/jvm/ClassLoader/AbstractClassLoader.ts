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
  protected parentLoader: AbstractClassLoader | null;

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

  protected prepareClass(cls: ClassFile): void | Error {
    return;
  }

  protected linkClass(cls: ClassFile): ClassRef {
    const data = new ClassRef(cls, this);
    return data;
  }

  protected loadClass(cls: ClassRef): ClassRef {
    this.loadedClasses[this.getClassName(cls)] = cls;
    return cls;
  }

  protected getClassName(cls: ClassRef): string {
    return cls.getClassname();
  }

  protected getClassRef(className: string): ClassRef {
    if (this.loadedClasses[className]) {
      return this.loadedClasses[className];
    }

    if (this.parentLoader) {
      try {
        const res = this.parentLoader.getClassRef(className);
        if (res) {
          return res;
        }
      } catch (e) {
        return this.load(className);
      }
    }
    return this.load(className);
  }

  resolveClass(thread: NativeThread, className: string): ClassRef {
    try {
      return this.getClassRef(className);
    } catch (e) {
      thread.throwNewException('java/lang/ClassNotFoundException', className);
      return thread.getClass();
    }
  }

  _resolveClass(className: string): ClassRef {
    return this.getClassRef(className);
  }

  abstract load(className: string): ClassRef;
}
