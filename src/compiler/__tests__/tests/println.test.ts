import {
  runTest,
  testCase,
} from "../test-utils";

const testCases: testCase[] = [
  {
    comment: "println with String argument",
    program: `
      public class Main {
        public static void main(String[] args) {
          System.out.println("Hello world!");
          System.out.println("Java");
        }
      }
    `,
    expectedLines: ["Hello world!", "Java"],
  },
  {
    comment: "println with int argument",
    program: `
      public class Main {
        public static void main(String[] args) {
          System.out.println(100);
          System.out.println(-1);
          System.out.println(0);
          System.out.println(1);
        }
      }
    `,
    expectedLines: ["100", "-1", "0", "1"],
  },
  {
    comment: "println with float argument",
    program: `
      public class Main {
        public static void main(String[] args) {
          System.out.println(1.0f);
          System.out.println(4.1f);
          System.out.println(10.7f);
          System.out.println(-12.6f);
        }
      }
    `,
    expectedLines: ["1.0", "4.1", "10.7", "-12.6"],
  },
  {
    comment: "println with long argument",
    program: `
      public class Main {
        public static void main(String[] args) {
          System.out.println(1L);
          System.out.println(10l);
          System.out.println(100L);
          System.out.println(10000000000L);
        }
      }
    `,
    expectedLines: ["1", "10", "100", "10000000000"],
  },
  {
    comment: "println with double argument",
    program: `
      public class Main {
        public static void main(String[] args) {
          System.out.println(10.3);
          System.out.println(0.1);
          System.out.println(1.0);
          System.out.println(-12.6);
        }
      }
    `,
    expectedLines: ["10.3", "0.1", "1.0", "-12.6"],
  },
  {
    comment: "multiple println statements",
    program: `
      public class Main {
        public static void main(String[] args) {
          System.out.println("This is a test.");
          System.out.println(123);
          System.out.println("Another test with additional line\\n");
          System.out.println(321);
        }
      }
    `,
    expectedLines: ["This is a test.", "123", "Another test with additional line\n", "321"],
  }
];

export const printlnTest = () => describe("println", () => {
  for (let testCase of testCases) {
    const { comment: comment, program: program, expectedLines: expectedLines } = testCase;
    const expectedResult = expectedLines.join("\n") + "\n";
    it(comment, () => runTest(program, expectedResult));
  }
});