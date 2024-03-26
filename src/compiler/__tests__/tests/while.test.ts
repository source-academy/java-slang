import {
  runTest,
  testCase,
} from "../test-utils";

const testCases: testCase[] = [
  {
    comment: "while loops",
    program: `
      public class Main {
        public static void main(String[] args) {
          int x = 0;
          while (x < 3) {
            System.out.println(x);
            x += 1;
          }
          while (x > 0) {
            System.out.println(x);
            x -= 1;
          }
        }
      }
    `,
    expectedLines: ["0", "1", "2", "3", "2", "1"],
  },
  {
    comment: "2 level nested while loops",
    program: `
      public class Main {
        public static void main(String[] args) {
          int x = 0;
          while (x <= 3) {
            int y = x;
            while (y > 0) {
              System.out.println(y);
              y -= 1;
            }
            x += 1;
          }
        }
      }
    `,
    expectedLines: ["1", "2", "1", "3", "2", "1"],
  },
  {
    comment: "3 level nested while loops",
    program: `
      public class Main {
        public static void main(String[] args) {
          int x = 1;
          while (x <= 3) {
            int y = 1;
            while (y <= 2) {
              int z = 0;
              while (z <= 1) {   
                System.out.println(z);
                z += 1;
              }
              y += 1;
            }
            x += 1;
          }
        }
      }
    `,
    expectedLines: ["0", "1", "0", "1", "0", "1", "0", "1", "0", "1", "0", "1"],
  },
  {
    comment: "while with if else (simple Collatz sequence)",
    program: `
      public class Main {
        public static void main(String[] args) {
          int s = 168;
          while (s != 1) {
            System.out.println(s);
            if (s % 2 == 0)
              s >>= 1;
            else
              s = 3 * s + 1;
          }
          System.out.println(s);
        }
      }
    `,
    expectedLines: ["168", "84", "42", "21", "64", "32", "16", "8", "4", "2", "1"],
  },
  {
    comment: "do while",
    program: `
      public class Main {
        public static void main(String[] args) {
          int y = 404, d = 100;
          do {
            System.out.println(y);
            y -= 101;
          } while (y > 0 && y / d == y % d);
        }
      }
    `,
    expectedLines: ["404", "303", "202", "101"],
  },
  {
    comment: "while with break statement",
    program: `
      public class Main {
        public static void main(String[] args) {
          int x = 5;
          while (x > 0) {
            System.out.println(x);
            x -= 1;
            if (x == 2) {
              break;
            }
          }
        }
      }
    `,
    expectedLines: ["5", "4", "3"],
  },
  {
    comment: "while with continue statement",
    program: `
      public class Main {
        public static void main(String[] args) {
          int x = 5;
          while (x > 0) {
            x -= 1;
            if (x == 2) {
              continue;
            }
            System.out.println(x);
          }
        }
      }
    `,
    expectedLines: ["4", "3", "1", "0"],
  },
  {
    comment: "do while, with continue",
    program: `
      public class Main {
        public static void main(String[] args) {
          int y = 403;
          do {
            y--;
            continue;
            System.out.println(y);
          } while (y > 0);
          System.out.println("First line printed");
        }
      }
    `,
    expectedLines: ["First line printed"],
  },
];

export const whileTest = () => describe("while statements", () => {
  for (let testCase of testCases) {
    const { comment: comment, program: program, expectedLines: expectedLines } = testCase;
    const expectedResult = expectedLines.join("\n") + "\n";
    it(comment, () => runTest(program, expectedResult));
  }
});
