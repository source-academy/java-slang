import { AttributeType } from './attributes';
import { ConstantType } from './constants';
import { FieldType } from './fields';
import { MethodType } from './methods';

export interface ClassFile {
  magic: number;
  minorVersion: number;
  majorVersion: number;
  constantPoolCount: number;
  constantPool: Array<ConstantType>;
  accessFlags: number;
  thisClass: number;
  superClass: number;
  interfacesCount: number;
  interfaces: Array<string>;
  fieldsCount: number;
  fields: Array<FieldType>;
  methodsCount: number;
  methods: Array<MethodType>;
  attributesCount: number;
  attributes: Array<AttributeType>;
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
