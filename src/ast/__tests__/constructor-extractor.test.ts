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
      importDeclarations: [],
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
                location: expect.anything(),
              },
              location: expect.anything(),
            },
          ],
          location: expect.anything(),
        },
      ],
      location: expect.anything(),
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
      importDeclarations: [],
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
                location: expect.anything(),
              },
              location: expect.anything(),
            },
          ],
          location: expect.anything(),
        },
      ],
      location: expect.anything(),
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
      importDeclarations: [],
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
                location: expect.anything(),
              },
              location: expect.anything(),
            },
          ],
          location: expect.anything(),
        },
      ],
      location: expect.anything(),
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
      importDeclarations: [],
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
                location: expect.anything(),
              },
              location: expect.anything(),
            },
          ],
          location: expect.anything(),
        },
      ],
      location: expect.anything(),
    };

    const ast = parse(programStr);
    expect(ast).toEqual(expectedAst);
  });
});

describe("extract ExplicitConstructorInvocation correctly", () => {
  it("extract this() correctly", () => {
    const programStr = `
      class Test {
        Test() {
          this(1);
        }
        Test(int x) {}
      }
    `;

    const expectedAst: AST = {
      kind: "CompilationUnit",
      importDeclarations: [],
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
                blockStatements: [
                  {
                    kind: "ExplicitConstructorInvocation",
                    thisOrSuper: "this",
                    argumentList: [
                      {
                        kind: "Literal",
                        literalType: {
                          kind: "DecimalIntegerLiteral",
                          value: "1",
                        },
                        location: expect.anything(),
                      },
                    ],
                    location: expect.anything(),
                  },
                ],
                location: expect.anything(),
              },
              location: expect.anything(),
            },
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
                location: expect.anything(),
              },
              location: expect.anything(),
            },
          ],
          location: expect.anything(),
        },
      ],
      location: expect.anything(),
    };

    const ast = parse(programStr);
    expect(ast).toEqual(expectedAst);
  });

  it("extract super() correctly", () => {
    const programStr = `
      class Test {
        Test() {
          super();
        }
      }
    `;

    const expectedAst: AST = {
      kind: "CompilationUnit",
      importDeclarations: [],
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
                blockStatements: [
                  {
                    kind: "ExplicitConstructorInvocation",
                    thisOrSuper: "super",
                    argumentList: [],
                    location: expect.anything(),
                  },
                ],
                location: expect.anything(),
              },
              location: expect.anything(),
            },
          ],
          location: expect.anything(),
        },
      ],
      location: expect.anything(),
    };

    const ast = parse(programStr);
    expect(ast).toEqual(expectedAst);
  });
});
