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
      "ResOverload", // main
      "ResType", // [""]
      "ResType", // Test

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
      "ResOverload", // main
      "ResType", // [""]
      "ResType", // Test

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
      "ResOverload", // main
      "ResType", // [""]
      "ResType", // Test

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
});