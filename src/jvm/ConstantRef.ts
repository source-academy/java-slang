import { CONSTANT_TAG } from "../ClassFile/constants/constants";
import { ClassFile } from "../ClassFile/types";
import { AttributeInfo, CodeAttribute, BootstrapMethodsAttribute } from "../ClassFile/types/attributes";
import { ConstantInfo, ConstantClassInfo, ConstantUtf8Info, ConstantNameAndTypeInfo } from "../ClassFile/types/constants";
import { FieldInfo } from "../ClassFile/types/fields";
import AbstractClassLoader from "./ClassLoader/AbstractClassLoader";
import NativeThread from "./NativeThread";
import { JavaReference } from "./dataTypes";


export interface MethodRef {
  accessFlags: number;
  name: string;
  descriptor: string;
  attributes: Array<AttributeInfo>;
  code: CodeAttribute | null;
}

export interface ConstantClass {
  tag: CONSTANT_TAG;
  nameIndex: number;
  ref: ClassRef;
}

export interface ConstantMethodref {
  tag: CONSTANT_TAG;
  classIndex: number;
  nameAndTypeIndex: number;
  ref: MethodRef;
}

export interface ConstantInterfaceMethodref {
  tag: CONSTANT_TAG;
  classIndex: number;
  nameAndTypeIndex: number;
  ref: MethodRef;
}

export interface ConstantString {
  tag: CONSTANT_TAG;
  stringIndex: number;
  ref: JavaReference;
}


export type ConstantRef =
  | ConstantInfo
  | ConstantClass
  | ConstantMethodref
  | ConstantInterfaceMethodref
  | ConstantString;

export interface FieldRef {
  accessFlags: number;
  nameIndex: number;
  descriptorIndex: number;
  attributes: Array<AttributeInfo>;
  data?: any;
}

export class ClassRef {
  public isInitialized: boolean = false;

  private loader: AbstractClassLoader;

  private constantPool: Array<ConstantRef>;
  private accessFlags: number;

  private thisClass: string;
  private superClass: number | ClassRef;

  private interfaces: Array<number | ClassRef>;

  private fields: {
    [fieldName: string]: FieldInfo;
  };

  private methods: {
    [methodName: string]: MethodRef;
  };

  private bootstrapMethods?: BootstrapMethodsAttribute;
  private attributes: Array<AttributeInfo>;

  constructor(classfile: ClassFile, loader: AbstractClassLoader) {
    this.constantPool = classfile.constantPool;
    this.accessFlags = classfile.accessFlags;

    const clsInfo = classfile.constantPool[
      classfile.thisClass
    ] as ConstantClassInfo;
    const clsName = classfile.constantPool[
      clsInfo.nameIndex
    ] as ConstantUtf8Info;
    this.thisClass = clsName.value;

    this.superClass = classfile.superClass;

    this.interfaces = classfile.interfaces;

    this.fields = {};
    classfile.fields.forEach(field => {
      const fieldName = classfile.constantPool[
        field.nameIndex
      ] as ConstantUtf8Info;
      const fieldDesc = classfile.constantPool[
        field.descriptorIndex
      ] as ConstantUtf8Info;
      this.fields[fieldName.value + fieldDesc.value] = field;
    });

    this.methods = {};
    classfile.methods.forEach(method => {
      const methodRef: MethodRef = {
        accessFlags: method.accessFlags,
        name: '',
        descriptor: '',
        attributes: method.attributes,
        code: null,
      };

      methodRef.name = (
        classfile.constantPool[method.nameIndex] as ConstantUtf8Info
      ).value;
      methodRef.descriptor = (
        classfile.constantPool[method.descriptorIndex] as ConstantUtf8Info
      ).value;

      methodRef.attributes.forEach(attr => {
        const attrname = (
          classfile.constantPool[attr.attributeNameIndex] as ConstantUtf8Info
        ).value;
        if (attrname === 'Code') {
          methodRef.code = attr as CodeAttribute;
        }
      });

      this.methods[methodRef.name + methodRef.descriptor] = methodRef;
    });

    this.attributes = classfile.attributes;

    this.loader = loader;
  }

  private resolveClassRef(thread: NativeThread, clsRef: ConstantClass) {
    const className = this.constantPool[clsRef.nameIndex] as ConstantUtf8Info;

    if (className.value[0] === '[') {
      return;
    }

    const ref = this.loader.resolveClass(thread, className.value);

    if (!ref) {
      thread.throwNewException('java/lang/ClassNotFoundException', '');
      return;
    }

    clsRef.ref = ref;
    return;
  }

  private resolveMethodRef(thread: NativeThread, methodRef: ConstantMethodref) {
    const className = thread
      .getClass()
      .getConstant(
        thread,
        thread.getClass().getConstant(thread, methodRef.classIndex).nameIndex
      ).value;

    const nameAndTypeIndex = thread
      .getClass()
      .getConstant(
        thread,
        methodRef.nameAndTypeIndex
      ) as ConstantNameAndTypeInfo;
    const methodName = thread
      .getClass()
      .getConstant(thread, nameAndTypeIndex.nameIndex).value;
    const methodDescriptor = thread
      .getClass()
      .getConstant(thread, nameAndTypeIndex.descriptorIndex).value;

    const clsRef = this.loader.resolveClass(thread, className);
    if (!clsRef) {
      thread.throwNewException('java/lang/ClassNotFoundException', '');
      return;
    }

    methodRef.ref = clsRef.getMethod(thread, methodName + methodDescriptor);
  }

  private resolveStringRef(thread: NativeThread, strRef: ConstantString) {
    throw new Error('Method not implemented.');
  }

  resolveReference(thread: NativeThread, ref: ConstantRef) {
    if ((ref as ConstantMethodref).ref) {
      return;
    }

    switch (ref.tag) {
      case CONSTANT_TAG.Class:
        this.resolveClassRef(thread, ref as ConstantClass);
        return;
      case CONSTANT_TAG.Methodref:
        this.resolveMethodRef(thread, ref as ConstantMethodref);
        return;
      case CONSTANT_TAG.InterfaceMethodref:
        this.resolveMethodRef(thread, ref as ConstantMethodref);
        return;
      case CONSTANT_TAG.String:
        this.resolveStringRef(thread, ref as ConstantString);
        break;
    }
  }

  /**
   * Getters
   */
  getLoader(): AbstractClassLoader {
    return this.loader;
  }

  getConstant(thread: NativeThread, constantIndex: number): any {
    const constItem = this.constantPool[constantIndex];
    if (
      constItem.tag === CONSTANT_TAG.Class ||
      constItem.tag === CONSTANT_TAG.Methodref ||
      constItem.tag === CONSTANT_TAG.InterfaceMethodref ||
      constItem.tag === CONSTANT_TAG.String
    ) {
      this.resolveReference(thread, constItem);
    }
    return constItem;
  }

  getConstantWide(thread: NativeThread, constantIndex: number): any {
    const constItem = this.constantPool[constantIndex];
    if (
      constItem.tag === CONSTANT_TAG.Class ||
      constItem.tag === CONSTANT_TAG.Methodref ||
      constItem.tag === CONSTANT_TAG.InterfaceMethodref ||
      constItem.tag === CONSTANT_TAG.String
    ) {
      this.resolveReference(thread, constItem);
    }
    return constItem;
  }

  checkAccess(): number {
    return this.accessFlags;
  }

  getClassname(): string {
    return this.thisClass;
  }

  getSuperClass(thread: NativeThread): ClassRef {
    if (typeof this.superClass === 'number') {
      const Class = this.getConstant(thread, this.superClass);
      this.resolveReference(thread, Class);
    }

    return this.superClass as ClassRef;
  }

  getInterfaces() {
    return this.interfaces;
  }

  getMethod(thread: NativeThread, methodName: string): MethodRef {
    return this.methods[methodName];
  }

  getStatic(thread: NativeThread, fieldName: string): any {
    return this.fields[fieldName].data;
  }

  getStatic64(thread: NativeThread, fieldName: string): any {
    return this.fields[fieldName].data;
  }

  /**
   * Setters
   */
  putStatic(thread: NativeThread, fieldName: string, value: any): void {
    this.fields[fieldName].data = value;
  }

  putStatic64(thread: NativeThread, fieldName: string, value: any): void {
    this.fields[fieldName].data = value;
  }
}
