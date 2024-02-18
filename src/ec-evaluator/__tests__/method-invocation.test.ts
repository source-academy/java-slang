import { parse } from "../../ast/parser";
import { evaluate } from "../interpreter";
import {
  ControlStub,
  StashStub,
  createContextStub,
  getControlItemStr,
  getStashItemStr
} from "./utils";

it("evaluate MethodInvocation without return value correctly", () => {
  const programStr = `
    public class Test {
      public static void main(String[] args) {
        test();
      }
      public static void test() {}
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
    "MethodDeclaration", // public static void test() {...}

    "Pop",
    "MethodInvocation", // main()

    "Invocation", // ()
    "MethodName", // main

    "Env", // from Invocation
    "Marker",
    "Block", // {...}

    "Env", // from Block
    "ReturnStatement", // return;
    "ExpressionStatement", // test();

    "Pop",
    "MethodInvocation", // test()

    "Invocation", // ()
    "MethodName", // test

    "Env", // from Invocation
    "Marker",
    "Block", // {...}

    "Env", // from Block
    "ReturnStatement", // return;

    "Reset", // return
    "Void", //

    "Reset", // skip Env from Block

    "Reset", // return
    "Void",

    "Reset", // skip Env from Block
  ];
  const expectedStashTrace = [
    "main", // MethodName
    "test", // MethodName
    "Void",
    "Void",
  ];

  expect(result).toEqual(undefined);
  expect((context.control as ControlStub).getTrace().map(i => getControlItemStr(i))).toEqual(expectedControlTrace);
  expect((context.stash as StashStub).getTrace().map(i => getStashItemStr(i))).toEqual(expectedStashTrace);
  // TODO test env
});

it("evaluate MethodInvocation with return value correctly", () => {
  const programStr = `
    public class Test {
      public static void main(String[] args) {
        test();
      }
      public static int test() {
        return 1;
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
    "MethodDeclaration", // public static int test() {...}

    "Pop",
    "MethodInvocation", // main()

    "Invocation", // ()
    "MethodName", // main

    "Env", // from Invocation
    "Marker",
    "Block", // {...}

    "Env", // from Block
    "ReturnStatement", // return;
    "ExpressionStatement", // test();

    "Pop",
    "MethodInvocation", // test()

    "Invocation", // ()
    "MethodName", // test

    "Env", // from Invocation
    "Marker",
    "Block", // {...}

    "Env", // from Block
    "ReturnStatement", // return 1;

    "Reset", // return
    "Literal", // 1

    "Reset", // skip Env from Block

    "Reset", // return
    "Void",

    "Reset", // skip Env from Block
  ];
  const expectedStashTrace = [
    "main", // MethodName
    "test", // MethodName
    "1", // Literal
    "Void",
  ];

  expect(result).toEqual(undefined);
  expect((context.control as ControlStub).getTrace().map(i => getControlItemStr(i))).toEqual(expectedControlTrace);
  expect((context.stash as StashStub).getTrace().map(i => getStashItemStr(i))).toEqual(expectedStashTrace);
  // TODO test env
});
