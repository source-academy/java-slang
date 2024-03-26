import {
  runTest,
  testCase,
} from "../test-utils";

const testCases: testCase[] = [
  {
    comment: "array creation",
    program: `
      public class Main {
        public static void main(String[] args) {
          int a[] = {1, 2, 3};
          System.out.println("success");
        }
      }
    `,
    expectedLines: ["success"],
  },
  {
    comment: "array accesses",
    program: `
      public class Main {
        public static void main(String[] args) {
          int a[] = {1, 2, 3};
          System.out.println(a[0]);
          System.out.println(a[1]);
          System.out.println(a[2]);
        }
      }
    `,
    expectedLines: ["1", "2", "3"],
  },
  {
    comment: "array manipulation",
    program: `
      public class Main {
        public static void main(String[] args) {
          int a[] = {1, 2, 3};
          a[0] = 100;
          System.out.println(a[0]);
          a[1] = a[2] + 5;
          System.out.println(a[1]);
          a[2] += 7;
          System.out.println(a[2]);
        }
      }
    `,
    expectedLines: ["100", "8", "10"],
  },
  {
    comment: "sum of two arrays",
    program: `
      public class Main {
        public static void main(String[] args) {
          int a[] = {1, 2, 3, 4, 5};
          int b[] = {6, 7, 8, 9, 10};
          int c[] = {0, 0, 0, 0, 0};
          for (int i = 0; i < 5; i++) {
            c[i] = a[i] + b[i];
          }
          for (int j = 0; j < 5; j++) {
            System.out.println(c[j]);
          }
        }
      }
    `,
    expectedLines: ["7", "9", "11", "13", "15"],
  },
];

export const arrayTest = () => describe("arrays", () => {
  for (let testCase of testCases) {
    const { comment: comment, program: program, expectedLines: expectedLines } = testCase;
    const expectedResult = expectedLines.join("\n") + "\n";
    it(comment, () => runTest(program, expectedResult));
  }
});