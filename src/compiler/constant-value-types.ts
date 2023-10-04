export interface ConstantClassValue {
  name: ConstantUtf8Value;
}

export interface ConstantMethodrefValue {
  class: ConstantClassValue;
  nameAndType: ConstantNameAndTypeValue;
}

export interface ConstantFieldrefValue {
  class: ConstantClassValue;
  nameAndType: ConstantNameAndTypeValue;
}

export interface ConstantNameAndTypeValue {
  name: ConstantUtf8Value;
  descriptor: ConstantUtf8Value;
}

export interface ConstantStringValue {
  string: ConstantUtf8Value
}

export interface ConstantUtf8Value {
  value: string;
}

export type ConstantTypeValue =
  | ConstantClassValue
  | ConstantMethodrefValue
  | ConstantNameAndTypeValue
  | ConstantStringValue
  | ConstantUtf8Value;

