import { parse } from "../../ast/parser";
import { NullPointerException } from "../errors";
import { evaluate } from "../interpreter";
import { createContextStub } from "./utils";

describe("should throw NullPointerException correctly", () => {
  it("should throw NullPointerException when invoking instance method but target is null", () => {
    const programStr = `
      class Test {
        public static void main(String[] args) {
          Test test = null;
          test.test();
        }
        void test() {}
      }
    `;
  
    const compilationUnit = parse(programStr);
    expect(compilationUnit).toBeTruthy();
  
    const context = createContextStub();
    context.control.push(compilationUnit!);
  
    expect(() => evaluate(context)).toThrowError(NullPointerException);
  });

  it("should not throw NullPointerException when invoking static method although target is null", () => {
    const programStr = `
      class Test {
        public static void main(String[] args) {
          Test test = null;
          test.test();
        }
        static void test() {}
      }
    `;
  
    const compilationUnit = parse(programStr);
    expect(compilationUnit).toBeTruthy();
  
    const context = createContextStub();
    context.control.push(compilationUnit!);
  
    expect(() => evaluate(context)).not.toThrowError(NullPointerException);
  });
  
  it("should throw NullPointerException when accessing instance field but target is null", () => {
    const programStr = `
      class Test {
        int x;
        public static void main(String[] args) {
          Test test = null;
          int x = test.x;
        }
      }
    `;
  
    const compilationUnit = parse(programStr);
    expect(compilationUnit).toBeTruthy();
  
    const context = createContextStub();
    context.control.push(compilationUnit!);
  
    expect(() => evaluate(context)).toThrowError(NullPointerException);
  });

  it("should not throw NullPointerException when accessing static field although target is null", () => {
    const programStr = `
      class Test {
        static int x;
        public static void main(String[] args) {
          Test test = null;
          int x = test.x;
        }
      }
    `;
  
    const compilationUnit = parse(programStr);
    expect(compilationUnit).toBeTruthy();
  
    const context = createContextStub();
    context.control.push(compilationUnit!);
  
    expect(() => evaluate(context)).not.toThrowError(NullPointerException);
  });
});
