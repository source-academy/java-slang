import { parse } from "../../ast/parser";
import { evaluate } from "../interpreter";
import {
  ControlStub,
  StashStub,
  createContextStub,
  getControlItemStr,
  getStashItemStr
} from "./utils";

describe("evaluate NormalClassDeclaration correctly", () => {
  it("evaluate NormalClassDeclaration correctly", () => {
    const programStr = `
      class Parent {}
      class Test extends Parent {
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
      "NormalClassDeclaration", // class Test extends Parent {...}
      "NormalClassDeclaration", // class Parent {...}

      "Env", // from NormalClassDeclaration
      "ConstructorDeclaration", // Parent() {...}

      "Env", // from NormalClassDeclaration
      "MethodDeclaration", // static void main(String[] args) {...}
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
      "Void",
    ];

    expect(result).toEqual(undefined);
    expect((context.control as ControlStub).getTrace().map(i => getControlItemStr(i))).toEqual(expectedControlTrace);
    expect((context.stash as StashStub).getTrace().map(i => getStashItemStr(i))).toEqual(expectedStashTrace);
    // TODO test env
  });
});

describe("evaluate FieldDeclaration correctly", () => {
  it("evaluate inherited static field correctly", () => {
    const programStr = `
      class Parent {
        static int x;
      }
      class Test extends Parent {
        public static void main(String[] args) {
          x = 1;
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

      "Env", // from NormalClassDeclaration
      "ConstructorDeclaration", // Parent() {...}
      "FieldDeclaration", // static int x = 0;

      "Pop",
      "Assign", // =
      "Literal", // 0
      "EvalVariable", // x

      "Env", // from NormalClassDeclaration
      "MethodDeclaration", // static void main(String[] args) {...}
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
      "ExpressionStatement", // x = 1;

      "Pop",
      "Assignment", // x = 1

      "Assign", // =
      "Literal", // 1
      "EvalVariable", // x

      "Reset", // return
      "Void",

      "Reset", // Skip Env from Block
    ];
    const expectedStashTrace = [
      "x", // EvalVariable
      "0", // Literal
      "0", // Assign
      "Test", // ResType
      "String[]", // ResType
      "main", // ResOverload
      "Test", // EvalVariable
      "Test", // Deref
      "main", // ResOverride
      `[""]`, // Literal
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

  it("evaluate shadowed static field correctly", () => {
    const programStr = `
      class Parent {
        static int x;
      }
      class Test extends Parent {
        static int x;
        public static void main(String[] args) {
          x = 1;
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

      "Env", // from NormalClassDeclaration
      "ConstructorDeclaration", // Parent() {...}
      "FieldDeclaration", // static int x = 0;

      "Pop",
      "Assign", // =
      "Literal", // 0
      "EvalVariable", // x

      "Env", // from NormalClassDeclaration
      "MethodDeclaration", // static void main(String[] args) {...}
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
      "ExpressionStatement", // x = 1;

      "Pop",
      "Assignment", // x = 1

      "Assign", // =
      "Literal", // 1
      "EvalVariable", // x

      "Reset", // return
      "Void",

      "Reset", // Skip Env from Block
    ];
    const expectedStashTrace = [
      "x", // EvalVariable
      "0", // Literal
      "0", // Assign
      "x", // EvalVariable
      "0", // Literal
      "0", // Assign
      "Test", // ResType
      "String[]", // ResType
      "main", // ResOverload
      "Test", // EvalVariable
      "Test", // Deref
      "main", // ResOverride
      `[""]`, // Literal
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

  it("evaluate inherited instance field correctly", () => {
    const programStr = `
      class Parent {
        int x;
      }
      class Test extends Parent {
        public static void main(String[] args) {
          Parent t = new Test();
          t.x = 1;
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

      "Env", // from NormalClassDeclaration
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
      "ExpressionStatement", // t.x = 1;
      "LocalVariableDeclarationStatement", // Parent t = new Test();

      "ExpressionStatement", // t = new Test();
      "LocalVariableDeclarationStatement", // Parent t;

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
      "Assignment", // t.x = 1

      "Assign", // =
      "Literal", // 1
      "EvalVariable", // t.x

      "Res", // x
      "EvalVariable", // t

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
      "t", // EvalVariable
      "Test", // ResType
      "Test", // ResConOverload
      "Object", // New
      "Parent", // ResType
      "Parent", // ResConOverload
      "super", // EvalVariable
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
      "x", // Res
      "1", // Literal
      "1", // Assign
      "Void",
    ];

    expect(result).toEqual(undefined);
    expect((context.control as ControlStub).getTrace().map(i => getControlItemStr(i))).toEqual(expectedControlTrace);
    expect((context.stash as StashStub).getTrace().map(i => getStashItemStr(i))).toEqual(expectedStashTrace);
    // TODO test env
  });

  it("evaluate declared and inherited instance fields correctly", () => {
    const programStr = `
      class Parent {
        int x = 1;
      }
      class Test extends Parent {
        int y;
        public static void main(String[] args) {
          Parent t = new Test();
          t.y = t.x;
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

      "Env", // from NormalClassDeclaration
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
      "ExpressionStatement", // t.x = t.x;
      "LocalVariableDeclarationStatement", // Parent t = new Test();

      "ExpressionStatement", // t = new Test();
      "LocalVariableDeclarationStatement", // Parent t;

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
      "ExpressionStatement", // this.y = 0;
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

      "Reset", // Skip Env from Block

      "Pop",
      "Assignment", // this.y = 0

      "Assign", // =
      "Literal", // 0
      "EvalVariable", // this.y

      "Res", // y
      "EvalVariable", // this

      "Reset", // return
      "ExpressionName", // this

      "Deref",
      "EvalVariable", // this

      "Reset", // Skip Env from Block

      "Pop",
      "Assignment", // t.y = t.x

      "Assign", // =
      "ExpressionName", // t.x
      "EvalVariable", // t.y

      "Res", // y
      "EvalVariable", // t

      "Deref",
      "EvalVariable", // t.x

      "Res", // x
      "EvalVariable", // t

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
      "t", // EvalVariable
      "Test", // ResType
      "Test", // ResConOverload
      "Object", // New
      "Parent", // ResType
      "Parent", // ResConOverload
      "super", // EvalVariable
      "Object", // Deref
      "this", // EvalVariable
      "x", // Res
      "1", // Literal
      "1", // Assign
      "this", // EvalVariable
      "Object", // Deref
      "this", // EvalVariable
      "y", // Res
      "0", // Literal
      "0", // Assign
      "this", // EvalVariable
      "Object", // Deref
      "Object", // Assign
      "t", // EvalVariable
      "y", // Res
      "t", // EvalVariable
      "x", // Res
      "1", // Deref
      "1", // Assign
      "Void",
    ];

    expect(result).toEqual(undefined);
    expect((context.control as ControlStub).getTrace().map(i => getControlItemStr(i))).toEqual(expectedControlTrace);
    expect((context.stash as StashStub).getTrace().map(i => getStashItemStr(i))).toEqual(expectedStashTrace);
    // TODO test env
  });

  // TODO
  // it("evaluate shadowed instance fields correctly", () => {
  //   const programStr = `
  //     class Parent {
  //       int x = 1;
  //     }
  //     class Test extends Parent {
  //       int x = 2;
  //       public static void main(String[] args) {
  //         Test t = new Test();
  //         int x = t.x; // 2
  //       }
  //     }
  //     `;
  // });

  // TODO
  // it("evaluate shadowed instance fields correctly", () => {
  //   const programStr = `
  //     class Parent {
  //       int x = 1;
  //     }
  //     class Test extends Parent {
  //       int x = 2;
  //       public static void main(String[] args) {
  //         Parent t = new Test();
  //         int x = t.x; // 1
  //       }
  //     }
  //     `;
  // });
});

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
      "ExpressionStatement", // x = 2;

      "Pop",
      "Assignment", // x = 2

      "Assign", // =
      "Literal", // 2
      "EvalVariable", // x

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
      "x", // EvalVariable
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
      "ExpressionStatement", // x = 1;

      "Pop",
      "Assignment", // x = 1

      "Assign", // =
      "Literal", // 1
      "EvalVariable", // x

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
      "x", // EvalVariable
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
