import { parse } from "../../ast/parser";
import { ResOverloadAmbiguousError, ResOverloadError } from "../errors";
import { evaluate } from "../interpreter";
import {
  ControlStub,
  StashStub,
  createContextStub,
  getControlItemStr,
  getStashItemStr
} from "./__utils__/utils";

describe("evaluate method overloading correctly", () => {
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
      "NormalClassDeclaration", // class Object {...}
      
      "Env", // from NormalClassDeclaration
      "ConstructorDeclaration", // Object() {...}
  
      "Env",
      "MethodDeclaration", // static void test() {...}
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
      "Descriptor", // ResOverload
      "Test", // EvalVariable
      "Test", // Deref
      "main", // ResOverride
      `[""]`, // Literal
      "x", // EvalVariable
      "Test", // ResType
      "int", // ResType
      "Descriptor", // ResOverload
      "Test", // EvalVariable
      "Test", // Deref
      "test", // ResOverride
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
      "NormalClassDeclaration", // class Object {...}
      
      "Env", // from NormalClassDeclaration
      "ConstructorDeclaration", // Object() {...}
  
      "Env",
      "MethodDeclaration", // void Test() {...}
      "MethodDeclaration", // public static void main(String[] args) {...}
      "ConstructorDeclaration", // Test(int x) {...}
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
      "MethodInvocation", // Test.Test()

      "Invocation", // ()
      "ResOverride",
      "ExpressionName", // Test
      "ResOverload", // Test
      "ResType", // Test

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
      "Descriptor", // ResOverload
      "Test", // EvalVariable
      "Test", // Deref
      "main", // ResOverride
      `[""]`, // Literal
      "Test", // EvalVariable
      "Test", // ResType
      "int", // ResType
      "Test", // ResConOverlaod
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
      "Test", // ResType
      "Descriptor", // ResOverload
      "Test", // EvalVariable
      "Object", // Deref
      "Test", // ResOverride
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

  it("should invoke overloaded instance method with supertype", () => {
    const programStr = `
      class Parent {
        int x;
      }
      class Test extends Parent {
        public static void main(String[] args) {
          Test t = new Test();
          t.test(t);
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
      "ExpressionStatement", // t.test(t);
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
      "MethodInvocation", // t.test(t)

      "Invocation", // ()
      "ExpressionName", // t
      "ResOverride",
      "ExpressionName", // t
      "ResOverload", // test
      "ResType", // t
      "ResType", // t

      "Deref",
      "EvalVariable", // t

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
      "Descriptor", // ResOverload
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
      "Test", // ResType
      "Test", // ResType
      "Descriptor", // ResOverload
      "t", // EvalVariable
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

  it("should not invoke overloaded instance method with supertype", () => {
    const programStr = `
      class Parent {
        int x;
      }
      class Test extends Parent {
        public static void main(String[] args) {
          Test t = new Test();
          t.test(t);
        }
        void test(Parent p) {
          x = 2;
        }
        void test(Test t) {
          x = 3;
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
      "ConstructorDeclaration", // Parent() {...}

      "Env", // from NormalClassDeclaration
      "MethodDeclaration", // void test(Test t) {...}
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
      "ExpressionStatement", // t.test(t);
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
      "MethodInvocation", // t.test(t)

      "Invocation", // ()
      "ExpressionName", // t
      "ResOverride",
      "ExpressionName", // t
      "ResOverload", // test
      "ResType", // t
      "ResType", // t

      "Deref",
      "EvalVariable", // t

      "Deref",
      "EvalVariable", // t

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

      "Reset", // Skip Env from Block

      "Reset", // return
      "Void",

      "Reset", // Skip Env from Block
    ];
    const expectedStashTrace = [
      "Test", // ResType
      "String[]", // ResType
      "Descriptor", // ResOverload
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
      "Test", // ResType
      "Test", // ResType
      "Descriptor", // ResOverload
      "t", // EvalVariable
      "Object", // Deref
      "test", // ResOverride
      "Object",
      "t", // EvalVariable
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

  it("should invoke most specific overloaded instance method", () => {
    const programStr = `
      class Parent {
        int x;
      }
      class Test extends Parent {
        public static void main(String[] args) {
          Test t = new Test();
          t.test(t, t);
        }
        void test(Test t1, Test t2) {
          x = 3;
        }
        void test(Test t, Parent p) {
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
      "ConstructorDeclaration", // Parent() {...}

      "Env", // from NormalClassDeclaration
      "MethodDeclaration", // void test(Test t1, Test t2) {...}
      "MethodDeclaration", // void test(Test t, Parent p) {...}
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
      "ExpressionStatement", // t.test(t, t);
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
      "MethodInvocation", // t.test(t, t)

      "Invocation", // ()
      "ExpressionName", // t
      "ExpressionName", // t
      "ResOverride",
      "ExpressionName", // t
      "ResOverload", // test
      "ResType", // t
      "ResType", // t
      "ResType", // t

      "Deref",
      "EvalVariable", // t

      "Deref",
      "EvalVariable", // t

      "Deref",
      "EvalVariable", // t

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

      "Reset", // Skip Env from Block

      "Reset", // return
      "Void",

      "Reset", // Skip Env from Block
    ];
    const expectedStashTrace = [
      "Test", // ResType
      "String[]", // ResType
      "Descriptor", // ResOverload
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
      "Test", // ResType
      "Test", // ResType
      "Test", // ResType
      "Descriptor", // ResOverload
      "t", // EvalVariable
      "Object", // Deref
      "test", // ResOverride
      "Object",
      "t", // EvalVariable
      "Object", // Deref
      "t", // EvalVariable
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

  it("should throw ambiguous method overloading error", () => {
    const programStr = `
      class Parent {
        int x;
      }
      class Test extends Parent {
        public static void main(String[] args) {
          Test t = new Test();
          t.test(t, t);
        }
        void test(Parent p, Test t) {
          x = 3;
        }
        void test(Test t, Parent p) {
          x = 2;
        }
      }
      `;

    const compilationUnit = parse(programStr);
    expect(compilationUnit).toBeTruthy();

    const context = createContextStub();
    context.control.push(compilationUnit!);

    expect(() => evaluate(context)).toThrowError(ResOverloadAmbiguousError);
  });

  it("should fail method overloading resolution", () => {
    const programStr = `
      class Parent {}
      class Test extends Parent {
        public static void main(String[] args) {
          Parent p = new Test();
          p.test();
        }
        void test() {}
      }
      `;

    const compilationUnit = parse(programStr);
    expect(compilationUnit).toBeTruthy();

    const context = createContextStub();
    context.control.push(compilationUnit!);

    expect(() => evaluate(context)).toThrowError(ResOverloadError);
  });

  it("should invoke inherited method", () => {
    const programStr = `
      class Parent {
        static void test() {}
      }
      class Test extends Parent {
        public static void main(String[] args) {
          test();
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

      "Env", // from NormalClassDeclaration
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
      "Void",

      "Reset", // Skip Env from Block

      "Reset", // return
      "Void",

      "Reset", // Skip Env from Block
    ];
    const expectedStashTrace = [
      "Test", // ResType
      "String[]", // ResType
      "Descriptor", // ResOverload
      "Test", // EvalVariable
      "Test", // Deref
      "main", // ResOverride
      `[""]`, // Literal
      "Test", // ResType
      "Descriptor", // ResOverload
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
});
