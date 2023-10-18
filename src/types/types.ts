import { IntegerTooLargeError } from "./errors";

export type Type = Int | String;

export class Int {
  public name = "int";
  private static INTEGER_MAX = 2147483647;
  private static INTEGER_MIN = -2147483648;

  public static from(value: number): Int | Error;
  public static from(value: string): Int | Error;
  public static from(value: number | string): Int | Error {
    if (typeof value === "string") value = Number(value);
    if (value > this.INTEGER_MAX) return new IntegerTooLargeError();
    if (value < this.INTEGER_MIN) return new IntegerTooLargeError();
    return new Int();
  }
}

export class String {
  public name = "String";
  public static from(value: string): String {
    return new String();
  }
}
