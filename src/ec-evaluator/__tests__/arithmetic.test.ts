import { evaluate } from "../interpreter";
import { parse } from "../../ast/parser"
import { DECLARED_BUT_NOT_YET_ASSIGNED, isNode } from "../utils";
import { ControlStub, EnvironmentStub, StashStub, createContextStub } from "./utils";

it("evaluate local variable declaration to a basic arithmetic operation correctly", () => {
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

  const expectedAgendaTrace = [
    "CompilationUnit",
    "Assignment",
    "LocalVariableDeclarationStatement",
    "Pop",
    "Assign",
    "BinaryExpression",
    "BinaryOperation",
    "Literal",
    "Literal"
  ];
  const expectedStashTrace = ["10", "2", "0"];
  const expectedEnv = new Map([
    ["y", [
      DECLARED_BUT_NOT_YET_ASSIGNED,
      {
        kind: "Literal",
        literalType: {
          kind: "DecimalIntegerLiteral",
          value: "0",
        },
      },
    ]]
  ]);

  expect(result).toEqual(undefined);
  expect((context.control as ControlStub).getTrace().map(i => isNode(i) ? i.kind : i.instrType)).toEqual(expectedAgendaTrace);
  expect((context.stash as StashStub).getTrace().map(i => i.literalType.value)).toEqual(expectedStashTrace);
  expect((context.environment as EnvironmentStub).getTrace()).toEqual(expectedEnv);
});

it("evaluate local variable declaration to a complex arithmetic operation correctly", () => {
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

  const expectedAgendaTrace = [
    "CompilationUnit",
    "Assignment",
    "LocalVariableDeclarationStatement",
    "Pop",
    "Assign",
    "BinaryExpression",
    "BinaryOperation",
    "Literal",
    "BinaryExpression",
    "BinaryOperation",
    "BinaryExpression",
    "Literal",
    "BinaryOperation",
    "Literal",
    "Literal"
  ];
  const expectedStashTrace = ["1", "2", "3", "6", "7", "4", "3"];
  const expectedEnv = new Map([
    ["z", [
      DECLARED_BUT_NOT_YET_ASSIGNED,
      {
        kind: "Literal",
        literalType: {
          kind: "DecimalIntegerLiteral",
          value: "3",
        }
      },
    ]],
  ]);

  expect(result).toEqual(undefined);
  expect((context.control as ControlStub).getTrace().map(i => isNode(i) ? i.kind : i.instrType)).toEqual(expectedAgendaTrace);
  expect((context.stash as StashStub).getTrace().map(i => i.literalType.value)).toEqual(expectedStashTrace);
  expect((context.environment as EnvironmentStub).getTrace()).toEqual(expectedEnv);
});

it("evaluate multiple local variable declarations correctly", () => {
  const programStr = `
    public class Test {
      public static void main(String[] args) {
        int x = 1;
        int y = 10 % 2;
      }
    }
    `;

  const compilationUnit = parse(programStr);
  expect(compilationUnit).toBeTruthy();

  const context = createContextStub();
  context.control.push(compilationUnit!);

  const result = evaluate(context);

  const expectedAgendaTrace = [
    "CompilationUnit",
    "LocalVariableDeclarationStatement",
    "LocalVariableDeclarationStatement",
    "Assignment",
    "LocalVariableDeclarationStatement",
    "Pop",
    "Assign",
    "Literal",
    "Assignment",
    "LocalVariableDeclarationStatement",
    "Pop",
    "Assign",
    "BinaryExpression",
    "BinaryOperation",
    "Literal",
    "Literal"
  ];
  const expectedStashTrace = ["1", "10", "2", "0"];
  const expectedEnv = new Map([
    ["x", [
      DECLARED_BUT_NOT_YET_ASSIGNED,
      {
        kind: "Literal",
        literalType: {
          kind: "DecimalIntegerLiteral",
          value: "1",
        },
      },
    ]],
    ["y", [
      DECLARED_BUT_NOT_YET_ASSIGNED,
      {
        kind: "Literal",
        literalType: {
          kind: "DecimalIntegerLiteral",
          value: "0",
        },
      },
    ]],
  ]);

  expect(result).toEqual(undefined);
  expect((context.control as ControlStub).getTrace().map(i => isNode(i) ? i.kind : i.instrType)).toEqual(expectedAgendaTrace);
  expect((context.stash as StashStub).getTrace().map(i => i.literalType.value)).toEqual(expectedStashTrace);
  expect((context.environment as EnvironmentStub).getTrace()).toEqual(expectedEnv);
});

it("evaluate local variable declaration to a basic arithmetic expression without brackets to enforce precedence correctly", () => {
  const programStr = `
    public class Test {
      public static void main(String[] args) {
        int x = 1 + 2 * 3;
      }
    }
    `;

  const compilationUnit = parse(programStr);
  expect(compilationUnit).toBeTruthy();

  const context = createContextStub();
  context.control.push(compilationUnit!);

  const result = evaluate(context);

  const expectedAgendaTrace = [
    "CompilationUnit",
    "Assignment",
    "LocalVariableDeclarationStatement",
    "Pop",
    "Assign",
    "BinaryExpression", // 1 + 2 * 3
    "BinaryOperation", // +
    "BinaryExpression",  // 2 * 3
    "Literal", // 1
    "BinaryOperation", // *
    "Literal", // 3
    "Literal" // 2
  ];
  const expectedStashTrace = ["1", "2", "3", "6", "7"];
  const expectedEnv = new Map([
    ["x", [
      DECLARED_BUT_NOT_YET_ASSIGNED,
      {
        kind: "Literal",
        literalType: {
          kind: "DecimalIntegerLiteral",
          value: "7",
        },
      },
    ]],
  ]);

  expect(result).toEqual(undefined);
  expect((context.control as ControlStub).getTrace().map(i => isNode(i) ? i.kind : i.instrType)).toEqual(expectedAgendaTrace);
  expect((context.stash as StashStub).getTrace().map(i => i.literalType.value)).toEqual(expectedStashTrace);
  expect((context.environment as EnvironmentStub).getTrace()).toEqual(expectedEnv);
});

it("evaluate local variable declaration to a complex arithmetic expression without brackets to enforce precedence correctly", () => {
  const programStr = `
    public class Test {
      public static void main(String[] args) {
        int x = 2 / 1 - 3 * (5 % 4) + 6;
      }
    }
    `;

  const compilationUnit = parse(programStr);
  expect(compilationUnit).toBeTruthy();

  const context = createContextStub();
  context.control.push(compilationUnit!);

  const result = evaluate(context);

  const expectedAgendaTrace = [
    "CompilationUnit",
    "Assignment",
    "LocalVariableDeclarationStatement",
    "Pop",
    "Assign",
    "BinaryExpression", // 2 / 1 - 3 * (5 % 4) + 6
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
    "BinaryExpression", // (5 % 4)
    "Literal", // 3
    "BinaryOperation", // %
    "Literal", // 4
    "Literal" // 5
  ];
  const expectedStashTrace = ["2", "1", "2", "3", "5", "4", "1", "3", "-1", "6", "5"];
  const expectedEnv = new Map([
    ["x", [
      DECLARED_BUT_NOT_YET_ASSIGNED,
      {
        kind: "Literal",
        literalType: {
          kind: "DecimalIntegerLiteral",
          value: "5",
        },
      },
    ]],
  ]);

  expect(result).toEqual(undefined);
  expect((context.control as ControlStub).getTrace().map(i => isNode(i) ? i.kind : i.instrType)).toEqual(expectedAgendaTrace);
  expect((context.stash as StashStub).getTrace().map(i => i.literalType.value)).toEqual(expectedStashTrace);
  expect((context.environment as EnvironmentStub).getTrace()).toEqual(expectedEnv);
});
