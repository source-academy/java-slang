import { check } from "..";
import { parse } from "../../../ast/parser";
import { Type } from "../../types";

const createProgram = (statement: string) => `
  public class Main {
    public static void main(String args[]) {
      int test = ${statement};
    }
  }
`;

const testcases: {
  input: string;
  result: { type: Type | null; errors: Error[] };
}[] = [
  {
    input: "0",
    result: { type: null, errors: [] },
  },
  {
    input: "10",
    result: { type: null, errors: [] },
  },
  {
    input: "11",
    result: { type: null, errors: [] },
  },
  {
    input: "1_0",
    result: { type: null, errors: [] },
  },
  {
    input: "1__0",
    result: { type: null, errors: [] },
  },
  // TODO: For the following program, java-parser returns undefined for variable initializer during the parsing.
  // {
  //   input: "_1",
  //   result: { type: null, errors: [new IllegalUnderscoreError()] },
  // },
  // TODO: For the following program, java-parser throws an error during the parsing.
  // {
  //   input: "1_",
  //   result: { type: null, errors: [new IllegalUnderscoreError()] },
  // },
];

describe("Type Checker", () => {
  testcases.map((testcase) => {
    test(`Checking integer literals for ${testcase.input}`, () => {
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
