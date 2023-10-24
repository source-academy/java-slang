import { IntegerTooLargeError } from "./errors";

export type Type = Boolean | Character | Double | Float | Int | Long | String;

export class Boolean {
  public name = "boolean";

  public static from(value: string): Boolean | Error {
    if (!["true", "false"].includes(value))
      throw new Error(`Unrecognized boolean ${value}.`);
    return new Boolean();
  }
}

export class Character {
  public name = "char";

  public static from(value: string): Character | Error {
    if (
      value.length !== 3 ||
      value.charAt(0) !== "'" ||
      value.charAt(2) !== "'"
    )
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
      const number = base === 16 ? parseHexFloat(value) : Number(value);
      console.log(number); // TODO: Check limits of Double
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
      const number = base === 16 ? parseHexFloat(value) : Number(value);
      console.log(number); // TODO: Check limits of Float
    }
    return new Float();
  }
}

export class Int {
  public name = "int";
  private static INTEGER_MAX = 2147483647;
  private static INTEGER_MIN = -2147483648;

  public static from(value: number): Int | Error;
  public static from(value: string): Int | Error;
  public static from(value: number | string): Int | Error {
    if (typeof value === "string") {
      const isNegative = value.startsWith("-");
      if (isNegative) value = value.substring(1);
      value = value.replace(/_/g, "").toLowerCase();
      const base = getNumericBase(value);
      value = removeNumericBasePrefix(value, base);
      const int = parseInt(value, base);
      value = isNegative ? int * -1 : int;
    }
    if (value > this.INTEGER_MAX) return new IntegerTooLargeError();
    if (value < this.INTEGER_MIN) return new IntegerTooLargeError();
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

export class String {
  public name = "String";
  public static from(value: string): String {
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
