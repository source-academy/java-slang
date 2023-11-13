import {
  runTest,
  testCase,
} from "../test-utils";

const testCases: testCase[] = [
  {
    comment: "one int variable declaration",
    program: `
      public class Main {
        public static void main(String[] args) {
          int x = 1;
          System.out.println(x);
        }
      }
    `,
    expectedLines: ["1"],
  },
  {
    comment: "multiple int variable declaration",
    program: `
      public class Main {
        public static void main(String[] args) {
          int a = 1, b = 2, c = 3;
          System.out.println(a);
          System.out.println(b);
          System.out.println(c);
          int x = -123;
          System.out.println(x);
          int y = 9;
          System.out.println(y);
        }
      }
    `,
    expectedLines: ["1", "2", "3", "-123", "9"],
  },
];

export const variableDeclarationTest = () => describe("variable declaration", () => {
  for (let testCase of testCases) {
    const { comment: comment, program: program, expectedLines: expectedLines } = testCase;
    const expectedResult = expectedLines.join("\n") + "\n";
    it(comment, () => runTest(program, expectedResult));
  }
});