import {
  runTest,
  testCase,
} from "../__utils__/test-utils";
import * as peggy from "peggy";
import { compile } from "../../index";
import { AST } from "../../../ast/types/packages-and-modules";
import { javaPegGrammar } from "../../grammar";
import { peggyFunctions } from "../../peggy-functions";

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
    comment: "instance field with an inline initializer",
    program: `
      public class Main {
        public int one = 1;
        public static void main(String[] args) {
          Main m = new Main();
          System.out.println(m.one);
        }
      }
    `,
    expectedLines: ["1"],
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
  {
    comment: "instance method using this keyword",
    program: `
      public class Main {
        public void f() {
          System.out.println("In f");
        }
        public void g() {
          System.out.println("In g");
        }

        public void print() {
          this.f();
          System.out.println("In print");
          this.g();
        }

        public static void main(String[] args) {
          Main m = new Main();
          m.print();
        }
      }
    `,
    expectedLines: ["In f", "In print", "In g"],
  },
  {
    comment: "concrete subclasses of abstract classes can be instantiated",
    program: `
      abstract class Shape {
        public abstract int sides();
        public abstract String name();
        public String describe() { return name() + " has " + sides() + " sides"; }
      }
      class Triangle extends Shape {
        public int sides() { return 3; }
        public String name() { return "triangle"; }
      }
      abstract class Polygon extends Shape {
        public String name() { return "polygon"; }
      }
      class Square extends Polygon {
        public int sides() { return 4; }
      }
      public class Main {
        public static void main(String[] args) {
          Shape t = new Triangle();
          Shape s = new Square();
          System.out.println(t.describe());
          System.out.println(s.describe());
          Polygon p = new Square();
          Shape asShape = p;
          System.out.println(asShape.sides());
        }
      }
    `,
    expectedLines: ["triangle has 3 sides", "polygon has 4 sides", "4"],
  },
];

export const classTest = () => describe("fields and methods of class", () => {
  for (let testCase of testCases) {
    const { comment: comment, program: program, expectedLines: expectedLines } = testCase;
    it(comment, () => runTest(program, expectedLines));
  }

  describe("rejects instantiations that Java does not allow", () => {
    const classes = `
      abstract class Shape {
        public abstract int sides();
      }
      abstract class Polygon extends Shape {}
      class Square extends Polygon {
        public int sides() { return 4; }
      }
      enum Color { RED, GREEN }
    `;
    const compileWithClasses = (body: string) => {
      const parser = peggy.generate(peggyFunctions + javaPegGrammar, {
        allowedStartRules: ["CompilationUnit"],
      });
      return compile(
        parser.parse(`
          ${classes}
          public class Main {
            public static void main(String[] args) {
              ${body}
            }
          }
        `) as AST
      );
    };

    const rejected: [string, string, RegExp][] = [
      ["an abstract class", "Shape s = new Shape();", /Shape is abstract; cannot be instantiated/],
      ["an abstract subclass of an abstract class", "Polygon p = new Polygon();", /Polygon is abstract/],
      ["an abstract class in an array initializer", "Shape[] shapes = {new Shape()};", /Shape is abstract/],
      ["an abstract class passed as an argument", "System.out.println(new Shape());", /Shape is abstract/],
      ["an abstract library class", "Number n = new Number();", /Number is abstract/],
      ["a library interface", "Runnable r = new Runnable();", /Runnable is abstract/],
      ["an enum", "Color c = new Color();", /enum classes may not be instantiated/],
    ];
    for (const [comment, body, message] of rejected) {
      it(`rejects instantiating ${comment}`, () =>
        expect(() => compileWithClasses(body)).toThrow(message));
    }

    it("still allows a concrete subclass", () =>
      expect(() => compileWithClasses("Shape s = new Square(); Polygon p = new Square();")).not.toThrow());
    it("still allows a concrete library class", () =>
      expect(() => compileWithClasses("StringBuilder b = new StringBuilder();")).not.toThrow());
  });
});
