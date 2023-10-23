import { IntegerTooLargeError } from "./errors";

export type Type = Int | String;

export class Double {
  public name = "double";
  // private static DOUBLE_MAX = 1.7976931348623157e308;
  // private static DOUBLE_MIN = 4.9e-324;

  public static from(value: number | string): Int | Error {
    if (typeof value === "string") {
      const isNegative = value.startsWith("-");
      if (isNegative) value = value.substring(1);
      value = value.replace(/_/g, "").toLowerCase();
      const int = Number(value);
      value = isNegative ? int * -1 : int;
    }
    // if (value > this.DOUBLE_MAX) return new FloatTooLargeError();
    // if (value < this.DOUBLE_MIN) return new FloatTooLargeError();
    return new Double();
  }
}

export class Float {
  public name = "float";
  // private static FLOAT_MAX = 3.4028235e38;
  // private static FLOAT_MIN = 1.4e-45;

  public static from(value: number | string): Int | Error {
    if (typeof value === "string") {
      const isNegative = value.startsWith("-");
      if (isNegative) value = value.substring(1);
      value = value.replace(/_/g, "").toLowerCase();
      const int = Number(value);
      value = isNegative ? int * -1 : int;
    }
    // if (value > this.FLOAT_MAX) return new FloatTooLargeError();
    // if (value < this.FLOAT_MIN) return new FloatTooLargeError();
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

  public static from(value: string): Int | Error {
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
