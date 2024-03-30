export interface ConstantUtf8Value {
  value: string;
}

export interface ConstantIntegerValue {
  value: number;
}

export interface ConstantFloatValue {
  value: number;
}

export interface ConstantLongValue {
  value: bigint;
}

export interface ConstantDoubleValue {
  value: number;
}

export interface ConstantClassValue {
  name: ConstantUtf8Value;
}

export interface ConstantStringValue {
  string: ConstantUtf8Value
}

export interface ConstantFieldrefValue {
  class: ConstantClassValue;
  nameAndType: ConstantNameAndTypeValue;
}

export interface ConstantMethodrefValue {
  class: ConstantClassValue;
  nameAndType: ConstantNameAndTypeValue;
}

export interface ConstantNameAndTypeValue {
  name: ConstantUtf8Value;
  descriptor: ConstantUtf8Value;
}

export type ConstantTypeValue =
  | ConstantUtf8Value
  | ConstantIntegerValue
  | ConstantFloatValue
  | ConstantLongValue
  | ConstantDoubleValue
  | ConstantClassValue
  | ConstantStringValue
  | ConstantFieldrefValue
  | ConstantMethodrefValue
  | ConstantNameAndTypeValue;

