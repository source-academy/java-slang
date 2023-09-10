import { CONSTANT_TAG } from "../constants/constants";

export interface ConstantClassInfo {
  tag: CONSTANT_TAG;
  nameIndex: number;
}

export interface ConstantFieldrefInfo {
  tag: CONSTANT_TAG;
  classIndex: number;
  nameAndTypeIndex: number;
}

export interface ConstantMethodrefInfo {
  tag: CONSTANT_TAG;
  classIndex: number;
  nameAndTypeIndex: number;
}

export interface ConstantInterfaceMethodrefInfo {
  tag: CONSTANT_TAG;
  classIndex: number;
  nameAndTypeIndex: number;
}

export interface ConstantStringInfo {
  tag: CONSTANT_TAG;
  stringIndex: number;
}

export interface ConstantIntegerInfo {
  tag: CONSTANT_TAG;
  value: number;
}

export interface ConstantFloatInfo {
  tag: CONSTANT_TAG;
  value: number;
}

export interface ConstantLongInfo {
  tag: CONSTANT_TAG;
  value: bigint;
}

export interface ConstantDoubleInfo {
  tag: CONSTANT_TAG;
  value: number;
}

export interface ConstantNameAndTypeInfo {
  tag: CONSTANT_TAG;
  nameIndex: number;
  descriptorIndex: number;
}

export interface ConstantUtf8Info {
  tag: CONSTANT_TAG;
  length: number;
  value: string;
}

export enum REFERENCE_KIND {
  REF_getField,
  REF_getStatic,
  REF_putField,
  REF_putStatic,
  REF_invokeVirtual,
  REF_invokeStatic,
  REF_invokeSpecial,
  REF_newInvokeSpecial,
  REF_invokeInterface,
}

export interface ConstantMethodHandleInfo {
  tag: CONSTANT_TAG;
  referenceKind: REFERENCE_KIND;
  referenceIndex: number;
}

export interface ConstantMethodTypeInfo {
  tag: CONSTANT_TAG;
  descriptorIndex: number;
}

export interface ConstantInvokeDynamicInfo {
  tag: CONSTANT_TAG;
  bootstrapMethodAttrIndex: number;
  nameAndTypeIndex: number;
}

export type ConstantType =
  | ConstantClassInfo
  | ConstantFieldrefInfo
  | ConstantMethodrefInfo
  | ConstantInterfaceMethodrefInfo
  | ConstantStringInfo
  | ConstantIntegerInfo
  | ConstantFloatInfo
  | ConstantLongInfo
  | ConstantDoubleInfo
  | ConstantNameAndTypeInfo
  | ConstantUtf8Info
  | ConstantMethodHandleInfo
  | ConstantMethodTypeInfo
  | ConstantInvokeDynamicInfo;
