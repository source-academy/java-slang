import { check } from "..";
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
    input: "double decimaldouble = 1.;",
    result: { type: null, errors: [] },
  },
  {
    input: "double decimaldouble = 1.1;",
    result: { type: null, errors: [] },
  },
  {
    input: "double decimaldouble = 1.e1;",
    result: { type: null, errors: [] },
  },
  {
    input: "double decimaldouble = 1.E1;",
    result: { type: null, errors: [] },
  },
  {
    input: "double decimaldouble = 1.e+1;",
    result: { type: null, errors: [] },
  },
  {
    input: "double decimaldouble = 1.E+1;",
    result: { type: null, errors: [] },
  },
  {
    input: "double decimaldouble = 1.e-1;",
    result: { type: null, errors: [] },
  },
  {
    input: "double decimaldouble = 1.E-1;",
    result: { type: null, errors: [] },
  },
  {
    input: "double decimaldouble = 1.d;",
    result: { type: null, errors: [] },
  },
  {
    input: "double decimaldouble = 1.D;",
    result: { type: null, errors: [] },
  },
  {
    input: "float decimalfloat = 1.f;",
    result: { type: null, errors: [] },
  },
  {
    input: "float decimalfloat = 1.F;",
    result: { type: null, errors: [] },
  },
  // TODO: For the following program, java-parser throws an error during the parsing.
  // {
  //   input: "double decimaldouble = .;",
  //   result: { type: null, errors: [new Error()] },
  // },
  {
    input: "double decimaldouble = .1;",
    result: { type: null, errors: [] },
  },
  {
    input: "double decimaldouble = .1e1;",
    result: { type: null, errors: [] },
  },
  {
    input: "double decimaldouble = .1E1;",
    result: { type: null, errors: [] },
  },
  {
    input: "double decimaldouble = .1e+1;",
    result: { type: null, errors: [] },
  },
  {
    input: "double decimaldouble = .1E+1;",
    result: { type: null, errors: [] },
  },
  {
    input: "double decimaldouble = .1e-1;",
    result: { type: null, errors: [] },
  },
  {
    input: "double decimaldouble = .1E-1;",
    result: { type: null, errors: [] },
  },
  {
    input: "double decimaldouble = .1d;",
    result: { type: null, errors: [] },
  },
  {
    input: "double decimaldouble = .1D;",
    result: { type: null, errors: [] },
  },
  {
    input: "float decimalfloat = .1f;",
    result: { type: null, errors: [] },
  },
  {
    input: "float decimalfloat = .1F;",
    result: { type: null, errors: [] },
  },
  // TODO: For the following program, java-parser throws an error during the parsing.
  // {
  //   input: "double hexdouble = 0x1.;",
  //   result: { type: null, errors: [new Error()] },
  // },
  // TODO: For the following program, java-parser throws an error during the parsing.
  // {
  //   input: "double hexdouble = 0x1.1;",
  //   result: { type: null, errors: [] },
  // },
  {
    input: "double hexdouble = 0x1.p1;",
    result: { type: null, errors: [] },
  },
  {
    input: "double hexdouble = 0x1.P1;",
    result: { type: null, errors: [] },
  },
  {
    input: "double hexdouble = 0x1.p+1;",
    result: { type: null, errors: [] },
  },
  {
    input: "double hexdouble = 0x1.P+1;",
    result: { type: null, errors: [] },
  },
  {
    input: "double hexdouble = 0x1.p-1;",
    result: { type: null, errors: [] },
  },
  {
    input: "double hexdouble = 0x1.P-1;",
    result: { type: null, errors: [] },
  },

  {
    input: "double hexdouble = 0x1.p1d;",
    result: { type: null, errors: [] },
  },
  {
    input: "double hexdouble = 0x1.p1D;",
    result: { type: null, errors: [] },
  },
  {
    input: "float hexfloat = 0x1.p1f;",
    result: { type: null, errors: [] },
  },
  {
    input: "float hexfloat = 0x1.p1F;",
    result: { type: null, errors: [] },
  },
  {
    input: "double hexdouble = 0x.1p1;",
    result: { type: null, errors: [] },
  },
  {
    input: "double hexdouble = 0x.1P1;",
    result: { type: null, errors: [] },
  },
  {
    input: "double hexdouble = 0x.1p+1;",
    result: { type: null, errors: [] },
  },
  {
    input: "double hexdouble = 0x.1P+1;",
    result: { type: null, errors: [] },
  },
  {
    input: "double hexdouble = 0x.1p-1;",
    result: { type: null, errors: [] },
  },
  {
    input: "double hexdouble = 0x.1P-1;",
    result: { type: null, errors: [] },
  },
  {
    input: "double hexdouble = 0x.1p1d;",
    result: { type: null, errors: [] },
  },
  {
    input: "double hexdouble = 0x.1p1D;",
    result: { type: null, errors: [] },
  },
  {
    input: "float hexfloat = 0x.1p1f;",
    result: { type: null, errors: [] },
  },
  {
    input: "float hexfloat = 0x.1p1F;",
    result: { type: null, errors: [] },
  },
  {
    input: "Double decimaldouble = 1.;",
    result: { type: null, errors: [] },
  },
  {
    input: "Float decimalfloat = 1.f;",
    result: { type: null, errors: [] },
  },
  {
    input: "double decimaldouble = -1.;",
    result: { type: null, errors: [] },
  },
  {
    input: "float decimalfloat = -1.f;",
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
