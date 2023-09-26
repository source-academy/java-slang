import { parse } from "../parser";

describe('one empty class', () => {
  test('without additional blanks', () => {
    const input = `
      public final class Java {
        // nothing here
      }
    `;

    const expected = {
      kind: 'OrdinaryCompilationUnit',
      topLevelClassOrInterfaceDeclaration: [
        {
          kind: 'NormalClassDeclaration',
          classModifier: ['public', 'final'],
          typeIdentifier: 'Java',
          classBody: { kind: 'ClassBody', classBodyDeclaration: [] }
        }
      ]
    };

    const result = parse(input);
    expect(result).toEqual(expected);
  });

  test('with additional blanks and comments', () => {
    const input = `
      /* 
        Usesless commments
      */
      public class Test {
        // nothing here
      }
      /*
        here and there...
      */
    `;

    const expected = {
      kind: 'OrdinaryCompilationUnit',
      topLevelClassOrInterfaceDeclaration: [
        {
          kind: 'NormalClassDeclaration',
          classModifier: ['public'],
          typeIdentifier: 'Test',
          classBody: { kind: 'ClassBody', classBodyDeclaration: [] }
        }
      ]
    };

    const result = parse(input);
    expect(result).toEqual(expected);
  });
});

describe('one class with methods', () => {
  test('one method, one argument', () => {
    const input = `
      public class Java {
        public static void Main(String[] args) {
          // Empty method body
        }
      }
    `;

    const expected = {
      kind: 'OrdinaryCompilationUnit',
      topLevelClassOrInterfaceDeclaration: [
        {
          kind: 'NormalClassDeclaration',
          classModifier: ['public'],
          typeIdentifier: 'Java',
          classBody: {
            kind: 'ClassBody',
            classBodyDeclaration: [
              {
                kind: 'MethodDeclaration',
                methodModifier: ['public', 'static'],
                methodHeader: {
                  kind: 'MethodHeader',
                  result: 'void',
                  identifier: 'Main',
                  formalParameterList: [
                    {
                      kind: 'FormalParameter',
                      variableModifier: [],
                      unannType: 'String[]',
                      identifier: 'args'
                    }
                  ]
                },
                methodBody: []
              }
            ]
          }
        }
      ]
    };

    const result = parse(input);
    expect(result).toEqual(expected);
  });

  test('few methods with multiple arguments', () => {
    const input = `
      public class JDemo {
        public static ReturnType Method(int a, String b, boolean c[][]) {

        }
        private final void PrivateMethod(ObjType[] obj[], char canAlso[]) {

        }
        public long[] another(float arg1, double arg2) {

        }
      }
    `;

    const expected = {
      kind: 'OrdinaryCompilationUnit',
      topLevelClassOrInterfaceDeclaration: [
        {
          kind: 'NormalClassDeclaration',
          classModifier: ['public'],
          typeIdentifier: 'JDemo',
          classBody: {
            kind: 'ClassBody',
            classBodyDeclaration: [
              {
                kind: 'MethodDeclaration',
                methodModifier: ['public', 'static'],
                methodHeader: {
                  kind: 'MethodHeader',
                  result: 'ReturnType',
                  identifier: 'Method',
                  formalParameterList: [
                    {
                      kind: 'FormalParameter',
                      variableModifier: [],
                      unannType: 'int',
                      identifier: 'a'
                    },
                    {
                      kind: 'FormalParameter',
                      variableModifier: [],
                      unannType: 'String',
                      identifier: 'b'
                    },
                    {
                      kind: 'FormalParameter',
                      variableModifier: [],
                      unannType: 'boolean[][]',
                      identifier: 'c'
                    }
                  ]
                },
                methodBody: []
              },
              {
                kind: 'MethodDeclaration',
                methodModifier: ['private', 'final'],
                methodHeader: {
                  kind: 'MethodHeader',
                  result: 'void',
                  identifier: 'PrivateMethod',
                  formalParameterList: [
                    {
                      kind: 'FormalParameter',
                      variableModifier: [],
                      unannType: 'ObjType[][]',
                      identifier: 'obj'
                    },
                    {
                      kind: 'FormalParameter',
                      variableModifier: [],
                      unannType: 'char[]',
                      identifier: 'canAlso'
                    }
                  ]
                },
                methodBody: []
              },
              {
                kind: 'MethodDeclaration',
                methodModifier: ['public'],
                methodHeader: {
                  kind: 'MethodHeader',
                  result: 'long[]',
                  identifier: 'another',
                  formalParameterList: [
                    {
                      kind: 'FormalParameter',
                      variableModifier: [],
                      unannType: 'float',
                      identifier: 'arg1'
                    },
                    {
                      kind: 'FormalParameter',
                      variableModifier: [],
                      unannType: 'double',
                      identifier: 'arg2'
                    }
                  ]
                },
                methodBody: []
              }
            ]
          }
        }
      ]
    };

    const result = parse(input);
    expect(result).toEqual(expected);
  });
});

describe('simple arithmetic expressions', () => {
  test('addition', () => {
    const input = `
      class C {
        public void f() {
          int a = 1, b = 2, c = 3, d;
          c = a + b + c;
        }
      }
    `;

    const expected = {
      kind: 'OrdinaryCompilationUnit',
      topLevelClassOrInterfaceDeclaration: [
        {
          kind: 'NormalClassDeclaration',
          classModifier: [],
          typeIdentifier: 'C',
          classBody: {
            kind: 'ClassBody',
            classBodyDeclaration: [
              {
                kind: 'MethodDeclaration',
                methodModifier: ['public'],
                methodHeader: {
                  kind: 'MethodHeader',
                  result: 'void',
                  identifier: 'f',
                  formalParameterList: []
                },
                methodBody: [
                  {
                    kind: 'LocalVariableDeclaration',
                    variableModifier: [],
                    unannType: 'int',
                    variableDeclaratorList: [
                      {
                        identifier: 'a',
                        dims: '',
                        variableInitializer: {
                          kind: 'ConditionalExpression',
                          test: { kind: 'Literal', value: '1' }
                        }
                      },
                      {
                        identifier: 'b',
                        dims: '',
                        variableInitializer: {
                          kind: 'ConditionalExpression',
                          test: { kind: 'Literal', value: '2' }
                        }
                      },
                      {
                        identifier: 'c',
                        dims: '',
                        variableInitializer: {
                          kind: 'ConditionalExpression',
                          test: { kind: 'Literal', value: '3' }
                        }
                      },
                      { identifier: 'd', dims: '' }
                    ]
                  },
                  {
                    kind: 'AssignmentExpression',
                    left: 'c',
                    op: '=',
                    right: {
                      kind: 'ConditionalExpression',
                      test: {
                        type: 'BinaryExpression',
                        operator: '+',
                        left: {
                          type: 'BinaryExpression',
                          operator: '+',
                          left: { kind: 'NameExpression', name: 'a' },
                          right: { kind: 'NameExpression', name: 'b' }
                        },
                        right: { kind: 'NameExpression', name: 'c' }
                      }
                    }
                  }
                ]
              }
            ]
          }
        }
      ]
    };

    const result = parse(input);
    expect(result).toEqual(expected);
  });

  test('addition and multiplication', () => {
    const input = `
    class C {
      public void f() {
        int a = 1 + 2 * 3 - 4;
        long b = a << 9;
      }
    }
    `;

    const expected = {
      kind: 'OrdinaryCompilationUnit',
      topLevelClassOrInterfaceDeclaration: [
        {
          kind: 'NormalClassDeclaration',
          classModifier: [],
          typeIdentifier: 'C',
          classBody: {
            kind: 'ClassBody',
            classBodyDeclaration: [
              {
                kind: 'MethodDeclaration',
                methodModifier: ['public'],
                methodHeader: {
                  kind: 'MethodHeader',
                  result: 'void',
                  identifier: 'f',
                  formalParameterList: []
                },
                methodBody: [
                  {
                    kind: 'LocalVariableDeclaration',
                    variableModifier: [],
                    unannType: 'int',
                    variableDeclaratorList: [
                      {
                        identifier: 'a',
                        dims: '',
                        variableInitializer: {
                          kind: 'ConditionalExpression',
                          test: {
                            type: 'BinaryExpression',
                            operator: '-',
                            left: {
                              type: 'BinaryExpression',
                              operator: '+',
                              left: { kind: 'Literal', value: '1' },
                              right: {
                                type: 'BinaryExpression',
                                operator: '*',
                                left: { kind: 'Literal', value: '2' },
                                right: { kind: 'Literal', value: '3' }
                              }
                            },
                            right: { kind: 'Literal', value: '4' }
                          }
                        }
                      }
                    ]
                  },
                  {
                    kind: 'LocalVariableDeclaration',
                    variableModifier: [],
                    unannType: 'long',
                    variableDeclaratorList: [
                      {
                        identifier: 'b',
                        dims: '',
                        variableInitializer: {
                          kind: 'ConditionalExpression',
                          test: {
                            type: 'BinaryExpression',
                            operator: '<<',
                            left: { kind: 'NameExpression', name: 'a' },
                            right: { kind: 'Literal', value: '9' }
                          }
                        }
                      }
                    ]
                  }
                ]
              }
            ]
          }
        }
      ]
    };

    const result = parse(input);
    expect(result).toEqual(expected);
  });
});