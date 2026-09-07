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
  {
    comment: "int to long",
    program: `
      public class Main {
        public static void main(String[] args) {
          int a = 123;
          long b = a;
          System.out.println(b);
        }
      }
    `,
    expectedLines: ["123"],
  },
  {
    comment: "int to float",
    program: `
      public class Main {
        public static void main(String[] args) {
          int a = 123;
          float b = a;
          System.out.println(b);
        }
      }
    `,
    expectedLines: ["123.0"],
  },

  // long -> other types
  {
    comment: "long to float",
    program: `
      public class Main {
        public static void main(String[] args) {
          long a = 9223372036854775807L;
          float b = a;
          System.out.println(b);
        }
      }
    `,
    expectedLines: ["9.223372E18"],
  },
  {
    comment: "long to double",
    program: `
      public class Main {
        public static void main(String[] args) {
          long a = 9223372036854775807L;
          double b = a;
          System.out.println(b);
        }
      }
    `,
    expectedLines: ["9.223372036854776E18"],
  },

  // float -> other types
  {
    comment: "float to double",
    program: `
      public class Main {
        public static void main(String[] args) {
          float a = 3.0f;
          double b = a;
          System.out.println(b);
        }
      }
    `,
    expectedLines: ["3.0"],
  },
];

export const assignmentExpressionTest = () => describe("assignment expression", () => {
  for (let testCase of testCases) {
    const { comment: comment, program: program, expectedLines: expectedLines } = testCase;
    it(comment, () => runTest(program, expectedLines));
  }
});
