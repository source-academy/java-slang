export enum CONSTANT_TAG {
  CONSTANT_Class,
  CONSTANT_Fieldref,
  CONSTANT_Methodref,
  CONSTANT_InterfaceMethodref,
  CONSTANT_String,
  CONSTANT_Integer,
  CONSTANT_Float,
  CONSTANT_Long,
  CONSTANT_Double,
  CONSTANT_NameAndType,
  CONSTANT_Utf8,
  CONSTANT_MethodHandle,
  CONSTANT_MethodType,
  CONSTANT_InvokeDynamic,
}

export const constantTagMap: { [key: number]: CONSTANT_TAG } = {
  7: CONSTANT_TAG.CONSTANT_Class,
  9: CONSTANT_TAG.CONSTANT_Fieldref,
  10: CONSTANT_TAG.CONSTANT_Methodref,
  11: CONSTANT_TAG.CONSTANT_InterfaceMethodref,
  8: CONSTANT_TAG.CONSTANT_String,
  3: CONSTANT_TAG.CONSTANT_Integer,
  4: CONSTANT_TAG.CONSTANT_Float,
  5: CONSTANT_TAG.CONSTANT_Long,
  6: CONSTANT_TAG.CONSTANT_Double,
  12: CONSTANT_TAG.CONSTANT_NameAndType,
  1: CONSTANT_TAG.CONSTANT_Utf8,
  15: CONSTANT_TAG.CONSTANT_MethodHandle,
  16: CONSTANT_TAG.CONSTANT_MethodType,
  18: CONSTANT_TAG.CONSTANT_InvokeDynamic,
};
