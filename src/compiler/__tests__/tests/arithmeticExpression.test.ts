import {
  runTest,
  testCase,
} from "../__utils__/test-utils";

const testCases: testCase[] = [
  {
    comment: "int only simple binary expression, part 1",
    program: `
      public class Main {
        public static void main(String[] args) {
          System.out.println(1 + 2);
          System.out.println(3 - 4);
          System.out.println(5 * 6);
          System.out.println(7 / 8); // floor division
          System.out.println(9 % 10);
          System.out.println(5 % -2);
          System.out.println(-5 % 2);
          System.out.println(-5 % -2);
        }
      }
    `,
    expectedLines: ["3", "-1", "30", "0", "9", "1", "-1", "-1"],
  },
  {
    comment: "int only simple binary expression, part 2",
    program: `
      public class Main {
        public static void main(String[] args) {
          System.out.println(10 | 5);
          System.out.println(3 & 2);
          System.out.println(10 ^ 4);
          System.out.println(-1 | 2);
          System.out.println(1 & -2);
          System.out.println(50 ^ -50);
        }
      }
    `,
    expectedLines: ["15", "2", "14", "-1", "0", "-4"],
  },
  {
    comment: "int only complex binary expression",
    program: `
      public class Main {
        public static void main(String[] args) {
          System.out.println(1 + 2 * 3 - 4);
          System.out.println(10 * (7 - 4) / 2);
          System.out.println(3 * 4 * 5 - 100 / 2 / 5);
          System.out.println((4 | 6) & (10 ^ 24) + 100);
          System.out.println(~3 >>> 2 & 5 << 1 + 2);
          System.out.println((~3 >>> 2) & (5 << (1 + 2)));
        }
      }
    `,
    expectedLines: ["3", "15", "50", "6", "40", "40"],
  },
  {
    comment: "int boundaries",
    program: `
      public class Main {
        public static void main(String[] args) {
          System.out.println(-2147483648);
          System.out.println(-32769);
          System.out.println(-32768);
          System.out.println(-129);
          System.out.println(-128);
          System.out.println(-1);
          System.out.println(0);
          System.out.println(1);
          System.out.println(127);
          System.out.println(128);
          System.out.println(32767);
          System.out.println(32768);
          System.out.println(2147483647);
        }
      }
    `,
    expectedLines: ["-2147483648", "-32769", "-32768",
      "-129", "-128", "-1", "0", "1", "127", "128", "32767", "32768", "2147483647"],
  },
];

export const arithmeticExpressionTest = () => describe("arithmetic expression", () => {
  for (let testCase of testCases) {
    const { comment: comment, program: program, expectedLines: expectedLines } = testCase;
    it(comment, () => runTest(program, expectedLines));
  }
});
