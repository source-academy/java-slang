import {
  runTest,
  testCase,
} from "../__utils__/test-utils";

const testCases: testCase[] = [
  {
    comment: "basic for loop",
    program: `
      public class Main {
        public static void main(String[] args) {
          for (int i = 0; i < 5; i = i + 1) {
            System.out.println(i);
          }
          for (int j = -1; j <= 1; j += 1)
            System.out.println(j);
        }
      }
    `,
    expectedLines: ["0", "1", "2", "3", "4", "-1", "0", "1"],
  },
  {
    comment: "for loop without init",
    program: `
      public class Main {
        public static void main(String[] args) {
          int count = 10;
          for (; count > 0; count -= 3) {
            System.out.println(count);
          }
        }
      }
    `,
    expectedLines: ["10", "7", "4", "1"],
  },
  {
    comment: "for loop without update",
    program: `
      public class Main {
        public static void main(String[] args) {
          for (int g = 0; g < 10;) {
            System.out.println(g);
            g += 2;
          }
        }
      }
    `,
    expectedLines: ["0", "2", "4", "6", "8"],
  },
  {
    comment: "for loop with if",
    program: `
      public class Main {
        public static void main(String[] args) {
          int count = 10, n = 150;
          for (int x = 0; x < 100; x += 1) {
            count += 1;
            n -= 1;
            if (count == 70) {
              System.out.println("count is now 70");
            } else if (n == 70) {
              System.out.println("n is now 70");
            }
            if (x == 70) {
              System.out.println("x is now 70");
            }
          }
          System.out.println(count);
          System.out.println(n);
        }
      }
    `,
    expectedLines: ["count is now 70", "x is now 70", "n is now 70", "110", "50"],
  },
  {
    comment: "2 level nested for loops, part 1",
    program: `
      public class Main {
        public static void main(String[] args) {
          for (int x = 0; x < 3; x += 1) {
            for (int y = 0; y < 3; y += 1) {
              System.out.println(x);
              System.out.println(y);
            }
          }
        }
      }
    `,
    expectedLines: ["0", "0", "0", "1", "0", "2", "1", "0", "1", "1", "1", "2", "2", "0", "2", "1", "2", "2",],
  },
  {
    comment: "2 level nested for loops, part 2",
    program: `
      public class Main {
        public static void main(String[] args) {
          for (int x = -1; x <= 1; x++) {
            for (int y = 1; y >= -1; y--) {
              System.out.println(x);
              System.out.println(y);
            }
          }
        }
      }
    `,
    expectedLines: ["-1", "1", "-1", "0", "-1", "-1", "0", "1", "0", "0", "0", "-1", "1", "1", "1", "0", "1", "-1",],
  },
  {
    comment: "for loops with break statement",
    program: `
      public class Main {
        public static void main(String[] args) {
          for (int i = -2; i <= 2; i++) {
            System.out.println(i);
            if (i == 0) {
              break;
            }
          }
        }
      }
    `,
    expectedLines: ["-2", "-1", "0"],
  },
  {
    comment: "for loops with continue statement",
    program: `
      public class Main {
        public static void main(String[] args) {
          for (int i = -2; i <= 2; i++) {
            if (i == 0) {
              continue;
            }
            System.out.println(i);
          }
        }
      }
    `,
    expectedLines: ["-2", "-1", "1", "2"],
  },
  {
    comment: "for loops with break/continue statements",
    program: `
      public class Main {
        public static void main(String[] args) {
          for (int x = -1; x <= 1; x++) {
            if (x == 0) {
              continue;
            }
            for (int y = 1; y >= -1; y--) {
              System.out.println(x);
              System.out.println(y);
              if (y == 0) {
                break;
              }
            }
          }
        }
      }
    `,
    expectedLines: ["-1", "1", "-1", "0", "1", "1", "1", "0"],
  }
];

export const forTest = () => describe("for statements", () => {
  for (let testCase of testCases) {
    const { comment: comment, program: program, expectedLines: expectedLines } = testCase;
    it(comment, () => runTest(program, expectedLines));
  }
});
