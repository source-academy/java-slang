import {
  runTest,
  testCase,
} from "../test-utils";

const testCases: testCase[] = [
  {
    comment: "multiple class methods",
    program: `
      public class Main {
        public static void f() {
          System.out.println("In f");
        }
        public static void g() {
          System.out.println("In g");
        }
        public static void main(String[] args) {
          System.out.println("In main");
          f();
          Main.g();
          System.out.println("In main");
        }
      }
    `,
    expectedLines: ["In main", "In f", "In g", "In main"],
  },
  {
    comment: "recursive method",
    program: `
      public class Main {
        public static void f(int x) {
          if (x >= 0) {
            System.out.println(x);
            f(x - 1);
          }
        }
        public static void main(String[] args) {
          f(2);
        }
      }
    `,
    expectedLines: ["2", "1", "0"],
  },
  {
    comment: "chain calls",
    program: `
      public class Main {
        public static void main(String[] args) {
          System.out.println("main");
          f();
          System.out.println("main");
        }
        public static void f() {
          System.out.println("f");
          g();
        }
        public static void g() {
          h();
          System.out.println("g");
        }
        public static void h() {
          System.out.println("h");
        }
      }
    `,
    expectedLines: ["main", "f", "h", "g", "main"],
  },
  {
    comment: "static function returning non-void",
    program: `
      public class Main {
        public static void main(String[] args) {
          int a = 10;
          a += f(3);
          System.out.println(a);
        }
        public static int f(int x) {
          return x + x;
        }
      }
    `,
    expectedLines: ["16"],
  },
  {
    comment: "factorial function on small input",
    program: `
      public class Main {
        public static void main(String[] args) {
          System.out.println(f(0));
          System.out.println(f(1));
          System.out.println(f(2));
          System.out.println(f(3));
          System.out.println(f(4));
          System.out.println(f(5));
        }
        public static int f(int x) {
          if (x == 0) {
            return 1;
          }
          return x * f(x - 1);
        }
      }
    `,
    expectedLines: ["1", "1", "2", "6", "24", "120"],
  },
  {
    comment: "composite function",
    program: `
      public class Main {
        public static int f(int x) {
          return x + 1;
        }
        public static int g(int x) {
          return x * 2;
        }
        public static int h(int x) {
          return x % 10;
        }

        public static void main(String[] args) {
          int x = 7;
          System.out.println(f(g(x)));
          System.out.println(g(f(x)));
          System.out.println(h(f(g(x))));
          System.out.println(h(g(f(x))));
        }
      }
    `,
    expectedLines: ["15", "16", "5", "6"],
  }
];

export const methodInvocationTest = () => describe("method invocations", () => {
  for (let testCase of testCases) {
    const { comment: comment, program: program, expectedLines: expectedLines } = testCase;
    const expectedResult = expectedLines.join("\n") + "\n";
    it(comment, () => runTest(program, expectedResult));
  }
});