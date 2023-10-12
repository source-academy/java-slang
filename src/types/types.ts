import { IntegerTooLargeError } from "./errors";

export type Type = Integer | String;

export class Integer {
  private static INTEGER_MAX = 2147483647;
  private static INTEGER_MIN = -2147483648;

  public static from(value: number): Integer | Error;
  public static from(value: string): Integer | Error;
  public static from(value: number | string): Integer | Error {
    if (typeof value === "string") value = Number(value);
    if (value > this.INTEGER_MAX) return new IntegerTooLargeError();
    if (value < this.INTEGER_MIN) return new IntegerTooLargeError();
    return new Integer();
  }
}

export class String {
  public static from(value: string): String {
    return new String();
  }
}
