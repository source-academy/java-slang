import { parse } from "../../ast/parser";
import { NoMainMtdError } from "../errors";
import { evaluate } from "../interpreter";
import {
  ControlStub,
  StashStub,
  createContextStub,
  getControlItemStr,
  getStashItemStr
} from "./__utils__/utils";

describe("evaluate main method correctly", () => {
  it("should throw an error when main method is not defined", () => {
    const programStr = `
      class Test {}
      `;
  
    const compilationUnit = parse(programStr);
    expect(compilationUnit).toBeTruthy();
  
    const context = createContextStub();
    context.control.push(compilationUnit!);
  
    expect(() => evaluate(context)).toThrowError(NoMainMtdError);
  });

  it("should not throw an error if main method is defined in at least one class", () => {
    const programStr = `
      class Test {}
      class AnotherTest {
        public static void main(String[] args) {}
      }
      `;
  
    const compilationUnit = parse(programStr);
    expect(compilationUnit).toBeTruthy();
  
    const context = createContextStub();
    context.control.push(compilationUnit!);
  
    expect(() => evaluate(context)).not.toThrowError(NoMainMtdError);
  });

  it("should invoke the main method defined in first class according to program order", () => {
    const programStr = `
      class Test {
        public static void main(String[] args) {}
      }
      class AnotherTest {
        public static void main(String[] args) {}
      }
      `;
  
    const compilationUnit = parse(programStr);
    expect(compilationUnit).toBeTruthy();
  
    const context = createContextStub();
    context.control.push(compilationUnit!);
  
    const result = evaluate(context);
  
    const expectedControlTrace = [
      "CompilationUnit",
      
      "ExpressionStatement", // Test.main([""]);
      "NormalClassDeclaration", // class AnotherTest {...}
      "NormalClassDeclaration", // class Test {...}
      "NormalClassDeclaration", // class Object {...}
      
      "Env", // from NormalClassDeclaration
      "ConstructorDeclaration", // Object() {...}

      "Env", // from NormalClassDeclaration
      "MethodDeclaration", // static void main(String[] args) {...}
      "ConstructorDeclaration", // Test() {...}

      "Env", // from NormalClassDeclaration
      "MethodDeclaration", // static void main(String[] args) {...}
      "ConstructorDeclaration", // AnotherTest() {...}

      "Pop",
      "MethodInvocation", // Test.main([""])

      "Invocation", // ()
      "Literal", // [""]
      "ResOverride",
      "ExpressionName", // Test
      "ResOverload", // main
      "ResType", // [""]
      "ResType", // Test

      "Deref",
      "EvalVariable", // Test

      "Env", // from Invocation
      "Marker",
      "Block", // {...}

      "Env", // from Block
      "ReturnStatement", // return;

      "Reset", // return
      "Void",

      "Reset", // Skip Env from Block
    ];
    const expectedStashTrace = [
      "Test", // ResType
      "String[]", // ResType
      "main", // ResOverload
      "Test", // EvalVariable
      "Test", // Deref
      "main", // ResOverride
      `[""]`, // Literal
      "Void", // Void
    ];
  
    expect(result).toEqual(undefined);
    expect((context.control as ControlStub).getTrace().map(i => getControlItemStr(i))).toEqual(expectedControlTrace);
    expect((context.stash as StashStub).getTrace().map(i => getStashItemStr(i))).toEqual(expectedStashTrace);
    // TODO test env
  });

  it("should not hardcode initial method invocation to Test.main()", () => {
    const programStr = `
      class test {
        int x;
        test() {
          x = 1;
        }
        test(int x) {
          this.x = x;
        }
        public static void main(String[] args) {
          test test = new test(2);
          test.test();
        }
        void test() {
          this.x = 3;
        }
      }
    `;

    const compilationUnit = parse(programStr);
    expect(compilationUnit).toBeTruthy();

    const context = createContextStub();
    context.control.push(compilationUnit!);

    const result = evaluate(context);

    const expectedControlTrace = [
      "CompilationUnit",

      "ExpressionStatement", // test.main([""]);
      "NormalClassDeclaration", // class test {...}
      "NormalClassDeclaration", // class Object {...}
      
      "Env", // from NormalClassDeclaration
      "ConstructorDeclaration", // Object() {...}

      "Env",
      "MethodDeclaration", // void test() {...}
      "MethodDeclaration", // public static void main(String[] args) {...}
      "ConstructorDeclaration", // test(int x) {...}
      "ConstructorDeclaration", // test() {...}

      "Pop",
      "MethodInvocation", // test.main([""])

      "Invocation", // ()
      "Literal", // [""]
      "ResOverride",
      "ExpressionName", // test
      "ResOverload", // main
      "ResType", // [""]
      "ResType", // test

      "Deref",
      "EvalVariable", // test

      "Env", // from Invocation
      "Marker",
      "Block", // {...}

      "Env", // from Block
      "ReturnStatement", // return;
      "ExpressionStatement", // test.test();
      "LocalVariableDeclarationStatement", // test test = new test(1);

      "ExpressionStatement", // test = new test(1);
      "LocalVariableDeclarationStatement", // test test;

      "Pop",
      "Assignment", // test = new test(1)

      "Assign", // =
      "ClassInstanceCreationExpression", // new test(1)
      "EvalVariable", // test

      "Invocation", // ()
      "Literal", // 2
      "New", // new
      "ResConOverload", // test
      "ResType", // 1
      "ResType", // test

      "Env", // from Invocation
      "Marker",
      "Block", // {...}

      "Env", // from Block
      "ReturnStatement", // return this;
      "ExpressionStatement", // this.x = x;
      "ExpressionStatement", // this.x = 0;
      "ExplicitConstructorInvocation", // super();

      "Pop",
      "Invocation", // ()
      "ExpressionName", // super
      "ResConOverload", // Object
      "ResType", // super

      "Deref",
      "EvalVariable", // super

      "Env", // from Invocation
      "Marker",
      "Block", // {...}

      "Env", // from Block
      "ReturnStatement", // return this;

      "Reset", // return
      "ExpressionName", // this

      "Deref",
      "EvalVariable", // this

      "Reset", // Skip Env from Block

      "Pop",
      "Assignment", // this.x = 0

      "Assign", // =
      "Literal", // 0
      "EvalVariable", // this.x

      "Res", // x
      "EvalVariable", // this

      "Pop",
      "Assignment", // this.x = x;

      "Assign", // =
      "ExpressionName", // x
      "EvalVariable", // this.x

      "Res", // x
      "EvalVariable", // this

      "Deref",
      "EvalVariable", // x

      "Reset", // return
      "ExpressionName", // this

      "Deref",
      "EvalVariable", // this

      "Reset", // skip Env from Block

      "Pop",
      "MethodInvocation", // test.test()

      "Invocation", // ()
      "ResOverride",
      "ExpressionName", // test
      "ResOverload", // test
      "ResType", // test

      "Deref",
      "EvalVariable", // test

      "Env", // from Invocation
      "Marker",
      "Block", // {...}

      "Env", // from Block
      "ReturnStatement", // return;
      "ExpressionStatement", // this.x = 3;

      "Pop",
      "Assignment", // this.x = 3

      "Assign", // =
      "Literal", // 3
      "EvalVariable", // this.x

      "Res", // x
      "EvalVariable", // this

      "Reset", // return
      "Void",

      "Reset", // skip Env from Block

      "Reset", // return
      "Void",

      "Reset", // skip Env from Block
    ];
    const expectedStashTrace = [
      "test", // ResType
      "String[]", // ResType
      "main", // ResOverload
      "test", // EvalVariable
      "test", // Deref
      "main", // ResOverride
      `[""]`, // Literal
      "test", // EvalVariable
      "test", // ResType
      "int", // ResType
      "test", // ResConOverlaod
      "Object", // New
      "2", // Literal
      "Object", // ResType
      "Object", // ResConOverload
      "super", // EvalVariable
      "Object", // Deref
      "this", // EvalVariable
      "Object", // Deref
      "this", // EvalVariable
      "x", // Res
      "0", // Literal
      "0", // Assign
      "this", // EvalVariable
      "x", // Res
      "x", // EvalVariable
      "2", // Deref
      "2", // Assign
      "this", // EvalVariable
      "Object", // Deref
      "Object", // Assign
      "test", // ResType
      "test", // ResOverload
      "test", // EvalVariable
      "Object", // Deref
      "test", // ResOverride
      "Object",
      "this", // EvalVariable
      "x", // Res
      "3", // Literal
      "3", // Assign
      "Void",
      "Void",
    ];

    expect(result).toEqual(undefined);
    expect((context.control as ControlStub).getTrace().map(i => getControlItemStr(i))).toEqual(expectedControlTrace);
    expect((context.stash as StashStub).getTrace().map(i => getStashItemStr(i))).toEqual(expectedStashTrace);
    // TODO test env
  });
});
