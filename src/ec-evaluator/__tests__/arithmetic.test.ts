import { evaluate } from "../interpreter";
import { parse } from "../../ast/parser"
import {
  ControlStub,
  StashStub,
  createContextStub,
  getControlItemStr,
  getStashItemStr
} from "./utils";

it("evaluate LocalVariableDeclarationStatement to a basic arithmetic operation correctly", () => {
  const programStr = `
    public class Test {
      public static void main(String[] args) {
        int y = 10 % 2;
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
    "ResOverride",
    "ResOverload", // main
    "ResType", // [""]
    "ResType", // Test

    "Env", // from Invocation
    "Marker",
    "Block", // {...}

    "Env", // from Block
    "ReturnStatement", // return;
    "LocalVariableDeclarationStatement", // int y = 10 % 2;

    "ExpressionStatement", // y = 10 % 2;
    "LocalVariableDeclarationStatement", // int y;

    "Pop",
    "Assignment", // y = 10 % 2

    "Assign", // =
    "BinaryExpression", // 10 % 2
    "EvalVariable", // y

    "BinaryOperation", // %
    "Literal", // 2
    "Literal", // 10

    "Reset", // return
    "Void",

    "Reset", // skip Env from Invocation
  ];
  const expectedStashTrace = [
    "Test", // ResType
    "String[]", // ResType
    "main", // ResOverload
    "main", // ResOverride
    `[""]`, // Literal
    "y", // EvalVariable
    "10", // Literal
    "2", // Literal
    "0", // BinaryOperation %
    "0", // Assign
    "Void", // Void
  ];
  
  expect(result).toEqual(undefined);
  expect((context.control as ControlStub).getTrace().map(i => getControlItemStr(i))).toEqual(expectedControlTrace);
  expect((context.stash as StashStub).getTrace().map(i => getStashItemStr(i))).toEqual(expectedStashTrace);
  // TODO test env
});

it("evaluate LocalVariableDeclarationStatement to a complex arithmetic operation correctly", () => {
  const programStr = `
    public class Test {
      public static void main(String[] args) {
        int z = 1 + (2 * 3) - 4;
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
    "ResOverride",
    "ResOverload", // main
    "ResType", // [""]
    "ResType", // Test

    "Env", // from Invocation
    "Marker",
    "Block", // {...}

    "Env", // from Block
    "ReturnStatement", // return;
    "LocalVariableDeclarationStatement", // int z = 1 + (2 * 3) - 4;

    "ExpressionStatement", // z = 1 + (2 * 3) - 4;
    "LocalVariableDeclarationStatement", // int z;

    "Pop",
    "Assignment", // z = 1 + (2 * 3) - 4

    "Assign", // =
    "BinaryExpression", // 1 + (2 * 3) - 4
    "EvalVariable", // z

    "BinaryOperation", // +
    "Literal", // 1
    "BinaryExpression", // (2 * 3) - 4

    "BinaryOperation", // -
    "BinaryExpression", // 2 * 3
    "Literal", // 4

    "BinaryOperation", // *
    "Literal", // 2
    "Literal", // 3

    "Reset", // return
    "Void",

    "Reset", // skip Env from Invocation
  ];
  const expectedStashTrace = [
    "Test", // ResType
    "String[]", // ResType
    "main", // ResOverload
    "main", // ResOverride
    `[""]`, // Literal
    "z", // EvalVariable
    "1", // Literal
    "2", // Literal
    "3", // Literal
    "6", // BinaryOperation *
    "7", // BinaryOperation +
    "4", // Literal
    "3", // BinaryOperation -
    "3", // Assign
    "Void", // Void
  ];

  expect(result).toEqual(undefined);
  expect((context.control as ControlStub).getTrace().map(i => getControlItemStr(i))).toEqual(expectedControlTrace);
  expect((context.stash as StashStub).getTrace().map(i => getStashItemStr(i))).toEqual(expectedStashTrace);
  // TODO test env
});

it("evaluate FieldDeclaration to a basic arithmetic expression without brackets to enforce precedence correctly", () => {
  const programStr = `
    public class Test {
      static int x = 1 + 2 * 3;
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
    "MethodDeclaration", // public static void main(String[] args) {}
    "ConstructorDeclaration", // Test() {...}
    "FieldDeclaration", // static int x = 1 + 2 * 3;

    "Pop",
    "Assign", // =
    "BinaryExpression", // 1 + 2 * 3
    "EvalVariable", // x

    "BinaryOperation", // +
    "BinaryExpression",  // 2 * 3
    "Literal", // 1

    "BinaryOperation", // *
    "Literal", // 3
    "Literal", // 2

    "Pop",
    "MethodInvocation", // Test.main([""])

    "Invocation", // ()
    "Literal", // [""]
    "ResOverride",
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
    "2", // Literal
    "3", // Literal
    "6", // BinaryOperation *
    "7", // BinaryOperation +
    "7", // Assign
    "Test", // ResType
    "String[]", // ResType
    "main", // ResOverload
    "main", // ResOverride
    `[""]`, // Literal
    "Void", // Void
  ];

  expect(result).toEqual(undefined);
  expect((context.control as ControlStub).getTrace().map(i => getControlItemStr(i))).toEqual(expectedControlTrace);
  expect((context.stash as StashStub).getTrace().map(i => getStashItemStr(i))).toEqual(expectedStashTrace);
  // TODO test env
});

it("evaluate FieldDeclaration to a complex arithmetic expression without brackets to enforce precedence correctly", () => {
  const programStr = `
    public class Test {
      static int x = 2 / 1 - 3 * (5 % 4) + 6;
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
    "MethodDeclaration", // public static void main(String[] args) {}
    "ConstructorDeclaration", // Test() {...}
    "FieldDeclaration", // static int x = 2 / 1 - 3 * (5 % 4) + 6;

    "Pop",
    "Assign", // =
    "BinaryExpression", // 2 / 1 - 3 * (5 % 4) + 6
    "EvalVariable", // x
    
    "BinaryOperation", // +
    "Literal", // 6
    "BinaryExpression", // 2 / 1 - 3 * (5 % 4)

    "BinaryOperation", // -
    "BinaryExpression", // 3 * (5 % 4)
    "BinaryExpression", // 2 / 1

    "BinaryOperation", // /
    "Literal", // 1
    "Literal", // 2

    "BinaryOperation", // *
    "BinaryExpression", // 5 % 4
    "Literal", // 3

    "BinaryOperation", // %
    "Literal", // 4
    "Literal", // 5

    "Pop",
    "MethodInvocation", // Test.main([""])

    "Invocation", // ()
    "Literal", // [""]
    "ResOverride",
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
    "2", // Literal
    "1", // Literal
    "2", // BinaryOperation /
    "3", // Literal
    "5", // Literal
    "4", // Literal
    "1", // BinaryOperation % 
    "3", // BinaryOperation +
    "-1", // BinaryOperation -
    "6", // Literal
    "5", // BinaryOperation +
    "5", // Assign
    "Test", // ResType
    "String[]", // ResType
    "main", // ResOverload
    "main", // ResOverride
    `[""]`, // Literal
    "Void", // Void
  ];

  expect(result).toEqual(undefined);
  expect((context.control as ControlStub).getTrace().map(i => getControlItemStr(i))).toEqual(expectedControlTrace);
  expect((context.stash as StashStub).getTrace().map(i => getStashItemStr(i))).toEqual(expectedStashTrace);
  // TODO test env
});
