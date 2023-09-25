import { parse } from "../parser";
import * as util from 'util';

function inspect(obj: any) {
  console.log(util.inspect(obj, false, null, true));
}

function fail() {
  expect(true).toBe(false);
}

describe('one empty class', () => {
  test('without additional blanks', () => {
    const input = `
      public final class Java {
        // nothing here
      }
    `;

    try {
      const result = parse(input);
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
      expect(result).toEqual(expected);
    } catch (e) {
      inspect(e.format([{ text: input }]));
      fail();
    }
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

    try {
      const result = parse(input);
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
      expect(result).toEqual(expected);
    } catch (e) {
      inspect(e.format([{ text: input }]));
      fail();
    }
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

    try {
      const result = parse(input);
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
      expect(result).toEqual(expected);
    } catch (e) {
      inspect(e.format([{ text: input }]));
      fail();
    }
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

    try {
      const result = parse(input);
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
                        unannType: 'int',
                        identifier: 'a'
                      },
                      {
                        kind: 'FormalParameter',
                        unannType: 'String',
                        identifier: 'b'
                      },
                      {
                        kind: 'FormalParameter',
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
                        unannType: 'ObjType[][]',
                        identifier: 'obj'
                      },
                      {
                        kind: 'FormalParameter',
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
                        unannType: 'float',
                        identifier: 'arg1'
                      },
                      {
                        kind: 'FormalParameter',
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
      }
        ;
      expect(result).toEqual(expected);
    } catch (e) {
      inspect(e.format([{ text: input }]));
      fail();
    }
  });
});
