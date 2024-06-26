import {
  runTest,
  testCase,
} from "../__utils__/test-utils";

const testCases: testCase[] = [
  {
    comment: "single increment/decrement statement",
    program: `
    public class Main {
      public static void main(String[] args) {
        int a = 1;
        int b = 2;

        ++a;
        b++;
        System.out.println(a);
        System.out.println(b);

        a--;
        --b;
        System.out.println(a);
        System.out.println(b);
      }
    }`,
    expectedLines: ["2", "3", "1", "2"],
  },
  {
    comment: "postfix increment/decrement",
    program: `
    public class Main {
      public static void main(String[] args) {
        int a = 1;
        int b = 2;
        int c = 3;
        int d = 4;
        int e = 5;
        int f = 6;

        System.out.println(a+b--);
        System.out.println(a);
        System.out.println(b);

        System.out.println(c-d++);
        System.out.println(c);
        
        System.out.println(d);

        System.out.println(e+++f);
        System.out.println(e);
        System.out.println(f);
      }
    }`,
    expectedLines: ["3", "1", "1", "-1", "3", "5", "11", "6", "6"],
  },
  {
    comment: "prefix increment/decrement",
    program: `
    public class Main {
      public static void main(String[] args) {
        int a = 1, b = 2, c = 3;
        System.out.println(a+(++b));
        System.out.println(a);
        System.out.println(b);

        System.out.println(--c);
        System.out.println(c);
        System.out.println(++c);
        System.out.println(c);
      }
    }`,
    expectedLines: ["4", "1", "3", "2", "2", "3", "3"],
  },
  {
    comment: "unary plus/minus",
    program: `
    public class Main {
      public static void main(String[] args) {
        int a = 10;
        System.out.println(a);
        System.out.println(+a);
        System.out.println(-a);
        System.out.println(+-a);
        System.out.println(-+a);
        System.out.println(+-+a);
        System.out.println(-+-a);
        System.out.println(+--a);
        System.out.println(-++a);
      }
    }`,
    expectedLines: ["10", "10", "-10", "-10", "-10", "-10", "10", "9", "-10"],
  },
  {
    comment: "bitwise complement",
    program: `
    public class Main {
      public static void main(String[] args) {
        int a = 1, b = 42;
        System.out.println(a);
        System.out.println(~a);
        System.out.println(~~a);
        System.out.println(~~~a);

        System.out.println(~b);
        System.out.println(-b - 1);
      }
    }`,
    expectedLines: ["1", "-2", "1", "-2", "-43", "-43"],
  },
];

export const unaryExpressionTest = () => describe("unary expression", () => {
  for (let testCase of testCases) {
    const { comment: comment, program: program, expectedLines: expectedLines } = testCase;
    it(comment, () => runTest(program, expectedLines));
  }
});
