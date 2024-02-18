import { parse } from "../parser";
import { AST } from "../types/packages-and-modules";

describe("extract Literal correctly", () => {
  it("extract FieldDeclaration DecimalIntegerLiteral correctly", () => {
    const programStr = `
      class Test {
        int x = 1;
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
                  },
                },
              ],
            },
          ],
        },
      ],
    };
  
    const ast = parse(programStr);
    expect(ast).toEqual(expectedAst);
  });
});

describe("extract BinaryExpression correctly", () => {
  it("extract FieldDeclaration unparenthesized BinaryExpression correctly", () => {
    const programStr = `
      class Test {
        int x = 1 + 2 * 3;
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
              kind: "FieldDeclaration",
              fieldModifier: [],
              fieldType: "int",
              variableDeclaratorList: [
                {
                  kind: "VariableDeclarator",
                  variableDeclaratorId: "x",
                  variableInitializer: {
                    kind: "BinaryExpression",
                    operator: "+",
                    left: {
                      kind: "Literal",
                      literalType: {
                        kind: "DecimalIntegerLiteral",
                        value: "1",
                      },
                    },
                    right: {
                      kind: "BinaryExpression",
                      operator: "*",
                      left: {
                        kind: "Literal",
                        literalType: {
                          kind: "DecimalIntegerLiteral",
                          value: "2",
                        },
                      },
                      right: {
                        kind: "Literal",
                        literalType: {
                          kind: "DecimalIntegerLiteral",
                          value: "3",
                        },
                      },
                    },
                  },
                },
              ],
            },
          ],
        },
      ],
    };
  
    const ast = parse(programStr);
    expect(ast).toEqual(expectedAst);
  });

  it("extract FieldDeclaration parenthesized BinaryExpression correctly", () => {
    const programStr = `
      class Test {
        int x = (1 + 2) * 3;
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
              kind: "FieldDeclaration",
              fieldModifier: [],
              fieldType: "int",
              variableDeclaratorList: [
                {
                  kind: "VariableDeclarator",
                  variableDeclaratorId: "x",
                  variableInitializer: {
                    kind: "BinaryExpression",
                    operator: "*",
                    left: {
                      kind: "BinaryExpression",
                      operator: "+",
                      left: {
                        kind: "Literal",
                        literalType: {
                          kind: "DecimalIntegerLiteral",
                          value: "1",
                        },
                      },
                      right: {
                        kind: "Literal",
                        literalType: {
                          kind: "DecimalIntegerLiteral",
                          value: "2",
                        },
                      },
                    },
                    right: {
                      kind: "Literal",
                      literalType: {
                        kind: "DecimalIntegerLiteral",
                        value: "3",
                      },
                    },
                  },
                },
              ],
            },
          ],
        },
      ],
    };
  
    const ast = parse(programStr);
    expect(ast).toEqual(expectedAst);
  });
});

describe("extract ExpressionName correctly", () => {
  it("extract LocalVariableDeclarationStatement simple ExpressionName correctly", () => {
      const programStr = `
        class Test {
          int x;
          void test() {
            int y = x;
          }
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
                kind: "FieldDeclaration",
                fieldModifier: [],
                fieldType: "int",
                variableDeclaratorList: [
                  {
                    kind: "VariableDeclarator",
                    variableDeclaratorId: "x",
                  },
                ],
              },
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
                blockStatements: [
                  {
                    kind: "LocalVariableDeclarationStatement",
                    localVariableType: "int",
                    variableDeclaratorList: [
                      {
                        kind: "VariableDeclarator",
                        variableDeclaratorId: "y",
                        variableInitializer: {
                          kind: "ExpressionName",
                          name: "x",
                        },
                      },
                    ],
                  },
                ],
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
