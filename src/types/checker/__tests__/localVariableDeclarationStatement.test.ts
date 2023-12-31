import { check } from "..";
import { IncompatibleTypesError } from "../../errors";
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
}[] = [
  {
    input: "int test = 0;",
    result: { type: null, errors: [] },
  },
  {
    input: 'int test = "A";',
    result: { type: null, errors: [new IncompatibleTypesError()] },
  },
  {
    input: "String test = 0;",
    result: { type: null, errors: [new IncompatibleTypesError()] },
  },
  {
    input: 'String test = "A";',
    result: { type: null, errors: [] },
  },
];

describe("Type Checker", () => {
  testcases.map((testcase) => {
    test(`Checking local variable declaration for ${testcase.input}`, () => {
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
