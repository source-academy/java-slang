import {
  runTest,
  testCase,
} from "../__utils__/test-utils";

const testCases: testCase[] = [
  {
    comment: "basic static nested class instantiation and usage",
    program: `
      public class Main {
        public static class Inner {
          public int value;
          public Inner(int v) {
            this.value = v;
          }
          public int getValue() {
            return this.value;
          }
        }

        public static void main(String[] args) {
          Inner inner = new Inner(42);
          System.out.println(inner.getValue());
        }
      }
    `,
    expectedLines: ["42"],
  },
  {
    comment: "one nested class field typed as a sibling nested class",
    program: `
      public class Main {
        public static class Box {
          public int value;
          public Box(int v) {
            this.value = v;
          }
        }

        public static class Holder {
          public Box box;
          public Holder(Box b) {
            this.box = b;
          }
        }

        public static void main(String[] args) {
          Box box = new Box(9);
          Holder holder = new Holder(box);
          System.out.println(holder.box.value);
        }
      }
    `,
    expectedLines: ["9"],
  },
  {
    comment: "nested class instance field with an inline initializer",
    program: `
      public class Main {
        static class Inner1 {
          public int one = 1;
        }
        public static void main(String[] args) {
          Inner1 inner1 = new Inner1();
          int n = inner1.one;
          System.out.println(n);
        }
      }
    `,
    expectedLines: ["1"],
  },
  {
    comment: "nested class forward-references a sibling class declared after it",
    program: `
      public class Main {
        static class A {
          int get() { return B.code; }
        }
        static class B {
          static int code = 9;
        }
        public static void main(String[] args) {
          A a = new A();
          System.out.println(a.get());
        }
      }
    `,
    expectedLines: ["9"],
  },
  {
    comment: "nested class forward-references a sibling enum declared after it",
    program: `
      public class Main {
        static class Box {
          Color get() { return Color.RED; }
        }
        enum Color { RED, BLUE }
        public static void main(String[] args) {
          Box box = new Box();
          Color c = box.get();
          System.out.println(c.name());
        }
      }
    `,
    expectedLines: ["RED"],
  },
  {
    comment: "two levels of static nested class",
    program: `
      public class Main {
        public static class Middle {
          public static class Inner {
            public String greet() {
              return "hello";
            }
          }
        }

        public static void main(String[] args) {
          Inner inner = new Inner();
          System.out.println(inner.greet());
        }
      }
    `,
    expectedLines: ["hello"],
  },
];

export const nestedClassesTest = () => describe("static nested classes", () => {
  for (let testCase of testCases) {
    const { comment: comment, program: program, expectedLines: expectedLines } = testCase;
    it(comment, () => runTest(program, expectedLines));
  }
});
