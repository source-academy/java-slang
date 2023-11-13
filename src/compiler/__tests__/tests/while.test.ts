import {
  runTest,
  testCase,
} from "../test-utils";

const testCases: testCase[] = [
  {
    comment: "while",
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
  }
];

export const whileTest = () => describe("while statements", () => {
  for (let testCase of testCases) {
    const { comment: comment, program: program, expectedLines: expectedLines } = testCase;
    const expectedResult = expectedLines.join("\n") + "\n";
    it(comment, () => runTest(program, expectedResult));
  }
});
