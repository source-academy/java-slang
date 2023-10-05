import { AttributeInfo } from './attributes';
import { ConstantInfo } from './constants';
import { FieldInfo } from './fields';
import { MethodInfo } from './methods';

export interface ClassFile {
  magic: number;
  minorVersion: number;
  majorVersion: number;
  constantPoolCount: number;
  constantPool: Array<ConstantInfo>;
  accessFlags: number;
  thisClass: number;
  superClass: number;
  interfacesCount: number;
  interfaces: Array<number>;
  fieldsCount: number;
  fields: Array<FieldInfo>;
  methodsCount: number;
  methods: Array<MethodInfo>;
  attributesCount: number;
  attributes: Array<AttributeInfo>;
}

export enum ACCESS_FLAGS {
  ACC_PUBLIC = 0x0001,
  ACC_FINAL = 0x0010,
  ACC_SUPER = 0x0020,
  ACC_INTERFACE = 0x0200,
  ACC_ABSTRACT = 0x0400,
  ACC_SYNTHETIC = 0x1000,
  ACC_ANNOTATION = 0x2000,
  ACC_ENUM = 0x4000,
  ACC_MODULE = 0x8000,
}
