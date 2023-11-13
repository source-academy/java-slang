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