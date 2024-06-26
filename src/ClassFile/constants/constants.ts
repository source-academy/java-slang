export enum CONSTANT_TAG {
  Class = 7,
  Fieldref = 9,
  Methodref = 10,
  InterfaceMethodref = 11,
  String = 8,
  Integer = 3,
  Float = 4,
  Long = 5,
  Double = 6,
  NameAndType = 12,
  Utf8 = 1,
  MethodHandle = 15,
  MethodType = 16,
  InvokeDynamic = 18
}

export const constantTagMap: { [key: number]: CONSTANT_TAG } = {
  7: CONSTANT_TAG.Class,
  9: CONSTANT_TAG.Fieldref,
  10: CONSTANT_TAG.Methodref,
  11: CONSTANT_TAG.InterfaceMethodref,
  8: CONSTANT_TAG.String,
  3: CONSTANT_TAG.Integer,
  4: CONSTANT_TAG.Float,
  5: CONSTANT_TAG.Long,
  6: CONSTANT_TAG.Double,
  12: CONSTANT_TAG.NameAndType,
  1: CONSTANT_TAG.Utf8,
  15: CONSTANT_TAG.MethodHandle,
  16: CONSTANT_TAG.MethodType,
  18: CONSTANT_TAG.InvokeDynamic
}
