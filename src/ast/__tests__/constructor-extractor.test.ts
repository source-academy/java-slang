import { parse } from "../parser";
import { AST } from "../types/packages-and-modules";

describe("extract ConstructorModifier correctly", () => {
  it("extract ConstructorDeclaration without ConstructorModifier correctly", () => {
    const programStr = `
      class Test {
        Test() {}
      }
    `;

    const expectedAst: AST = {
      kind: "CompilationUnit",
      topLevelClassOrInterfaceDeclarations: [
        {
          kind: "NormalClassDeclaration",
          classModifier: [],
          typeIdentifier: "Test",
          classBody: [
            {
              kind: "ConstructorDeclaration",
              constructorModifier: [],
              constructorDeclarator: {
                identifier: "Test",
                formalParameterList: [],
              },
              constructorBody: {
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

  it("extract ConstructorDeclaration with ConstructorModifier correctly", () => {
    const programStr = `
      class test {
        public test() {}
      }
    `;

    const expectedAst: AST = {
      kind: "CompilationUnit",
      topLevelClassOrInterfaceDeclarations: [
        {
          kind: "NormalClassDeclaration",
          classModifier: [],
          typeIdentifier: "test",
          classBody: [
            {
              kind: "ConstructorDeclaration",
              constructorModifier: [
                "public",
              ],
              constructorDeclarator: {
                identifier: "test",
                formalParameterList: [],
              },
              constructorBody: {
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

describe("extract FormalParameter correctly", () => {
  it("extract ConstructorDeclaration without FormalParameter correctly", () => {
    const programStr = `
      class test {
        test() {}
      }
    `;

    const expectedAst: AST = {
      kind: "CompilationUnit",
      topLevelClassOrInterfaceDeclarations: [
        {
          kind: "NormalClassDeclaration",
          classModifier: [],
          typeIdentifier: "test",
          classBody: [
            {
              kind: "ConstructorDeclaration",
              constructorModifier: [],
              constructorDeclarator: {
                identifier: "test",
                formalParameterList: [],
              },
              constructorBody: {
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

  it("extract ConstructorDeclaration with FormalParameter correctly", () => {
    const programStr = `
      class Test {
        Test(int x) {}
      }
    `;

    const expectedAst: AST = {
      kind: "CompilationUnit",
      topLevelClassOrInterfaceDeclarations: [
        {
          kind: "NormalClassDeclaration",
          classModifier: [],
          typeIdentifier: "Test",
          classBody: [
            {
              kind: "ConstructorDeclaration",
              constructorModifier: [],
              constructorDeclarator: {
                identifier: "Test",
                formalParameterList: [
                  {
                    kind: "FormalParameter",
                    unannType: "int",
                    identifier: "x",
                  },
                ],
              },
              constructorBody: {
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
