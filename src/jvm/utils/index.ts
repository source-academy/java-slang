import { ClassData } from "../types/class/ClassData";
import { JavaType, JvmObject } from "../types/reference/Object";

/**
 * Converts a Java String to a JS string
 * @param str Java String object
 */
export const j2jsString = (str: JvmObject) => {
  return String.fromCharCode(
    ...str._getField('value', '[C', 'java/lang/String').getJsArray()
  );
};

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
    case 'long':
    case 'double':
      return 8;

    case 'int':
    case 'float':
      return 4;

    case 'short':
    case 'char':
      return 2;

    case 'byte':
    case 'boolean':
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
        '[' + (res.referenceCls ? 'L' + res.referenceCls + ';' : res.type);
      return { type: JavaType.array, referenceCls: clsName, index: res.index };
    case JavaType.reference:
      const sub = descriptor.substring(index);
      const end = sub.indexOf(';');
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
  let [args, ret] = desc.split(')');
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
      return 'byte';
    case JavaType.char:
      return 'char';
    case JavaType.double:
      return 'double';
    case JavaType.float:
      return 'float';
    case JavaType.int:
      return 'int';
    case JavaType.long:
      return 'long';
    case JavaType.short:
      return 'short';
    case JavaType.boolean:
      return 'boolean';
    case JavaType.void:
      return 'void';
    default:
      return null;
  }
}

export function primitiveNameToType(pName: string) {
  switch (pName) {
    case 'byte':
      return JavaType.byte;
    case 'char':
      return JavaType.char;
    case 'double':
      return JavaType.double;
    case 'float':
      return JavaType.float;
    case 'int':
      return JavaType.int;
    case 'long':
      return JavaType.long;
    case 'short':
      return JavaType.short;
    case 'boolean':
      return JavaType.boolean;
    case 'void':
      return JavaType.void;
    default:
      return null;
  }
}
