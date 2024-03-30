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
  {
    comment: "allow same variable name declaration in different for init",
    program: `
      public class Main {
        public static void main(String[] args) {
          for (int i = -2; i <= 0; i++) {
            System.out.println(i);
          }
          for (int i = 3; i > 0; i--) {
            System.out.println(i);
          }
        }
      }
    `,
    expectedLines: ["-2", "-1", "0", "3", "2", "1"],
  },
  {
    comment: "allow declaration of same name after out of scope",
    program: `
      public class Main {
        public static void main(String[] args) {
          for (int i = -1; i <= 1; i++) {
            int x = 6;
            System.out.println(x + i);
          }
          int x = 10;
          System.out.println(x);
        }
      }
    `,
    expectedLines: ["5", "6", "7", "10"],
  },
];

export const variableDeclarationTest = () => describe("variable declaration", () => {
  for (let testCase of testCases) {
    const { comment: comment, program: program, expectedLines: expectedLines } = testCase;
    const expectedResult = expectedLines.join("\n") + "\n";
    it(comment, () => runTest(program, expectedResult));
  }
});