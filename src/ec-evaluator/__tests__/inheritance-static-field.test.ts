import { parse } from "../../ast/parser";
import { UndeclaredVariableError } from "../errors";
import { evaluate } from "../interpreter";
import {
  ControlStub,
  StashStub,
  createContextStub,
  getControlItemStr,
  getStashItemStr
} from "./utils";

describe("evaluate static fields with inheritance", () => {
  it("evaluate inherited static field via simple name correctly", () => {
    const programStr = `
      class Parent {
        static int x = 1;
      }
      class Test extends Parent {
        public static void main(String[] args) {
          int y = x;
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
      "FieldDeclaration", // static int x = 1;

      "Pop",
      "Assign", // =
      "Literal", // 1
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
      "LocalVariableDeclarationStatement", // int y = Test.x;

      "ExpressionStatement", // y = Test.x;
      "LocalVariableDeclarationStatement", // int y;

      "Pop",
      "Assignment", // y = Test.x

      "Assign", // =
      "ExpressionName", // Test.x
      "EvalVariable", // y

      "Deref",
      "EvalVariable", // Test.x

      "Res", // x
      "EvalVariable", // Test

      "Reset", // return
      "Void",

      "Reset", // Skip Env from Block
    ];
    const expectedStashTrace = [
      "x", // EvalVariable
      "1", // Literal
      "1", // Assign
      "Test", // ResType
      "String[]", // ResType
      "main", // ResOverload
      "Test", // EvalVariable
      "Test", // Deref
      "main", // ResOverride
      `[""]`, // Literal
      "y", // EvalVariable
      "Test", // EvalVariable
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

  it("evaluate shadowed static field via simple name correctly", () => {
    const programStr = `
      class Parent {
        static int x = 1;
      }
      class Test extends Parent {
        static int x = 2;
        public static void main(String[] args) {
          int y = x; // 2
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
      "FieldDeclaration", // static int x = 1;

      "Pop",
      "Assign", // =
      "Literal", // 1
      "EvalVariable", // x

      "Env", // from NormalClassDeclaration
      "MethodDeclaration", // static void main(String[] args) {...}
      "ConstructorDeclaration", // Test() {...}
      "FieldDeclaration", // static int x = 2;

      "Pop",
      "Assign", // =
      "Literal", // 2
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
      "LocalVariableDeclarationStatement", // int y = Test.x;

      "ExpressionStatement", // y = Test.x;
      "LocalVariableDeclarationStatement", // int y;

      "Pop",
      "Assignment", // y = Test.x

      "Assign", // =
      "ExpressionName", // Test.x
      "EvalVariable", // y

      "Deref",
      "EvalVariable", // Test.x

      "Res", // x
      "EvalVariable", // Test

      "Reset", // return
      "Void",

      "Reset", // Skip Env from Block
    ];
    const expectedStashTrace = [
      "x", // EvalVariable
      "1", // Literal
      "1", // Assign
      "x", // EvalVariable
      "2", // Literal
      "2", // Assign
      "Test", // ResType
      "String[]", // ResType
      "main", // ResOverload
      "Test", // EvalVariable
      "Test", // Deref
      "main", // ResOverride
      `[""]`, // Literal
      "y", // EvalVariable
      "Test", // EvalVariable
      "x", // Res
      "2", // Deref
      "2", // Assign
      "Void",
    ];

    expect(result).toEqual(undefined);
    expect((context.control as ControlStub).getTrace().map(i => getControlItemStr(i))).toEqual(expectedControlTrace);
    expect((context.stash as StashStub).getTrace().map(i => getStashItemStr(i))).toEqual(expectedStashTrace);
    // TODO test env
  });

  it("evaluate inherited static field via qualified name correctly", () => {
    const programStr = `
      class Parent {
        static int x = 1;
      }
      class Test extends Parent {
        public static void main(String[] args) {
          Parent t = new Test();
          int x = t.x;
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
      "FieldDeclaration", // static int x = 1;

      "Pop",
      "Assign", // =
      "Literal", // 1
      "EvalVariable", // x

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
      "LocalVariableDeclarationStatement", // int x = t.x;
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

      "ExpressionStatement", // x = t.x;
      "LocalVariableDeclarationStatement", // int x;

      "Pop",
      "Assignment", // x = t.x

      "Assign", // =
      "ExpressionName", // t.x
      "EvalVariable", // x

      "Deref",
      "EvalVariable", // t.x

      "Res", // x
      "EvalVariable", // t

      "Reset", // return
      "Void",

      "Reset", // Skip Env from Block
    ];
    const expectedStashTrace = [
      "x", // EvalVariable
      "1", // Literal
      "1", // Assign
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
      "Object", // Deref
      "this", // EvalVariable
      "Object", // Deref
      "this", // EvalVariable
      "Object", // Deref
      "Object", // Assign
      "x", // EvalVariable
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

  it("evaluate shadowed static field via subclass qualified name correctly", () => {
    const programStr = `
      class Parent {
        static int x = 1;
      }
      class Test extends Parent {
        static int x = 2;
        public static void main(String[] args) {
          Test t = new Test();
          int x = t.x; // 2
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
      "FieldDeclaration", // static int x = 1;

      "Pop",
      "Assign", // =
      "Literal", // 1
      "EvalVariable", // x

      "Env", // from NormalClassDeclaration
      "MethodDeclaration", // public static void main(String[] args) {...}
      "ConstructorDeclaration", // Test() {...}
      "FieldDeclaration", // static int x = 2;

      "Pop",
      "Assign", // =
      "Literal", // 2
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
      "LocalVariableDeclarationStatement", // int x = t.x;
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

      "ExpressionStatement", // int x = t.x;
      "LocalVariableDeclarationStatement", // int x;

      "Pop",
      "Assignment", // x = t.x

      "Assign", // =
      "ExpressionName", // t.x
      "EvalVariable", // x

      "Deref",
      "EvalVariable", // t.x

      "Res", // x
      "EvalVariable", // t

      "Reset", // return
      "Void",

      "Reset", // Skip Env from Block
    ];
    const expectedStashTrace = [
      "x", // EvalVariable
      "1", // Literal
      "1", // Assign
      "x", // EvalVariable
      "2", // Literal
      "2", // Assign
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
      "Object", // Deref
      "this", // EvalVariable
      "Object", // Deref
      "this", // EvalVariable
      "Object", // Deref
      "Object", // Assign
      "x", // EvalVariable
      "t", // EvalVariable
      "x", // Res
      "2", // Deref
      "2", // Assign
      "Void",
    ];

    expect(result).toEqual(undefined);
    expect((context.control as ControlStub).getTrace().map(i => getControlItemStr(i))).toEqual(expectedControlTrace);
    expect((context.stash as StashStub).getTrace().map(i => getStashItemStr(i))).toEqual(expectedStashTrace);
    // TODO test env
  });

  it("evaluate shadowed static field via superclass qualified name correctly", () => {
    const programStr = `
      class Parent {
        static int x = 1;
      }
      class Test extends Parent {
        static int x = 2;
        public static void main(String[] args) {
          Parent p = new Test();
          int x = p.x; // 1
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
      "FieldDeclaration", // static int x = 1;

      "Pop",
      "Assign", // =
      "Literal", // 1
      "EvalVariable", // x

      "Env", // from NormalClassDeclaration
      "MethodDeclaration", // public static void main(String[] args) {...}
      "ConstructorDeclaration", // Test() {...}
      "FieldDeclaration", // static int x = 2;

      "Pop",
      "Assign", // =
      "Literal", // 2
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
      "LocalVariableDeclarationStatement", // int x = p.x;
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

      "ExpressionStatement", // x = p.x;
      "LocalVariableDeclarationStatement", // int x;

      "Pop",
      "Assignment", // x = p.x

      "Assign", // =
      "ExpressionName", // p.x
      "EvalVariable", // x

      "Deref",
      "EvalVariable", // p.x

      "Res", // x
      "EvalVariable", // p

      "Reset", // return
      "Void",

      "Reset", // Skip Env from Block
    ];
    const expectedStashTrace = [
      "x", // EvalVariable
      "1", // Literal
      "1", // Assign
      "x", // EvalVariable
      "2", // Literal
      "2", // Assign
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
      "x", // EvalVariable
      "p", // EvalVariable
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

  it("should not be able to access subclass static field via superclass qualified name", () => {
    const programStr = `
      class Parent {}
      class Test extends Parent {
        static int x;
        public static void main(String[] args) {
          Parent p = new Test();
          int x = p.x;
        }
      }
      `;

    const compilationUnit = parse(programStr);
    expect(compilationUnit).toBeTruthy();

    const context = createContextStub();
    context.control.push(compilationUnit!);

    expect(() => evaluate(context)).toThrowError(UndeclaredVariableError);
  });
});
