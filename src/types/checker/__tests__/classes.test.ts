import { check } from '..'
import { parse } from '../../ast'
import { CannotFindSymbolError, CyclicInheritanceError } from '../../errors'
import { Type } from '../../types/type'

const testcases: {
  input: string
  result: { type: Type | null; errors: Error[] }
  only?: boolean
}[] = [
  {
    input: `
        public class Main {
          public static void main(String args[]) {}
        }
    `,
    result: { type: null, errors: [] }
  },
  {
    input: `
        public class Basic {
          public void display() {}
        }
        
        public class Main {
          public static void main(String[] args) {
            Basic basic = new Basic();
            basic.display();
          }
        }
    `,
    result: { type: null, errors: [] }
  },
  {
    input: `
        class Parent {
          void greet() {}
        }
        
        class Child extends Parent {
          @Override
          void greet() {}
        }
        
        public class Main {
          public static void main(String[] args) {
            Parent parent = new Parent();
            Parent child = new Child(); // Polymorphism
            parent.greet();
            child.greet();
          }
        }
    `,
    result: { type: null, errors: [] }
  },
  {
    input: `
        class OverloadedMethods {
          void display() {}
          void display(String msg) {}
        }
      
        public class Main {
          public static void main(String[] args) {
            OverloadedMethods obj = new OverloadedMethods();
            obj.display();
            obj.display("Overloaded method with one parameter.");
          }
        }
    `,
    result: { type: null, errors: [] }
  },
  {
    input: `
        class MultipleConstructors {
          MultipleConstructors() {}
          MultipleConstructors(String message) {}
        }
        
        public class Main {
          public static void main(String[] args) {
            new MultipleConstructors();
            new MultipleConstructors("Overloaded constructor with a String.");
          }
        }
    `,
    result: { type: null, errors: [] }
  },
  {
    input: `
        class A extends B {}
        class B extends A {}
        
        public class Main {
          public static void main(String[] args) {}
        }
    `,
    result: { type: null, errors: [new CyclicInheritanceError()] }
  },
  {
    input: `
        class A extends B {}
        class B {}

        public class Main {
          public static void main(String[] args) {}
        }
    `,
    result: { type: null, errors: [] }
  },
  {
    input: `
        class A {
          public void hello(B b) {}
        }
        class B {}
        public class Main {
          public static void main(String[] args) {}
        }
    `,
    result: { type: null, errors: [] }
  },
  {
    input: `
        class StaticMember {
          static String staticVariable = "Static Variable";
          static void staticMethod() { System.out.println("Static method."); }
        }
        public class Main {
          public static void main(String[] args) {
            System.out.println(StaticMember.staticVariable); // Access static variable
            StaticMember.staticMethod(); // Call static method
          }
        }
    `,
    result: { type: null, errors: [] }
  },
  {
    input: `
        class AccessControl {
          private void privateMethod() { System.out.println("Private method."); }
          public void attemptAccess() { privateMethod(); }
        }
        
        public class Main {
          public static void main(String[] args) {
            AccessControl obj = new AccessControl();
            obj.attemptAccess();
            obj.privateMethod(); // Should be flagged as an error
          }
        }
    `,
    result: { type: null, errors: [new CannotFindSymbolError()] }
  }
]

describe('Type Checker', () => {
  testcases.map(testcase => {
    let it = test
    if (testcase.only) it = test.only
    it(`Checking classes for '${testcase.input}'`, () => {
      const program = testcase.input
      const ast = parse(program)
      if (!ast) throw new Error('Program parsing returns null.')
      const result = check(ast)
      if (result.currentType === null) expect(result.currentType).toBe(testcase.result.type)
      else expect(result.currentType).toBeInstanceOf(testcase.result.type)
      if (testcase.result.errors.length > result.errors.length) {
        testcase.result.errors.forEach((error, index) => {
          if (!result.errors[index]) expect('').toBe(error.message)
          expect(result.errors[index].message).toBe(error.message)
        })
      } else {
        result.errors.forEach((error, index) => {
          if (!testcase.result.errors[index]) expect(error.message).toBe('')
          expect(error.message).toBe(testcase.result.errors[index].message)
        })
      }
    })
  })
})
