import { parse } from "../../ast/parser";
import { evaluate } from "../interpreter";
import { Value } from "../types";
import { DECLARED_BUT_NOT_YET_ASSIGNED, isNode } from "../utils";
import { ControlStub, EnvironmentStub, StashStub, createContextStub } from "./utils";

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
  ];
  const expectedStashTrace: Value[] = [];
  const expectedEnv = new Map([
    ["x", [
      DECLARED_BUT_NOT_YET_ASSIGNED,
    ]],
  ]);

  expect(result).toEqual(undefined);
  expect((context.control as ControlStub).getTrace().map(i => isNode(i) ? i.kind : i.instrType)).toEqual(expectedControlTrace);
  expect((context.stash as StashStub).getTrace().map(i => i.literalType.value)).toEqual(expectedStashTrace);
  expect((context.environment as EnvironmentStub).getTrace()).toEqual(expectedEnv);
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
    "Assignment",
    "LocalVariableDeclarationStatement",
    "Pop",
    "Assign",
    "Literal",
  ];
  const expectedStashTrace = ["1"];
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
  ]);

  expect(result).toEqual(undefined);
  expect((context.control as ControlStub).getTrace().map(i => isNode(i) ? i.kind : i.instrType)).toEqual(expectedControlTrace);
  expect((context.stash as StashStub).getTrace().map(i => i.literalType.value)).toEqual(expectedStashTrace);
  expect((context.environment as EnvironmentStub).getTrace()).toEqual(expectedEnv);
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
    "Assignment",
    "LocalVariableDeclarationStatement",
    "Pop",
    "Assign",
    "Literal",
  ];
  const expectedStashTrace = ["1"];
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
  ]);

  expect(result).toEqual(undefined);
  expect((context.control as ControlStub).getTrace().map(i => isNode(i) ? i.kind : i.instrType)).toEqual(expectedControlTrace);
  expect((context.stash as StashStub).getTrace().map(i => i.literalType.value)).toEqual(expectedStashTrace);
  expect((context.environment as EnvironmentStub).getTrace()).toEqual(expectedEnv);
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
    "ExpressionName",
  ];
  const expectedStashTrace = ["1", "1"];
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
          value: "1",
        },
      },
    ]],
  ]);

  expect(result).toEqual(undefined);
  expect((context.control as ControlStub).getTrace().map(i => isNode(i) ? i.kind : i.instrType)).toEqual(expectedControlTrace);
  expect((context.stash as StashStub).getTrace().map(i => i.literalType.value)).toEqual(expectedStashTrace);
  expect((context.environment as EnvironmentStub).getTrace()).toEqual(expectedEnv);
});
