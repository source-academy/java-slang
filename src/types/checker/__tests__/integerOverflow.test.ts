import { check } from "..";
import { IntegerTooLargeError } from "../../errors";
import { parse } from "../../../ast/parser";
import { Type } from "../../types/type";

const createProgram = (statement: string) => `
  public class Main {
    public static void main(String args[]) {
      ${statement}
    }
  }
`;

const testcases: {
  input: string;
  result: { type: Type | null; errors: Error[] };
  only?: boolean;
}[] = [
  {
    input: "int decimal = 2147483647;",
    result: { type: null, errors: [] },
  },
  {
    input: "int decimal = -2147483648;",
    result: { type: null, errors: [] },
  },
  {
    input: "int decimal = 2147483648;",
    result: { type: null, errors: [new IntegerTooLargeError()] },
  },
  {
    input: "int decimal = -2147483649;",
    result: { type: null, errors: [new IntegerTooLargeError()] },
  },
  {
    input: "long decimal = 9223372036854775807L;",
    result: { type: null, errors: [] },
  },
  {
    input: "long decimal = -9223372036854775808L;",
    result: { type: null, errors: [] },
  },
  {
    input: "long decimal = 9223372036854775808L;",
    result: { type: null, errors: [new IntegerTooLargeError()] },
  },
  {
    input: "long decimal = -9223372036854775809L;",
    result: { type: null, errors: [new IntegerTooLargeError()] },
  },
  {
    input: "int hex = 0x7FFFFFFF;",
    result: { type: null, errors: [] },
  },
  {
    input: "int hex = -0x80000000;",
    result: { type: null, errors: [] },
  },
  {
    input: "int hex = 0x80000000;",
    result: { type: null, errors: [new IntegerTooLargeError()] },
  },
  {
    input: "int hex = -0x80000001;",
    result: { type: null, errors: [new IntegerTooLargeError()] },
  },
  {
    input: "long hex = 0x7FFFFFFFFFFFFFFFL;",
    result: { type: null, errors: [] },
  },
  {
    input: "long hex = -0x8000000000000000L;",
    result: { type: null, errors: [] },
  },
  {
    input: "long hex = 0x8000000000000000L;",
    result: { type: null, errors: [new IntegerTooLargeError()] },
  },
  {
    input: "long hex = -0x8000000000000001L;",
    result: { type: null, errors: [new IntegerTooLargeError()] },
  },
  {
    input: "int octal = 017777777777;",
    result: { type: null, errors: [] },
  },
  {
    input: "int octal = -020000000000;",
    result: { type: null, errors: [] },
  },
  {
    input: "int octal = 020000000000;",
    result: { type: null, errors: [new IntegerTooLargeError()] },
  },
  {
    input: "int octal = -020000000001;",
    result: { type: null, errors: [new IntegerTooLargeError()] },
  },
  {
    input: "long octal = 0777777777777777777777L;",
    result: { type: null, errors: [] },
  },
  {
    input: "long octal = -01000000000000000000000L;",
    result: { type: null, errors: [] },
  },
  {
    input: "long octal = 01000000000000000000000L;",
    result: { type: null, errors: [new IntegerTooLargeError()] },
  },
  {
    input: "long octal = -01000000000000000000001L;",
    result: { type: null, errors: [new IntegerTooLargeError()] },
  },
  {
    input: "int binary = 0b1111111111111111111111111111111;",
    result: { type: null, errors: [] },
  },
  {
    input: "int octal = -0b10000000000000000000000000000000;",
    result: { type: null, errors: [] },
  },
  {
    input: "int octal = 0b10000000000000000000000000000000;",
    result: { type: null, errors: [new IntegerTooLargeError()] },
  },
  {
    input: "int octal = -0b10000000000000000000000000000001;",
    result: { type: null, errors: [new IntegerTooLargeError()] },
  },
  {
    input: `long binary = 0b${"1".repeat(63)}L;`,
    result: { type: null, errors: [] },
  },
  {
    input: `long binary = -0b1${"0".repeat(63)}L;`,
    result: { type: null, errors: [] },
  },
  {
    input: `long binary = 0b1${"0".repeat(63)}L;`,
    result: { type: null, errors: [new IntegerTooLargeError()] },
  },
  {
    input: `long binary = -0b1${"0".repeat(62)}1L;`,
    result: { type: null, errors: [new IntegerTooLargeError()] },
  },
];

describe("Type Checker", () => {
  testcases.map((testcase) => {
    let it = test;
    if (testcase.only) it = test.only;
    it(`Checking integer overflow for ${testcase.input}`, () => {
      const program = createProgram(testcase.input);
      const ast = parse(program);
      if (!ast) throw new Error("Program parsing returns null.");
      const result = check(ast);
      if (result.currentType === null)
        expect(result.currentType).toBe(testcase.result.type);
      else expect(result.currentType).toBeInstanceOf(testcase.result.type);
      expect(result.errors.length).toBe(testcase.result.errors.length);
      testcase.result.errors.forEach((error, index) => {
        expect(result.errors[index].message).toBe(error.message);
      });
    });
  });
});
