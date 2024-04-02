import { check } from "..";
import { parse } from "../../ast";
import {
  CannotFindSymbolError,
  IncompatibleTypesError,
  VariableAlreadyDefinedError,
} from "../../errors";
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
    input: `for (int i = 0; i < 10; i++) {}`,
    result: { type: null, errors: [] },
  },
  {
    input: `for (double i = 0; i < 10; i++) {}`,
    result: { type: null, errors: [] },
  },
  {
    input: `for (int i = 0; i < 10; i = i + "1") {}`,
    result: { type: null, errors: [new IncompatibleTypesError()] },
  },
  {
    input: `
      for (int i = 0; i < 10; i++) {}
      int test = i;
    `,
    result: { type: null, errors: [new CannotFindSymbolError()] },
  },
  {
    input: `
      for (int i = 0; i < 10; i++) {
        for (int i = 0; i < 5; i++) {}
      }
    `,
    result: { type: null, errors: [] },
  },
  {
    input: `for (int i = 0, j = 10; i < j; i++, j--) {}`,
    result: { type: null, errors: [] },
  },
  {
    input: `
      int i = 1;
      for (i = 0; i < 10; i++) {}
    `,
    result: { type: null, errors: [] },
  },
  {
    input: `
      int i = 1;
      for (int i = 0; i < 10; i++) {}
    `,
    result: { type: null, errors: [new VariableAlreadyDefinedError()] },
  },
];

describe("Type Checker", () => {
  testcases.map((testcase) => {
    let it = test;
    if (testcase.only) it = test.only;
    it(`Checking for statements for '${testcase.input}'`, () => {
      const program = createProgram(testcase.input);
      const ast = parse(program);
      if (!ast) throw new Error("Program parsing returns null.");
      const result = check(ast);
      if (result.currentType === null)
        expect(result.currentType).toBe(testcase.result.type);
      else expect(result.currentType).toBeInstanceOf(testcase.result.type);
      if (testcase.result.errors.length > result.errors.length) {
        testcase.result.errors.forEach((error, index) => {
          if (!result.errors[index]) expect("").toBe(error.message);
          expect(result.errors[index].message).toBe(error.message);
        });
      } else {
        result.errors.forEach((error, index) => {
          if (!testcase.result.errors[index]) expect(error.message).toBe("");
          expect(error.message).toBe(testcase.result.errors[index].message);
        });
      }
    });
  });
});
