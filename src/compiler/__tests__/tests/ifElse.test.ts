import {
  runTest,
  testCase,
} from "../test-utils";

const testCases: testCase[] = [
  {
    comment: "if without else",
    program: `
      public class Main {
        public static void main(String[] args) {
          if (4 < 5) {
            System.out.println("ok");
          }
          if (7 > 9) {
            System.out.println("uh oh");
          }
          if (100 >= 50) {
            System.out.println("done");
          }
        }
      }
    `,
    expectedLines: ["ok", "done"],
  },
  {
    comment: "if without else, trivial conditional expression",
    program: `
      public class Main {
        public static void main(String[] args) {
          if (true) {
            System.out.println("ok");
          }
          if (false) {
            System.out.println("uh oh");
          }
          if (true) {
            System.out.println("done");
          }
        }
      }
    `,
    expectedLines: ["ok", "done"],
  },
  {
    comment: "if and else",
    program: `
      public class Main {
        public static void main(String[] args) {
          int x = 10, y = 5, z = 3;
          if (x < y + z) {
            System.out.println("This is incorrect");
          } else {
            System.out.println("This is expected");
          }

          if (x - y == y) {
            System.out.println("Correct");
          } else {
            System.out.println("Incorrect");
          }
        }
      }
    `,
    expectedLines: ["This is expected", "Correct"],
  },
  {
    comment: "else follow innermost if",
    program: `
      public class Main {
        public static void main(String[] args) {
          int x = 7, y = 1;
          if (x == 7)
            if (y > 8)
              System.out.println("no way");
            else
              System.out.println("ok");
        }
      }
    `,
    expectedLines: ["ok"],
  },
  {
    comment: "chain of if elses",
    program: `
      public class Main {
        public static void main(String[] args) {
          int a = -1, b = 1;
          if (a > b) {
            System.out.println("-1 > 1");
          } else if (a == b) {
            System.out.println("-1 == 1");
          } else {
            System.out.println("Good");
          }

          if (a == b) {
            System.out.println("-1 == 1");
          } else if (a < b) {
            System.out.println("Nice");
          } else {
            System.out.println("shouldn't reach here");
          }

          if (a < b) {
            System.out.println("Ok");
          } else if (a == b) {
            System.out.println("shouldn't reach here");
          } else if (a > b) {
            System.out.println("shouldn't reach here");
          }
        }
      }
    `,
    expectedLines: ["Good", "Nice", "Ok"],
  },
  {
    comment: "logical and",
    program: `
      public class Main {
        public static void main(String[] args) {
          int x = 10, y = 5, z = 3;
          if (x > y && y > z) {
            System.out.println("Yes1");
          } else {
            System.out.println("No");
          }

          if (x > y && y <= 4) {
            System.out.println("No");
          } else {
            System.out.println("Yes2");
          }

          if (x < y && y > z) {
            System.out.println("No");
          } else {
            System.out.println("Yes3");
          }

          if (x < y && y <= 4) {
            System.out.println("No");
          } else {
            System.out.println("Yes4");
          }
        }
      }
    `,
    expectedLines: ["Yes1", "Yes2", "Yes3", "Yes4"],
  },
  {
    comment: "logical or",
    program: `
      public class Main {
        public static void main(String[] args) {
          int x = 7, y = 5, z = 2;
          if (x > y || y > z) {
            System.out.println("Yes1");
          } else {
            System.out.println("No");
          }

          if (x > y || y <= 4) {
            System.out.println("Yes2");
          } else {
            System.out.println("No");
          }

          if (x < y || y > z) {
            System.out.println("Yes3");
          } else {
            System.out.println("No");
          }

          if (x < y || y <= 4) {
            System.out.println("No");
          } else {
            System.out.println("Yes4");
          }
        }
      }
    `,
    expectedLines: ["Yes1", "Yes2", "Yes3", "Yes4"],
  },
  {
    comment: "logical not",
    program: `
      public class Main {
        public static void main(String[] args) {
          int x = 7, y = 5, z = 2;

          if (!(x < y)) {
            System.out.println("Yes1");
          } else {
            System.out.println("No");
          }

          if (!(z <= y)) {
            System.out.println("No");
          } else {
            System.out.println("Yes2");
          }
        }
      }
    `,
    expectedLines: ["Yes1", "Yes2"],
  },
  {
    comment: "complex conditional expression",
    program: `
      public class Main {
        public static void main(String[] args) {
          if (4 <= 4 && (!(1 <= 2) || 9 > 5) ) {
            System.out.println("Yes");
          } else {
            System.out.println("No");
          }
        
          if (!(8 > 3 || !(7 < 9))) {
            System.out.println("No");
          } else {
            System.out.println("Yes2");
          }
        }
      }
    `,
    expectedLines: ["Yes", "Yes2"],
  },
  {
    comment: "nested if else",
    program: `
      public class Main {
        public static void main(String[] args) {
          int a = 5, b = 10, c = 15;
          if (a == 5) {
            if (b < c) {
              System.out.println("Yes");
            } else {
              System.out.println("No");
            }
            if (c < b) {
              System.out.println("No");
            } else {
              System.out.println("Yes");
            }
          } else {
            System.out.println("No");
          }
        
          if (b != 10) {
            System.out.println("No");
          } else if (b <= 10) {
            if (b < c) {
              System.out.println("Yes");
            } else {
              System.out.println("No");
            }
            if (c < b) {
              System.out.println("No");
            } else {
              System.out.println("Yes");
            }
          } else {
            System.out.println("No");
          }
        }
      }
    `,
    expectedLines: ["Yes", "Yes", "Yes", "Yes"],
  },
  {
    comment: "ternary operators",
    program: `
      public class Main {
        public static void main(String[] args) {
          int a = 5, b = 10, c = 15;
          System.out.println(a < b ? c : -c);
          System.out.println(a < b ? b > c ? c : -c : 0);
        }
      }
    `,
    expectedLines: ["15", "-15"],
  },
  {
    comment: "conditional expression involving null",
    program: `
      public class Main {
        public static void main(String[] args) {
          Main m = null;
          if (m == null) {
            System.out.println("m is null");
          } else {
            System.out.println("uh oh");
          }
          if (null == null) {
            System.out.println("null is null");
          } else {
            System.out.println("uh oh");
          }

          Main obj = new Main();
          if (null == obj) {
            System.out.println("uh oh");
          } else {
            System.out.println("obj not null");
          }
          if (null != null) {
            System.out.println("uh oh");
          } else {
            System.out.println("null is still null");
          }
        }
      }
    `,
    expectedLines: ["m is null", "null is null", "obj not null", "null is still null"],
  },
];

export const ifElseTest = () => describe("if else statements", () => {
  for (let testCase of testCases) {
    const { comment: comment, program: program, expectedLines: expectedLines } = testCase;
    it(comment, () => runTest(program, expectedLines));
  }
});