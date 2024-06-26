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

  it("extract FieldDeclaration NullLiteral correctly", () => {
    const programStr = `
      class Test {
        Test x = null;
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
              fieldType: "Test",
              variableDeclaratorList: [
                {
                  kind: "VariableDeclarator",
                  variableDeclaratorId: "x",
                  variableInitializer: {
                    kind: "Literal",
                    literalType: {
                      kind: "NullLiteral",
                      value: "null",
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

describe("extract BinaryExpression correctly", () => {
  it("extract FieldDeclaration unparenthesized BinaryExpression correctly", () => {
    const programStr = `
      class Test {
        int x = 1 + 2 * 3;
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
                    kind: "BinaryExpression",
                    operator: "+",
                    left: {
                      kind: "Literal",
                      literalType: {
                        kind: "DecimalIntegerLiteral",
                        value: "1",
                      },
                      location: expect.anything(),
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
                        location: expect.anything(),
                      },
                      right: {
                        kind: "Literal",
                        literalType: {
                          kind: "DecimalIntegerLiteral",
                          value: "3",
                        },
                        location: expect.anything(),
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

  it("extract FieldDeclaration parenthesized BinaryExpression correctly", () => {
    const programStr = `
      class Test {
        int x = (1 + 2) * 3;
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
                    right: {
                      kind: "Literal",
                      literalType: {
                        kind: "DecimalIntegerLiteral",
                        value: "3",
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

describe("extract ExpressionName correctly", () => {
  it("extract LocalVariableDeclarationStatement VariableInitializer simple ExpressionName correctly", () => {
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
                          location: expect.anything(),
                        },
                      },
                    ],
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

  it("extract LocalVariableDeclarationStatement VariableInitializer qualified ExpressionName correctly", () => {
    const programStr = `
      class Test {
        static int x;
        void test() {
          int y = Test.x;
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
              kind: "FieldDeclaration",
              fieldModifier: [
                "static",
              ],
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
                          name: "Test.x",
                          location: expect.anything(),
                        },
                      },
                    ],
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

  it("extract LocalVariableDeclarationStatement VariableInitializer this keyword correctly", () => {
    const programStr = `
      class Test {
        static int x;
        void test() {
          int y = this.x;
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
              kind: "FieldDeclaration",
              fieldModifier: [
                "static",
              ],
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
                          name: "this.x",
                          location: expect.anything(),
                        },
                      },
                    ],
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

describe("extract Assignment correctly", () => {
  it("extract Assignment second LeftHandSide simple ExpressionName correctly", () => {
    const programStr = `
      class Test {
        int x = y = 1;
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
                    kind: "Assignment",
                    left: {
                      kind: "ExpressionName",
                      name: "y",
                      location: expect.anything(),
                    },
                    operator: "=",
                    right: {
                      kind: "Literal",
                      literalType: {
                        kind: "DecimalIntegerLiteral",
                        value: "1",
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

  it("extract Assignment second LeftHandSide qualified ExpressionName correctly", () => {
    const programStr = `
      class Test {
        int x = Test.y = 1;
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
                    kind: "Assignment",
                    left: {
                      kind: "ExpressionName",
                      name: "Test.y",
                      location: expect.anything(),
                    },
                    operator: "=",
                    right: {
                      kind: "Literal",
                      literalType: {
                        kind: "DecimalIntegerLiteral",
                        value: "1",
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

  it("extract Assignment second LeftHandSide this keyword correctly", () => {
    const programStr = `
      class Test {
        int x = this.y = 1;
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
                    kind: "Assignment",
                    left: {
                      kind: "ExpressionName",
                      name: "this.y",
                      location: expect.anything(),
                    },
                    operator: "=",
                    right: {
                      kind: "Literal",
                      literalType: {
                        kind: "DecimalIntegerLiteral",
                        value: "1",
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

describe("extract MethodInvocation correctly", () => {
  it("extract MethodInvocation simple MethodName correctly", () => {
    const programStr = `
      class Test {
        int x = test();
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
                    kind: "MethodInvocation",
                    identifier: "test",
                    argumentList: [],
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

  it("extract MethodInvocation qualified MethodName correctly", () => {
    const programStr = `
      class Test {
        int x = Test.test();
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
                    kind: "MethodInvocation",
                    identifier: "Test.test",
                    argumentList: [],
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

  it("extract MethodInvocation this keyword correctly", () => {
    const programStr = `
      class Test {
        int x = this.test();
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
                    kind: "MethodInvocation",
                    identifier: "this.test",
                    argumentList: [],
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

  it("extract MethodInvocation qualified MethodName with args correctly", () => {
    const programStr = `
      class Test {
        int x = test.test(y);
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
                    kind: "MethodInvocation",
                    identifier: "test.test",
                    argumentList: [
                      {
                        kind: "ExpressionName",
                        name: "y",
                        location: expect.anything(),
                      },
                    ],
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

  it("extract MethodInvocation this keyword with args correctly", () => {
    const programStr = `
      class Test {
        int x = this.test(y, 100);
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
                    kind: "MethodInvocation",
                    identifier: "this.test",
                    argumentList: [
                      {
                        kind: "ExpressionName",
                        name: "y",
                        location: expect.anything(),
                      },
                      {
                        kind: "Literal",
                        literalType: {
                          kind: "DecimalIntegerLiteral",
                          value: "100",
                        },
                        location: expect.anything(),
                      },
                    ],
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

describe("extract ClassInstanceCreationExpression correctly", () => {
  it("extract LocalVariableDeclarationStatement ClassInstanceCreationExpression without arguments correctly", () => {
    const programStr = `
      class Test {
        void test() {
          Test test = new Test();
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
                    localVariableType: "Test",
                    variableDeclaratorList: [
                      {
                        kind: "VariableDeclarator",
                        variableDeclaratorId: "test",
                        variableInitializer: {
                          kind: "ClassInstanceCreationExpression",
                          identifier: "Test",
                          argumentList: [],
                          location: expect.anything(),
                        },
                      },
                    ],
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

  it("extract LocalVariableDeclarationStatement ClassInstanceCreationExpression with arguments correctly", () => {
    const programStr = `
      class Test {
        void test() {
          Test test = new Test(1, 2);
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
                    localVariableType: "Test",
                    variableDeclaratorList: [
                      {
                        kind: "VariableDeclarator",
                        variableDeclaratorId: "test",
                        variableInitializer: {
                          kind: "ClassInstanceCreationExpression",
                          identifier: "Test",
                          argumentList: [
                            {
                              kind: "Literal",
                              literalType: {
                                kind: "DecimalIntegerLiteral",
                                value: "1",
                              },
                              location: expect.anything(),
                            },
                            {
                              kind: "Literal",
                              literalType: {
                                kind: "DecimalIntegerLiteral",
                                value: "2",
                              },
                              location: expect.anything(),
                            },
                          ],
                          location: expect.anything(),
                        },
                      },
                    ],
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
