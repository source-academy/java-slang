import { IntegerTooLargeError } from "./errors";

export type Type = Int | String;

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
      value = value.replace(/_/g, "");
      let base = 10;
      if (value.length > 1) {
        if (value.startsWith("0b")) {
          base = 2;
          value = value.substring(2);
        } else if (value.startsWith("0x")) {
          base = 16;
          value = value.substring(2);
        } else if (value.startsWith("0")) {
          base = 8;
          value = value.substring(1);
        }
      }
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
    value = value.replace(/(_|l|L)/g, "");
    if (
      value.length > 1 &&
      value.startsWith("0") &&
      !value.startsWith("0b") &&
      !value.startsWith("0x")
    )
      value = "0o" + value.substring(1);
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
