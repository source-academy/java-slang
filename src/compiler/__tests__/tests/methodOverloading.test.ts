import {
  runTest,
  testCase,
} from "../__utils__/test-utils";

const testCases: testCase[] = [
  {
    comment: "Basic method overloading",
    program: `
      public class Main {
        public static void f(int x) {
          System.out.println("int: " + x);
        }
        public static void f(double x) {
          System.out.println("double: " + x);
        }
        public static void main(String[] args) {
          f(5);
          f(5.5);
        }
      }
    `,
    expectedLines: ["int: 5", "double: 5.5"],
  },
  {
    comment: "Overloaded methods with different parameter counts",
    program: `
      public class Main {
        public static void f(int x) {
          System.out.println("single param: " + x);
        }
        public static void f(int x, int y) {
          System.out.println("two params: " + (x + y));
        }
        public static void main(String[] args) {
          f(3);
          f(3, 4);
        }
      }
    `,
    expectedLines: ["single param: 3", "two params: 7"],
  },
  {
    comment: "Method overloading with different return types",
    program: `
      public class Main {
        public static int f(int x) {
          return x * 2;
        }
        public static String f(String s) {
          return s + "!";
        }
        public static void main(String[] args) {
          System.out.println(f(4));
          System.out.println(f("Hello"));
        }
      }
    `,
    expectedLines: ["8", "Hello!"],
  },
  {
    comment: "Overloading with implicit type conversion",
    program: `
      public class Main {
        public static void f(int x) {
          System.out.println("int version: " + x);
        }
        public static void f(long x) {
          System.out.println("long version: " + x);
        }
        public static void main(String[] args) {
          f(10);  // should call int version
          f(10L); // should call long version
        }
      }
    `,
    expectedLines: ["int version: 10", "long version: 10"],
  },
  {
    comment: "Ambiguous method overloading",
    program: `
      public class Main {
        public static void f(int x, double y) {
          System.out.println("int, double");
        }
        public static void f(double x, int y) {
          System.out.println("double, int");
        }
        public static void main(String[] args) {
          f(5, 5.0);
          f(5.0, 5);
        }
      }
    `,
    expectedLines: ["int, double", "double, int"],
  },
  {
    comment: "Overloading with reference types",
    program: `
      public class Main {
        public static void f(String s) {
          System.out.println("String");
        }
        public static void f(Main m) {
          System.out.println("Main");
        }
        public static void main(String[] args) {
          f("Hello"); // should call String version
          f(new Main()); // should call Main version
        }
      }
    `,
    expectedLines: ["String", "Main"],
  },
  {
    comment: "Overloaded instance and static methods",
    program: `
      public class Main {
        public void f() {
          System.out.println("Instance method");
        }
        public static void f(int x) {
          System.out.println("Static method with int: " + x);
        }
        public static void main(String[] args) {
          Main obj = new Main();
          obj.f();
          f(5);
        }
      }
    `,
    expectedLines: ["Instance method", "Static method with int: 5"],
  },
  {
    comment: "Overloaded instance methods",
    program: `
      public class Main {
        public void f(int x) {
          System.out.println("Instance int: " + x);
        }
        public void f(double x) {
          System.out.println("Instance double: " + x);
        }
        public static void main(String[] args) {
          Main obj = new Main();
          obj.f(5);
          obj.f(5.5);
        }
      }
    `,
    expectedLines: ["Instance int: 5", "Instance double: 5.5"],
  },
  {
    comment: "Implicit conversion during method invocation",
    program: `
      public class Main {
        public static void f(double x) {
          System.out.println("Converted double: " + x);
        }
        public static void main(String[] args) {
          f(10); // Implicitly converts int to double
        }
      }
    `,
    expectedLines: ["Converted double: 10.0"],
  },
  {
    comment: "Overloading with widening conversion",
    program: `
      public class Main {
        public static void f(long x) {
          System.out.println("long version: " + x);
        }
        public static void f(double x) {
          System.out.println("double version: " + x);
        }
        public static void main(String[] args) {
          f(5); // Should call long version
          f(5.0f); // Should call double version
        }
      }
    `,
    expectedLines: ["long version: 5", "double version: 5.0"],
  }
];

export const methodOverloadingTest = () => describe("method overloading", () => {
  for (let testCase of testCases) {
    const { comment, program, expectedLines } = testCase;
    it(comment, () => runTest(program, expectedLines));
  }
});