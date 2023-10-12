import { IntegerTooLargeError } from "./errors";

export enum Type {
  Integer,
  String,
}

export class Integer {
  value: number;
  private INTEGER_MAX = 2147483647;
  private INTEGER_MIN = -2147483648;

  private constructor(value: number) {
    this.value = value;
  }

  public from(value: number): Integer | Error;
  public from(value: string): Integer | Error;
  public from(value: number | string): Integer | Error {
    if (typeof value === "string") value = Number(value);
    if (value > this.INTEGER_MAX) return new IntegerTooLargeError();
    if (value < this.INTEGER_MIN) return new IntegerTooLargeError();
    return new Integer(value);
  }
}

export class String {
  value: string;

  private constructor(value: string) {
    this.value = value;
  }

  public from(value: string): String | Error {
    return new String(value);
  }
}
