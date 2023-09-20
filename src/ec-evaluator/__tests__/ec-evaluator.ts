import { evaluate } from "../interpreter";
import { parse } from "../../ast/parser"
import { isNode } from "../utils";

it('evaluate local variable declaration to a literal correctly', () => {
  const programStr = `
    public class Test {
      public static void main(String[] args) {
        int x = 1;
      }
    }
    `;
  const compilationUnit = parse(programStr);
  if (compilationUnit) {
    const [result, agendaTrace, stashTrace] = evaluate(compilationUnit);;

    const expectedAgendaTrace = [
      'CompilationUnit',
      'Pop',
      'Assignment',
      'Literal'
    ];
    const expectedStashTrace = [1];

    expect(result).toMatchInlineSnapshot(`undefined`);
    expect(agendaTrace.map(i => isNode(i) ? i.type : i.instrType)).toEqual(expectedAgendaTrace);
    expect(stashTrace.map(i => i.value)).toEqual(expectedStashTrace);
  }
})

it('evaluate local variable declaration to a basic arithmetic operation correctly', () => {
  const programStr = `
    public class Test {
      public static void main(String[] args) {
        int y = 10 % 2;
      }
    }
    `;
  const compilationUnit = parse(programStr);
  if (compilationUnit) {
    const [result, agendaTrace, stashTrace] = evaluate(compilationUnit);;

    const expectedAgendaTrace = [
      'CompilationUnit',
      'Pop',
      'Assignment',
      'BinaryExpression', 
      'BinaryOperation',
      'Literal',
      'Literal'
    ];
    const expectedStashTrace = [10, 2, 0];
    
    expect(result).toMatchInlineSnapshot(`undefined`);
    expect(agendaTrace.map(i => isNode(i) ? i.type : i.instrType)).toEqual(expectedAgendaTrace);
    expect(stashTrace.map(i => i.value)).toEqual(expectedStashTrace);
  }
})

it('evaluate local variable declaration to a complex arithmetic operation correctly', () => {
  const programStr = `
    public class Test {
      public static void main(String[] args) {
        int z = 1 + (2 * 3) - 4;
      }
    }
    `;
  const compilationUnit = parse(programStr);
  if (compilationUnit) {
    const [result, agendaTrace, stashTrace] = evaluate(compilationUnit);;

    const expectedAgendaTrace = [
      'CompilationUnit',
      'Pop',
      'Assignment',
      'BinaryExpression', 
      'BinaryOperation',
      'Literal',
      'BinaryExpression',
      'BinaryOperation',
      'BinaryExpression',
      'Literal',
      'BinaryOperation',
      'Literal',
      'Literal'
    ];
    const expectedStashTrace = [1, 2, 3, 6, 7, 4, 3];
    
    expect(result).toMatchInlineSnapshot(`undefined`);
    expect(agendaTrace.map(i => isNode(i) ? i.type : i.instrType)).toEqual(expectedAgendaTrace);
    expect(stashTrace.map(i => i.value)).toEqual(expectedStashTrace);
  }
})

it('evaluate multiple local variable declarations correctly', () => {
  const programStr = `
    public class Test {
      public static void main(String[] args) {
        int x = 1;
        int y = 10 % 2;
      }
    }
    `;
  const compilationUnit = parse(programStr);
  if (compilationUnit) {
    const [result, agendaTrace, stashTrace] = evaluate(compilationUnit);;

    const expectedAgendaTrace = [
      'CompilationUnit',
      'LocalVariableDeclarationStatement',
      'LocalVariableDeclarationStatement',
      'Pop',
      'Assignment',
      'Literal',
      'Pop',
      'Assignment',
      'BinaryExpression', 
      'BinaryOperation',
      'Literal',
      'Literal'
    ];
    const expectedStashTrace = [1, 10, 2, 0];

    expect(result).toMatchInlineSnapshot(`undefined`);
    expect(agendaTrace.map(i => isNode(i) ? i.type : i.instrType)).toEqual(expectedAgendaTrace);
    expect(stashTrace.map(i => i.value)).toEqual(expectedStashTrace);
  }
})
