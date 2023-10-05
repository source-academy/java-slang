import AbstractSystem from '../AbstractSystem';
import { ClassRef } from '../ConstantRef';
import AbstractClassLoader from './AbstractClassLoader';

export default class ClassLoader extends AbstractClassLoader {
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
  load(className: string): ClassRef | undefined {
    const path = this.classPath ? this.classPath + '/' + className : className;

    if (this.parentLoader) {
      const res = this.parentLoader.load(className);
      if (res) {
        return res;
      }
    }

    let classFile;

    try {
      classFile = this.nativeSystem.readFile(path);
    } catch (e) {
      return;
    }

    this.prepareClass(classFile);
    const classData = this.linkClass(classFile);
    return this.loadClass(classData);
  }
}
