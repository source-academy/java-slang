import { parse } from "../../ast/parser";
import { evaluate } from "../interpreter";
import {
  ControlStub,
  StashStub,
  createContextStub,
  getControlItemStr,
  getStashItemStr
} from "./utils";

it("evaluate LHS Class correctly", () => {
  const programStr = `
    class Test {
      static int x;
      public static void main(String[] args) {
        Test.x = 1;
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
    "MethodDeclaration", // public static void main(String[] args) {...}
    "ConstructorDeclaration", // Test() {...}
    "FieldDeclaration", // static int x = 0;

    "Pop",
    "Assign", // =
    "Literal", // 0
    "EvalVariable", // x

    "Pop",
    "MethodInvocation", // Test.main([""])

    "Invocation", // ()
    "Literal", // [""]
    "ResOverride",
    "ResOverload", // main
    "ResType", // [""]
    "ResType", // Test

    "Env", // from Invocation
    "Marker",
    "Block", // {...}

    "Env", // from Block
    "ReturnStatement", // return;
    "ExpressionStatement", // Test.x = 1;

    "Pop",
    "Assignment", // Test.x = 1

    "Assign", // =
    "Literal", // 1
    "EvalVariable", // Test.x

    "Res", // x
    "EvalVariable", // Test

    "Reset", // return
    "Void",

    "Reset", // skip Env from Block
  ];
  const expectedStashTrace = [
    "x", // EvalVariable
    "0", // Literal
    "0", // Assign
    "Test", // ResType
    "String[]", // ResType
    "main", // ResOverload
    "main", // ResOverride
    `[""]`, // Literal
    "Test", // EvalVariable
    "x", // EvalVariable
    "1", // Literal
    "1", // Assign
    "Void",
  ];

  expect(result).toEqual(undefined);
  expect((context.control as ControlStub).getTrace().map(i => getControlItemStr(i))).toEqual(expectedControlTrace);
  expect((context.stash as StashStub).getTrace().map(i => getStashItemStr(i))).toEqual(expectedStashTrace);
  // TODO test env
});

it("evaluate LHS Object correctly", () => {
  const programStr = `
    class Test {
      int x = 1;
      public static void main(String[] args) {
        Test test = new Test();
        test.x = 2;
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
    "MethodDeclaration", // public static void main(String[] args) {...}
    "ConstructorDeclaration", // Test() {...}

    "Pop",
    "MethodInvocation", // Test.main([""])

    "Invocation", // ()
    "Literal", // [""]
    "ResOverride",
    "ResOverload", // main
    "ResType", // [""]
    "ResType", // Test

    "Env", // from Invocation
    "Marker",
    "Block", // {...}

    "Env", // from Block
    "ReturnStatement", // return;
    "ExpressionStatement", // test.x = 2;
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
    "ExpressionStatement", // this.x = 1;

    "Pop",
    "Assignment", // this.x = 1

    "Assign", // =
    "Literal", // 1
    "EvalVariable", // this.x

    "Res", // x
    "EvalVariable", // this

    "Reset", // return
    "ExpressionName", // this

    "Deref",
    "EvalVariable", // this

    "Reset", // skip Env from Block

    "Pop",
    "Assignment", // test.x = 2

    "Assign", // =
    "Literal", // 2
    "EvalVariable", // test.x

    "Res", // x
    "EvalVariable", // test

    "Reset", // return
    "Void",

    "Reset", // skip Env from Block
  ];
  const expectedStashTrace = [
    "Test", // ResType
    "String[]", // ResType
    "main", // ResOverload
    "main", // ResOverride
    `[""]`, // Literal
    "test", // EvalVariable
    "Test", // ResType
    "Test", // ResConOverload
    "Object", // New
    "this", // EvalVariable
    "x", // Res
    "1", // Literal
    "1", // Assign
    "this", // EvalVariable
    "Object", // this
    "Object", // Assign
    "test", // EvalVariable
    "x", // EvalVariable
    "2", // Literal
    "2", // Assign
    "Void",
  ];

  expect(result).toEqual(undefined);
  expect((context.control as ControlStub).getTrace().map(i => getControlItemStr(i))).toEqual(expectedControlTrace);
  expect((context.stash as StashStub).getTrace().map(i => getStashItemStr(i))).toEqual(expectedStashTrace);
  // TODO test env
});

it("evaluate LHS this correctly", () => {
  const programStr = `
    class Test {
      int x = 1;
      public static void main(String[] args) {
        Test test = new Test();
        test.test();
      }
      void test() {
        this.x = 2;
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
    "MethodDeclaration", // public static void main(String[] args) {...}
    "ConstructorDeclaration", // Test() {...}

    "Pop",
    "MethodInvocation", // Test.main([""])
    
    "Invocation", // ()
    "Literal", // [""]
    "ResOverride",
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
    "ExpressionStatement", // this.x = 1;

    "Pop",
    "Assignment", // this.x = 1

    "Assign", // =
    "Literal", // 1
    "EvalVariable", // this.x

    "Res", // x
    "EvalVariable", // this

    "Reset", // return
    "ExpressionName", // this
   
    "Deref",
    "EvalVariable", // this

    "Reset", // skip Env from Block

    "Pop",
    "MethodInvocation", // test.test()

    "Invocation", // ()
    "ResOverride",
    "ResOverload", // test
    "ResType", // test

    "ExpressionName", // test

    "Deref",
    "EvalVariable", // test

    "ExpressionName", // test

    "Deref",
    "EvalVariable", // test

    "Env", // from Invocation
    "Marker",
    "Block", // {...}

    "Env", // from Block
    "ReturnStatement", // return;
    "ExpressionStatement", // this.x = 2;

    "Pop",
    "Assignment", // this.x = 2

    "Assign", // =
    "Literal", // 2
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
    "main", // ResOverride
    `[""]`, // Literal
    "test", // EvalVariable
    "Test", // ResType
    "Test", // ResConOverload
    "Object", // New
    "this", // EvalVariable
    "x", // Res
    "1", // Literal
    "1", // Assign
    "this", // EvalVariable
    "Object", // Deref
    "Object", // Assign
    "Test", // ResType
    "test", // ResOverload
    "test", // EvalVariable
    "Object", // Deref
    "test", // ResOverride
    "test", // EvalVariable
    "Object", // Deref
    "this", // EvalVariable
    "x", // Res
    "2", // Literal
    "2", // Assign
    "Void",
    "Void",
  ];

  expect(result).toEqual(undefined);
  expect((context.control as ControlStub).getTrace().map(i => getControlItemStr(i))).toEqual(expectedControlTrace);
  expect((context.stash as StashStub).getTrace().map(i => getStashItemStr(i))).toEqual(expectedStashTrace);
  // TODO test env
});

it("evaluate RHS Class correctly", () => {
  const programStr = `
    class Test {
      static int x;
      public static void main(String[] args) {
        int x = Test.x;
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
    "MethodDeclaration", // public static void main(String[] args) {...}
    "ConstructorDeclaration", // Test() {...}
    "FieldDeclaration", // static int x = 0;

    "Pop",
    "Assign", // =
    "Literal", // 0
    "EvalVariable", // x

    "Pop",
    "MethodInvocation", // Test.main([""])

    "Invocation", // ()
    "Literal", // [""]
    "ResOverride",
    "ResOverload", // main
    "ResType", // [""]
    "ResType", // Test

    "Env", // from Invocation
    "Marker",
    "Block", // {...}

    "Env", // from Block
    "ReturnStatement", // return;
    "LocalVariableDeclarationStatement", // int x = Test.x;

    "ExpressionStatement", // x = Test.x;
    "LocalVariableDeclarationStatement", // int x;

    "Pop",
    "Assignment", // x = Test.x

    "Assign", // =
    "ExpressionName", // Test.x
    "EvalVariable", // x

    "Deref",
    "EvalVariable", // Test.x

    "Res", // x
    "EvalVariable", // Test

    "Reset", // return
    "Void",

    "Reset", // skip Env from Block
  ];
  const expectedStashTrace = [
    "x", // EvalVariable
    "0", // Literal
    "0", // Assign
    "Test", // ResType
    "String[]", // ResType
    "main", // ResOverload
    "main", // ResOverride
    `[""]`, // Literal
    "x", // EvalVariable
    "Test", // EvalVariable
    "x", // Res
    "0", // Deref
    "0", // Assign
    "Void",
  ];

  expect(result).toEqual(undefined);
  expect((context.control as ControlStub).getTrace().map(i => getControlItemStr(i))).toEqual(expectedControlTrace);
  expect((context.stash as StashStub).getTrace().map(i => getStashItemStr(i))).toEqual(expectedStashTrace);
  // TODO test env
});

it("evaluate RHS Object correctly", () => {
  const programStr = `
    class Test {
      int x;
      public static void main(String[] args) {
        Test test = new Test();
        int x = test.x;
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
    "MethodDeclaration", // public static void main(String[] args) {...}
    "ConstructorDeclaration", // Test() {...}

    "Pop",
    "MethodInvocation", // Test.main([""])

    "Invocation", // ()
    "Literal", // [""]
    "ResOverride",
    "ResOverload", // main
    "ResType", // [""]
    "ResType", // Test

    "Env", // from Invocation
    "Marker",
    "Block", // {...}

    "Env", // from Block
    "ReturnStatement", // return;
    "LocalVariableDeclarationStatement", // int x = test.x;
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
    "ExpressionStatement", // this.x = 0;

    "Pop",
    "Assignment", // this.x = 0

    "Assign", // =
    "Literal", // 0
    "EvalVariable", // this.x

    "Res", // x
    "EvalVariable", // this

    "Reset", // return
    "ExpressionName", // this

    "Deref",
    "EvalVariable", // this

    "Reset", // skip Env from Block

    "ExpressionStatement", // x = test.x;
    "LocalVariableDeclarationStatement", // int x;

    "Pop",
    "Assignment", // x = test.x

    "Assign", // =
    "ExpressionName", // test.x
    "EvalVariable", // x

    "Deref",
    "EvalVariable", // test.x

    "Res", // x
    "EvalVariable", // test

    "Reset", // return
    "Void",

    "Reset", // skip Env from Block
  ];
  const expectedStashTrace = [
    "Test", // ResType
    "String[]", // ResType
    "main", // ResOverload
    "main", // ResOverride
    `[""]`, // Literal
    "test", // EvalVariable
    "Test", // ResType
    "Test", // ResConOverload
    "Object", // New
    "this", // EvalVariable
    "x", // Res
    "0", // Literal
    "0", // Assign
    "this", // EvalVariable
    "Object", // Deref
    "Object", // Assign
    "x", // EvalVariable
    "test", // EvalVariable
    "x", // Res
    "0", // Deref
    "0", // Assign
    "Void",
  ];

  expect(result).toEqual(undefined);
  expect((context.control as ControlStub).getTrace().map(i => getControlItemStr(i))).toEqual(expectedControlTrace);
  expect((context.stash as StashStub).getTrace().map(i => getStashItemStr(i))).toEqual(expectedStashTrace);
  // TODO test env
});

it("evaluate RHS this correctly", () => {
  const programStr = `
    class Test {
      int x = 1;
      public static void main(String[] args) {
        Test test = new Test();
        test.test();
      }
      void test() {
        int x = this.x;
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
    "MethodDeclaration", // public static void main(String[] args) {...}
    "ConstructorDeclaration", // Test() {...}

    "Pop",
    "MethodInvocation", // Test.main([""])

    "Invocation", // ()
    "Literal", // [""]
    "ResOverride",
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
    "ExpressionStatement", // this.x = 1;

    "Pop",
    "Assignment", // this.x = 1

    "Assign", // =
    "Literal", // 1
    "EvalVariable", // this.x

    "Res", // x
    "EvalVariable", // this

    "Reset", // return
    "ExpressionName", // this

    "Deref",
    "EvalVariable", // this

    "Reset", // skip Env from Block

    "Pop",
    "MethodInvocation", // test.test()

    "Invocation", // ()
    "ResOverride",
    "ResOverload", // test
    "ResType", // test

    "ExpressionName", // test

    "Deref",
    "EvalVariable", // test

    "ExpressionName", // test

    "Deref",
    "EvalVariable", // test

    "Env", // from Invocation
    "Marker",
    "Block", // {...}

    "Env", // from Block
    "ReturnStatement", // return;
    "LocalVariableDeclarationStatement", // int x = this.x;

    "ExpressionStatement", // x = this.x;
    "LocalVariableDeclarationStatement", // int x;

    "Pop",
    "Assignment", // x = this.x

    "Assign", // =
    "ExpressionName", // this.x
    "EvalVariable", // x

    "Deref",
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
    "main", // ResOverride
    `[""]`, // Literal
    "test", // EvalVariable
    "Test", // ResConOverload
    "Test", // ResType
    "Object", // New
    "this", // EvalVariable
    "x", // Res
    "1", // Literal
    "1", // Assign
    "this", // EvalVariable
    "Object", // Deref
    "Object", // Assign
    "Test", // ResType
    "test", // ResOverload
    "test", // EvalVariable
    "Object", // Deref
    "test", // ResOverride
    "test", // EvalVariable
    "Object", // Deref
    "x", // EvalVariable
    "this", // EvalVariable
    "x", // Res
    "1", // Deref
    "1", // Assign
    "Void",
    "Void",
  ];

  expect(result).toEqual(undefined);
  expect((context.control as ControlStub).getTrace().map(i => getControlItemStr(i))).toEqual(expectedControlTrace);
  expect((context.stash as StashStub).getTrace().map(i => getStashItemStr(i))).toEqual(expectedStashTrace);
  // TODO test env
});

// TODO throw NullPointerException when accesing instance field but instance is null
