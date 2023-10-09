
import AbstractSystem from '../AbstractSystem';
import { ClassRef } from '../ConstantRef';
import AbstractClassLoader from './AbstractClassLoader';

export default class BootstrapClassLoader extends AbstractClassLoader {
  constructor(nativeSystem: AbstractSystem, classPath: string) {
    super(nativeSystem, classPath, null);
  }

  load(className: string): ClassRef {
    const path = this.classPath ? this.classPath + '/' + className : className;
    const classFile = this.nativeSystem.readFile(path);
    this.prepareClass(classFile);
    const classData = this.linkClass(classFile);
    return this.loadClass(classData);
  }
}
