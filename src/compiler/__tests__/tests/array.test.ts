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
  {
    comment: "array of float",
    program: `
      public class Main {
        public static void main(String[] args) {
          float[] b = {1.1f, 8.8f, 3.14f};
          for (int i = 0; i < b.length; i++) {
            System.out.println(b[i]);
          }
        }
      }
    `,
    expectedLines: ["1.1", "8.8", "3.14"],
  },
  {
    comment: "array of long",
    program: `
      public class Main {
        public static void main(String[] args) {
          long[] a = {3L, 5L, 7L};
          for (int i = 0; i < a.length; i++) {
            System.out.println(a[i]);
          }
        }
      }
    `,
    expectedLines: ["3", "5", "7"],
  },
  {
    comment: "array of double",
    program: `
      public class Main {
        public static void main(String[] args) {
          double[] b = {3.3, 5.5, 7.9};
          for (int i = 0; i < b.length; i++) {
            System.out.println(b[i]);
          }
        }
      }
    `,
    expectedLines: ["3.3", "5.5", "7.9"],
  },
  {
    comment: "array of boolean",
    program: `
      public class Main {
        public static void main(String[] args) {
          boolean[] a = {true, false, false, true};
          for (int i = 0; i < a.length; i++) {
            System.out.println(a[i]);
          }
        }
      }
    `,
    expectedLines: ["true", "false", "false", "true"],
  },
  {
    comment: "array of char",
    program: `
      public class Main {
        public static void main(String[] args) {
          char[] a = {'J', 'a', 'v', 'a'};
          for (int i = 0; i < a.length; i++) {
            System.out.println(a[i]);
          }
        }
      }
    `,
    expectedLines: ["J", "a", "v", "a"],
  },
  {
    comment: "array of reference type",
    program: `
      public class Main {
        public int data;
        Main(int data) {
          this.data = data;
        }
        public static void main(String[] args) {
          Main[] a = {new Main(7), new Main(2), new Main(5), new Main(6)};
          for (int i = 0; i < a.length; i++) {
            Main m = a[i];
            System.out.println(m.data);
          }
        }
      }
    `,
    expectedLines: ["7", "2", "5", "6"],
  },
];

export const arrayTest = () => describe("arrays", () => {
  for (let testCase of testCases) {
    const { comment: comment, program: program, expectedLines: expectedLines } = testCase;
    const expectedResult = expectedLines.join("\n") + "\n";
    it(comment, () => runTest(program, expectedResult));
  }
});