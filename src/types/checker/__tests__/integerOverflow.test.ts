import { check } from "..";
import { IntegerTooLargeError } from "../../errors";
import { parse } from "../../../ast/parser";
import { Type } from "../../types";

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
    input: "int test = 2147483647;",
    result: { type: null, errors: [] },
  },
  {
    input: "int test = -2147483648;",
    result: { type: null, errors: [] },
  },
  {
    input: "int test = 2147483648;",
    result: { type: null, errors: [new IntegerTooLargeError()] },
  },
  {
    input: "int test = -2147483649;",
    result: { type: null, errors: [new IntegerTooLargeError()] },
  },
  {
    input: "int test = 1 + 2147483647;",
    result: { type: null, errors: [] },
  },
  {
    input: "int test = 1 + 2147483648;",
    result: { type: null, errors: [new IntegerTooLargeError()] },
  },
  {
    input: "int test = 1 - 2147483647;",
    result: { type: null, errors: [] },
  },
  {
    input: "int test = 1 - 2147483648;",
    result: { type: null, errors: [new IntegerTooLargeError()] },
  },
  {
    input: "int test = 1 + +2147483647;",
    result: { type: null, errors: [] },
  },
  {
    input: "int test = 1 + +2147483648;",
    result: { type: null, errors: [new IntegerTooLargeError()] },
  },
  {
    input: "int test = 1 + -2147483648;",
    result: { type: null, errors: [] },
  },
  {
    input: "int test = 1 + -2147483649;",
    result: { type: null, errors: [new IntegerTooLargeError()] },
  },
  {
    input: "long test = 9223372036854775807L;",
    result: { type: null, errors: [] },
  },
  {
    input: "long test = -9223372036854775808L;",
    result: { type: null, errors: [] },
  },
  {
    input: "long test = 9223372036854775808L;",
    result: { type: null, errors: [new IntegerTooLargeError()] },
  },
  {
    input: "long test = -9223372036854775809L;",
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
        expect(result.errors[index].name).toBe(error.name);
      });
    });
  });
});
