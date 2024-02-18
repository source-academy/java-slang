import { parse } from "../parser";
import { AST } from "../types/packages-and-modules";

describe("extract MethodModifier correctly", () => {
  it("extract MethodDeclaration without MethodModifier correctly", () => {
    const programStr = `
      class Test {
        void test() {}
      }
    `;

    const expectedAst: AST = {
      kind: "CompilationUnit",
      topLevelClassOrInterfaceDeclarations: [
        {
          classModifier: [],
          typeIdentifier: "Test",
          classBody: [
            {
              kind: "MethodDeclaration",
              methodModifier: [],
              methodHeader: {
                result: "void",
                identifier: "test",
                formalParameterList: [],
              },
              methodBody: {
                kind: "Block",
                blockStatements: [],
              },
            },
          ],
        },
      ],
    };

    const ast = parse(programStr);
    expect(ast).toEqual(expectedAst);
  });

  it("extract MethodDeclaration with MethodModifier correctly", () => {
    const programStr = `
      class Test {
        public static void test() {}
      }
    `;

    const expectedAst: AST = {
      kind: "CompilationUnit",
      topLevelClassOrInterfaceDeclarations: [
        {
          classModifier: [],
          typeIdentifier: "Test",
          classBody: [
            {
              kind: "MethodDeclaration",
              methodModifier: [
                "public",
                "static",
              ],
              methodHeader: {
                result: "void",
                identifier: "test",
                formalParameterList: [],
              },
              methodBody: {
                kind: "Block",
                blockStatements: [],
              },
            },
          ],
        },
      ],
    };

    const ast = parse(programStr);
    expect(ast).toEqual(expectedAst);
  });
});
