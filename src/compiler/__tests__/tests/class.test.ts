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
    comment: "array initializers in instance and static fields",
    program: `
      public class Main {
        public int[] nums = {10, 20, 30};
        public static String[] names = {"a", "b" + "c"};
        public double[] ds = {1, 2.5f, 'a'};
        public long[] ls = {1, 2, 3};
        public char[] cs = {'x', 'y'};
        public boolean[] bs = {true, false};
        public int[] empty = {};
        public int[][] grid = {{1, 2}, {3}, {}};
        public static String[][] table = {{"p", "q"}, {"r"}};
        public Object[] objs = {"s", 1, null};
        public int first = nums[0];

        public static void main(String[] args) {
          Main m = new Main();
          System.out.println(m.nums.length + " " + m.nums[0] + " " + m.nums[2]);
          System.out.println(names[0] + names[1] + " " + names.length);
          System.out.println(m.ds[0] + " " + m.ds[1] + " " + m.ds[2]);
          System.out.println(m.ls[2]);
          System.out.println(m.cs[1]);
          System.out.println(m.bs[0] + " " + m.bs[1]);
          System.out.println(m.empty.length);
          int[] row0 = m.grid[0];
          int[] row1 = m.grid[1];
          int[] row2 = m.grid[2];
          System.out.println(m.grid.length + " " + row0[1] + " " + row1[0] + " " + row2.length);
          String[] t0 = table[0];
          String[] t1 = table[1];
          System.out.println(t0[1] + t1[0] + " " + t1.length);
          System.out.println(m.objs.length + " " + m.objs[0] + " " + m.objs[1] + " " + m.objs[2]);
          System.out.println(m.first);
          m.nums[1] += 5;
          Main m2 = new Main();
          System.out.println(m.nums[1] + " " + m2.nums[1]);
        }
      }
    `,
    expectedLines: [
      "3 10 30",
      "abc 2",
      "1.0 2.5 97.0",
      "3",
      "y",
      "true false",
      "0",
      "3 2 3 0",
      "qr 1",
      "3 s 1 null",
      "10",
      "25 20",
    ],
  },
  {
    comment: "array initializers in fields run for every constructor and in subclasses",
    program: `
      class Base {
        protected int[] data = {1, 2, 3};
        public Base() { data[0] = 100; }
        public Base(int x) { data[0] = x; }
      }
      class Derived extends Base {
        public int[] extra = {7, 8};
        public Derived() { data[1] = 200; }
        public int sum() { return data[0] + data[1] + data[2] + extra[0] + extra[1]; }
      }
      public class Main {
        public static void main(String[] args) {
          Derived d = new Derived();
          System.out.println(d.sum());
          Base b = new Base(5);
          System.out.println(b.data[0] + " " + b.data[1]);
        }
      }
    `,
    expectedLines: ["318", "5 2"],
  },
  {
    comment: "abstract methods implemented across several levels, and by overloads",
    program: `
      abstract class Animal {
        public abstract String sound();
        public abstract int legs(int pairs);
        public abstract void greet(String who, int[] times);
        public void show() { System.out.println(sound() + " " + legs(2)); }
      }
      abstract class Pet extends Animal {
        public String sound() { return "purr"; }
        public abstract String owner();
      }
      class Cat extends Pet {
        public int legs(int pairs) { return pairs * 2; }
        public int legs(String s) { return -1; }
        public void greet(String who, int[] times) { System.out.println("hi " + who + times.length); }
        public String owner() { return "me"; }
      }
      class LoudCat extends Cat {
        public String sound() { return "MEOW"; }
      }
      abstract class Base { public abstract int value(); }
      abstract class Middle extends Base { public int value() { return 1; } }
      abstract class Redeclared extends Middle { public abstract int value(); }
      class Concrete extends Redeclared { public int value() { return 3; } }
      public class Main {
        public static void main(String[] args) {
          Animal c = new Cat();
          c.show();
          Animal l = new LoudCat();
          l.show();
          int[] t = {1, 2};
          l.greet("bob", t);
          Base b = new Concrete();
          System.out.println(b.value());
        }
      }
    `,
    expectedLines: ["purr 4", "MEOW 4", "hi bob2", "3"],
  },
  {
    comment: "classes extending library classes can be upcast, downcast and inherit library methods",
    program: `
      class Child extends Mid { }
      class Mid extends Number {
        public int intValue() { return 1; }
        public long longValue() { return 2L; }
        public float floatValue() { return 3f; }
        public double doubleValue() { return 4.0; }
      }
      class MyEx extends Exception {
        public MyEx() { }
        public String extra() { return "extra"; }
      }
      class Counter extends Object {
        public int hashCode() { return 42; }
      }
      public class Main {
        static class Inner extends Number {
          public int intValue() { return 5; }
          public long longValue() { return 6L; }
          public float floatValue() { return 7f; }
          public double doubleValue() { return 8.0; }
        }
        public static void main(String[] args) {
          Number n = new Child();
          Number m = new Inner();
          System.out.println(n.longValue() + " " + m.doubleValue());
          Mid back = (Mid) n;
          System.out.println(back.intValue());
          MyEx e = new MyEx();
          System.out.println(e.getMessage());
          System.out.println(e.extra());
          System.out.println(e);
          Throwable t = e;
          System.out.println(t.getMessage());
          Counter c = new Counter();
          Object o = c;
          System.out.println(o.hashCode());
        }
      }
    `,
    expectedLines: ["2 8.0", "1", "null", "extra", "MyEx", "null", "42"],
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


    describe("abstract methods", () => {
      const compileProgram = (declarations: string) => {
        const parser = peggy.generate(peggyFunctions + javaPegGrammar, {
          allowedStartRules: ["CompilationUnit"],
        });
        return compile(
          parser.parse(`
            ${declarations}
            public class Main {
              public static void main(String[] args) {}
            }
          `) as AST
        );
      };
      const rejectedDeclarations: [string, string, RegExp][] = [
        [
          "a non-abstract class declaring an abstract method",
          "class A { public abstract void f(); }",
          /A is not abstract and does not override abstract method f\(\) in A/,
        ],
        [
          "a non-abstract class declaring an abstract method with parameters",
          "class A { abstract int f(int x, String[] s); }",
          /abstract method f\(int,String\[\]\) in A/,
        ],
        [
          "an unimplemented abstract method of the parent",
          "abstract class A { public abstract void f(); } class B extends A {}",
          /B is not abstract and does not override abstract method f\(\) in A/,
        ],
        [
          "an unimplemented method with parameters",
          "abstract class A { abstract void f(int x, double[] d, String s); } class B extends A {}",
          /abstract method f\(int,double\[\],String\) in A/,
        ],
        [
          "an overload with other parameter types",
          "abstract class A { abstract void f(int x); } class B extends A { void f(long x) {} }",
          /abstract method f\(int\) in A/,
        ],
        [
          "an abstract method inherited through an abstract middle class",
          "abstract class A { abstract void f(); } abstract class M extends A {} class B extends M {}",
          /B is not abstract .* f\(\) in A/,
        ],
        [
          "a method redeclared abstract by an intermediate class",
          "abstract class A { void f() {} } abstract class M extends A { abstract void f(); } class B extends M {}",
          /B is not abstract .* f\(\) in M/,
        ],
        [
          "a static method that does not implement it",
          "abstract class A { abstract void f(); } class B extends A { static void f() {} }",
          /abstract method f\(\) in A/,
        ],
        [
          "a private method that does not implement it",
          "abstract class A { abstract void f(); } class B extends A { private void f() {} }",
          /abstract method f\(\) in A/,
        ],
        [
          "an unimplemented abstract method of a library class",
          "class N extends Number { public int intValue() { return 1; } }",
          /N is not abstract and does not override abstract method \w+\(\) in Number/,
        ],
      ];
      for (const [comment, declarations, message] of rejectedDeclarations) {
        it(`rejects ${comment}`, () =>
          expect(() => compileProgram(declarations)).toThrow(message));
      }

      it("allows an abstract class to leave abstract methods unimplemented", () =>
        expect(() =>
          compileProgram("abstract class A { abstract void f(); } abstract class B extends A {}")
        ).not.toThrow());
      it("allows a class implementing all abstract methods of a library class", () =>
        expect(() =>
          compileProgram(`class Seven extends Number {
            public int intValue() { return 7; }
            public long longValue() { return 7L; }
            public float floatValue() { return 7f; }
            public double doubleValue() { return 7.0; }
          }`)
        ).not.toThrow());
      it("allows a subclass declared before its abstract parent", () =>
        expect(() =>
          compileProgram("class B extends A { void f() {} } abstract class A { abstract void f(); }")
        ).not.toThrow());
      it("allows a nested concrete class implementing a nested abstract class", () =>
        expect(() =>
          compileProgram(
            "class O { static abstract class A { abstract void f(); } static class B extends A { void f() {} } }"
          )
        ).not.toThrow());
      it("rejects a nested concrete class that does not", () =>
        expect(() =>
          compileProgram(
            "class O { static abstract class A { abstract void f(); } static class B extends A {} }"
          )
        ).toThrow(/O.B is not abstract .* f\(\) in A/));
    });

    it("still allows a concrete subclass", () =>
      expect(() => compileWithClasses("Shape s = new Square(); Polygon p = new Square();")).not.toThrow());
    it("still allows a concrete library class", () =>
      expect(() => compileWithClasses("StringBuilder b = new StringBuilder();")).not.toThrow());
  });
});
