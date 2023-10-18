import { ClassRef } from "./ConstantRef";

export class JavaArray {
  type: string | ArrayType;
  length: number;
  array: any[];

  constructor(length: number, type: string | ArrayType, arr?: any[]) {
    this.length = length;
    this.array = [];
    this.type = type;

    if (arr) {
      this.array = arr;
      return;
    }

    let def;
    switch (this.type) {
      case ArrayType.boolean:
        def = false;
        break;
      case ArrayType.char:
        def = '';
        break;
      case ArrayType.float:
        def = 0.0;
        break;
      case ArrayType.double:
        def = 0.0;
        break;
      case ArrayType.byte:
        def = 0;
        break;
      case ArrayType.short:
        def = 0;
        break;
      case ArrayType.int:
        def = 0;
        break;
      case ArrayType.long:
        def = BigInt(0);
        break;
      default:
        def = null;
    }

    for (let i = 0; i < length; i++) {
      this.array.push(def);
    }
  }

  get(index: number) {
    if (index >= 0 && index < this.length) {
      return this.array[index];
    }
  }

  set(index: number, value: any) {
    if (index >= 0 && index < this.length) {
      this.array[index] = value;
    }
  }

  len() {
    return this.length;
  }
}

export class JavaReference {
  private cls: ClassRef;
  private fields: {
    [key: string]: any;
  };

  constructor(cls: ClassRef, fields: { [key: string]: any }) {
    this.cls = cls;
    this.fields = fields;
  }

  getClass() {
    return this.cls;
  }

  getField(name: string) {
    return this.fields[name];
  }

  getField64(name: string) {
    return this.fields[name];
  }

  putField(name: string, value: any) {
    this.fields[name] = value;
  }

  putField64(name: string, value: any) {
    this.fields[name] = value;
  }
}

export interface FieldRef {
  class: ClassRef;
  fieldName: string;
}

export enum ArrayType {
  boolean = 4,
  char = 5,
  float = 6,
  double = 7,
  byte = 8,
  short = 9,
  int = 10,
  long = 11,
}

export enum JavaType {
  byte = 'B',
  char = 'C',
  double = 'D',
  float = 'F',
  int = 'I',
  long = 'J',
  short = 'S',
  boolean = 'Z',
  reference = 'L',
  array = '[',
  void = 'V',
}
