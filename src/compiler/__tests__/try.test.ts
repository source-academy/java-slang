import { runTest, testCase } from "./__utils__/test-utils";

const testCases: testCase[] = [
  {
    comment: "try/catch block without exception",
    program: `
      public class Main {
        public static void main(String[] args) {
          try {
            System.out.println(1);
          } catch (Exception e) {
            System.out.println(2);
          }
          System.out.println(0);
        }
      }
    `,
    expectedLines: ["1", "0"],
  },
];

describe("try/catch", () => {
  for (const testCase of testCases) {
    it(testCase.comment, () => runTest(testCase.program, testCase.expectedLines));
  }
});
