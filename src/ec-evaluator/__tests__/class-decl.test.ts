import { parse } from "../../ast/parser";
import { NoMainMtdError } from "../errors";
import { evaluate } from "../interpreter";
import {
  ControlStub,
  StashStub,
  createContextStub,
  getControlItemStr,
  getStashItemStr
} from "./utils";

describe("evaluate FieldDeclaration correctly", () => {
  it("evaluate static FieldDeclaration without variableInitializer correctly", () => {
    const programStr = `
      public class Test {
        static Test x;
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
      "NormalClassDeclaration", // public class Test {...}

      "Env", // from NormalClassDeclaration
      "MethodDeclaration", // public static void main(String[] args) {...}
      "ConstructorDeclaration", // Test() {...}
      "FieldDeclaration", // static Test x = null;

      "Pop",
      "Assign", // =
      "Literal", // null
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

      "Reset", // return
      "Void",

      "Reset", // skip Env from Invocation
    ];
    const expectedStashTrace = [
      "x", // EvalVariable
      "null", // Literal
      "null", // Assign
      "Test", // ResType
      "String[]", // ResType
      "main", // ResOverload
      `[""]`, // Literal
      "Void", // Void
    ];
  
    expect(result).toEqual(undefined);
    expect((context.control as ControlStub).getTrace().map(i => getControlItemStr(i))).toEqual(expectedControlTrace);
    expect((context.stash as StashStub).getTrace().map(i => getStashItemStr(i))).toEqual(expectedStashTrace);
    // TODO test env
  });
  
  it("evaluate static FieldDeclaration with variableInitializer correctly", () => {
    const programStr = `
      public class Test {
        static int x = 1;
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
      "NormalClassDeclaration", // public class Test {...}

      "Env", // from NormalClassDeclaration
      "MethodDeclaration", // public static void main(String[] args) {...}
      "ConstructorDeclaration", // Test() {...}
      "FieldDeclaration", // static int x = 1;

      "Pop",
      "Assign", // =
      "Literal", // 1
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

      "Reset", // return
      "Void",

      "Reset", // skip Env from Invocation
    ];
    const expectedStashTrace = [
      "x", // EvalVariable
      "1", // Literal
      "1", // Assign
      "Test", // ResType
      "String[]", // ResType
      "main", // ResOverload
      `[""]`, // Literal
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
      
      "ExpressionStatement", // Test.main([""]);
      "NormalClassDeclaration", // public class Test {...}

      "Env", // from NormalClassDeclaration
      "MethodDeclaration", // public static void main(String[] args) {...}
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
      
      "ExpressionStatement", // Test.main([""]);
      "NormalClassDeclaration", // public class Test {...}

      "Env", // from NormalClassDeclaration
      "MethodDeclaration", // public static void main(String[] args) {...}
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
      
      "ExpressionStatement", // Test.main([""]);
      "NormalClassDeclaration", // public class Test {...}

      "Env", // from NormalClassDeclaration
      "MethodDeclaration", // private int test2(int x) {}
      "MethodDeclaration", // static void test1() {}
      "MethodDeclaration", // public static void main(String[] args) {...}
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
      "Void", // Void
    ];
  
    expect(result).toEqual(undefined);
    expect((context.control as ControlStub).getTrace().map(i => getControlItemStr(i))).toEqual(expectedControlTrace);
    expect((context.stash as StashStub).getTrace().map(i => getStashItemStr(i))).toEqual(expectedStashTrace);
    // TODO test env
  });
});

describe("evaluate main method correctly", () => {
  it("should throw an error when main method is not defined", () => {
    const programStr = `
      class Test {}
      `;
  
    const compilationUnit = parse(programStr);
    expect(compilationUnit).toBeTruthy();
  
    const context = createContextStub();
    context.control.push(compilationUnit!);
  
    expect(() => evaluate(context)).toThrowError(NoMainMtdError);
  });

  it("should not throw an error if main method is defined in at least one class", () => {
    const programStr = `
      class Test {}
      class AnotherTest {
        public static void main(String[] args) {}
      }
      `;
  
    const compilationUnit = parse(programStr);
    expect(compilationUnit).toBeTruthy();
  
    const context = createContextStub();
    context.control.push(compilationUnit!);
  
    expect(() => evaluate(context)).not.toThrowError(NoMainMtdError);
  });

  it("should invoke the main method defined in first class according to program order", () => {
    const programStr = `
      class Test {
        public static void main(String[] args) {}
      }
      class AnotherTest {
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
      "NormalClassDeclaration", // class AnotherTest {...}
      "NormalClassDeclaration", // class Test {...}

      "Env", // from NormalClassDeclaration
      "MethodDeclaration", // static void main(String[] args) {...}
      "ConstructorDeclaration", // Test() {...}

      "Env", // from NormalClassDeclaration
      "MethodDeclaration", // static void main(String[] args) {...}
      "ConstructorDeclaration", // AnotherTest() {...}

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
      "Void", // Void
    ];
  
    expect(result).toEqual(undefined);
    expect((context.control as ControlStub).getTrace().map(i => getControlItemStr(i))).toEqual(expectedControlTrace);
    expect((context.stash as StashStub).getTrace().map(i => getStashItemStr(i))).toEqual(expectedStashTrace);
    // TODO test env
  });
});
