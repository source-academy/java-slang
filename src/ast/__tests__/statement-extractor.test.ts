import { parse } from "../parser";
import { AST } from "../types/packages-and-modules";

describe("extract ExpressionStatement correctly", () => {
  it("extract Assignment correctly", () => {
    const programStr = `
      class Test {
        void test() {
          x = 1;
        }
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
                      },
                      operator: "=",
                      right: {
                        kind: "Literal",
                        literalType: {
                          kind: "DecimalIntegerLiteral",
                          value: "1",
                        },
                      },
                    },
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

  it("extract MethodInvocation correctly", () => {
    const programStr = `
      class Test {
        void test() {
          test();
        }
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
                      identifier: {
                        kind: "MethodName",
                        name: "test",
                      },
                      argumentList: [],
                    },
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
                    },
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
                      kind: "Literal",
                      literalType: {
                        kind: "DecimalIntegerLiteral",
                        value: "1",
                      },
                    },
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
