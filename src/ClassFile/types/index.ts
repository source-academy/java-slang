import { AttributeType } from './attributes';
import { ConstantType } from './constants';
import { FieldType } from './fields';
import { MethodType } from './methods';

export interface ClassFile {
  magic: number;
  minorVersion: number;
  majorVersion: number;
  constantPool: Array<ConstantType>;
  accessFlags: number;
  thisClass: number;
  superClass: number;
  interfaces: Array<string>;
  fields: {
    [fieldName: string]: FieldType;
  };
  methods: {
    [methodName: string]: MethodType;
  };
  attributes: Array<AttributeType>;
}
