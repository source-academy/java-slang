import { parse } from "../../ast/parser";
import { evaluate } from "../interpreter";
import {
  ControlStub,
  StashStub,
  createContextStub,
  getControlItemStr,
  getStashItemStr
} from "./__utils__/utils";

describe("evaluate static MethodInvocation correctly", () => {
  it("evaluate static MethodInvocation in static MethodInvocation with simple name correctly", () => {
    const programStr = `
      class Test {
        public static void main(String[] args) {
          test();
        }
        static void test() {}
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
      "NormalClassDeclaration", // class Test {...}
      "NormalClassDeclaration", // class Object {...}
      
      "Env", // from NormalClassDeclaration
      "ConstructorDeclaration", // Object() {...}

      "Env",
      "MethodDeclaration", // static void test() {...}
      "MethodDeclaration", // public static void main(String[] args) {...}
      "ConstructorDeclaration", // Test() {...}

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
      "ExpressionStatement", // Test.test();

      "Pop",
      "MethodInvocation", // Test.test()

      "Invocation", // ()
      "ResOverride",
      "ExpressionName", // Test
      "ResOverload", // test
      "ResType", // Test

      "Deref",
      "EvalVariable", // Test

      "Env", // from Invocation
      "Marker",
      "Block", // {...}

      "Env", // from Block
      "ReturnStatement", // return;

      "Reset", // return
      "Void", //

      "Reset", // skip Env from Block

      "Reset", // return
      "Void",

      "Reset", // skip Env from Block
    ];
    const expectedStashTrace = [
      "Test", // ResType
      "String[]", // ResType
      "main", // ResOverload
      "Test", // EvalVariable
      "Test", // Deref
      "main", // ResOverride
      `[""]`, // Literal
      "Test", // ResType
      "test", // ResOverload
      "Test", // EvalVariable
      "Test", // Deref
      "test", // ResOverride
      "Void",
      "Void",
    ];

    expect(result).toEqual(undefined);
    expect((context.control as ControlStub).getTrace().map(i => getControlItemStr(i))).toEqual(expectedControlTrace);
    expect((context.stash as StashStub).getTrace().map(i => getStashItemStr(i))).toEqual(expectedStashTrace);
    // TODO test env
  });

  it("evaluate static MethodInvocation in instance MethodInvocation with simple name correctly", () => {
    const programStr = `
      class Test {
        public static void main(String[] args) {
          Test test = new Test();
          test.test();
        }
        static void test(int x) {}
        void test() {
          test(1);
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

      "ExpressionStatement", // Test.main([""]);
      "NormalClassDeclaration", // class Test {...}
      "NormalClassDeclaration", // class Object {...}
      
      "Env", // from NormalClassDeclaration
      "ConstructorDeclaration", // Object() {...}

      "Env",
      "MethodDeclaration", // void test() {...}
      "MethodDeclaration", // static void test(int x) {...}
      "MethodDeclaration", // public static void main(String[] args) {...}
      "ConstructorDeclaration", // Test() {...}

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
      "ExpressionStatement", // test.test();
      "LocalVariableDeclarationStatement", // Test test = new Test();

      "ExpressionStatement", // test = new Test();
      "LocalVariableDeclarationStatement", // Test test;

      "Pop",
      "Assignment", // test = new Test()

      "Assign", // =
      "ClassInstanceCreationExpression", // new Test()
      "EvalVariable", // test

      "Invocation", // ()
      "New", // new
      "ResConOverload", // Test
      "ResType", // Test

      "Env", // from Invocation
      "Marker",
      "Block", // {...}

      "Env", // from Block
      "ReturnStatement", // return this;
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
      "ResType", // Test

      "Deref",
      "EvalVariable", // test

      "Env", // from Invocation
      "Marker",
      "Block", // {...}

      "Env", // from Block
      "ReturnStatement", // return;
      "ExpressionStatement", // this.test(1);

      "Pop",
      "MethodInvocation", // this.test(1)

      "Invocation",
      "Literal", // 1
      "ResOverride",
      "ExpressionName", // this
      "ResOverload", // test
      "ResType", // 1
      "ResType", // this

      "Deref",
      "EvalVariable", // this

      "Env", // from Invocation
      "Marker",
      "Block", // {...}

      "Env", // from Block
      "ReturnStatement", // return;

      "Reset", // return
      "Void", //

      "Reset", // skip Env from Block

      "Reset", // return
      "Void", //

      "Reset", // skip Env from Block

      "Reset", // return
      "Void", //

      "Reset", // skip Env from Block
    ];
    const expectedStashTrace = [
      "Test", // ResType
      "String[]", // ResType
      "main", // ResOverload
      "Test", // EvalVariable
      "Test", // Deref
      "main", // ResOverride
      `[""]`, // Literal
      "test", // EvalVariable
      "Test", // ResType
      "Test", // ResConOverload
      "Object", // New
      "Object", // ResType
      "Object", // ResConOverload
      "super", // EvalVariable
      "Object", // Deref
      "this", // EvalVariable
      "Object", // Deref
      "this", // EvalVariable
      "Object", // Deref
      "Object", // Assign
      "Test", // ResType
      "test", // ResOverload
      "test", // EvalVariable
      "Object", // Deref
      "test", // ResOverride
      "Object",
      "Test", // ResType
      "int", // ResType
      "test", // ResOverload
      "this", // EvalVariable
      "Object", // Deref
      "test", // ResOverride
      "1", // Literal
      "Void",
      "Void",
      "Void",
    ];

    expect(result).toEqual(undefined);
    expect((context.control as ControlStub).getTrace().map(i => getControlItemStr(i))).toEqual(expectedControlTrace);
    expect((context.stash as StashStub).getTrace().map(i => getStashItemStr(i))).toEqual(expectedStashTrace);
    // TODO test env
  });
});

describe("evaluate instance MethodInvocation correctly", () => {
  it("evaluate instance MethodInvocation in instance MethodInvocation with simple name correctly", () => {
    const programStr = `
      class Test {
        public static void main(String[] args) {
          Test test = new Test();
          test.test();
        }
        void test(int x) {}
        void test() {
          test(1);
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

      "ExpressionStatement", // Test.main([""]);
      "NormalClassDeclaration", // class Test {...}
      "NormalClassDeclaration", // class Object {...}
      
      "Env", // from NormalClassDeclaration
      "ConstructorDeclaration", // Object() {...}

      "Env",
      "MethodDeclaration", // void test() {...}
      "MethodDeclaration", // void test(int x) {...}
      "MethodDeclaration", // public static void main(String[] args) {...}
      "ConstructorDeclaration", // Test() {...}

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
      "ExpressionStatement", // test.test();
      "LocalVariableDeclarationStatement", // Test test = new Test();

      "ExpressionStatement", // test = new Test();
      "LocalVariableDeclarationStatement", // Test test;

      "Pop",
      "Assignment", // test = new Test()

      "Assign", // =
      "ClassInstanceCreationExpression", // new Test()
      "EvalVariable", // test

      "Invocation", // ()
      "New", // new
      "ResConOverload", // Test
      "ResType", // Test

      "Env", // from Invocation
      "Marker",
      "Block", // {...}

      "Env", // from Block
      "ReturnStatement", // return this;
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
      "ResType", // Test

      "Deref",
      "EvalVariable", // test

      "Env", // from Invocation
      "Marker",
      "Block", // {...}

      "Env", // from Block
      "ReturnStatement", // return;
      "ExpressionStatement", // this.test(1);

      "Pop",
      "MethodInvocation", // this.test(1)

      "Invocation", // ()
      "Literal", // 1
      "ResOverride",
      "ExpressionName", // this
      "ResOverload", // test
      "ResType", // 1
      "ResType", // this

      "Deref",
      "EvalVariable", // this

      "Env", // from Invocation
      "Marker",
      "Block", // {...}

      "Env", // from Block
      "ReturnStatement", // return;

      "Reset", // return
      "Void",

      "Reset", // skip Env from Block

      "Reset", // return
      "Void", //

      "Reset", // skip Env from Block

      "Reset", // return
      "Void", //

      "Reset", // skip Env from Block
    ];
    const expectedStashTrace = [
      "Test", // ResType
      "String[]", // ResType
      "main", // ResOverload
      "Test", // EvalVariable
      "Test", // Deref
      "main", // ResOverride
      `[""]`, // Literal
      "test", // EvalVariable
      "Test", // ResType
      "Test", // ResConOverload
      "Object", // New
      "Object", // ResType
      "Object", // ResConOverload
      "super", // EvalVariable
      "Object", // Deref
      "this", // EvalVariable
      "Object", // Deref
      "this", // EvalVariable
      "Object", // Deref
      "Object", // Assign
      "Test", // ResType
      "test", // ResOverload
      "test", // EvalVariable
      "Object", // Deref
      "test", // ResOverride
      "Object",
      "Test", // ResType
      "int", // ResType
      "test", // ResOverload
      "this", // EvalVariable
      "Object", // Deref
      "test", // ResOverride
      "Object",
      "1", // Literal
      "Void",
      "Void",
      "Void",
    ];

    expect(result).toEqual(undefined);
    expect((context.control as ControlStub).getTrace().map(i => getControlItemStr(i))).toEqual(expectedControlTrace);
    expect((context.stash as StashStub).getTrace().map(i => getStashItemStr(i))).toEqual(expectedStashTrace);
    // TODO test env
  });
});
