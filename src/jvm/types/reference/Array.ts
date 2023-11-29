import Thread from "../../thread";
import { Result } from "../Result";
import { ArrayClassData } from "../class/ClassData";
import { JvmObject, JavaType } from "./Object";


export class JvmArray extends JvmObject {
  private primitiveType: ArrayPrimitiveType | null;
  private length: number;
  private array: any[];
  constructor(cls: ArrayClassData) {
    super(cls);
    switch (cls.getClassname()[1]) {
      case JavaType.boolean:
        this.primitiveType = ArrayPrimitiveType.boolean;
        break;
      case JavaType.char:
        this.primitiveType = ArrayPrimitiveType.char;
        break;
      case JavaType.float:
        this.primitiveType = ArrayPrimitiveType.float;
        break;
      case JavaType.double:
        this.primitiveType = ArrayPrimitiveType.double;
        break;
      case JavaType.byte:
        this.primitiveType = ArrayPrimitiveType.byte;
        break;
      case JavaType.short:
        this.primitiveType = ArrayPrimitiveType.short;
        break;
      case JavaType.int:
        this.primitiveType = ArrayPrimitiveType.int;
        break;
      case JavaType.long:
        this.primitiveType = ArrayPrimitiveType.long;
        break;
      default:
        this.primitiveType = null;
    }
    this.length = 0;
    this.array = [];
  }

  initialize(thread: Thread, ...rest: any[]): Result<JvmArray> {
    return this.initArray(rest[0], rest[1]);
  }

  initArray(length: number, arr?: any[]): Result<JvmArray> {
    this.length = length;

    if (arr) {
      this.array = arr;
      return { result: this };
    }

    let def;
    switch (this.primitiveType) {
      case ArrayPrimitiveType.boolean:
        def = 0;
        break;
      case ArrayPrimitiveType.char:
        def = 0;
        break;
      case ArrayPrimitiveType.float:
        def = 0.0;
        break;
      case ArrayPrimitiveType.double:
        def = 0.0;
        break;
      case ArrayPrimitiveType.byte:
        def = 0;
        break;
      case ArrayPrimitiveType.short:
        def = 0;
        break;
      case ArrayPrimitiveType.int:
        def = 0;
        break;
      case ArrayPrimitiveType.long:
        def = BigInt(0);
        break;
      default:
        def = null;
    }

    this.array = new Array(length).fill(def);
    return { result: this };
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

  getJsArray() {
    return this.array;
  }

  len() {
    return this.length;
  }

  clone(): JvmArray {
    const clone = new JvmArray(this.getClass() as ArrayClassData);
    clone.length = this.length;
    clone.array = [...this.array]; // shallow copy
    return clone;
  }
}

export enum ArrayPrimitiveType {
  boolean = 4,
  char = 5,
  float = 6,
  double = 7,
  byte = 8,
  short = 9,
  int = 10,
  long = 11,
}
