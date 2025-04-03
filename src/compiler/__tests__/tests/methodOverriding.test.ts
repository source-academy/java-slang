import { runTest, testCase } from '../__utils__/test-utils'

const testCases: testCase[] = [
  {
    comment: 'Basic method overriding',
    program: `
      class Parent {
        public void show() {
          System.out.println("Parent show");
        }
      }
      class Child extends Parent {
        public void show() {
          System.out.println("Child show");
        }
      }
      public class Main {
        public static void main(String[] args) {
          Parent p = new Parent();
          p.show(); // Parent show
          Child c = new Child();
          c.show(); // Child show
          Parent ref = new Child();
          ref.show(); // Child show (dynamic dispatch)
        }
      }
    `,
    expectedLines: ['Parent show', 'Child show', 'Child show']
  },
  {
    comment: 'Overriding with different access modifiers',
    program: `
      class Parent {
        protected void display() {
          System.out.println("Parent display");
        }
      }
      class Child extends Parent {
        public void display() {  // Increased visibility
          System.out.println("Child display");
        }
      }
      public class Main {
        public static void main(String[] args) {
          Parent ref = new Child();
          ref.display(); // Child display
        }
      }
    `,
    expectedLines: ['Child display']
  },
  {
    comment: 'Method overriding with return type covariance',
    program: `
      class Parent {
        public Number getValue() {
          return 10;
        }
      }
      class Child extends Parent {
        public Integer getValue() {
          return 20;
        }
      }
      public class Main {
        public static void main(String[] args) {
          Parent ref = new Child();
          System.out.println(ref.getValue()); // 20
        }
      }
    `,
    expectedLines: ['20']
  },
  {
    comment: 'Overriding with multiple levels of inheritance',
    program: `
      class GrandParent {
        public void greet() {
          System.out.println("Hello from GrandParent");
        }
      }
      class Parent extends GrandParent {
        public void greet() {
          System.out.println("Hello from Parent");
        }
      }
      class Child extends Parent {
        public void greet() {
          System.out.println("Hello from Child");
        }
      }
      public class Main {
        public static void main(String[] args) {
          GrandParent ref1 = new GrandParent();
          ref1.greet(); // GrandParent
          GrandParent ref2 = new Parent();
          ref2.greet(); // Parent
          GrandParent ref3 = new Child();
          ref3.greet(); // Child
        }
      }
    `,
    expectedLines: ['Hello from GrandParent', 'Hello from Parent', 'Hello from Child']
  },
  {
    comment: 'Overriding and method hiding with static methods',
    program: `
      class Parent {
        public static void staticMethod() {
          System.out.println("Parent static method");
        }
        public void instanceMethod() {
          System.out.println("Parent instance method");
        }
      }
      class Child extends Parent {
        public static void staticMethod() {
          System.out.println("Child static method");
        }
        public void instanceMethod() {
          System.out.println("Child instance method");
        }
      }
      public class Main {
        public static void main(String[] args) {
          Parent.staticMethod(); // Parent static method
          Child.staticMethod(); // Child static method
          Parent ref = new Child();
          ref.instanceMethod(); // Child instance method
        }
      }
    `,
    expectedLines: ['Parent static method', 'Child static method', 'Child instance method']
  },
  {
    comment: 'Overriding final methods (should cause compilation error)',
    program: `
      class Parent {
        public final void show() {
          System.out.println("Final method in Parent");
        }
      }
      class Child extends Parent {
        // public void show() {} // Uncommenting should cause compilation error
      }
      public class Main {
        public static void main(String[] args) {
          Parent p = new Parent();
          p.show(); // Final method in Parent
        }
      }
    `,
    expectedLines: ['Final method in Parent']
  },
  {
    comment: 'Overriding in a deep class hierarchy',
    program: `
      class A {
        public void test() {
          System.out.println("A test");
        }
      }
      class B extends A {
        public void test() {
          System.out.println("B test");
        }
      }
      class C extends B {
        public void test() {
          System.out.println("C test");
        }
      }
      class D extends C {
        public void test() {
          System.out.println("D test");
        }
      }
      public class Main {
        public static void main(String[] args) {
          A ref = new D();
          ref.test(); // D test
        }
      }
    `,
    expectedLines: ['D test']
  },
  {
    comment: 'Overriding private methods (should not override, treated as new method)',
    program: `
      class Parent {
        private void secret() {
          System.out.println("Parent secret");
        }
      }
      class Child extends Parent {
        public void secret() {
          System.out.println("Child secret");
        }
      }
      public class Main {
        public static void main(String[] args) {
          Child c = new Child();
          c.secret(); // Child secret
        }
      }
    `,
    expectedLines: ['Child secret']
  }
]

export const methodOverridingTest = () =>
  describe('method overriding', () => {
    for (let testCase of testCases) {
      const { comment, program, expectedLines } = testCase
      it(comment, () => runTest(program, expectedLines))
    }
  })
