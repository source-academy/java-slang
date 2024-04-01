import { parse } from "../../ast/parser";
import { evaluate } from "../interpreter";
import {
  ControlStub,
  StashStub,
  createContextStub,
  getControlItemStr,
  getStashItemStr
} from "./utils";

describe("evaluate simple qualified MethodInvocation correctly", () => {
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
      "ExpressionStatement", // Test.test(1);

      "Pop",
      "MethodInvocation", // Test.test(1)

      "Invocation",
      "Literal", // 1
      "ResOverride",
      "ExpressionName", // Test
      "ResOverload", // test
      "ResType", // 1
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
      "Test", // EvalVariable
      "Test", // Deref
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
      "NormalClassDeclaration", // class Object {...}
      
      "Env", // from NormalClassDeclaration
      "ConstructorDeclaration", // Object() {...}

      "Env",
      "MethodDeclaration", // int test() {...}
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

      "ExpressionStatement", // x = test.test();
      "LocalVariableDeclarationStatement", // int x;

      "Pop",
      "Assignment", // x = test.test()

      "Assign", // =
      "MethodInvocation", // test.test()
      "EvalVariable", // x

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
      "x", // EvalVariable
      "Test", // ResType
      "test", // ResOverload
      "test", // EvalVariable
      "Object", // Deref
      "test", // ResOverride
      "Object",
      "1", // Literal
      "1", // Assign
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
      "NormalClassDeclaration", // class Object {...}
      
      "Env", // from NormalClassDeclaration
      "ConstructorDeclaration", // Object() {...}

      "Env",
      "MethodDeclaration", // void test() {...}
      "MethodDeclaration", // int test(int x) {...}
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
      "MethodInvocation", // test.test(1)

      "Invocation", // ()
      "Literal", // 1
      "ResOverride",
      "ExpressionName", // test
      "ResOverload", // test
      "ResType", // 1
      "ResType", // test

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
      "int", // ResType
      "test", // ResOverload
      "test", // EvalVariable
      "Object", // Deref
      "test", // ResOverride
      "Object",
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

describe("evaluate complex qualified MethodInvocation correctly", () => {
  it("evaluate qualified MethodInvocation with static field correctly", () => {
    const programStr = `
      class Test {
        static Test t;
        public static void main(String[] args) {
          Test.t.test();
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
      "FieldDeclaration", // static Test x = null;

      "Pop",
      "Assign", // =
      "Literal", // null
      "EvalVariable", // Test

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
      "ExpressionStatement", // Test.t.test();

      "Pop",
      "MethodInvocation", // Test.t.test()

      "Invocation", // ()
      "ResOverride",
      "ExpressionName", // Test.t
      "ResOverload", // test
      "ResType", // Test.t

      "ResTypeCont", // t
      "ResType", // Test

      "Deref",
      "EvalVariable", // Test.t

      "Res", // t
      "EvalVariable", // Test

      "Env", // from Invocation
      "Marker",
      "Block", // {...}

      "Env", // from Block
      "ReturnStatement", // return;

      "Reset", // return
      "Void",

      "Reset", // skip Env from Block

      "Reset", // return
      "Void",

      "Reset", // skip Env from Block
    ];
    const expectedStashTrace = [
      "t", // EvalVariable
      "null", // Literal
      "null", // Assign
      "Test", // ResType
      "String[]", // ResType
      "main", // ResOverload
      "Test", // EvalVariable
      "Test", // Deref
      "main", // ResOverride
      `[""]`, // Literal
      "Test", // ResType
      "Test", // ResTypeCont
      "test", // ResOverload
      "Test", // EvalVariable
      "t", // Res
      "null", // Deref
      "test", // ResOverride
      "Void",
      "Void",
    ];

    expect(result).toEqual(undefined);
    expect((context.control as ControlStub).getTrace().map(i => getControlItemStr(i))).toEqual(expectedControlTrace);
    expect((context.stash as StashStub).getTrace().map(i => getStashItemStr(i))).toEqual(expectedStashTrace);
    // TODO test env
  });

  it("evaluate qualified MethodInvocation with instance declared field correctly", () => {
    const programStr = `
      class Test {
        AnotherTest t;
        public static void main(String[] args) {
          Test t = new Test();
          t.t.test();
        }
      }
      class AnotherTest {
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
      "NormalClassDeclaration", // class AnotherTest {...}
      "NormalClassDeclaration", // class Test {...}
      "NormalClassDeclaration", // class Object {...}

      "Env", // from NormalClassDeclaration
      "ConstructorDeclaration", // Object() {...}

      "Env", // from NormalClassDeclaration
      "MethodDeclaration", // public static void main(String[] args) {...}
      "ConstructorDeclaration", // Test() {...}

      "Env", // from NormalClassDeclaration
      "MethodDeclaration", // static void test() {...}
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
      "ExpressionStatement", // t.t.test();
      "LocalVariableDeclarationStatement", // Test t = new Test();

      "ExpressionStatement", // t = new Test();
      "LocalVariableDeclarationStatement", // Test t;
  
      "Pop",
      "Assignment", // t = new Test()
  
      "Assign", // =
      "ClassInstanceCreationExpression", // new Test()
      "EvalVariable", // t

      "Invocation", // ()
      "New", // new
      "ResConOverload", // Test
      "ResType", // Test

      "Env", // from Invocation
      "Marker",
      "Block", // {...}
  
      "Env", // from Block
      "ReturnStatement", // return this;
      "ExpressionStatement", // this.t = null;
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
      "Assignment", // this.t = null

      "Assign", // =
      "Literal", // null
      "EvalVariable", // this.t

      "Res", // t
      "EvalVariable", // this
  
      "Reset", // return
      "ExpressionName", // this

      "Deref",
      "EvalVariable", // this
  
      "Reset", // skip Env from Block

      "Pop",
      "MethodInvocation", // t.t.test()

      "Invocation", // ()
      "ResOverride",
      "ExpressionName", // t.t
      "ResOverload", // test
      "ResType", // t.t

      "ResTypeCont", // t
      "ResType", // t

      "Deref",
      "EvalVariable", // t.t

      "Res", // t
      "EvalVariable", // t

      "Env", // from Invocation
      "Marker",
      "Block", // {...}

      "Env", // from Block
      "ReturnStatement", // return;

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
      "Test", // EvalVariable
      "Test", // Deref
      "main", // ResOverride
      `[""]`, // Literal
      "t", // EvalVariable
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
      "t", // Res
      "null", // Literal
      "null", // Assign
      "this", // EvalVariable
      "Object", // Deref
      "Object", // Assign
      "Test", // ResType
      "AnotherTest", // ResTypeCont
      "test", // ResOverload
      "t", // EvalVariable
      "t", // Res
      "null", // Deref
      "test", // ResOverride
      "Void",
      "Void",
    ];

    expect(result).toEqual(undefined);
    expect((context.control as ControlStub).getTrace().map(i => getControlItemStr(i))).toEqual(expectedControlTrace);
    expect((context.stash as StashStub).getTrace().map(i => getStashItemStr(i))).toEqual(expectedStashTrace);
    // TODO test env
  });

  it("evaluate qualified MethodInvocation with instance inherited field correctly", () => {
    const programStr = `
      class Parent {
        Test t;
      }
      class Test extends Parent {
        public static void main(String[] args) {
          Test t = new Test();
          t.t.test();
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
      "NormalClassDeclaration", // class Test extends Parent {...}
      "NormalClassDeclaration", // class Parent {...}
      "NormalClassDeclaration", // class Object {...}

      "Env", // from NormalClassDeclaration
      "ConstructorDeclaration", // Object() {...}

      "Env", // from NormalClassDeclaration
      "ConstructorDeclaration", // Parent() {...}
      
      "Env", // from NormalClassDeclaration
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
      "ExpressionStatement", // t.t.test();
      "LocalVariableDeclarationStatement", // Test t = new Test();

      "ExpressionStatement", // t = new Test();
      "LocalVariableDeclarationStatement", // Test t;
  
      "Pop",
      "Assignment", // t = new Test()
  
      "Assign", // =
      "ClassInstanceCreationExpression", // new Test()
      "EvalVariable", // t

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
      "ResConOverload", // Parent
      "ResType", // super

      "Deref",
      "EvalVariable", // super

      "Env", // from Invocation
      "Marker",
      "Block", // {...}

      "Env", // from Block
      "ReturnStatement", // return this;
      "ExpressionStatement", // this.t = null;
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
      "Assignment", // this.t = null

      "Assign", // =
      "Literal", // null
      "EvalVariable", // this.t

      "Res", // t
      "EvalVariable", // this
  
      "Reset", // return
      "ExpressionName", // this

      "Deref",
      "EvalVariable", // this
  
      "Reset", // skip Env from Block

      "Reset", // return
      "ExpressionName", // this

      "Deref",
      "EvalVariable", // this

      "Reset", // Skip Env from Block

      "Pop",
      "MethodInvocation", // t.t.test()

      "Invocation", // ()
      "ResOverride",
      "ExpressionName", // t.t
      "ResOverload", // test
      "ResType", // t.t

      "ResTypeCont", // t
      "ResType", // t

      "Deref",
      "EvalVariable", // t.t

      "Res", // t
      "EvalVariable", // t

      "Env", // from Invocation
      "Marker",
      "Block", // {...}

      "Env", // from Block
      "ReturnStatement", // return;

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
      "Test", // EvalVariable
      "Test", // Deref
      "main", // ResOverride
      `[""]`, // Literal
      "t", // EvalVariable
      "Test", // ResType
      "Test", // ResConOverload
      "Object", // New
      "Parent", // ResType
      "Parent", // ResConOverload
      "super", // EvalVariable
      "Object", // Deref
      "Object", // ResType
      "Object", // ResConOverload
      "super", // EvalVariable
      "Object", // Deref
      "this", // EvalVariable
      "Object", // ResType
      "this", // EvalVariable
      "t", // Res
      "null", // Literal
      "null", // Assign
      "this", // EvalVariable
      "Object", // Deref
      "this", // EvalVariable
      "Object", // Deref
      "Object", // Assign
      "Test", // ResType
      "Test", // ResTypeCont
      "test", // ResOverload
      "t", // EvalVariable
      "t", // Res
      "null", // Deref
      "test", // ResOverride
      "Void",
      "Void",
    ];

    expect(result).toEqual(undefined);
    expect((context.control as ControlStub).getTrace().map(i => getControlItemStr(i))).toEqual(expectedControlTrace);
    expect((context.stash as StashStub).getTrace().map(i => getStashItemStr(i))).toEqual(expectedStashTrace);
    // TODO test env
  });
});
