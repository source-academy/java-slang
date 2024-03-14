import { check } from "..";
import { BadOperandTypesError, IncompatibleTypesError } from "../../errors";
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
    input: `
      int test = 0;
      if (true) {
        test = 1;
      }
    `,
    result: { type: null, errors: [] },
  },
  {
    input: `
      int test = 0;
      if (false) {}
      else {
        test = 1;
      }
    `,
    result: { type: null, errors: [] },
  },
  {
    input: `
      int test = 0;
      if (true) {
        test = 1;
        test = 2;
      }
      else {
        test = 3;
        test = 4;
      }
    `,
    result: { type: null, errors: [] },
  },
  {
    input: `
      int test = 0;
      if (1 + 1) {
        test = 1;
      }
    `,
    result: { type: null, errors: [new IncompatibleTypesError()] },
  },
  {
    input: `
      int test = 0;
      if (1 * "Hello") {
        test = 1;
      }
    `,
    result: { type: null, errors: [new BadOperandTypesError()] },
  },

  {
    input: `
      int test = 0;
      if (true) {
        if (1 * "Hello") {
          test = 1;
        }
      }
    `,
    result: { type: null, errors: [new BadOperandTypesError()] },
  },
];

describe("Type Checker", () => {
  testcases.map((testcase) => {
    let it = test;
    if (testcase.only) it = test.only;
    it(`Checking if then else statements for ${testcase.input}`, () => {
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
