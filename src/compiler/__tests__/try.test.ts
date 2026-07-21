import { runTest, testCase } from "./__utils__/test-utils";
import { check } from "../../types/checker";
import { parse as parseTypeChecker } from "../../types/ast";
import { TypeCheckerError, UnhandledExceptionError } from "../../types/errors";

const testCases: testCase[] = [
  {
    comment: "try/catch block without exception",
    program: `
      public class Main {
        public static void main(String[] args) {
          try {
            System.out.println(1);
          } catch (Exception e) {
            System.out.println(2);
          }
          System.out.println(0);
        }
      }
    `,
    expectedLines: ["1", "0"],
  },
  {
    comment: "try/catch/finally block with exception handled",
    program: `
      public class Main {
        public static void main(String[] args) {
          try {
            int y = 1 / 0;
          } catch (Exception e) {
            System.out.println(2);
          } finally {
            System.out.println(3);
          }
          System.out.println(4);
        }
      }
    `,
    expectedLines: ["2", "3", "4"],
  }
  ,
  {
    comment: "static helper method throws exception and catch handles it",
    program: `
      public class Main {
        public static int bar(int x) throws Exception {
          int z = 1 / 0;
          return x;
        }

        public static void main(String[] args) {
          try {
            int y = bar(5);
          } catch (Exception e) {
            System.out.println(2);
          } finally {
            System.out.println(3);
          }
          System.out.println(4);
        }
      }
    `,
    expectedLines: ["2", "3", "4"],
  },
  {
    comment: "instance method calls static helper that throws exception and catch handles it",
    program: `
      public class Main {
        public int foo(int x) throws Exception {
          int z = bar(x);
          return x;
        }

        public static int bar(int x) throws Exception {
          int z = 1 / 0;
          return x;
        }

        public static void main(String[] args) {
          try {
            Main main = new Main();
            int y = main.foo(5);
          } catch (Exception e) {
            System.out.println(2);
          } finally {
            System.out.println(3);
          }
          System.out.println(4);
        }
      }
    `,
    expectedLines: ["2", "3", "4"],
  },
  {
    comment: "static helper method does not throw and catch is skipped",
    program: `
      public class Main {
        public static int bar(int x) throws Exception {
          int z = 1;
          return x;
        }

        public static void main(String[] args) {
          try {
            int y = bar(5);
          } catch (Exception e) {
            System.out.println(2);
          } finally {
            System.out.println(3);
          }
          System.out.println(4);
        }
      }
    `,
    expectedLines: ["3", "4"],
  },
  {
    comment: "instance method calls static helper without throwing and catch is skipped",
    program: `
      public class Main {
        public int foo(int x) throws Exception {
          int z = bar(x);
          return x;
        }

        public static int bar(int x) throws Exception {
          int z = 1;
          return x;
        }

        public static void main(String[] args) {
          try {
            Main main = new Main();
            int y = main.foo(5);
          } catch (Exception e) {
            System.out.println(2);
          } finally {
            System.out.println(3);
          }
          System.out.println(4);
        }
      }
    `,
    expectedLines: ["3", "4"],
  }
];

describe("try/catch", () => {
  for (const testCase of testCases) {
    it(testCase.comment, () => runTest(testCase.program, testCase.expectedLines));
  }
});

const typeCheckErrorCases = [
  {
    comment: "static method declares checked exception but is not handled or propagated",
    program: `
      public class Main {
        public static int bar(int x) throws Exception {
          int z = 1;
          return x;
        }

        public static void main(String[] args) {
          bar(5);
        }
      }
    `
  },
  {
    comment: "instance method declares checked exception but is not handled or propagated",
    program: `
      public class Main {
        public int foo(int x) throws Exception {
          int z = bar(x);
          return x;
        }

        public static int bar(int x) throws Exception {
          int z = 1;
          return x;
        }

        public static void main(String[] args) {
          Main main = new Main();
          main.foo(5);
        }
      }
    `
  }
];

describe("try/catch type checking errors", () => {
  for (const testCase of typeCheckErrorCases) {
    it(testCase.comment, () => {
      const ast = parseTypeChecker(testCase.program);
      if (ast instanceof TypeCheckerError) throw new Error('Program parsing returns null.');
      const result = check(ast);
      expect(result.errors.some(error => error instanceof UnhandledExceptionError)).toBe(true);
    });
  }
});
