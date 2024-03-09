import { parse } from "../parser";
import { AST } from "../types/packages-and-modules";

describe("extract LocalVariableDeclarationStatement correctly", () => {
  it("extract LocalVariableDeclarationStatement with variableInitializer correctly", () => {
    const programStr = `
      class Test {
        void test(String[] args) {
          int x = 1;
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
                formalParameterList: [
                  {
                    kind: "FormalParameter",
                    unannType: "String[]",
                    identifier: "args",
                  },
                ],
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
            },
          ],
        },
      ],
    };
  
    const ast = parse(programStr);
    expect(ast).toEqual(expectedAst);
  });

  it("extract LocalVariableDeclarationStatement without variableInitializer correctly", () => {
    const programStr = `
      class Test {
        void test(String[] args) {
          int x;
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
                formalParameterList: [
                  {
                    kind: "FormalParameter",
                    unannType: "String[]",
                    identifier: "args",
                  },
                ],
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
                        variableDeclaratorId: "x",
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
