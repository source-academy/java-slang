import {
  runTest,
  testCase,
} from "../test-utils";

const testCases: testCase[] = [
  {
    comment: "only if",
    program: `
      public class Main {
        public static void main(String[] args) {
          if (4 < 5) {
            System.out.println("ok");
          }
          if (7 > 9) {
            System.out.println("uh oh");
          }
          if (100 >= 50) {
            System.out.println("done");
          }
        }
      }
    `,
    expectedLines: ["ok", "done"],
  },
  {
    comment: "if and else",
    program: `
      public class Main {
        public static void main(String[] args) {
          int x = 10, y = 5, z = 3;
          if (x < y + z) {
            System.out.println("This is incorrect");
          } else {
            System.out.println("This is expected");
          }

          if (x - y == y) {
            System.out.println("Correct");
          } else {
            System.out.println("Incorrect");
          }
        }
      }
    `,
    expectedLines: ["This is expected", "Correct"],
  },
  {
    comment: "chain of if elses",
    program: `
      public class Main {
        public static void main(String[] args) {
          int a = -1, b = 1;
          if (a > b) {
            System.out.println("-1 > 1");
          } else if (a == b) {
            System.out.println("-1 == 1");
          } else {
            System.out.println("Good");
          }

          if (a == b) {
            System.out.println("-1 == 1");
          } else if (a < b) {
            System.out.println("Nice");
          } else {
            System.out.println("shouldn't reach here");
          }

          if (a < b) {
            System.out.println("Ok");
          } else if (a == b) {
            System.out.println("shouldn't reach here");
          } else if (a > b) {
            System.out.println("shouldn't reach here");
          }
        }
      }
    `,
    expectedLines: ["Good", "Nice", "Ok"],
  }
];

export const ifElseTest = () => describe("if else statements", () => {
  for (let testCase of testCases) {
    const { comment: comment, program: program, expectedLines: expectedLines } = testCase;
    const expectedResult = expectedLines.join("\n") + "\n";
    it(comment, () => runTest(program, expectedResult));
  }
});