import {
  runTest,
  testCase,
} from "../test-utils";

const testCases: testCase[] = [
  {
    comment: "multiple class methods",
    program: `
      public class Main {
        public static void f() {
          System.out.println("In f");
        }
        public static void g() {
          System.out.println("In g");
        }
        public static void main(String[] args) {
          System.out.println("In main");
          f();
          Main.g();
          System.out.println("In main");
        }
      }
    `,
    expectedLines: ["In main", "In f", "In g", "In main"],
  },
  {
    comment: "recursive method",
    program: `
      public class Main {
        public static void f(int x) {
          if (x >= 0) {
            System.out.println(x);
            f(x - 1);
          }
        }
        public static void main(String[] args) {
          f(2);
        }
      }
    `,
    expectedLines: ["2", "1", "0"],
  }
];

export const methodInvocationTest = () => describe("method invocations", () => {
  for (let testCase of testCases) {
    const { comment: comment, program: program, expectedLines: expectedLines } = testCase;
    const expectedResult = expectedLines.join("\n") + "\n";
    it(comment, () => runTest(program, expectedResult));
  }
});