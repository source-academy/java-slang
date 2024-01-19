import { AttributeInfo } from "../../ClassFile/types/attributes";
import AbstractClassLoader from "../ClassLoader/AbstractClassLoader";
import { ConstantPool } from "../constant-pool";
import Thread from "../thread";
import { IAttribute, info2Attribute } from "../types/class/Attributes";
import {
  ArrayClassData,
  ReferenceClassData,
  ClassData,
} from "../types/class/ClassData";
import { ConstantUtf8 } from "../types/class/Constants";
import { Field } from "../types/class/Field";
import { JvmArray } from "../types/reference/Array";
import { JvmObject, JavaType } from "../types/reference/Object";
import { SuccessResult } from "./Result";

/**
 * Converts a Java String to a JS string
 * @param str Java String object
 */
export const j2jsString = (str: JvmObject) => {
  return String.fromCharCode(
    ...str._getField("value", "[C", "java/lang/String").getJsArray()
  );
};

function newCharArr(loader: AbstractClassLoader, str: string): JvmArray {
  // Assume char array loaded at init
  const cArrRes = loader.getClass("[C") as SuccessResult<ArrayClassData>;
  const cArrCls = cArrRes.result;
  const cArr = cArrCls.instantiate() as JvmArray;
  const jsArr = [];
  for (let i = 0; i < str.length; i++) {
    jsArr.push(str.charCodeAt(i));
  }
  cArr.initArray(str.length, jsArr);
  return cArr;
}

/**
 * Converts a JS string to a Java String. Assumes java/lang/String and [C is loaded.
 */
export function js2jString(
  loader: AbstractClassLoader,
  str: string
): JvmObject {
  const charArr = newCharArr(loader, str);
  const strRes = loader.getClass(
    "java/lang/String"
  ) as SuccessResult<ReferenceClassData>;
  const strCls = strRes.result;
  const strObj = strCls.instantiate();
  const fieldRef = strCls.lookupField("value[C") as Field;
  strObj.putField(fieldRef as Field, charArr);
  return strObj;
}

/**
 * Returns the number of bytes that a primitive or reference takes up in memory.
 * @param cls ClassRef of the primitive or reference
 */
export const typeIndexScale = (cls: ClassData) => {
  // Reference type
  if (!cls.checkPrimitive()) {
    return 4;
  }

  const componentName = cls.getClassname();
  switch (componentName) {
    case "long":
    case "double":
      return 8;

    case "int":
    case "float":
      return 4;

    case "short":
    case "char":
      return 2;

    case "byte":
    case "boolean":
      return 1;

    default:
      return -1;
  }
};

export const byteArray2charArray = (byteArray: number[]) => {
  const res: number[] = [];
  byteArray.forEach((byte, index) => {
    if (index % 2 === 0) {
      res.push((byte << 8) | byteArray[index + 1]);
    }
  });
  return res;
};

export function parseFieldDescriptor(
  descriptor: string,
  index: number
): { type: string; referenceCls?: string; index: number } {
  switch (descriptor[index]) {
    case JavaType.byte:
    case JavaType.char:
    case JavaType.double:
    case JavaType.float:
    case JavaType.int:
    case JavaType.long:
    case JavaType.short:
    case JavaType.boolean:
      return { type: descriptor[index], index: index + 1 };
    case JavaType.array:
      const res = parseFieldDescriptor(descriptor, index + 1);
      const clsName =
        "[" + (res.referenceCls ? "L" + res.referenceCls + ";" : res.type);
      return { type: JavaType.array, referenceCls: clsName, index: res.index };
    case JavaType.reference:
      const sub = descriptor.substring(index);
      const end = sub.indexOf(";");
      return {
        type: JavaType.reference,
        referenceCls: sub.substring(1, end),
        index: index + end + 1,
      };
    case JavaType.void:
      return { type: JavaType.void, index: index + 1 };
    default:
      throw new Error(`Unknown type ${descriptor[index]}`);
  }
}

export function parseMethodDescriptor(desc: string) {
  let [args, ret] = desc.split(")");
  args = args.substring(1);
  const argTypes = [];

  let index = 0;
  while (index < args.length) {
    const {
      type,
      referenceCls,
      index: newIndex,
    } = parseFieldDescriptor(args, index);
    argTypes.push({ type, referenceCls });
    index = newIndex;
  }

  const retType = parseFieldDescriptor(ret, 0);
  return {
    args: argTypes,
    ret: { type: retType.type, referenceCls: retType.referenceCls },
  };
}

export function getArgs(
  thread: Thread,
  descriptor: string,
  isNative: boolean
): any[] {
  // We should memoize parsing in the future.
  const methodDesc = parseMethodDescriptor(descriptor);
  const args = [];
  for (let i = methodDesc.args.length - 1; i >= 0; i--) {
    switch (methodDesc.args[i].type) {
      case "V":
        break; // should not happen
      case "B":
      case "C":
      case "I":
      case "S":
      case "Z":
        args.push(thread.popStack());
        break;
      case "D":
        const double = asDouble(thread.popStack64());
        args.push(double);
        if (!isNative) {
          args.push(double);
        }
        break;
      case "F":
        args.push(asFloat(thread.popStack()));
        break;
      case "J":
        const long = asDouble(thread.popStack64());
        args.push(long);
        if (!isNative) {
          args.push(long);
        }
        break;
      case "[":
      default: // references + arrays
        args.push(thread.popStack());
    }
  }

  return args.reverse();
}

export function getField(ref: any, fieldName: string, type: JavaType) {
  ref.getField(fieldName, type);
}

export function asDouble(value: number): number {
  return value;
}

export function asFloat(value: number): number {
  return Math.fround(value);
}

export function primitiveTypeToName(type: JavaType) {
  switch (type) {
    case JavaType.byte:
      return "byte";
    case JavaType.char:
      return "char";
    case JavaType.double:
      return "double";
    case JavaType.float:
      return "float";
    case JavaType.int:
      return "int";
    case JavaType.long:
      return "long";
    case JavaType.short:
      return "short";
    case JavaType.boolean:
      return "boolean";
    case JavaType.void:
      return "void";
    default:
      return null;
  }
}

export function primitiveNameToType(pName: string) {
  switch (pName) {
    case "byte":
      return JavaType.byte;
    case "char":
      return JavaType.char;
    case "double":
      return JavaType.double;
    case "float":
      return JavaType.float;
    case "int":
      return JavaType.int;
    case "long":
      return JavaType.long;
    case "short":
      return JavaType.short;
    case "boolean":
      return JavaType.boolean;
    case "void":
      return JavaType.void;
    default:
      return null;
  }
}

export function attrInfo2Interface(
  infoArr: AttributeInfo[],
  constantPool: ConstantPool
) {
  const attributes: { [attributeName: string]: IAttribute[] } = {};
  // attributes
  infoArr.forEach((attr) => {
    const attrName = (
      constantPool.get(attr.attributeNameIndex) as ConstantUtf8
    ).get();
    if (!attributes[attrName]) {
      attributes[attrName] = [];
    }
    attributes[attrName].push(info2Attribute(attr, constantPool));
  });
  return attributes;
}

export function autoBox(obj: any) {
  console.warn("Auto boxing not implemented");
  return obj;
}

export function autoUnbox(obj: any) {
  console.warn("Auto unboxing not implemented");
  return obj;
}
