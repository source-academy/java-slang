import { parse } from "../../ast/parser";
import { evaluate } from "../interpreter";
import {
  ControlStub,
  StashStub,
  createContextStub,
  getControlItemStr,
  getStashItemStr
} from "./__utils__/utils";

describe("evaluate constructor overloading resolution correctly", () => {
  it("evaluate superclass constructor invocation correctly", () => {
    const programStr = `
      class Parent {
        int x;
        Parent(Parent p) {
          x = 1;
        }
        Parent(int p) {
          x = p;
        }
      }
      class Test extends Parent {
        Test() {
          super(2);
        }
        public static void main(String[] args) {
          Test t = new Test();
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
      "ConstructorDeclaration", // Parent(Parent p) {...}
      "ConstructorDeclaration", // Parent(int p) {...}
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
      "ExplicitConstructorInvocation", // super(2);

      "Pop",
      "Invocation", // ()
      "Literal", // 2
      "ExpressionName", // super
      "ResConOverload", // Parent
      "ResType", // 2
      "ResType", // super

      "Deref",
      "EvalVariable", // super

      "Env", // from Invocation
      "Marker",
      "Block", // {...}

      "Env", // from Block
      "ReturnStatement", // return this;
      "ExpressionStatement", // this.x = p;
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
      "Assignment", // this.x = p

      "Assign", // =
      "ExpressionName", // p
      "EvalVariable", // this.x

      "Res", // x
      "EvalVariable", // this
      
      "Deref",
      "EvalVariable", // p

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
      "int", // ResType
      "Parent", // ResConOverload
      "super", // EvalVariable
      "Object", // Deref
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
      "p", // EvalVariable
      "2", // Deref
      "2", // Assign
      "this", // EvalVariable
      "Object", // Deref
      "this", // EvalVariable
      "Object", // Deref
      "Object", // Assign
      "Void",
    ];

    expect(result).toEqual(undefined);
    expect((context.control as ControlStub).getTrace().map(i => getControlItemStr(i))).toEqual(expectedControlTrace);
    expect((context.stash as StashStub).getTrace().map(i => getStashItemStr(i))).toEqual(expectedStashTrace);
    // TODO test env
  });

  it("should resolve to Test(int x) instead of default constructor", () => {
    const programStr = `
      class Test {
        int x;
        Test(int x) {
          this.x = x;
        }
        public static void main(String[] args) {
          Test test = new Test(1);
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
  
      "Env", // from NormalClassDeclaration
      "MethodDeclaration", // public static void main(String[] args) {...}
      "ConstructorDeclaration", // Test() {...}
      "ConstructorDeclaration", // Test(int x) {...}
  
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
      "LocalVariableDeclarationStatement", // Test test = new Test(1);
  
      "ExpressionStatement", // test = new Test(1);
      "LocalVariableDeclarationStatement", // Test test;
  
      "Pop",
      "Assignment", // test = new Test(1)
  
      "Assign", // =
      "ClassInstanceCreationExpression", // new Test(1)
      "EvalVariable", // test

      "Invocation", // ()
      "Literal", // 1
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
  
      "Reset", // return
      "Void",
  
      "Reset", // skip Env from Block
    ];
    const expectedStashTrace = [
      "Test", // ResType
      "String[]", // ResType
      "Descriptor", // ResOverload
      "Test", // EvalVariable,
      "Test", // Deref
      "main", // ResOverride
      `[""]`, // Literal
      "test", // EvalVariable
      "Test", // ResType
      "int", // ResType
      "Test", // ResConOverlaod
      "Object", // New
      "1", // Literal
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
      "1", // Deref
      "1", // Assign
      "this", // EvalVariable
      "Object", // Deref
      "Object", // Assign
      "Void",
    ];
  
    expect(result).toEqual(undefined);
    expect((context.control as ControlStub).getTrace().map(i => getControlItemStr(i))).toEqual(expectedControlTrace);
    expect((context.stash as StashStub).getTrace().map(i => getStashItemStr(i))).toEqual(expectedStashTrace);
    // TODO test env
  });

  it("should resolve to Test(int x) instead of method with similar descriptor", () => {
    const programStr = `
      class Test {
        int x;
        Test(int x) {
          this.x = x;
        }
        public static void main(String[] args) {
          Test test = new Test(1);
        }
        Test Test(int x) {
          return new Test(x + 1);
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
  
      "Env", // from NormalClassDeclaration
      "MethodDeclaration", // Test Test(int x) {...}
      "MethodDeclaration", // public static void main(String[] args) {...}
      "ConstructorDeclaration", // Test() {...}
      "ConstructorDeclaration", // Test(int x) {...}
  
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
      "LocalVariableDeclarationStatement", // Test test = new Test(1);
  
      "ExpressionStatement", // test = new Test(1);
      "LocalVariableDeclarationStatement", // Test test;
  
      "Pop",
      "Assignment", // test = new Test(1)
  
      "Assign", // =
      "ClassInstanceCreationExpression", // new Test(1)
      "EvalVariable", // test

      "Invocation", // ()
      "Literal", // 1
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
  
      "Reset", // return
      "Void",
  
      "Reset", // skip Env from Block
    ];
    const expectedStashTrace = [
      "Test", // ResType
      "String[]", // ResType
      "Descriptor", // ResOverload
      "Test", // EvalVariable,
      "Test", // Deref
      "main", // ResOverride
      `[""]`, // Literal
      "test", // EvalVariable
      "Test", // ResType
      "int", // ResType
      "Test", // ResConOverlaod
      "Object", // New
      "1", // Literal
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
      "1", // Deref
      "1", // Assign
      "this", // EvalVariable
      "Object", // Deref
      "Object", // Assign
      "Void",
    ];
  
    expect(result).toEqual(undefined);
    expect((context.control as ControlStub).getTrace().map(i => getControlItemStr(i))).toEqual(expectedControlTrace);
    expect((context.stash as StashStub).getTrace().map(i => getStashItemStr(i))).toEqual(expectedStashTrace);
    // TODO test env
  });

  it("evaluate alternate constructor invocation correctly", () => {
    const programStr = `
      class Test {
        int x;
        Test() {
          this(1);
        }
        Test(int x) {
          this.x = x;
        }
        public static void main(String[] args) {
          Test test = new Test();
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
  
      "Env", // from NormalClassDeclaration
      "MethodDeclaration", // public static void main(String[] args) {...}
      "ConstructorDeclaration", // Test() {...}
      "ConstructorDeclaration", // Test(int x) {...}
  
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
      "ExplicitConstructorInvocation", // this(1);

      "Pop",
      "Invocation", // ()
      "Literal", // 1
      "ExpressionName", // this
      "ResConOverload", // Test
      "ResType", // 1
      "ResType", // this

      "Deref",
      "EvalVariable", // this
  
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

      "Reset", // return
      "ExpressionName", // this

      "Deref",
      "EvalVariable", // this
  
      "Reset", // skip Env from Block
  
      "Reset", // return
      "Void",
  
      "Reset", // skip Env from Block
    ];
    const expectedStashTrace = [
      "Test", // ResType
      "String[]", // ResType
      "Descriptor", // ResOverload
      "Test", // EvalVariable,
      "Test", // Deref
      "main", // ResOverride
      `[""]`, // Literal
      "test", // EvalVariable
      "Test", // ResType
      "Test", // ResConOverlaod
      "Object", // New
      "Test", // ResType
      "int", // ResType
      "Test", // ResConOverload
      "this", // EvalVariable
      "Object", // Deref
      "1", // Literal
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
      "1", // Deref
      "1", // Assign
      "this", // EvalVariable
      "Object", // Deref
      "this", // EvalVariable
      "Object", // Deref
      "Object", // Assign
      "Void",
    ];
  
    expect(result).toEqual(undefined);
    expect((context.control as ControlStub).getTrace().map(i => getControlItemStr(i))).toEqual(expectedControlTrace);
    expect((context.stash as StashStub).getTrace().map(i => getStashItemStr(i))).toEqual(expectedStashTrace);
    // TODO test env
  });
});
