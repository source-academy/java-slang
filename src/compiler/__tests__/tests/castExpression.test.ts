import {
  runTest,
  testCase,
} from "../__utils__/test-utils";

const testCases: testCase[] = [
  {
    comment: "Simple primitive casting: int to float",
    program: `
      public class Main {
        public static void main(String[] args) {
          int a = 5;
          float b = (float) a;
          System.out.println(b);
        }
      }
    `,
    expectedLines: ["5.0"],
  },
  {
    comment: "Simple primitive casting: float to int",
    program: `
      public class Main {
        public static void main(String[] args) {
          float a = 2.9f;
          int b = (int) a;
          System.out.println(b);
        }
      }
    `,
    expectedLines: ["2"],
  },
  {
    comment: "Primitive casting: double to long",
    program: `
      public class Main {
        public static void main(String[] args) {
          double a = 123456789.987;
          long b = (long) a;
          System.out.println(b);
        }
      }
    `,
    expectedLines: ["123456789"],
  },
  {
    comment: "Primitive casting: long to byte",
    program: `
      public class Main {
        public static void main(String[] args) {
          long a = 257;
          byte b = (byte) a;
          System.out.println(b);
        }
      }
    `,
    expectedLines: ["1"], // byte wraps around at 256
  },
  {
    comment: "Primitive casting: char to int",
    program: `
      public class Main {
        public static void main(String[] args) {
          char a = 'A';
          int b = (int) a;
          System.out.println(b);
        }
      }
    `,
    expectedLines: ["65"],
  },
  {
    comment: "Primitive casting: int to char",
    program: `
      public class Main {
        public static void main(String[] args) {
          int a = 65;
          char b = (char) a;
          System.out.println(b);
        }
      }
    `,
    expectedLines: ["A"],
  },
  {
    comment: "Primitive casting: int to char",
    program: `
      public class Main {
        public static void main(String[] args) {
          int a = 66;
          char b = (char) a;
          System.out.println(b);
        }
      }
    `,
    expectedLines: ["B"],
  },
  {
    comment: "Primitive casting with loss of precision",
    program: `
      public class Main {
        public static void main(String[] args) {
          double a = 123.456;
          int b = (int) a;
          System.out.println(b);
        }
      }
    `,
    expectedLines: ["123"],
  },
  {
    comment: "Primitive casting: float to short",
    program: `
      public class Main {
        public static void main(String[] args) {
          float a = 32768.0f;
          short b = (short) a;
          System.out.println(b);
        }
      }
    `,
    expectedLines: ["-32768"], // short wraps around
  },
  {
    comment: "Chained casting: double to int to byte",
    program: `
      public class Main {
        public static void main(String[] args) {
          double a = 258.99;
          int b = (int) a;
          byte c = (byte) b;
          System.out.println(c);
        }
      }
    `,
    expectedLines: ["2"], // 258 -> byte wraps around
  },
];

export const castExpressionTest = () => describe("cast expression", () => {
  for (let testCase of testCases) {
    const { comment: comment, program: program, expectedLines: expectedLines } = testCase;
    it(comment, () => runTest(program, expectedLines));
  }
});