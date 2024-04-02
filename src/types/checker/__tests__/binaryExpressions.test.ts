import { BadOperandTypesError } from "../../errors";
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
    input: "int test = 0;",
    result: { type: null, errors: [] },
  },
  {
    input: "int test = 1 + 1;",
    result: { type: null, errors: [] },
  },
  {
    input: 'String test = 1 + "A";',
    result: { type: null, errors: [] },
  },
  {
    input: 'String test = "A" + 1;',
    result: { type: null, errors: [] },
  },
  {
    input: 'String test = "A" + "A";',
    result: { type: null, errors: [] },
  },
  {
    input: "int test = 1 - 1;",
    result: { type: null, errors: [] },
  },
  {
    input: 'String test = 1 - "A";',
    result: { type: null, errors: [new BadOperandTypesError()] },
  },
  {
    input: 'String test = "A" - 1;',
    result: { type: null, errors: [new BadOperandTypesError()] },
  },
  {
    input: 'String test = "A" - "A";',
    result: { type: null, errors: [new BadOperandTypesError()] },
  },
  {
    input: "int test = 1 * 1;",
    result: { type: null, errors: [] },
  },
  {
    input: 'String test = 1 * "A";',
    result: { type: null, errors: [new BadOperandTypesError()] },
  },
  {
    input: 'String test = "A" * 1;',
    result: { type: null, errors: [new BadOperandTypesError()] },
  },
  {
    input: 'String test = "A" * "A";',
    result: { type: null, errors: [new BadOperandTypesError()] },
  },
  {
    input: "int test = 1 / 1;",
    result: { type: null, errors: [] },
  },
  {
    input: 'String test = 1 / "A";',
    result: { type: null, errors: [new BadOperandTypesError()] },
  },
  {
    input: 'String test = "A" / 1;',
    result: { type: null, errors: [new BadOperandTypesError()] },
  },
  {
    input: 'String test = "A" / "A";',
    result: { type: null, errors: [new BadOperandTypesError()] },
  },
  {
    input: "int test = (1 + 1) + 1;",
    result: { type: null, errors: [] },
  },
  {
    input: "int test = 1 + (1 + 1); ",
    result: { type: null, errors: [] },
  },
  {
    input: 'String test = (1 + "A") + 1;',
    result: { type: null, errors: [] },
  },
  {
    input: 'String test = 1 + (1 + "A");',
    result: { type: null, errors: [] },
  },
  {
    input: "double test = 0.1 + 0.1;",
    result: { type: null, errors: [] },
  },
  {
    input: "double test = 0.1 + 0.1F;",
    result: { type: null, errors: [] },
  },
  {
    input: 'String test = "string" + 0.1;',
    result: { type: null, errors: [] },
  },
  {
    input: "int test = 1 + true;",
    result: { type: null, errors: [new BadOperandTypesError()] },
  },
];

describe("Type Checker", () => {
  testcases.map((testcase) => {
    let it = test;
    if (testcase.only) it = test.only;
    it(`Checking binary expression ${testcase.input}`, () => {
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
