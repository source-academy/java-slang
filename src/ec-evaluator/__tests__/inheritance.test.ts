import { parse } from "../../ast/parser";
import { ResOverloadAmbiguousError, ResOverloadError, UndeclaredVariableError } from "../errors";
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
      "NormalClassDeclaration", // class Object {...}
      
      "Env", // from NormalClassDeclaration
      "ConstructorDeclaration", // Object() {...}

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
  describe("evaluate static fields", () => {
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

  describe("evaluate instance fields", () => {
    it("evaluate inherited instance field via simple name correctly", () => {
      const programStr = `
        class Parent {
          int x = 1;
          void test() {}
        }
        class Test extends Parent {
          public static void main(String[] args) {
            Parent p = new Test();
            p.test();
          }
          void test() {
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
        "ExpressionStatement", // this.x = 1;
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
        "LocalVariableDeclarationStatement", // int y = this.x;

        "ExpressionStatement", // y = this.x;
        "LocalVariableDeclarationStatement", // int y

        "Pop",
        "Assignment", // y = this.x
  
        "Assign", // =
        "ExpressionName", // this.x
        "EvalVariable", // y
  
        "Deref",
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
        "1", // Literal
        "1", // Assign
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
        "y", // EvalVariable
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

    it("evaluate shadowed instance field via simple name correctly", () => {
      const programStr = `
        class Parent {
          int x = 1;
          void test() {}
        }
        class Test extends Parent {
          int x = 2;
          public static void main(String[] args) {
            Parent p = new Test();
            p.test();
          }
          void test() {
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
        "ExpressionStatement", // this.x = 2;
  
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
        "Assignment", // this.x = 2
  
        "Assign", // =
        "Literal", // 2
        "EvalVariable", // this.x
  
        "Res", // x
        "EvalVariable", // this
  
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
        "LocalVariableDeclarationStatement", // int y = this.x;

        "ExpressionStatement", // y = this.x;
        "LocalVariableDeclarationStatement", // int y

        "Pop",
        "Assignment", // y = this.x
  
        "Assign", // =
        "ExpressionName", // this.x
        "EvalVariable", // y
  
        "Deref",
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
        "1", // Literal
        "1", // Assign
        "this", // EvalVariable
        "Object", // Deref
        "this", // EvalVariable
        "x", // Res
        "2", // Literal
        "2", // Assign
        "this", // EvalVariable
        "Object", // Deref
        "Object", // Assign
        "Parent", // ResType
        "test", // ResOverload
        "p", // EvalVariable
        "Object", // Deref
        "test", // ResOverride
        "Object",
        "y", // EvalVariable
        "this", // EvalVariable
        "x", // Res
        "2", // Deref
        "2", // Assign
        "Void",
        "Void",
      ];
  
      expect(result).toEqual(undefined);
      expect((context.control as ControlStub).getTrace().map(i => getControlItemStr(i))).toEqual(expectedControlTrace);
      expect((context.stash as StashStub).getTrace().map(i => getStashItemStr(i))).toEqual(expectedStashTrace);
      // TODO test env
    });

    it("evaluate inherited instance field via qualified name correctly", () => {
      const programStr = `
        class Parent {
          int x = 1;
        }
        class Test extends Parent {
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
        "ExpressionStatement", // this.x = 1;
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
        "1", // Literal
        "1", // Assign
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

    it("evaluate shadowed instance field via subclass qualified name correctly", () => {
      const programStr = `
        class Parent {
          int x = 1;
        }
        class Test extends Parent {
          int x = 2;
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
        "ExpressionStatement", // this.x = 2;
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
        "Assignment", // this.x = 2
  
        "Assign", // =
        "Literal", // 2
        "EvalVariable", // this.x
  
        "Res", // x
        "EvalVariable", // this
  
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
        "x", // Res
        "1", // Literal
        "1", // Assign
        "this", // EvalVariable
        "Object", // Deref
        "this", // EvalVariable
        "x", // Res
        "2", // Literal
        "2", // Assign
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
  
    it("evaluate shadowed instance field via superclass qualified name correctly", () => {
      const programStr = `
        class Parent {
          int x = 1;
        }
        class Test extends Parent {
          int x = 2;
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
        "ExpressionStatement", // this.x = 2;
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
        "Assignment", // this.x = 2
  
        "Assign", // =
        "Literal", // 2
        "EvalVariable", // this.x
  
        "Res", // x
        "EvalVariable", // this
  
        "Reset", // return
        "ExpressionName", // this
  
        "Deref",
        "EvalVariable", // this
  
        "Reset", // Skip Env from Block

        "ExpressionStatement", // x = t.x;
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
        "1", // Literal
        "1", // Assign
        "this", // EvalVariable
        "Object", // Deref
        "this", // EvalVariable
        "x", // Res
        "2", // Literal
        "2", // Assign
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
  
    it("should not be able to access subclass instance field via superclass qualified name", () => {
      const programStr = `
        class Parent {}
        class Test extends Parent {
          int x;
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
});

describe("evaluate method overloading correctly", () => {
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
      "test", // ResOverload
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
      "test", // ResOverload
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
      "test", // ResOverload
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
