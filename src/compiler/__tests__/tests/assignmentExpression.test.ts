import {
  runTest,
  testCase,
} from "../__utils__/test-utils";

const testCases: testCase[] = [
  {
    comment: "int to double assignment",
    program: `
      public class Main {
        public static void main(String[] args) {
          int x = 5;
          double y = x;
          System.out.println(y);
        }
      }
    `,
    expectedLines: ["5.0"],
  },
  {
    comment: "int to double conversion",
    program: `
      public class Main {
        public static void main(String[] args) {
          int x = 5;
          double y;
          y = x;
          System.out.println(y);
        }
      }
    `,
    expectedLines: ["5.0"],
  },
  {
    comment: "int to double conversion, array",
    program: `
      public class Main {
        public static void main(String[] args) {
          int x = 6;
          double[] y = {1.0, 2.0, 3.0, 4.0, 5.0};
          y[1] = x;
          System.out.println(y[1]);
        }
      }
    `,
    expectedLines: ["6.0"],
  },
];

export const assignmentExpressionTest = () => describe("assignment expression", () => {
  for (let testCase of testCases) {
    const { comment: comment, program: program, expectedLines: expectedLines } = testCase;
    it(comment, () => runTest(program, expectedLines));
  }
});
