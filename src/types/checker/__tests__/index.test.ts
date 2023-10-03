import { parse } from "../../../ast/parser";
import { Result } from "../index";
import { Type } from "../../types";
// import { BadOperandTypesError } from "../../errors";

const createProgram = (statement: string) => `
  public class Main {
    public static void main(String args[]) {
      int test = ${statement};
    }
  }
`;

const testcases: { input: string; result: Result }[] = [
  // {
  //   input: "1 + 1",
  //   result: { currentType: Type.Integer, errors: [] },
  // },
  // {
  //   input: '1 + "A"',
  //   result: { currentType: Type.String, errors: [] },
  // },
  // {
  //   input: '"A" + 1',
  //   result: { currentType: Type.String, errors: [] },
  // },
  // {
  //   input: '"A" + "A"',
  //   result: { currentType: Type.String, errors: [] },
  // },
  // {
  //   input: "1 - 1",
  //   result: { currentType: Type.Integer, errors: [] },
  // },
  // {
  //   input: '1 - "A"',
  //   result: { currentType: Type.String, errors: [] },
  // },
  {
    input: '"A" - 1',
    result: { currentType: Type.String, errors: [] },
  },
  // {
  //   input: '"A" - "A"',
  //   result: { currentType: Type.String, errors: [] },
  // },
  // {
  //   input: "1 * 1",
  //   result: { currentType: Type.Integer, errors: [] },
  // },
  // {
  //   input: '1 * "A"',
  //   result: { currentType: null, errors: [new BadOperandTypesError()] },
  // },
  // {
  //   input: '"A" * 1',
  //   result: { currentType: null, errors: [new BadOperandTypesError()] },
  // },
  // {
  //   input: '"A" * "A"',
  //   result: { currentType: null, errors: [new BadOperandTypesError()] },
  // },
  // {
  //   input: "1 / 1",
  //   result: { currentType: Type.Integer, errors: [] },
  // },
  // {
  //   input: '1 / "A"',
  //   result: { currentType: null, errors: [new BadOperandTypesError()] },
  // },
  // {
  //   input: '"A" / 1',
  //   result: { currentType: null, errors: [new BadOperandTypesError()] },
  // },
  // {
  //   input: '"A" / "A"',
  //   result: { currentType: null, errors: [new BadOperandTypesError()] },
  // },
  // {
  //   input: "(1 + 1) + 1",
  //   result: { currentType: Type.Integer, errors: [] },
  // },
  // {
  //   input: "1 + (1 + 1)",
  //   result: { currentType: Type.Integer, errors: [] },
  // },
  // {
  //   input: '(1 + "A") + 1',
  //   result: { currentType: null, errors: [new BadOperandTypesError()] },
  // },
  // {
  //   input: '1 + (1 + "A")',
  //   result: { currentType: null, errors: [new BadOperandTypesError()] },
  // },
];

describe("Type Checker", () => {
  testcases.map((testcase) => {
    test(`Checking expression ${testcase.input}`, () => {
      const program = createProgram(testcase.input);
      const ast = parse(program);

      const mainMethodBody =
        ast?.topLevelClassOrInterfaceDeclarations[0].classBody[0].methodBody[0];

      const test = mainMethodBody?.variableDeclarationList.variableInitializer;

      console.log(test);

      // const mainMethodBlockStatements =
      //   // @ts-ignore
      //   cst.children.ordinaryCompilationUnit[0].children.typeDeclaration[0]
      //     .children.classDeclaration[0].children.normalClassDeclaration[0]
      //     .children.classBody[0].children.classBodyDeclaration[0].children
      //     .classMemberDeclaration[0].children.methodDeclaration[0].children
      //     .methodBody[0].children.block[0].children
      //     .blockStatements[0] as CstNode;

      // const declaration =
      //   // @ts-ignore
      //   mainMethodBlockStatements.children.blockStatement[0].children
      //     .localVariableDeclarationStatement[0].children
      //     .localVariableDeclaration[0] as CstNode;

      // const expressionNode =
      //   // @ts-ignore
      //   declaration.children.variableDeclaratorList[0].children
      //     .variableDeclarator[0].children.variableInitializer[0].children
      //     .expression[0] as CstNode;

      // const expression =
      //   // @ts-ignore
      //   expressionNode.children.ternaryExpression[0].children
      //     .binaryExpression[0] as CstNode;

      // const result = check(expression);
      // expect(result.currentType).toBe(testcase.result.currentType);
      // expect(result.errors.length).toBe(testcase.result.errors.length);
    });
  });
});
