import {CONSTANT_TAG} from "../../constants/ClassFile/constants"

export interface CONSTANT_Class_info {
  tag: CONSTANT_TAG;
  name_index: number;
}

export interface CONSTANT_Fieldref_info {
  tag: CONSTANT_TAG;
  class_index: number;
  name_and_type_index: number;
}

export interface CONSTANT_Methodref_info {
  tag: CONSTANT_TAG;
  class_index: number;
  name_and_type_index: number;
}

export interface CONSTANT_InterfaceMethodref_info {
  tag: CONSTANT_TAG;
  class_index: number;
  name_and_type_index: number;
}

export interface CONSTANT_String_info {
  tag: CONSTANT_TAG;
  string_index: number;
}

export interface CONSTANT_Integer_info {
  tag: CONSTANT_TAG;
  value: number;
}

export interface CONSTANT_Float_info {
  tag: CONSTANT_TAG;
  value: number;
}

export interface CONSTANT_Long_info {
  tag: CONSTANT_TAG;
  value: bigint;
}

export interface CONSTANT_Double_info {
  tag: CONSTANT_TAG;
  value: number;
}

export interface CONSTANT_NameAndType_info {
  tag: CONSTANT_TAG;
  name_index: number;
  descriptor_index: number;
}

export interface CONSTANT_Utf8_info {
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

export interface CONSTANT_MethodHandle_info {
  tag: CONSTANT_TAG;
  reference_kind: REFERENCE_KIND;
  reference_index: number;
}

export interface CONSTANT_MethodType_info {
  tag: CONSTANT_TAG;
  descriptor_index: number;
}

export interface CONSTANT_InvokeDynamic_info {
  tag: CONSTANT_TAG;
  bootstrap_method_attr_index: number;
  name_and_type_index: number;
}

export type ConstantType =
  | CONSTANT_Class_info
  | CONSTANT_Fieldref_info
  | CONSTANT_Methodref_info
  | CONSTANT_InterfaceMethodref_info
  | CONSTANT_String_info
  | CONSTANT_Integer_info
  | CONSTANT_Float_info
  | CONSTANT_Long_info
  | CONSTANT_Double_info
  | CONSTANT_NameAndType_info
  | CONSTANT_Utf8_info
  | CONSTANT_MethodHandle_info
  | CONSTANT_MethodType_info
  | CONSTANT_InvokeDynamic_info;
