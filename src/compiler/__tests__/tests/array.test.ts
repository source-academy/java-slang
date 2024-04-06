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
          int[] a = {1, 2, 3};
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
          int[] a = {1, 2, 3};
          System.out.println(a[0]);
          System.out.println(a[1]);
          System.out.println(a[2]);
        }
      }
    `,
    expectedLines: ["1", "2", "3"],
  },
  {
    comment: "array length",
    program: `
      public class Main {
        public static void main(String[] args) {
          int[] a = {};
          int[] b = {4, 6, 7};
          int[] c = {3};
          int[] d = {11, 99};

          System.out.println(a.length);
          System.out.println(b.length);
          System.out.println(c.length);
          System.out.println(d.length);
        }
      }
    `,
    expectedLines: ["0", "3", "1", "2"],
  },
  {
    comment: "array manipulation",
    program: `
      public class Main {
        public static void main(String[] args) {
          int[] a = {1, 2, 3};
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
          int[] a = {1, 2, 3, 4, 5};
          int[] b = {6, 7, 8, 9, 10};
          int[] c = {0, 0, 0, 0, 0};
          for (int i = 0; i < 5; i++) {
            c[i] = a[i] + b[i];
          }
          for (int j = 0; j < c.length; j++) {
            System.out.println(c[j]);
          }
        }
      }
    `,
    expectedLines: ["7", "9", "11", "13", "15"],
  },
  {
    comment: "pass array to and from function",
    program: `
      public class Main {
        public static void printArr(int[] a) {
          for (int i = 0; i < a.length; i++) {
            System.out.println(a[i]);
          }
        }

        public static int[] getSampleArr() {
          int[] arr = {3, 1, 4, 1, 5, 9};
          return arr;
        }

        public static void main(String[] args) {
          int[] a = {1, 2, 3, 4, 5};
          printArr(a);

          a = getSampleArr();
          printArr(a);
        }
      }
    `,
    expectedLines: ["1", "2", "3", "4", "5", "3", "1", "4", "1", "5", "9"],
  },
];

export const arrayTest = () => describe("arrays", () => {
  for (let testCase of testCases) {
    const { comment: comment, program: program, expectedLines: expectedLines } = testCase;
    const expectedResult = expectedLines.join("\n") + "\n";
    it(comment, () => runTest(program, expectedResult));
  }
});