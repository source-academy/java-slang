import { BadOperandTypesError } from "../../errors";
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
    input: "1 + 1",
    result: { type: null, errors: [] },
  },
  {
    input: '1 + "A"',
    result: { type: null, errors: [] },
  },
  {
    input: '"A" + 1',
    result: { type: null, errors: [] },
  },
  {
    input: '"A" + "A"',
    result: { type: null, errors: [] },
  },
  {
    input: "1 - 1",
    result: { type: null, errors: [] },
  },
  {
    input: '1 - "A"',
    result: { type: null, errors: [] },
  },
  {
    input: '"A" - 1',
    result: { type: null, errors: [] },
  },
  {
    input: '"A" - "A"',
    result: { type: null, errors: [new BadOperandTypesError()] },
  },
  {
    input: "1 * 1",
    result: { type: null, errors: [] },
  },
  {
    input: '1 * "A"',
    result: { type: null, errors: [new BadOperandTypesError()] },
  },
  {
    input: '"A" * 1',
    result: { type: null, errors: [new BadOperandTypesError()] },
  },
  {
    input: '"A" * "A"',
    result: { type: null, errors: [new BadOperandTypesError()] },
  },
  {
    input: "1 / 1",
    result: { type: null, errors: [] },
  },
  {
    input: '1 / "A"',
    result: { type: null, errors: [new BadOperandTypesError()] },
  },
  {
    input: '"A" / 1',
    result: { type: null, errors: [new BadOperandTypesError()] },
  },
  {
    input: '"A" / "A"',
    result: { type: null, errors: [new BadOperandTypesError()] },
  },
  {
    input: "(1 + 1) + 1",
    result: { type: null, errors: [] },
  },
  {
    input: "1 + (1 + 1)",
    result: { type: null, errors: [] },
  },
  {
    input: '(1 + "A") + 1',
    result: { type: null, errors: [] },
  },
  {
    input: '1 + (1 + "A")',
    result: { type: null, errors: [] },
  },
];

describe("Type Checker", () => {
  testcases.map((testcase) => {
    test(`Checking binary expression ${testcase.input}`, () => {
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
