import { parse } from "../../ast/parser";
import { evaluate } from "../interpreter";
import {
  ControlStub,
  StashStub,
  createContextStub,
  getControlItemStr,
  getStashItemStr
} from "./utils";

it("evaluate LocalVariableDeclarationStatement without variableInitializer correctly", () => {
  const programStr = `
    public class Test {
      public static void main(String[] args) {
        int x;
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
    "NormalClassDeclaration", // class Object {...}
    
    "Env", // from NormalClassDeclaration
    "ConstructorDeclaration", // Object() {...}

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
    "LocalVariableDeclarationStatement", // int x;

    "Reset", // return
    "Void",

    "Reset", // skip Env from Invocation
  ];
  const expectedStashTrace = [
    "Test", // ResType
    "String[]", // ResType
    "main", // ResOverload
    "Test", // EvalVariable
    "Test", // Deref
    "main", // ResOverride
    `[""]`, // Literal
    "Void", // Void
  ];

  expect(result).toEqual(undefined);
  expect((context.control as ControlStub).getTrace().map(i => getControlItemStr(i))).toEqual(expectedControlTrace);
  expect((context.stash as StashStub).getTrace().map(i => getStashItemStr(i))).toEqual(expectedStashTrace);
  // TODO test env
});

it("evaluate LocalVariableDeclarationStatement with variableInitializer correctly", () => {
  const programStr = `
    public class Test {
      public static void main(String[] args) {
        int x = 1;
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
    "NormalClassDeclaration", // class Object {...}
    
    "Env", // from NormalClassDeclaration
    "ConstructorDeclaration", // Object() {...}

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
    "LocalVariableDeclarationStatement", // int x = 1;

    "ExpressionStatement", // x = 1;
    "LocalVariableDeclarationStatement", // int x;

    "Pop",
    "Assignment", // x = 1

    "Assign", // =
    "Literal", // 1
    "EvalVariable", // x

    "Reset", // return
    "Void",

    "Reset", // skip Env from Invocation
  ];
  const expectedStashTrace = [
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
    "Void", // Void
  ];

  expect(result).toEqual(undefined);
  expect((context.control as ControlStub).getTrace().map(i => getControlItemStr(i))).toEqual(expectedControlTrace);
  expect((context.stash as StashStub).getTrace().map(i => getStashItemStr(i))).toEqual(expectedStashTrace);
  // TODO test env
});

it("evaluate Assignment correctly", () => {
  const programStr = `
    public class Test {
      public static void main(String[] args) {
        int x;
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
    "NormalClassDeclaration", // public class Test {...}
    "NormalClassDeclaration", // class Object {...}
    
    "Env", // from NormalClassDeclaration
    "ConstructorDeclaration", // Object() {...}
    
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
    "ExpressionStatement", // x = 1;
    "LocalVariableDeclarationStatement", // int x;

    "Pop",
    "Assignment", // x = 1

    "Assign", // =
    "Literal", // 1
    "EvalVariable", // x

    "Reset", // return
    "Void",

    "Reset", // skip Env from Invocation
  ];
  const expectedStashTrace = [
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
    "Void", // Void
  ];

  expect(result).toEqual(undefined);
  expect((context.control as ControlStub).getTrace().map(i => getControlItemStr(i))).toEqual(expectedControlTrace);
  expect((context.stash as StashStub).getTrace().map(i => getStashItemStr(i))).toEqual(expectedStashTrace);
  // TODO test env
});

it("evaluate LocalVariableDeclarationStatement with local variable as variableInitializer correctly", () => {
  const programStr = `
    public class Test {
      public static void main(String[] args) {
        int x = 1;
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
    "NormalClassDeclaration", // public class Test {...}
    "NormalClassDeclaration", // class Object {...}
    
    "Env", // from NormalClassDeclaration
    "ConstructorDeclaration", // Object() {...}
    
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
    "LocalVariableDeclarationStatement", // int y = x;
    "LocalVariableDeclarationStatement", // int x = 1;
    
    "ExpressionStatement", // x = 1;
    "LocalVariableDeclarationStatement", // int x;

    "Pop",
    "Assignment", // x = 1

    "Assign", // =
    "Literal", // 1
    "EvalVariable", // x

    "ExpressionStatement", // y = x;
    "LocalVariableDeclarationStatement", // int y;

    "Pop",
    "Assignment", // y = x

    "Assign", // =
    "ExpressionName", // x
    "EvalVariable", // y

    "Deref",
    "EvalVariable", // x

    "Reset", // return
    "Void",

    "Reset", // skip Env from Invocation
  ];
  const expectedStashTrace = [
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
    "y", // EvalVariable
    "x", // EvalVariable
    "1", // Deref
    "1", // Assign
    "Void", // Void
  ];

  expect(result).toEqual(undefined);
  expect((context.control as ControlStub).getTrace().map(i => getControlItemStr(i))).toEqual(expectedControlTrace);
  expect((context.stash as StashStub).getTrace().map(i => getStashItemStr(i))).toEqual(expectedStashTrace);
  // TODO test env
});
