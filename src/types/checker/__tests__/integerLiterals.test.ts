import { check } from "..";
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
    input: "int test = 0;",
    result: { type: null, errors: [] },
  },
  {
    input: "int test = 10;",
    result: { type: null, errors: [] },
  },
  {
    input: "int test = 11;",
    result: { type: null, errors: [] },
  },
  {
    input: "int test = 1_0;",
    result: { type: null, errors: [] },
  },
  {
    input: "int test = 1__0;",
    result: { type: null, errors: [] },
  },
  // TODO: For the following program, ast extractor returns undefined for variable initializer during the parsing.
  // {
  //   input: "int test = _1;",
  //   result: { type: null, errors: [new IllegalUnderscoreError()] },
  // },
  // TODO: For the following program, java-parser throws an error during the parsing.
  // {
  //   input: "int test = 1_;",
  //   result: { type: null, errors: [new IllegalUnderscoreError()] },
  // },
  {
    input: "long test = 0L;",
    result: { type: null, errors: [] },
  },
  {
    input: "long test = 1_0L;",
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
        expect(result.errors[index].name).toBe(error.name);
      });
    });
  });
});