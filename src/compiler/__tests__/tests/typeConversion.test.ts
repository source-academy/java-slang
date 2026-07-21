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
          float f = 1.0f;
          int x = (int) f;
          System.out.println(x);
        }
      }
    `,
    expectedLines: ["1"],
  }
];

export const typeConversionTest = () => describe("type conversion", () => {
  for (let testCase of testCases) {
    const { comment: comment, program: program, expectedLines: expectedLines } = testCase;
    it(comment, () => runTest(program, expectedLines));
  }
});
