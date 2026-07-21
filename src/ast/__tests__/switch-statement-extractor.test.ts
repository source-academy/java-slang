import { parse } from "../parser";
import { AST } from "../types/packages-and-modules";

describe("extract SwitchStatement correctly", () => {
  it("extract SwitchStatement with case labels and statements correctly", () => {
    const programStr = `
      class Test {
        void test(int x) {
          switch (x) {
            case 1:
              System.out.println("One");
              break;
            case 2:
              System.out.println("Two");
              break;
            default:
              System.out.println("Default");
          }
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
                formalParameterList: [
                  {
                    kind: "FormalParameter",
                    unannType: "int",
                    identifier: "x",
                  },
                ],
              },
              methodBody: {
                kind: "Block",
                blockStatements: [
                  {
                    kind: "SwitchStatement",
                    expression: {
                      kind: "ExpressionName",
                      name: "x",
                      location: expect.anything(),
                    },
                    cases: [
                      {
                        kind: "SwitchCase",
                        labels: [
                          {
                            kind: "CaseLabel",
                            expression: {
                              kind: "Literal",
                              literalType: {
                                kind: "DecimalIntegerLiteral",
                                value: "1",
                              },
                            },
                          },
                        ],
                        statements: [
                          {
                            kind: "ExpressionStatement",
                            stmtExp: {
                              kind: "MethodInvocation",
                              identifier: "System.out.println",
                              argumentList: [
                                {
                                  kind: "Literal",
                                  literalType: {
                                    kind: "StringLiteral",
                                    value: '"One"',
                                  },
                                  location: expect.anything(),
                                },
                              ],
                              location: expect.anything(),
                            },
                            location: expect.anything(),
                          },
                          {
                            kind: "BreakStatement",
                          },
                        ],
                      },
                      {
                        kind: "SwitchCase",
                        labels: [
                          {
                            kind: "CaseLabel",
                            expression: {
                              kind: "Literal",
                              literalType: {
                                kind: "DecimalIntegerLiteral",
                                value: "2",
                              },
                            },
                          },
                        ],
                        statements: [
                          {
                            kind: "ExpressionStatement",
                            stmtExp: {
                              kind: "MethodInvocation",
                              identifier: "System.out.println",
                              argumentList: [
                                {
                                  kind: "Literal",
                                  literalType: {
                                    kind: "StringLiteral",
                                    value: '"Two"',
                                  },
                                  location: expect.anything(),
                                },
                              ],
                              location: expect.anything(),
                            },
                            location: expect.anything(),
                          },
                          {
                            kind: "BreakStatement",
                          },
                        ],
                      },
                      {
                        kind: "SwitchCase",
                        labels: [
                          {
                            kind: "DefaultLabel",
                          },
                        ],
                        statements: [
                          {
                            kind: "ExpressionStatement",
                            stmtExp: {
                              kind: "MethodInvocation",
                              identifier: "System.out.println",
                              argumentList: [
                                {
                                  kind: "Literal",
                                  literalType: {
                                    kind: "StringLiteral",
                                    value: '"Default"',
                                  },
                                  location: expect.anything(),
                                },
                              ],
                              location: expect.anything(),
                            },
                            location: expect.anything(),
                          },
                        ],
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

  it("extract SwitchStatement with fallthrough correctly", () => {
    const programStr = `
      class Test {
        void test(int x) {
          switch (x) {
            case 1:
            case 2:
              System.out.println("One or Two");
              break;
            default:
              System.out.println("Default");
          }
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
                formalParameterList: [
                  {
                    kind: "FormalParameter",
                    unannType: "int",
                    identifier: "x",
                  },
                ],
              },
              methodBody: {
                kind: "Block",
                blockStatements: [
                  {
                    kind: "SwitchStatement",
                    expression: {
                      kind: "ExpressionName",
                      name: "x",
                      location: expect.anything(),
                    },
                    cases: [
                      {
                        kind: "SwitchCase",
                        labels: [
                          {
                            kind: "CaseLabel",
                            expression: {
                              kind: "Literal",
                              literalType: {
                                kind: "DecimalIntegerLiteral",
                                value: "1",
                              },
                            },
                          },
                          {
                            kind: "CaseLabel",
                            expression: {
                              kind: "Literal",
                              literalType: {
                                kind: "DecimalIntegerLiteral",
                                value: "2",
                              },
                            },
                          },
                        ],
                        statements: [
                          {
                            kind: "ExpressionStatement",
                            stmtExp: {
                              kind: "MethodInvocation",
                              identifier: "System.out.println",
                              argumentList: [
                                {
                                  kind: "Literal",
                                  literalType: {
                                    kind: "StringLiteral",
                                    value: '"One or Two"',
                                  },
                                  location: expect.anything(),
                                },
                              ],
                              location: expect.anything(),
                            },
                            location: expect.anything(),
                          },
                          {
                            kind: "BreakStatement",
                          },
                        ],
                      },
                      {
                        kind: "SwitchCase",
                        labels: [
                          {
                            kind: "DefaultLabel",
                          },
                        ],
                        statements: [
                          {
                            kind: "ExpressionStatement",
                            stmtExp: {
                              kind: "MethodInvocation",
                              identifier: "System.out.println",
                              argumentList: [
                                {
                                  kind: "Literal",
                                  literalType: {
                                    kind: "StringLiteral",
                                    value: '"Default"',
                                  },
                                  location: expect.anything(),
                                },
                              ],
                              location: expect.anything(),
                            },
                            location: expect.anything(),
                          },
                        ],
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

  it("extract SwitchStatement without default case correctly", () => {
    const programStr = `
      class Test {
        void test(int x) {
          switch (x) {
            case 1:
              System.out.println("One");
              break;
          }
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
                formalParameterList: [
                  {
                    kind: "FormalParameter",
                    unannType: "int",
                    identifier: "x",
                  },
                ],
              },
              methodBody: {
                kind: "Block",
                blockStatements: [
                  {
                    kind: "SwitchStatement",
                    expression: {
                      kind: "ExpressionName",
                      name: "x",
                      location: expect.anything(),
                    },
                    cases: [
                      {
                        kind: "SwitchCase",
                        labels: [
                          {
                            kind: "CaseLabel",
                            expression: {
                              kind: "Literal",
                              literalType: {
                                kind: "DecimalIntegerLiteral",
                                value: "1",
                              },
                            },
                          },
                        ],
                        statements: [
                          {
                            kind: "ExpressionStatement",
                            stmtExp: {
                              kind: "MethodInvocation",
                              identifier: "System.out.println",
                              argumentList: [
                                {
                                  kind: "Literal",
                                  literalType: {
                                    kind: "StringLiteral",
                                    value: '"One"',
                                  },
                                  location: expect.anything(),
                                },
                              ],
                              location: expect.anything(),
                            },
                            location: expect.anything(),
                          },
                          {
                            kind: "BreakStatement",
                          },
                        ],
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
    console.log(JSON.stringify(ast, null, 2));
    expect(ast).toEqual(expectedAst);
  });
});
