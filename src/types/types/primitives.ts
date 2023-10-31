import { IntegerTooLargeError } from "../errors";
import { Type as TypeClass } from "./type";

export type Type =
  | Boolean
  | Byte
  | Character
  | Double
  | Float
  | Int
  | Long
  | Short
  | String;

export class Boolean extends TypeClass {
  constructor() {
    super("boolean");
  }

  public static from(value: string): Boolean | Error {
    if (!["true", "false"].includes(value))
      throw new Error(`Unrecognized boolean ${value}.`);
    return new Boolean();
  }

  public canBeAssigned(type: TypeClass): boolean {
    return type instanceof Boolean;
  }
}

export class Byte extends TypeClass {
  private static BYTE_MAX = 127;
  private static BYTE_MIN = -128;
  constructor() {
    super("byte");
  }

  public static from(value: string): Byte | Error {
    const isNegative = value.startsWith("-");
    if (isNegative) value = value.substring(1);
    value = value.replace(/_/g, "").toLowerCase();
    const base = getNumericBase(value);
    value = removeNumericBasePrefix(value, base);
    let byte = parseInt(value, base);
    byte = isNegative ? byte * -1 : byte;
    if (byte > this.BYTE_MAX) return new IntegerTooLargeError();
    if (byte < this.BYTE_MIN) return new IntegerTooLargeError();
    return new Byte();
  }

  public canBeAssigned(type: TypeClass): boolean {
    return type instanceof Byte;
  }
}

export class Character extends TypeClass {
  constructor() {
    super("char");
  }

  public static from(value: string): Character | Error {
    if (value.charAt(0) !== "'")
      throw new Error(`Unrecognized character ${value}.`);
    if (value.charAt(value.length - 1) !== "'")
      throw new Error(`Unrecognized character ${value}.`);
    return new Character();
  }

  public canBeAssigned(type: TypeClass): boolean {
    return (
      type instanceof Character || type instanceof Short || type instanceof Byte
    );
  }
}

export class Double extends TypeClass {
  constructor() {
    super("double");
  }

  public static from(value: number | string): Double | Error {
    if (typeof value === "string") {
      value = removeFloatTypeSuffix(value);
      const isNegative = value.startsWith("-");
      if (isNegative) value = value.substring(1);
      value = value.replace(/_/g, "").toLowerCase();
      const base = getNumericBase(value);
      base === 16 ? parseHexFloat(value) : Number(value);
    }
    return new Double();
  }

  public canBeAssigned(type: TypeClass): boolean {
    return (
      type instanceof Double ||
      type instanceof Float ||
      type instanceof Long ||
      type instanceof Int ||
      type instanceof Character ||
      type instanceof Short ||
      type instanceof Byte
    );
  }
}

export class Float extends TypeClass {
  constructor() {
    super("float");
  }

  public static from(value: number | string): Float | Error {
    if (typeof value === "string") {
      value = removeFloatTypeSuffix(value);
      const isNegative = value.startsWith("-");
      if (isNegative) value = value.substring(1);
      value = value.replace(/_/g, "").toLowerCase();
      const base = getNumericBase(value);
      base === 16 ? parseHexFloat(value) : Number(value);
    }
    return new Float();
  }

  public canBeAssigned(type: Type): boolean {
    return (
      type instanceof Float ||
      type instanceof Long ||
      type instanceof Int ||
      type instanceof Character ||
      type instanceof Short ||
      type instanceof Byte
    );
  }
}

export class Int extends TypeClass {
  private static INTEGER_MAX = 2147483647;
  private static INTEGER_MIN = -2147483648;
  constructor() {
    super("int");
  }

  public static from(value: string): Int | Error {
    const isNegative = value.startsWith("-");
    if (isNegative) value = value.substring(1);
    value = value.replace(/_/g, "").toLowerCase();
    const base = getNumericBase(value);
    value = removeNumericBasePrefix(value, base);
    let int = parseInt(value, base);
    int = isNegative ? int * -1 : int;
    if (int > this.INTEGER_MAX) return new IntegerTooLargeError();
    if (int < this.INTEGER_MIN) return new IntegerTooLargeError();
    return new Int();
  }

  public canBeAssigned(type: TypeClass): boolean {
    return (
      type instanceof Int ||
      type instanceof Character ||
      type instanceof Short ||
      type instanceof Byte
    );
  }
}

export class Long extends TypeClass {
  private static LONG_MAX = BigInt("9223372036854775807");
  private static LONG_MIN = BigInt("-9223372036854775808");
  constructor() {
    super("long");
  }

  public static from(value: string): Long | Error {
    const isNegative = value.startsWith("-");
    if (isNegative) value = value.substring(1);
    value = value.replace(/(_|l|L)/g, "").toLowerCase();
    if (getNumericBase(value) === 8)
      value = "0o" + removeNumericBasePrefix(value, 8);
    const long = BigInt(value) * BigInt(isNegative ? -1 : 1);
    if (long > this.LONG_MAX) return new IntegerTooLargeError();
    if (long < this.LONG_MIN) return new IntegerTooLargeError();
    return new Long();
  }

  public canBeAssigned(type: TypeClass): boolean {
    return (
      type instanceof Long ||
      type instanceof Int ||
      type instanceof Character ||
      type instanceof Short ||
      type instanceof Byte
    );
  }
}

export class Null extends TypeClass {
  constructor() {
    super("null");
  }

  public static from(value: string): Null {
    if (value !== "null") throw new Error(`Unrecognized null ${value}.`);
    return new Null();
  }

  public canBeAssigned(type: TypeClass): boolean {
    return false;
  }
}

export class Short extends TypeClass {
  private static SHORT_MAX = 32767;
  private static SHORT_MIN = -32768;
  constructor() {
    super("short");
  }

  public static from(value: string): Short | Error {
    const isNegative = value.startsWith("-");
    if (isNegative) value = value.substring(1);
    value = value.replace(/_/g, "").toLowerCase();
    const base = getNumericBase(value);
    value = removeNumericBasePrefix(value, base);
    let short = parseInt(value, base);
    short = isNegative ? short * -1 : short;
    if (short > this.SHORT_MAX) return new IntegerTooLargeError();
    if (short < this.SHORT_MIN) return new IntegerTooLargeError();
    return new Short();
  }

  public canBeAssigned(type: TypeClass): boolean {
    return type instanceof Short || type instanceof Byte;
  }
}

export class String extends TypeClass {
  constructor() {
    super("String");
  }

  public static from(value: string): String {
    if (value.charAt(0) !== '"')
      throw new Error(`Unrecognized string ${value}.`);
    if (value.charAt(value.length - 1) !== '"')
      throw new Error(`Unrecognized string ${value}.`);
    if (
      value.length > 6 &&
      value.substring(0, 3) === '"""' &&
      value.substring(value.length - 3, value.length) !== '"""'
    )
      throw new Error(`Unrecognized string ${value}.`);
    return new String();
  }

  public canBeAssigned(type: TypeClass): boolean {
    return type instanceof String || type instanceof Null;
  }
}

type NumberType = "long" | "int";

export const getNumberType = (number: string): NumberType => {
  const lastCharacter = number.toLowerCase().charAt(number.length - 1);
  if (lastCharacter === "l") return "long";
  return "int";
};

type NumericBase = 2 | 8 | 10 | 16;

const getNumericBase = (number: string): NumericBase => {
  if (number.length < 2) return 10;
  const firstCharacter = number.charAt(0);
  if (firstCharacter !== "0") return 10;
  const secondCharacter = number.charAt(1).toLowerCase();
  if (secondCharacter === "b") return 2;
  else if (secondCharacter === "x") return 16;
  else return 8;
};

const removeNumericBasePrefix = (number: string, base: number): string => {
  if (base === 2 || base === 16) return number.substring(2);
  if (base === 8) return number.substring(1);
  return number;
};

type FloatType = "double" | "float";

export const getFloatType = (float: string): FloatType => {
  const lastCharacter = float.toLowerCase().charAt(float.length - 1);
  if (lastCharacter === "f") return "float";
  return "double";
};

const removeFloatTypeSuffix = (float: string): string => {
  const lastCharacter = float.toLowerCase().charAt(float.length - 1);
  if (["d", "f"].includes(lastCharacter))
    return float.substring(0, float.length - 1);
  return float;
};

const parseHexFloat = (float: string) => {
  float = float.toLowerCase().replace(/_/g, "");
  let floatTypeSuffix = float.charAt(-1);
  if (!["d", "f"].includes(floatTypeSuffix)) floatTypeSuffix = "d";
  else float = float.substring(0, float.length - 1);
  const [hexSignificandString, exponentIntegerString] = float.split("p");
  const exponentInteger = Number(exponentIntegerString);
  const parts = hexSignificandString.split(".");
  let number = parseInt(parts[0].length > 2 ? parts[0] : "0", 16);
  if (parts[1])
    number += parseInt(parts[1], 16) / Math.pow(16, parts[1].length);
  return number * Math.pow(2, exponentInteger);
};
