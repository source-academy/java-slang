import { check } from "..";
import { parse } from "../../ast";
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
    input: "int decimal = 0;",
    result: { type: null, errors: [] },
  },
  {
    input: "int decimal = 10;",
    result: { type: null, errors: [] },
  },
  {
    input: "int decimal = 11;",
    result: { type: null, errors: [] },
  },
  {
    input: "int decimal = 1_0;",
    result: { type: null, errors: [] },
  },
  {
    input: "int decimal = 1__0;",
    result: { type: null, errors: [] },
  },
  // TODO: For the following program, ast extractor returns undefined for variable initializer during the parsing.
  // {
  //   input: "int decimal = _1;",
  //   result: { type: null, errors: [new IllegalUnderscoreError()] },
  // },
  // TODO: For the following program, java-parser throws an error during the parsing.
  // {
  //   input: "int decimal = 1_;",
  //   result: { type: null, errors: [new IllegalUnderscoreError()] },
  // },
  {
    input: "long decimal = 0L;",
    result: { type: null, errors: [] },
  },
  {
    input: "long decimal = 1_0L;",
    result: { type: null, errors: [] },
  },
  {
    input: "int hex = 0x0;",
    result: { type: null, errors: [] },
  },
  {
    input: "int hex = 0x10;",
    result: { type: null, errors: [] },
  },
  {
    input: "int hex = 0x11;",
    result: { type: null, errors: [] },
  },
  {
    input: "int hex = 0x1_0;",
    result: { type: null, errors: [] },
  },
  {
    input: "int hex = 0x1__0;",
    result: { type: null, errors: [] },
  },
  {
    input: "long hex = 0x0L;",
    result: { type: null, errors: [] },
  },
  {
    input: "long hex = 0x1_0L;",
    result: { type: null, errors: [] },
  },
  {
    input: "int hex = 0X0;",
    result: { type: null, errors: [] },
  },
  {
    input: "int hex = 0X10;",
    result: { type: null, errors: [] },
  },
  {
    input: "int hex = 0X11;",
    result: { type: null, errors: [] },
  },
  {
    input: "int hex = 0X1_0;",
    result: { type: null, errors: [] },
  },
  {
    input: "int hex = 0X1__0;",
    result: { type: null, errors: [] },
  },
  {
    input: "long hex = 0X0L;",
    result: { type: null, errors: [] },
  },
  {
    input: "long hex = 0X1_0L;",
    result: { type: null, errors: [] },
  },
  {
    input: "int octal = 00;",
    result: { type: null, errors: [] },
  },
  {
    input: "int octal = 010;",
    result: { type: null, errors: [] },
  },
  {
    input: "int octal = 011;",
    result: { type: null, errors: [] },
  },
  {
    input: "int octal = 01_0;",
    result: { type: null, errors: [] },
  },
  {
    input: "int octal = 01__0;",
    result: { type: null, errors: [] },
  },
  {
    input: "long octal = 00L;",
    result: { type: null, errors: [] },
  },
  {
    input: "long octal = 01_0L;",
    result: { type: null, errors: [] },
  },
  {
    input: "int binary = 0b0;",
    result: { type: null, errors: [] },
  },
  {
    input: "int binary = 0b10;",
    result: { type: null, errors: [] },
  },
  {
    input: "int binary = 0b11;",
    result: { type: null, errors: [] },
  },
  {
    input: "int binary = 0b1_0;",
    result: { type: null, errors: [] },
  },
  {
    input: "int binary = 0b1__0;",
    result: { type: null, errors: [] },
  },
  {
    input: "long binary = 0b0L;",
    result: { type: null, errors: [] },
  },
  {
    input: "long binary = 0b1_0L;",
    result: { type: null, errors: [] },
  },
  {
    input: "int binary = 0B0;",
    result: { type: null, errors: [] },
  },
  {
    input: "int binary = 0B10;",
    result: { type: null, errors: [] },
  },
  {
    input: "int binary = 0B11;",
    result: { type: null, errors: [] },
  },
  {
    input: "int binary = 0B1_0;",
    result: { type: null, errors: [] },
  },
  {
    input: "int binary = 0B1__0;",
    result: { type: null, errors: [] },
  },
  {
    input: "long binary = 0B0L;",
    result: { type: null, errors: [] },
  },
  {
    input: "long binary = 0B1_0L;",
    result: { type: null, errors: [] },
  },
  {
    input: "Integer decimal = 0;",
    result: { type: null, errors: [] },
  },
  {
    input: "Long decimal = 0L;",
    result: { type: null, errors: [] },
  },
];

describe("Type Checker", () => {
  testcases.map((testcase) => {
    let it = test;
    if (testcase.only) it = test.only;
    it(`Checking integer literals for ${testcase.input}`, () => {
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
