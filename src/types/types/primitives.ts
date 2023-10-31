import { IntegerTooLargeError } from "../errors";

export type Type =
  | Boolean
  | Byte
  | Character
  | Double
  | Float
  | Int
  | Long
  | String;

export class Boolean {
  public name = "boolean";

  public static from(value: string): Boolean | Error {
    if (!["true", "false"].includes(value))
      throw new Error(`Unrecognized boolean ${value}.`);
    return new Boolean();
  }
}

export class Byte {
  public name = "byte";
  private static BYTE_MAX = 127;
  private static BYTE_MIN = -128;

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
}

export class Character {
  public name = "char";

  public static from(value: string): Character | Error {
    if (value.charAt(0) !== "'")
      throw new Error(`Unrecognized character ${value}.`);
    if (value.charAt(value.length - 1) !== "'")
      throw new Error(`Unrecognized character ${value}.`);
    return new Character();
  }
}

export class Double {
  public name = "double";

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
}

export class Float {
  public name = "float";

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
}

export class Int {
  public name = "int";
  private static INTEGER_MAX = 2147483647;
  private static INTEGER_MIN = -2147483648;

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
}

export class Long {
  public name = "long";
  private static LONG_MAX = BigInt("9223372036854775807");
  private static LONG_MIN = BigInt("-9223372036854775808");

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
}

export class Null {
  public name = "null";
  public static from(value: string): Null {
    if (value !== "null") throw new Error(`Unrecognized null ${value}.`);
    return new Null();
  }
}

export class Short {
  public name = "short";
  private static SHORT_MAX = 32767;
  private static SHORT_MIN = -32768;

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
}

export class String {
  public name = "String";
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
