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
          int a = 1;
          int b = 2;
          int c = 3;
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
  {
    comment: "declaration of primitive types",
    program: `
      public class Main {
        public static void main(String[] args) {
          boolean b = true;
          char c = '4';
          double d = 167.5;
          float f = 3.2f;
          int i = 16777215;
          long l = 70000000000L;

          System.out.println(b);
          System.out.println(c);
          System.out.println(d);
          System.out.println(f);
          System.out.println(i);
          System.out.println(l);
        }
      }
    `,
    expectedLines: ["true", "4", "167.5", "3.2", "16777215", "70000000000"],
  },
];

export const variableDeclarationTest = () => describe("variable declaration", () => {
  for (let testCase of testCases) {
    const { comment: comment, program: program, expectedLines: expectedLines } = testCase;
    it(comment, () => runTest(program, expectedLines));
  }
});