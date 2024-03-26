import { parse } from "../parser";
import { AST } from "../types/packages-and-modules";

describe("extract FieldModifier correctly", () => {
  it("extract multiple FieldModifier correctly", () => {
    const programStr = `
      class Test {
        public static int x = 100;
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
              kind: "FieldDeclaration",
              fieldModifier: [
                "public",
                "static",
              ],
              fieldType: "int",
              variableDeclaratorList: [
                {
                  kind: "VariableDeclarator",
                  variableDeclaratorId: "x",
                  variableInitializer: {
                    kind: "Literal",
                    literalType: {
                      kind: "DecimalIntegerLiteral",
                      value: "100",
                    },
                    location: expect.anything(),
                  },
                },
              ],
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

describe("extract field type correctly", () => {
  it("extract IntegralType correctly", () => {
    const programStr = `
      private class Test {
        private byte x;
      }
    `;

    const expectedAst: AST = {
      kind: "CompilationUnit",
      importDeclarations: [],
      topLevelClassOrInterfaceDeclarations: [
        {
          kind: "NormalClassDeclaration",
          classModifier: [
            "private",
          ],
          typeIdentifier: "Test",
          classBody: [
            {
              kind: "FieldDeclaration",
              fieldModifier: [
                "private",
              ],
              fieldType: "byte",
              variableDeclaratorList: [
                {
                  kind: "VariableDeclarator",
                  variableDeclaratorId: "x",
                },
              ],
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

  it("extract reference type correctly", () => {
    const programStr = `
      class Test {
        protected Test test;
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
              kind: "FieldDeclaration",
              fieldModifier: [
                "protected",
              ],
              fieldType: "Test",
              variableDeclaratorList: [
                {
                  kind: "VariableDeclarator",
                  variableDeclaratorId: "test",
                },
              ],
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

describe("extract VariableInitializer correctly", () => {
  it("extract Literal VariableInitializer correctly", () => {
    const programStr = `
      class Test {
        int x = 1;
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
              kind: "FieldDeclaration",
              fieldModifier: [],
              fieldType: "int",
              variableDeclaratorList: [
                {
                  kind: "VariableDeclarator",
                  variableDeclaratorId: "x",
                  variableInitializer: {
                    kind: "Literal",
                    literalType: {
                      kind: "DecimalIntegerLiteral",
                      value: "1",
                    },
                    location: expect.anything(),
                  },
                },
              ],
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

  it("extract ExpressionName VariableInitializer correctly", () => {
    const programStr = `
      class Test {
        int x;
        int y = x;
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
              kind: "FieldDeclaration",
              fieldModifier: [],
              fieldType: "int",
              variableDeclaratorList: [
                {
                  kind: "VariableDeclarator",
                  variableDeclaratorId: "x",
                },
              ],
              location: expect.anything(),
            },
            {
              kind: "FieldDeclaration",
              fieldModifier: [],
              fieldType: "int",
              variableDeclaratorList: [
                {
                  kind: "VariableDeclarator",
                  variableDeclaratorId: "y",
                  variableInitializer: {
                    kind: "ExpressionName",
                    name: "x",
                    location: expect.anything(),
                  },
                },
              ],
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

  it("extract BinaryExpression VariableInitializer correctly", () => {
    const programStr = `
      class Test {
        static int x = 10 % 2;
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
              kind: "FieldDeclaration",
              fieldModifier: [
                "static",
              ],
              fieldType: "int",
              variableDeclaratorList: [
                {
                  kind: "VariableDeclarator",
                  variableDeclaratorId: "x",
                  variableInitializer: {
                    kind: "BinaryExpression",
                    operator: "%",
                    left: {
                      kind: "Literal",
                      literalType: {
                        kind: "DecimalIntegerLiteral",
                        value: "10",
                      },
                      location: expect.anything(),
                    },
                    right: {
                      kind: "Literal",
                      literalType: {
                        kind: "DecimalIntegerLiteral",
                        value: "2",
                      },
                      location: expect.anything(),
                    },
                    location: expect.anything(),
                  },
                },
              ],
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
