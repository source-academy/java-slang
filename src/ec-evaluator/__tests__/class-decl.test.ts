import { parse } from "../../ast/parser";
import { evaluate } from "../interpreter";
import {
  ControlStub,
  StashStub,
  createContextStub,
  getControlItemStr,
  getStashItemStr
} from "./utils";

describe("evaluate FieldDeclaration correctly", () => {
  it("evaluate FieldDeclaration without variableInitializer correctly", () => {
    const programStr = `
      public class Test {
        int x;
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

      "ExpressionStatement", // main();
      "MethodDeclaration", // public static void main(String[] args) {...}
      "FieldDeclaration", // int x;

      "Pop",
      "MethodInvocation", // main()

      "Invocation", // ()
      "MethodName", // main

      "Env", // from Invocation
      "Marker",
      "Block", // {...}

      "Env", // from Block
      "ReturnStatement", // return;

      "Reset", // return
      "Void",

      "Reset", // skip Env from Invocation
    ];
    const expectedStashTrace = [
      "main", // MethodName
      "Void", // Void
    ];
  
    expect(result).toEqual(undefined);
    expect((context.control as ControlStub).getTrace().map(i => getControlItemStr(i))).toEqual(expectedControlTrace);
    expect((context.stash as StashStub).getTrace().map(i => getStashItemStr(i))).toEqual(expectedStashTrace);
    // TODO test env
  });
  
  it("evaluate FieldDeclaration with variableInitializer correctly", () => {
    const programStr = `
      public class Test {
        int x = 1;
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

      "ExpressionStatement", // main();
      "MethodDeclaration", // public static void main(String[] args) {...}
      "FieldDeclaration", // int x = 1;

      "Pop",
      "Assign", // =
      "Literal", // 1
      "EvalVariable", // x

      "Pop",
      "MethodInvocation", // main()

      "Invocation", // ()
      "MethodName", // main

      "Env", // from Invocation
      "Marker",
      "Block", // {...}

      "Env", // from Block
      "ReturnStatement", // return;

      "Reset", // return
      "Void",

      "Reset", // skip Env from Invocation
    ];
    const expectedStashTrace = [
      "x", // EvalVariable
      "1", // Literal
      "1", // Assign
      "main", // MethodName
      "Void", // Void
    ];
  
    expect(result).toEqual(undefined);
    expect((context.control as ControlStub).getTrace().map(i => getControlItemStr(i))).toEqual(expectedControlTrace);
    expect((context.stash as StashStub).getTrace().map(i => getStashItemStr(i))).toEqual(expectedStashTrace);
    // TODO test env
  });
});

describe("evaluate MethodDeclaration correctly", () => {
  it("evaluate MethodDeclaration without explicit return correctly", () => {
    const programStr = `
      public class Test {
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
      
      "ExpressionStatement", // main();
      "MethodDeclaration", // public static void main(String[] args) {...}

      "Pop",
      "MethodInvocation", // main()

      "Invocation", // ()
      "MethodName", // main

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
      "main", // MethodName
      "Void",
    ];

    expect(result).toEqual(undefined);
    expect((context.control as ControlStub).getTrace().map(i => getControlItemStr(i))).toEqual(expectedControlTrace);
    expect((context.stash as StashStub).getTrace().map(i => getStashItemStr(i))).toEqual(expectedStashTrace);
    // TODO test env
  });

  it("evaluate MethodDeclaration with explicit return correctly", () => {
    const programStr = `
      public class Test {
        public static void main(String[] args) {
          return;
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
      
      "ExpressionStatement", // main();
      "MethodDeclaration", // public static void main(String[] args) {...}

      "Pop",
      "MethodInvocation", // main()

      "Invocation", // ()
      "MethodName", // main

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
      "main", // MethodName
      "Void",
    ];

    expect(result).toEqual(undefined);
    expect((context.control as ControlStub).getTrace().map(i => getControlItemStr(i))).toEqual(expectedControlTrace);
    expect((context.stash as StashStub).getTrace().map(i => getStashItemStr(i))).toEqual(expectedStashTrace);
    // TODO test env
  });

  it("evaluate multiple MethodDeclaration correctly", () => {
    const programStr = `
      public class Test {
        public static void main(String[] args) {}
        static void test1() {}
        private int test2(int x) {}
      }
      `;
  
    const compilationUnit = parse(programStr);
    expect(compilationUnit).toBeTruthy();
  
    const context = createContextStub();
    context.control.push(compilationUnit!);
  
    const result = evaluate(context);
  
    const expectedControlTrace = [
      "CompilationUnit",
      
      "ExpressionStatement", // main();
      "MethodDeclaration", // private int test2(int x) {}
      "MethodDeclaration", // void test1() {}
      "MethodDeclaration", // public static void main(String[] args) {...}

      "Pop",
      "MethodInvocation", // main()

      "Invocation", // ()
      "MethodName", // main

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
      "main", // MethodName
      "Void", // Void
    ];
  
    expect(result).toEqual(undefined);
    expect((context.control as ControlStub).getTrace().map(i => getControlItemStr(i))).toEqual(expectedControlTrace);
    expect((context.stash as StashStub).getTrace().map(i => getStashItemStr(i))).toEqual(expectedStashTrace);
    // TODO test env
  });
});
