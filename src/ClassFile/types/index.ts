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
