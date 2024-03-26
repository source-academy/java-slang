import { parse } from "../parser";
import { AST } from "../types/packages-and-modules";

describe("extract ExpressionStatement correctly", () => {
  describe("extract Assignment correctly", () => {
    it("extract Assignment LeftHandSide simple ExpressionName correctly", () => {
      const programStr = `
        class Test {
          void test() {
            x = 1;
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
                      kind: "ExpressionStatement",
                      stmtExp: {
                        kind: "Assignment",
                        left: {
                          kind: "ExpressionName",
                          name: "x",
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

    it("extract Assignment LeftHandSide qualified ExpressionName correctly", () => {
      const programStr = `
        class Test {
          void test() {
            Test.x = 1;
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
                      kind: "ExpressionStatement",
                      stmtExp: {
                        kind: "Assignment",
                        left: {
                          kind: "ExpressionName",
                          name: "Test.x",
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

    it("extract Assignment LeftHandSide this keyword correctly", () => {
      const programStr = `
        class Test {
          void test() {
            this.x = 1;
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
                      kind: "ExpressionStatement",
                      stmtExp: {
                        kind: "Assignment",
                        left: {
                          kind: "ExpressionName",
                          name: "this.x",
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

    it("extract Assignment Expression simple ExpressionName correctly", () => {
      const programStr = `
        class Test {
          void test() {
            x = y;
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
                      kind: "ExpressionStatement",
                      stmtExp: {
                        kind: "Assignment",
                        left: {
                          kind: "ExpressionName",
                          name: "x",
                          location: expect.anything(),
                        },
                        operator: "=",
                        right: {
                          kind: "ExpressionName",
                          name: "y",
                          location: expect.anything(),
                        },
                        location: expect.anything(),
                      },
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

    it("extract Assignment Expression qualified ExpressionName correctly", () => {
      const programStr = `
        class Test {
          void test() {
            x = Test.y;
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
                      kind: "ExpressionStatement",
                      stmtExp: {
                        kind: "Assignment",
                        left: {
                          kind: "ExpressionName",
                          name: "x",
                          location: expect.anything(),
                        },
                        operator: "=",
                        right: {
                          kind: "ExpressionName",
                          name: "Test.y",
                          location: expect.anything(),
                        },
                        location: expect.anything(),
                      },
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

    it("extract Assignment Expression this keyword correctly", () => {
      const programStr = `
        class Test {
          void test() {
            x = this.y;
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
                      kind: "ExpressionStatement",
                      stmtExp: {
                        kind: "Assignment",
                        left: {
                          kind: "ExpressionName",
                          name: "x",
                          location: expect.anything(),
                        },
                        operator: "=",
                        right: {
                          kind: "ExpressionName",
                          name: "this.y",
                          location: expect.anything(),
                        },
                        location: expect.anything(),
                      },
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

  describe("extract MethodInvocation correctly", () => {
    it("extract MethodInvocation simple MethodName correctly", () => {
      const programStr = `
        class Test {
          void test() {
            test();
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
                      kind: "ExpressionStatement",
                      stmtExp: {
                        kind: "MethodInvocation",
                        identifier: "test",
                        argumentList: [],
                        location: expect.anything(),
                      },
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

    it("extract MethodInvocation qualified MethodName correctly", () => {
      const programStr = `
        class Test {
          void test() {
            Test.test();
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
                      kind: "ExpressionStatement",
                      stmtExp: {
                        kind: "MethodInvocation",
                        identifier: "Test.test",
                        argumentList: [],
                        location: expect.anything(),
                      },
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

    it("extract MethodInvocation this keyword correctly", () => {
      const programStr = `
        class Test {
          void test() {
            this.test();
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
                      kind: "ExpressionStatement",
                      stmtExp: {
                        kind: "MethodInvocation",
                        identifier: "this.test",
                        argumentList: [],
                        location: expect.anything(),
                      },
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

    it("extract MethodInvocation qualified MethodName with args correctly", () => {
      const programStr = `
        class Test {
          void test() {
            Test.test(1);
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
                      kind: "ExpressionStatement",
                      stmtExp: {
                        kind: "MethodInvocation",
                        identifier: "Test.test",
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

    it("extract MethodInvocation this keyword with args correctly", () => {
      const programStr = `
        class Test {
          void test() {
            this.test(1, z);
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
                      kind: "ExpressionStatement",
                      stmtExp: {
                        kind: "MethodInvocation",
                        identifier: "this.test",
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
                            kind: "ExpressionName",
                            name: "z",
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
});

describe("extract ReturnStatement correctly", () => {
  it("extract ReturnStatement without Expression correctly", () => {
    const programStr = `
      class Test {
        void test() {
          return;
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
                    kind: "ReturnStatement",
                    exp: {
                      kind: "Void",
                      location: expect.anything(),
                    },
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

  it("extract ReturnStatement with Expression correctly", () => {
    const programStr = `
      class Test {
        int test() {
          return 1;
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
                result: "int",
                identifier: "test",
                formalParameterList: [],
              },
              methodBody: {
                kind: "Block",
                blockStatements: [
                  {
                    kind: "ReturnStatement",
                    exp: {
                      kind: "Literal",
                      literalType: {
                        kind: "DecimalIntegerLiteral",
                        value: "1",
                      },
                      location: expect.anything(),
                    },
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
