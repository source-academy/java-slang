import { parse } from "../../ast/parser";
import { evaluate } from "../interpreter";
import {
  ControlStub,
  StashStub,
  createContextStub,
  getControlItemStr,
  getStashItemStr
} from "./__utils__/utils";

describe("evaluate method overriding correctly", () => {
  it("should invoke overriden instance method", () => {
    const programStr = `
      class Parent {
        int x;
        void test() {
          x = 1;
        }
      }
      class Test extends Parent {
        public static void main(String[] args) {
          Parent p = new Test();
          p.test();
        }
        void test() {
          x = 2;
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
      "NormalClassDeclaration", // class Test extends Parent {...}
      "NormalClassDeclaration", // class Parent {...}
      "NormalClassDeclaration", // class Object {...}
      
      "Env", // from NormalClassDeclaration
      "ConstructorDeclaration", // Object() {...}

      "Env", // from NormalClassDeclaration
      "MethodDeclaration", // void test() {...}
      "ConstructorDeclaration", // Parent() {...}

      "Env", // from NormalClassDeclaration
      "MethodDeclaration", // void test() {...}
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
      "ExpressionStatement", // p.test();
      "LocalVariableDeclarationStatement", // Parent p = new Test();

      "ExpressionStatement", // p = new Test();
      "LocalVariableDeclarationStatement", // Parent p;

      "Pop",
      "Assignment", // p = new Test()

      "Assign", // =
      "ClassInstanceCreationExpression", // new Test()
      "EvalVariable", // p

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

      "Reset", // return
      "ExpressionName", // this

      "Deref",
      "EvalVariable", // this

      "Reset", // Skip Env from Block

      "Reset", // return
      "ExpressionName", // this

      "Deref",
      "EvalVariable", // this

      "Reset", // Skip Env from Block

      "Pop",
      "MethodInvocation", // p.test()

      "Invocation", // ()
      "ResOverride",
      "ExpressionName", // p
      "ResOverload", // test
      "ResType", // p

      "Deref",
      "EvalVariable", // p

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

      "Reset", // Skip Env from Block

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
      "p", // EvalVariable
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
      "Object", // Deref
      "this", // EvalVariable
      "x", // Res
      "0", // Literal
      "0", // Assign
      "this", // EvalVariable
      "Object", // Deref
      "this", // EvalVariable
      "Object", // Deref
      "Object", // Assign
      "Parent", // ResType
      "test", // ResOverload
      "p", // EvalVariable
      "Object", // Deref
      "test", // ResOverride
      "Object",
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

  it("should not invoke overriden static method", () => {
    const programStr = `
      class Parent {
        static int x;
        static void test() {
          x = 1;
        }
      }
      class Test extends Parent {
        public static void main(String[] args) {
          Parent p = new Test();
          p.test();
        }
        static void test() {
          x = 2;
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
      "NormalClassDeclaration", // class Test extends Parent {...}
      "NormalClassDeclaration", // class Parent {...}
      "NormalClassDeclaration", // class Object {...}
      
      "Env", // from NormalClassDeclaration
      "ConstructorDeclaration", // Object() {...}

      "Env", // from NormalClassDeclaration
      "MethodDeclaration", // static void test() {...}
      "ConstructorDeclaration", // Parent() {...}
      "FieldDeclaration", // static int x = 0;

      "Pop",
      "Assign", // =
      "Literal", // 0
      "EvalVariable", // x

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
      "ExpressionStatement", // p.test();
      "LocalVariableDeclarationStatement", // Parent p = new Test();

      "ExpressionStatement", // p = new Test();
      "LocalVariableDeclarationStatement", // Parent p;

      "Pop",
      "Assignment", // p = new Test()

      "Assign", // =
      "ClassInstanceCreationExpression", // new Test()
      "EvalVariable", // p

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

      "Reset", // Skip Env from Block

      "Reset", // return
      "ExpressionName", // this

      "Deref",
      "EvalVariable", // this

      "Reset", // Skip Env from Block

      "Pop",
      "MethodInvocation", // p.test()

      "Invocation", // ()
      "ResOverride",
      "ExpressionName", // p
      "ResOverload", // test
      "ResType", // p

      "Deref",
      "EvalVariable", // p

      "Env", // from Invocation
      "Marker",
      "Block", // {...}

      "Env", // from Block
      "ReturnStatement", // return;
      "ExpressionStatement", // this.x = 1;

      "Pop",
      "Assignment", // this.x = 1

      "Assign", // =
      "Literal", // 1
      "EvalVariable", // this.x

      "Res", // x
      "EvalVariable", // this

      "Reset", // return
      "Void",

      "Reset", // Skip Env from Block

      "Reset", // return
      "Void",

      "Reset", // Skip Env from Block
    ];
    const expectedStashTrace = [
      "x", // Res
      "0", // Literal
      "0", // Assign
      "Test", // ResType
      "String[]", // ResType
      "main", // ResOverload
      "Test", // EvalVariable
      "Test", // Deref
      "main", // ResOverride
      `[""]`, // Literal
      "p", // EvalVariable
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
      "Object", // Deref
      "this", // EvalVariable
      "Object", // Deref
      "this", // EvalVariable
      "Object", // Deref
      "Object", // Assign
      "Parent", // ResType
      "test", // ResOverload
      "p", // EvalVariable
      "Object", // Deref
      "test", // ResOverride
      "Parent", // EvalVariable
      "x", // Res
      "1", // Literal
      "1", // Assign
      "Void",
      "Void",
    ];

    expect(result).toEqual(undefined);
    expect((context.control as ControlStub).getTrace().map(i => getControlItemStr(i))).toEqual(expectedControlTrace);
    expect((context.stash as StashStub).getTrace().map(i => getStashItemStr(i))).toEqual(expectedStashTrace);
    // TODO test env
  });

  it("should not invoke overriden instance method with supertype", () => {
    const programStr = `
      class Parent {
        int x;
        void test(Parent p) {
          x = 1;
        }
      }
      class Test extends Parent {
        public static void main(String[] args) {
          Parent p = new Test();
          Test t = new Test();
          p.test(t);
        }
        void test(Parent p) {
          x = 2;
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
      "NormalClassDeclaration", // class Test extends Parent {...}
      "NormalClassDeclaration", // class Parent {...}
      "NormalClassDeclaration", // class Object {...}
      
      "Env", // from NormalClassDeclaration
      "ConstructorDeclaration", // Object() {...}

      "Env", // from NormalClassDeclaration
      "MethodDeclaration", // void test(Parent p) {...}
      "ConstructorDeclaration", // Parent() {...}

      "Env", // from NormalClassDeclaration
      "MethodDeclaration", // void test(Parent p) {...}
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
      "ExpressionStatement", // p.test(t);
      "LocalVariableDeclarationStatement", // Test t = new Test();
      "LocalVariableDeclarationStatement", // Parent p = new Test();

      "ExpressionStatement", // p = new Test();
      "LocalVariableDeclarationStatement", // Parent p;

      "Pop",
      "Assignment", // p = new Test()

      "Assign", // =
      "ClassInstanceCreationExpression", // new Test()
      "EvalVariable", // p

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

      "Reset", // return
      "ExpressionName", // this

      "Deref",
      "EvalVariable", // this

      "Reset", // Skip Env from Block

      "Reset", // return
      "ExpressionName", // this

      "Deref",
      "EvalVariable", // this

      "Reset", // Skip Env from Block

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

      "Reset", // return
      "ExpressionName", // this

      "Deref",
      "EvalVariable", // this

      "Reset", // Skip Env from Block

      "Reset", // return
      "ExpressionName", // this

      "Deref",
      "EvalVariable", // this

      "Reset", // Skip Env from Block

      "Pop",
      "MethodInvocation", // p.test(t)

      "Invocation", // ()
      "ExpressionName", // t
      "ResOverride",
      "ExpressionName", // p
      "ResOverload", // test
      "ResType", // t
      "ResType", // p

      "Deref",
      "EvalVariable", // p

      "Deref",
      "EvalVariable", // t

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

      "Reset", // Skip Env from Block

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
      "p", // EvalVariable
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
      "Object", // Deref
      "this", // EvalVariable
      "x", // Res
      "0", // Literal
      "0", // Assign
      "this", // EvalVariable
      "Object", // Deref
      "this", // EvalVariable
      "Object", // Deref
      "Object", // Assign
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
      "Object", // Deref
      "this", // EvalVariable
      "x", // Res
      "0", // Literal
      "0", // Assign
      "this", // EvalVariable
      "Object", // Deref
      "this", // EvalVariable
      "Object", // Deref
      "Object", // Assign
      "Parent", // ResType
      "Test", // ResType
      "test", // ResOverload
      "p", // EvalVariable
      "Object", // Deref
      "test", // ResOverride
      "Object",
      "t", // EvalVariable
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

  it("should not invoke overriden instance method with supertype", () => {
    const programStr = `
      class Parent {
        int x;
        void test(Parent p) {
          x = 1;
        }
      }
      class Test extends Parent {
        public static void main(String[] args) {
          Parent p = new Test();
          Test t = new Test();
          p.test(t);
        }
        void test(Test t) {
          x = 2;
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
      "NormalClassDeclaration", // class Test extends Parent {...}
      "NormalClassDeclaration", // class Parent {...}
      "NormalClassDeclaration", // class Object {...}
      
      "Env", // from NormalClassDeclaration
      "ConstructorDeclaration", // Object() {...}

      "Env", // from NormalClassDeclaration
      "MethodDeclaration", // void test(Parent p) {...}
      "ConstructorDeclaration", // Parent() {...}

      "Env", // from NormalClassDeclaration
      "MethodDeclaration", // void test(Test t) {...}
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
      "ExpressionStatement", // p.test(t);
      "LocalVariableDeclarationStatement", // Test t = new Test();
      "LocalVariableDeclarationStatement", // Parent p = new Test();

      "ExpressionStatement", // p = new Test();
      "LocalVariableDeclarationStatement", // Parent p;

      "Pop",
      "Assignment", // p = new Test()

      "Assign", // =
      "ClassInstanceCreationExpression", // new Test()
      "EvalVariable", // p

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

      "Reset", // return
      "ExpressionName", // this

      "Deref",
      "EvalVariable", // this

      "Reset", // Skip Env from Block

      "Reset", // return
      "ExpressionName", // this

      "Deref",
      "EvalVariable", // this

      "Reset", // Skip Env from Block

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

      "Reset", // return
      "ExpressionName", // this

      "Deref",
      "EvalVariable", // this

      "Reset", // Skip Env from Block

      "Reset", // return
      "ExpressionName", // this

      "Deref",
      "EvalVariable", // this

      "Reset", // Skip Env from Block

      "Pop",
      "MethodInvocation", // p.test(t)

      "Invocation", // ()
      "ExpressionName", // t
      "ResOverride",
      "ExpressionName", // p
      "ResOverload", // test
      "ResType", // t
      "ResType", // p

      "Deref",
      "EvalVariable", // p

      "Deref",
      "EvalVariable", // t

      "Env", // from Invocation
      "Marker",
      "Block", // {...}

      "Env", // from Block
      "ReturnStatement", // return;
      "ExpressionStatement", // this.x = 1;

      "Pop",
      "Assignment", // this.x = 1

      "Assign", // =
      "Literal", // 1
      "EvalVariable", // this.x

      "Res", // x
      "EvalVariable", // this

      "Reset", // return
      "Void",

      "Reset", // Skip Env from Block

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
      "p", // EvalVariable
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
      "Object", // Deref
      "this", // EvalVariable
      "x", // Res
      "0", // Literal
      "0", // Assign
      "this", // EvalVariable
      "Object", // Deref
      "this", // EvalVariable
      "Object", // Deref
      "Object", // Assign
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
      "Object", // Deref
      "this", // EvalVariable
      "x", // Res
      "0", // Literal
      "0", // Assign
      "this", // EvalVariable
      "Object", // Deref
      "this", // EvalVariable
      "Object", // Deref
      "Object", // Assign
      "Parent", // ResType
      "Test", // ResType
      "test", // ResOverload
      "p", // EvalVariable
      "Object", // Deref
      "test", // ResOverride
      "Object",
      "t", // EvalVariable
      "Object", // Deref
      "this", // EvalVariable
      "x", // Res
      "1", // Literal
      "1", // Assign
      "Void",
      "Void",
    ];

    expect(result).toEqual(undefined);
    expect((context.control as ControlStub).getTrace().map(i => getControlItemStr(i))).toEqual(expectedControlTrace);
    expect((context.stash as StashStub).getTrace().map(i => getStashItemStr(i))).toEqual(expectedStashTrace);
    // TODO test env
  });
});
