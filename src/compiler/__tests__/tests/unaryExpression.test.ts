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
    comment: "increment/decrement on class fields",
    program: `
    public class Main {
      public static int g;
      public static int h;
      public static void main(String[] args) {
        g = 10;
        System.out.println(g);
        g++;
        System.out.println(g);
        ++g;
        System.out.println(g);

        h = 20;
        System.out.println(h);
        --h;
        System.out.println(h);
        h--;
        System.out.println(h);
      }
    }`,
    expectedLines: ["10", "11", "12", "20", "19", "18"],
  },
  {
    comment: "increment/decrement on instance fields",
    program: `
    public class Main {
      public int x;
      public void inc() {
        this.x++;
      }
      public void dec() {
        this.x--;
      }

      public static void main(String[] args) {
        Main m = new Main();
        System.out.println(m.x);
        m.inc();
        m.inc();
        System.out.println(m.x);
        m.x = 100;
        m.dec();
        System.out.println(m.x);
      }
    }`,
    expectedLines: ["0", "2", "99"],
  },
  {
    comment: "increment/decrement on arrays",
    program: `
    public class Main {
      public static void main(String[] args) {
        int[] arr = {1, 5, 10, 15, 20};
        arr[0]++;
        --arr[1];
        System.out.println(arr[0]);
        System.out.println(arr[1]);

        arr[3] = arr[2]++;
        arr[4] = --arr[2];
        System.out.println(arr[3]);
        System.out.println(arr[4]);
        System.out.println(arr[2]);
      }
    }`,
    expectedLines: ["2", "4", "10", "10", "10"],
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
