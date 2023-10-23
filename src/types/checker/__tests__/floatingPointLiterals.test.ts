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
    input: "double decimaldouble = .0;",
    result: { type: null, errors: [] },
  },
  {
    input: "double decimaldouble = 0.0;",
    result: { type: null, errors: [] },
  },
  {
    input: "double decimaldouble = 0.0d;",
    result: { type: null, errors: [] },
  },
  {
    input: "double decimaldouble = 0.0D;",
    result: { type: null, errors: [] },
  },
  {
    input: "float decimalfloat = 0.0f;",
    result: { type: null, errors: [] },
  },
  {
    input: "float decimalfloat = 0.0F;",
    result: { type: null, errors: [] },
  },
  {
    input: "double decimaldouble = 0.0e0;",
    result: { type: null, errors: [] },
  },
  {
    input: "double decimaldouble = 1.1e+1;",
    result: { type: null, errors: [] },
  },
  {
    input: "double decimaldouble = 1.1e-1;",
    result: { type: null, errors: [] },
  },
  {
    input: "double decimaldouble = 0.0E0;",
    result: { type: null, errors: [] },
  },
  {
    input: "double decimaldouble = 1.1E+1;",
    result: { type: null, errors: [] },
  },
  {
    input: "double decimaldouble = 1.1E-1;",
    result: { type: null, errors: [] },
  },
];

describe("Type Checker", () => {
  testcases.map((testcase) => {
    let it = test;
    if (testcase.only) it = test.only;
    it(`Checking floating point literals for ${testcase.input}`, () => {
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
