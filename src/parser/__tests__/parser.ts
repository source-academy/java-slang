import { parse } from "../parser";
import { expect, describe } from "@jest/globals";
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
            typeIdentifier: 'Java'
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
            typeIdentifier: 'Test'
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
