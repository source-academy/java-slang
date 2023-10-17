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
      if (!value.match(/\b\d+(?:_+\d+)*\b/g))
        return new Error(`Unrecognized integer string ${value}.`);
      value = value.replace(/_/g, "");
      value = Number(value);
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
    if (!value.match(/\b\d+(?:_+\d+)*(l|L)\b/g))
      return new Error(`Unrecognized long string ${value}.`);
    value = value.replace(/(_|l|L)/g, "");
    const long = BigInt(value);
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
