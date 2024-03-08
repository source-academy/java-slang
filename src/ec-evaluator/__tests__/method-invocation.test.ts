import { parse } from "../../ast/parser";
import { evaluate } from "../interpreter";
import {
  ControlStub,
  StashStub,
  createContextStub,
  getControlItemStr,
  getStashItemStr
} from "./utils";

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

      "Env",
      "MethodDeclaration", // static void test() {...}
      "MethodDeclaration", // public static void main(String[] args) {...}
      "ConstructorDeclaration", // Test() {...}

      "Pop",
      "MethodInvocation", // Test.main([""])

      "Invocation", // ()
      "Literal", // [""]
      "ResOverload", // main
      "ResType", // [""]
      "ResType", // Test

      "Env", // from Invocation
      "Marker",
      "Block", // {...}

      "Env", // from Block
      "ReturnStatement", // return;
      "ExpressionStatement", // Test.test();

      "Pop",
      "MethodInvocation", // Test.test()

      "Invocation", // ()
      "ResOverload", // test
      "ResType", // Test

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
      `[""]`, // Literal
      "Test", // ResType
      "test", // ResOverload
      "Void",
      "Void",
    ];

    expect(result).toEqual(undefined);
    expect((context.control as ControlStub).getTrace().map(i => getControlItemStr(i))).toEqual(expectedControlTrace);
    expect((context.stash as StashStub).getTrace().map(i => getStashItemStr(i))).toEqual(expectedStashTrace);
    // TODO test env
  });
  
  it("evaluate static MethodInvocation in static MethodInvocation with qualified class name correctly", () => {
    const programStr = `
      class Test {
        public static void main(String[] args) {
          Test.test();
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

      "Env",
      "MethodDeclaration", // static void test() {...}
      "MethodDeclaration", // public static void main(String[] args) {...}
      "ConstructorDeclaration", // Test() {...}

      "Pop",
      "MethodInvocation", // Test.main([""])
      
      "Invocation", // ()
      "Literal", // [""]
      "ResOverload", // main
      "ResType", // [""]
      "ResType", // Test

      "Env", // from Invocation
      "Marker",
      "Block", // {...}

      "Env", // from Block
      "ReturnStatement", // return;
      "ExpressionStatement", // Test.test();

      "Pop",
      "MethodInvocation", // Test.test()

      "Invocation", // ()
      "ResOverload", // test
      "ResType", // Test

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
      `[""]`, // Literal
      "Test", // ResType
      "test", // ResOverload
      "Void",
      "Void",
    ];

    expect(result).toEqual(undefined);
    expect((context.control as ControlStub).getTrace().map(i => getControlItemStr(i))).toEqual(expectedControlTrace);
    expect((context.stash as StashStub).getTrace().map(i => getStashItemStr(i))).toEqual(expectedStashTrace);
    // TODO test env
  });
  
  it("evaluate static MethodInvocation in static MethodInvocation with qualified instance name correctly", () => {
    const programStr = `
      class Test {
        public static void main(String[] args) {
          Test test = new Test();
          test.test();
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

      "Env",
      "MethodDeclaration", // static void test() {...}
      "MethodDeclaration", // public static void main(String[] args) {...}
      "ConstructorDeclaration", // Test() {...}

      "Pop",
      "MethodInvocation", // Test.main([""])

      "Invocation", // ()
      "Literal", // [""]
      "ResOverload", // main
      "ResType", // [""]
      "ResType", // Test

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

      "Reset", // return
      "ExpressionName", // this

      "Deref",
      "EvalVariable", // this

      "Reset", // skip Env from Block

      "Pop",
      "MethodInvocation", // test.test()

      "Invocation", // ()
      "ResOverload", // test
      "ResType", // Test

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
    ];
    const expectedStashTrace = [
      "Test", // ResType
      "String[]", // ResType
      "main", // ResOverload
      `[""]`, // Literal
      "test", // EvalVariable
      "Test", // ResType
      "Test", // ResConOverload
      "Object", // New
      "this", // EvalVariable
      "Object", // Deref
      "Object", // Assign
      "Test", // ResType
      "test", // ResOverload
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

      "Env",
      "MethodDeclaration", // void test() {...}
      "MethodDeclaration", // static void test(int x) {...}
      "MethodDeclaration", // public static void main(String[] args) {...}
      "ConstructorDeclaration", // Test() {...}

      "Pop",
      "MethodInvocation", // Test.main([""])

      "Invocation", // ()
      "Literal", // [""]
      "ResOverload", // main
      "ResType", // [""]
      "ResType", // Test

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

      "Reset", // return
      "ExpressionName", // this

      "Deref",
      "EvalVariable", // this

      "Reset", // skip Env from Block

      "Pop",
      "MethodInvocation", // test.test()

      "Invocation", // ()
      "ResOverload", // test
      "ResType", // Test

      "ExpressionName", // test
      
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
      "ResOverload", // test
      "ResType", // 1
      "ResType", // this

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
      `[""]`, // Literal
      "test", // EvalVariable
      "Test", // ResType
      "Test", // ResConOverload
      "Object", // New
      "this", // EvalVariable
      "Object", // Deref
      "Object", // Assign
      "Test", // ResType
      "test", // ResOverload
      "test", // EvalVariable
      "Object", // Deref
      "Test", // ResType
      "int", // ResType
      "test", // ResOverload
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

  it("evaluate static MethodInvocation in instance MethodInvocation with qualified name correctly", () => {
    const programStr = `
      class Test {
        public static void main(String[] args) {
          Test test = new Test();
          test.test();
        }
        static void test(int x) {}
        void test() {
          Test.test(1);
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

      "Env",
      "MethodDeclaration", // void test() {...}
      "MethodDeclaration", // static void test(int x) {...}
      "MethodDeclaration", // public static void main(String[] args) {...}
      "ConstructorDeclaration", // Test() {...}

      "Pop",
      "MethodInvocation", // Test.main([""])

      "Invocation", // ()
      "Literal", // [""]
      "ResOverload", // main
      "ResType", // [""]
      "ResType", // Test

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

      "Reset", // return
      "ExpressionName", // this

      "Deref",
      "EvalVariable", // this

      "Reset", // skip Env from Block

      "Pop",
      "MethodInvocation", // test.test()

      "Invocation", // ()
      "ResOverload", // test
      "ResType", // Test

      "ExpressionName", // test

      "Deref",
      "EvalVariable", // test

      "Env", // from Invocation
      "Marker",
      "Block", // {...}

      "Env", // from Block
      "ReturnStatement", // return;
      "ExpressionStatement", // Test.test(1);

      "Pop",
      "MethodInvocation", // Test.test(1)

      "Invocation",
      "Literal", // 1
      "ResOverload", // test
      "ResType", // 1
      "ResType", // Test

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
      `[""]`, // Literal
      "test", // EvalVariable
      "Test", // ResType
      "Test", // ResConOverload
      "Object", // New
      "this", // EvalVariable
      "Object", // Deref
      "Object", // Assign
      "Test", // ResType
      "test", // ResOverload
      "test", // EvalVariable
      "Object", // Deref
      "Test", // ResType
      "int", // ResType
      "test", // ResOverload
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

  it("evaluate static MethodInvocation in instance MethodInvocation with this keyword correctly", () => {
    const programStr = `
      class Test {
        public static void main(String[] args) {
          Test test = new Test();
          test.test();
        }
        static void test(int x) {}
        void test() {
          this.test(1);
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

      "Env",
      "MethodDeclaration", // void test() {...}
      "MethodDeclaration", // static void test(int x) {...}
      "MethodDeclaration", // public static void main(String[] args) {...}
      "ConstructorDeclaration", // Test() {...}

      "Pop",
      "MethodInvocation", // Test.main([""])

      "Invocation", // ()
      "Literal", // [""]
      "ResOverload", // main
      "ResType", // [""]
      "ResType", // Test

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

      "Reset", // return
      "ExpressionName", // this

      "Deref",
      "EvalVariable", // this

      "Reset", // skip Env from Block

      "Pop",
      "MethodInvocation", // test.test()

      "Invocation", // ()
      "ResOverload", // test
      "ResType", // Test

      "ExpressionName", // test

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
      "ResOverload", // test
      "ResType", // 1
      "ResType", // this

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
      `[""]`, // Literal
      "test", // EvalVariable
      "Test", // ResType
      "Test", // ResConOverload
      "Object", // New
      "this", // EvalVariable
      "Object", // Deref
      "Object", // Assign
      "Test", // ResType
      "test", // ResOverload
      "test", // EvalVariable
      "Object", // Deref
      "Test", // ResType
      "int", // ResType
      "test", // ResOverload
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
  it("evaluate instance MethodInvocation in static MethodInvocation with qualified instance name correctly", () => {
    const programStr = `
      class Test {
        public static void main(String[] args) {
          Test test = new Test();
          int x = test.test();
        }
        int test() {
          return 1;
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

      "Env",
      "MethodDeclaration", // int test() {...}
      "MethodDeclaration", // public static void main(String[] args) {...}
      "ConstructorDeclaration", // Test() {...}

      "Pop",
      "MethodInvocation", // Test.main([""])

      "Invocation", // ()
      "Literal", // [""]
      "ResOverload", // main
      "ResType", // [""]
      "ResType", // Test

      "Env", // from Invocation
      "Marker",
      "Block", // {...}

      "Env", // from Block
      "ReturnStatement", // return;
      "LocalVariableDeclarationStatement", // int x = test.test();
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

      "Reset", // return
      "ExpressionName", // this

      "Deref",
      "EvalVariable", // this

      "Reset", // skip Env from Block

      "ExpressionStatement", // x = test.test();
      "LocalVariableDeclarationStatement", // int x;

      "Pop",
      "Assignment", // x = test.test()

      "Assign", // =
      "MethodInvocation", // test.test()
      "EvalVariable", // x

      "Invocation", // ()
      "ResOverload", // test
      "ResType", // Test

      "ExpressionName", // test

      "Deref",
      "EvalVariable", // test

      "Env", // from Invocation
      "Marker",
      "Block", // {...}

      "Env", // from Block
      "ReturnStatement", // return 1;

      "Reset", // return
      "Literal", // 1

      "Reset", // skip Env from Block

      "Reset", // return
      "Void", //

      "Reset", // skip Env from Block
    ];
    const expectedStashTrace = [
      "Test", // ResType
      "String[]", // ResType
      "main", // ResOverload
      `[""]`, // Literal
      "test", // EvalVariable
      "Test", // ResType
      "Test", // ResConOverload
      "Object", // New
      "this", // EvalVariable
      "Object", // Deref
      "Object", // Assign
      "x", // EvalVariable
      "Test", // ResType
      "test", // ResOverload
      "test", // EvalVariable
      "Object", // Deref
      "1", // Literal
      "1", // Assign
      "Void",
    ];

    expect(result).toEqual(undefined);
    expect((context.control as ControlStub).getTrace().map(i => getControlItemStr(i))).toEqual(expectedControlTrace);
    expect((context.stash as StashStub).getTrace().map(i => getStashItemStr(i))).toEqual(expectedStashTrace);
    // TODO test env
  });

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

      "Env",
      "MethodDeclaration", // void test() {...}
      "MethodDeclaration", // void test(int x) {...}
      "MethodDeclaration", // public static void main(String[] args) {...}
      "ConstructorDeclaration", // Test() {...}

      "Pop",
      "MethodInvocation", // Test.main([""])

      "Invocation", // ()
      "Literal", // [""]
      "ResOverload", // main
      "ResType", // [""]
      "ResType", // Test

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

      "Reset", // return
      "ExpressionName", // this

      "Deref",
      "EvalVariable", // this

      "Reset", // skip Env from Block

      "Pop",
      "MethodInvocation", // test.test()

      "Invocation", // ()
      "ResOverload", // test
      "ResType", // Test

      "ExpressionName", // test

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
      "ResOverload", // test
      "ResType", // 1
      "ResType", // this

      "ExpressionName", // this

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
      `[""]`, // Literal
      "test", // EvalVariable
      "Test", // ResType
      "Test", // ResConOverload
      "Object", // New
      "this", // EvalVariable
      "Object", // Deref
      "Object", // Assign
      "Test", // ResType
      "test", // ResOverload
      "test", // EvalVariable
      "Object", // Deref
      "Test", // ResType
      "int", // ResType
      "test", // ResOverload
      "this", // EvalVariable
      "Object", // Deref
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
  
  it("evaluate instance MethodInvocation in instance MethodInvocation with qualified instance name correctly", () => {
    const programStr = `
      class Test {
        public static void main(String[] args) {
          Test test = new Test();
          test.test();
        }
        int test(int x) {
          return x;
        }
        void test() {
          Test test = new Test();
          test.test(1);
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

      "Env",
      "MethodDeclaration", // void test() {...}
      "MethodDeclaration", // int test(int x) {...}
      "MethodDeclaration", // public static void main(String[] args) {...}
      "ConstructorDeclaration", // Test() {...}

      "Pop",
      "MethodInvocation", // Test.main([""])

      "Invocation", // ()
      "Literal", // [""]
      "ResOverload", // main
      "ResType", // [""]
      "ResType", // Test

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

      "Reset", // return
      "ExpressionName", // this

      "Deref",
      "EvalVariable", // this

      "Reset", // skip Env from Block

      "Pop",
      "MethodInvocation", // test.test()

      "Invocation", // ()
      "ResOverload", // test
      "ResType", // Test

      "ExpressionName", // test

      "Deref",
      "EvalVariable", // test

      "Env", // from Invocation
      "Marker",
      "Block", // {...}

      "Env", // from Block
      "ReturnStatement", // return;
      "ExpressionStatement", // test.test(1);
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

      "Reset", // return
      "ExpressionName", // this

      "Deref",
      "EvalVariable", // this

      "Reset", // skip Env from Block

      "Pop",
      "MethodInvocation", // test.test(1)

      "Invocation", // ()
      "Literal", // 1
      "ResOverload", // test
      "ResType", // 1
      "ResType", // test

      "ExpressionName", // test

      "Deref",
      "EvalVariable", // test

      "Env", // from Invocation
      "Marker",
      "Block", // {...}

      "Env", // from Block
      "ReturnStatement", // return x;

      "Reset", // return
      "ExpressionName", // x

      "Deref",
      "EvalVariable", // x

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
      `[""]`, // Literal
      "test", // EvalVariable
      "Test", // ResType
      "Test", // ResConOverload
      "Object", // New
      "this", // EvalVariable
      "Object", // Deref
      "Object", // Assign
      "Test", // ResType
      "test", // ResOverload
      "test", // EvalVariable
      "Object", // Deref
      "test", // EvalVariable
      "Test", // ResType
      "Test", // ResConOverload
      "Object", // New
      "this", // EvalVariable
      "Object", // Deref
      "Object", // Assign
      "Test", // ResType
      "int", // ResType
      "test", // ResOverload
      "test", // EvalVariable
      "Object", // Deref
      "1", // Literal
      "x", // EvalVariable
      "1", // Deref
      "Void",
      "Void",
    ];

    expect(result).toEqual(undefined);
    expect((context.control as ControlStub).getTrace().map(i => getControlItemStr(i))).toEqual(expectedControlTrace);
    expect((context.stash as StashStub).getTrace().map(i => getStashItemStr(i))).toEqual(expectedStashTrace);
    // TODO test env
  });
  
  it("evaluate instance MethodInvocation in instance MethodInvocation with this keyword correctly", () => {
    const programStr = `
      class Test {
        public static void main(String[] args) {
          Test test = new Test();
          test.test();
        }
        int test(int x) {
          return x;
        }
        void test() {
          this.test(1);
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

      "Env",
      "MethodDeclaration", // void test() {...}
      "MethodDeclaration", // int test(int x) {...}
      "MethodDeclaration", // public static void main(String[] args) {...}
      "ConstructorDeclaration", // Test() {...}

      "Pop",
      "MethodInvocation", // Test.main([""])

      "Invocation", // ()
      "Literal", // [""]
      "ResOverload", // main
      "ResType", // [""]
      "ResType", // Test

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

      "Reset", // return
      "ExpressionName", // this

      "Deref",
      "EvalVariable", // this

      "Reset", // skip Env from Block

      "Pop",
      "MethodInvocation", // test.test()

      "Invocation", // ()
      "ResOverload", // test
      "ResType", // Test

      "ExpressionName", // test

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
      "ResOverload", // test
      "ResType", // 1
      "ResType", // this

      "ExpressionName", // this

      "Deref",
      "EvalVariable", // this

      "Env", // from Invocation
      "Marker",
      "Block", // {...}

      "Env", // from Block
      "ReturnStatement", // return x;

      "Reset", // return
      "ExpressionName", // x

      "Deref",
      "EvalVariable", // x

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
      `[""]`, // Literal
      "test", // EvalVariable
      "Test", // ResType
      "Test", // ResConOverload
      "Object", // New
      "this", // EvalVariable
      "Object", // Deref
      "Object", // Assign
      "Test", // ResType
      "test", // ResOverload
      "test", // EvalVariable
      "Object", // Deref
      "Test", // ResType
      "int", // ResType
      "test", // ResOverload
      "this", // EvalVariable
      "Object", // Deref
      "1", // Literal
      "x", // EvalVariable
      "1", // Deref
      "Void",
      "Void",
    ];

    expect(result).toEqual(undefined);
    expect((context.control as ControlStub).getTrace().map(i => getControlItemStr(i))).toEqual(expectedControlTrace);
    expect((context.stash as StashStub).getTrace().map(i => getStashItemStr(i))).toEqual(expectedStashTrace);
    // TODO test env
  });
});

describe("evaluate method overloading resolution correctly", () => {
  it("should resolve to test(int x) instead of test()", () => {
    const programStr = `
      class Test {
        public static void main(String[] args) {
          int x = test(1);
        }
        static void test() {}
        static void test(int x) {
          return x;
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
  
      "Env",
      "MethodDeclaration", // static void test() {...}
      "MethodDeclaration", // static void test(int x) {...}
      "MethodDeclaration", // public static void main(String[] args) {...}
      "ConstructorDeclaration", // Test() {...}
  
      "Pop",
      "MethodInvocation", // Test.main([""])
  
      "Invocation", // ()
      "Literal", // [""]
      "ResOverload", // main
      "ResType", // [""]
      "ResType", // Test
  
      "Env", // from Invocation
      "Marker",
      "Block", // {...}
  
      "Env", // from Block
      "ReturnStatement", // return;
      "LocalVariableDeclarationStatement", // int x = Test.test(1);
  
      "ExpressionStatement", // x = Test.test(1);
      "LocalVariableDeclarationStatement", // int x;
  
      "Pop",
      "Assignment", // x = Test.test(1)
  
      "Assign", // =
      "MethodInvocation", // Test.test(1)
      "EvalVariable", // x

      "Invocation", // ()
      "Literal", // 1
      "ResOverload", // Test
      "ResType", // 1
      "ResType", // Test
  
      "Env", // from Invocation
      "Marker",
      "Block", // {...}
  
      "Env", // from Block
      "ReturnStatement", // return x;

      "Reset", // return
      "ExpressionName", // x

      "Deref",
      "EvalVariable", // x
  
      "Reset", // skip Env from Block
  
      "Reset", // return
      "Void",
  
      "Reset", // skip Env from Block
    ];
    const expectedStashTrace = [
      "Test", // ResType
      "String[]", // ResType
      "main", // ResOverload
      `[""]`, // Literal
      "x", // EvalVariable
      "Test", // ResType
      "int", // ResType
      "test", // ResOverlaod
      "1", // Literal
      "x", // EvalVariable
      "1", // Deref
      "1", // Assign
      "Void",
    ];
  
    expect(result).toEqual(undefined);
    expect((context.control as ControlStub).getTrace().map(i => getControlItemStr(i))).toEqual(expectedControlTrace);
    expect((context.stash as StashStub).getTrace().map(i => getStashItemStr(i))).toEqual(expectedStashTrace);
    // TODO test env
  });

  it("should resolve to void Test() instead of constructor with similar descriptor", () => {
    const programStr = `
      class Test {
        int x;
        Test() {
          x = 1;
        }
        Test(int x) {
          this.x = x;
        }
        public static void main(String[] args) {
          Test Test = new Test(2);
          Test.Test();
        }
        void Test() {
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
  
      "ExpressionStatement", // Test.main([""]);
      "NormalClassDeclaration", // class Test {...}
  
      "Env",
      "MethodDeclaration", // void Test() {...}
      "MethodDeclaration", // public static void main(String[] args) {...}
      "ConstructorDeclaration", // Test(int x) {...}
      "ConstructorDeclaration", // Test() {...}
  
      "Pop",
      "MethodInvocation", // Test.main([""])
  
      "Invocation", // ()
      "Literal", // [""]
      "ResOverload", // main
      "ResType", // [""]
      "ResType", // Test
  
      "Env", // from Invocation
      "Marker",
      "Block", // {...}
  
      "Env", // from Block
      "ReturnStatement", // return;
      "ExpressionStatement", // Test.Test();
      "LocalVariableDeclarationStatement", // Test Test = new Test(1);
  
      "ExpressionStatement", // Test = new Test(1);
      "LocalVariableDeclarationStatement", // Test Test;
  
      "Pop",
      "Assignment", // Test = new Test(1)
  
      "Assign", // =
      "ClassInstanceCreationExpression", // new Test(1)
      "EvalVariable", // Test

      "Invocation", // ()
      "Literal", // 2
      "New", // new
      "ResConOverload", // Test
      "ResType", // 1
      "ResType", // Test
      "Env", // from Invocation
      "Marker",
      "Block", // {...}
  
  
      "Env", // from Block
      "ReturnStatement", // return this;
      "ExpressionStatement", // this.x = x;
      "ExpressionStatement", // this.x = 0;

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
      "MethodInvocation", // Test.Test()

      "Invocation", // ()
      "ResOverload", // Test
      "ResType", // Test

      "ExpressionName", // Test

      "Deref",
      "EvalVariable", // Test

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
      "Test", // ResType
      "String[]", // ResType
      "main", // ResOverload
      `[""]`, // Literal
      "Test", // EvalVariable
      "Test", // ResType
      "int", // ResType
      "Test", // ResConOverlaod
      "Object", // New
      "2", // Literal
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
      "Test", // ResType
      "Test", // ResOverload
      "Test", // EvalVariable
      "Object", // Deref
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
  
      "ExpressionStatement", // Test.main([""]);
      "NormalClassDeclaration", // class Test {...}
  
      "Env",
      "MethodDeclaration", // void Test() {...}
      "MethodDeclaration", // public static void main(String[] args) {...}
      "ConstructorDeclaration", // Test(int x) {...}
      "ConstructorDeclaration", // Test() {...}
  
      "Pop",
      "MethodInvocation", // Test.main([""])
  
      "Invocation", // ()
      "Literal", // [""]
      "ResOverload", // main
      "ResType", // [""]
      "ResType", // Test
  
      "Env", // from Invocation
      "Marker",
      "Block", // {...}
  
      "Env", // from Block
      "ReturnStatement", // return;
      "ExpressionStatement", // Test.Test();
      "LocalVariableDeclarationStatement", // Test Test = new Test(1);
  
      "ExpressionStatement", // Test = new Test(1);
      "LocalVariableDeclarationStatement", // Test Test;
  
      "Pop",
      "Assignment", // Test = new Test(1)
  
      "Assign", // =
      "ClassInstanceCreationExpression", // new Test(1)
      "EvalVariable", // Test

      "Invocation", // ()
      "Literal", // 2
      "New", // new
      "ResConOverload", // Test
      "ResType", // 1
      "ResType", // Test
  
      "Env", // from Invocation
      "Marker",
      "Block", // {...}
  
      "Env", // from Block
      "ReturnStatement", // return this;
      "ExpressionStatement", // this.x = x;
      "ExpressionStatement", // this.x = 0;

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
      "MethodInvocation", // Test.Test()

      "Invocation", // ()
      "ResOverload", // Test
      "ResType", // Test

      "ExpressionName", // Test

      "Deref",
      "EvalVariable", // Test

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
      `[""]`, // Literal
      "test", // EvalVariable
      "test", // ResType
      "int", // ResType
      "test", // ResConOverlaod
      "Object", // New
      "2", // Literal
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

// TODO throw NullPointerException when accesing instance field but instance is null
