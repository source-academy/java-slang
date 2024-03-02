import {
  runTest,
  testCase,
} from "../test-utils";

const testCases: testCase[] = [
  {
    comment: "static field",
    program: `
      public class Main {
        public static int f;

        public static void main(String[] args) {
          System.out.println(Main.f);
          Main.f = 10;
          System.out.println(Main.f);
          Main.f = 20;
          System.out.println(Main.f);
        }
      }
    `,
    expectedLines: ["0", "10", "20"],
  },
  {
    comment: "static field, simple name",
    program: `
      public class Main {
        public static int f;

        public static void main(String[] args) {
          System.out.println(f);
          f = 10;
          System.out.println(f);
          f = 20;
          System.out.println(Main.f);
        }
      }
    `,
    expectedLines: ["0", "10", "20"],
  },
  {
    comment: "allow declaration of same name for field and method",
    program: `
      public class Main {
        public static int f;
        public static void f() {
          System.out.println("in f");
        }

        public static void main(String[] args) {
          Main.f();
          System.out.println("ok");
          System.out.println(Main.f);
        }
      }
    `,
    expectedLines: ["in f", "ok", "0"],
  },
];

export const classTest = () => describe("fields and methods of class", () => {
  for (let testCase of testCases) {
    const { comment: comment, program: program, expectedLines: expectedLines } = testCase;
    const expectedResult = expectedLines.join("\n") + "\n";
    it(comment, () => runTest(program, expectedResult));
  }
});