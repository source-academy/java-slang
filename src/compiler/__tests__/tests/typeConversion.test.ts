import {
  runTest,
  testCase,
} from "../__utils__/test-utils";

const testCases: testCase[] = [
  {
    comment: "int to float widening type",
    program: `
      public class Main {
        public static void main(String[] args) {
          int x = 1;
          float y = x;
          System.out.println(y);
        }
      }
    `,
    expectedLines: ["1.0"],
  }
];

export const typeConversionTest = () => describe("type conversion", () => {
  for (let testCase of testCases) {
    const { comment: comment, program: program, expectedLines: expectedLines } = testCase;
    it(comment, () => runTest(program, expectedLines));
  }
});
