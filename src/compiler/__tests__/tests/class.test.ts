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
  {
    comment: "instance creation, default constructor",
    program: `
      public class Main {
        public static void main(String[] args) {
          Main a = new Main();
          System.out.println("ok");
        }
      }
    `,
    expectedLines: ["ok"],
  },
  {
    comment: "instance creation, custom constructor",
    program: `
      public class Main {
        public Main() {
          System.out.println("obj");
        }
        public Main(int x) {
          System.out.println(x);
        }
        public static void main(String[] args) {
          Main obj = new Main();
          Main obj2 = new Main(15);
          Main obj3 = new Main(51);
          Main obj4 = new Main();
        }
      }
    `,
    expectedLines: ["obj", "15", "51", "obj"],
  },
  {
    comment: "instance method",
    program: `
      public class Main {
        public void f() {
          System.out.println("in f");
        }
        public static void main(String[] args) {
          Main obj = new Main();
          obj.f();
        }
      }
    `,
    expectedLines: ["in f"],
  },
  {
    comment: "instance field",
    program: `
      public class Main {
        public int x;
        public static void main(String[] args) {
          Main obj = new Main();
          System.out.println(obj.x);
          obj.x = 45;
          System.out.println(obj.x);
          obj.x = 20;
          System.out.println(obj.x);
        }
      }
    `,
    expectedLines: ["0", "45", "20"],
  },
  {
    comment: "instance field and method",
    program: `
      public class Main {
        public int x;
        public void inc() {
          this.x += 1;
        }
        public void dec() {
          this.x -= 1;
        }
        public static void main(String[] args) {
          Main obj = new Main();
          obj.x = 100;
          System.out.println(obj.x);
          obj.inc();
          System.out.println(obj.x);
          obj.dec();
          System.out.println(obj.x);
        }
      }
    `,
    expectedLines: ["100", "101", "100"],
  },
];

export const classTest = () => describe("fields and methods of class", () => {
  for (let testCase of testCases) {
    const { comment: comment, program: program, expectedLines: expectedLines } = testCase;
    it(comment, () => runTest(program, expectedLines));
  }
});