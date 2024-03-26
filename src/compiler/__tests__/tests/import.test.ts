import {
  runTest,
  testCase,
} from "../test-utils";

const testCases: testCase[] = [
  {
    comment: "default import java.lang.*, part 1",
    program: `
      import java.lang.*;

      public class Main {
        public static void main(String[] args) {
          System.out.println("test");
        }
      }
    `,
    expectedLines: ["test"],
  },
  {
    comment: "default import java.lang.*, part 2",
    program: `
      import java.lang.System;

      public class Main {
        public static void main(String[] args) {
          System.out.println("TEST");
        }
      }
    `,
    expectedLines: ["TEST"],
  },
];

export const importTest = () => describe("imports", () => {
  for (let testCase of testCases) {
    const { comment: comment, program: program, expectedLines: expectedLines } = testCase;
    const expectedResult = expectedLines.join("\n") + "\n";
    it(comment, () => runTest(program, expectedResult));
  }
});