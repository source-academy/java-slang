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
    comment: "a bare this as a value",
    program: `
      class Counter {
        int n;
        Counter self = this;
        Counter inc() { n = n + 1; return this; }
        Counter add(int k) { this.n += k; return this; }
        boolean same(Counter o) { return this == o; }
        boolean sameAsSelf() { return same(this); }
        Counter pick(boolean b, Counter other) { return b ? this : other; }
        Object asObject() { return (Object) this; }
        void register(Registry r) { r.add(this); }
        int viaOther(Counter o) { return o.n; }
        int readThrough() { return viaOther(this); }
      }
      class Registry {
        Counter last;
        int adds;
        void add(Counter c) { last = c; adds = adds + 1; }
      }
      class Base {
        int id = 7;
        Base me() { return this; }
      }
      class Derived extends Base {
        Base asBase() { Base b = this; return b; }
        Derived myself() { return this; }
      }
      public class Main {
        static class Inner {
          int k = 4;
          Inner me() { return this; }
        }
        public static void main(String[] args) {
          Counter c = new Counter();
          Counter d = c.inc();
          d.add(5);
          System.out.println(c.n);
          System.out.println(c == d);
          System.out.println(c.same(c));
          System.out.println(c.same(new Counter()));
          System.out.println(c.sameAsSelf());
          Counter other = new Counter();
          System.out.println(c.pick(true, other) == c);
          System.out.println(c.pick(false, other) == other);
          System.out.println(c.asObject() == c);
          System.out.println(c.self == c);
          Registry r = new Registry();
          c.register(r);
          c.register(r);
          System.out.println(r.last == c);
          System.out.println(r.adds);
          System.out.println(c.readThrough());
          Derived x = new Derived();
          System.out.println(x.myself() == x);
          System.out.println(x.asBase() == x);
          System.out.println(x.me() == x);
          Inner i = new Inner();
          Inner j = i.me();
          System.out.println(j == i);
          System.out.println(j.k);
        }
      }
    `,
    expectedLines: ["6", "true", "true", "false", "true", "true", "true", "true", "true", "true", "2", "6", "true", "true", "true", "true", "4"],
  },
  {
    comment: "overrides with covariant return types and wider access dispatch correctly",
    program: `
      class Animal { public String name() { return "animal"; } }
      class Dog extends Animal { public String name() { return "dog"; } }
      abstract class Shelter {
        protected abstract Animal adopt();
        abstract int capacity();
        public String describe() { Animal a = adopt(); return a.name() + " " + capacity(); }
      }
      class DogShelter extends Shelter {
        public Dog adopt() { return new Dog(); }
        protected int capacity() { return 3; }
      }
      public class Main {
        public static void main(String[] args) {
          Shelter s = new DogShelter();
          System.out.println(s.describe());
          DogShelter d = new DogShelter();
          Dog dog = d.adopt();
          System.out.println(dog.name());
          Animal viaBase = d.adopt();
          System.out.println(viaBase.name());
        }
      }
    `,
    expectedLines: ["dog 3", "dog", "dog"],
  },
  {
    comment: "covariant return types over several levels are reachable through every superclass",
    program: `
      class X { String who() { return "X"; } }
      class Y extends X { String who() { return "Y"; } }
      class Z extends Y { String who() { return "Z"; } }
      class A { X make(long a, double b, int[] c, String d) { return new X(); } }
      class B extends A { Y make(long a, double b, int[] c, String d) { return new Y(); } }
      class C extends B { Z make(long a, double b, int[] c, String d) { return new Z(); } }
      abstract class Maker {
        abstract X build(int n);
        X buildTwice(int n) { return build(n); }
      }
      class YMaker extends Maker { Y build(int n) { return new Y(); } }
      public class Main {
        public static void main(String[] args) {
          int[] arr = {1};
          A a = new C();
          B b = new C();
          C c = new C();
          X x1 = a.make(1L, 2.0, arr, "s");
          Y y1 = b.make(1L, 2.0, arr, "s");
          Z z1 = c.make(1L, 2.0, arr, "s");
          System.out.println(x1.who() + y1.who() + z1.who());
          A plain = new A();
          B mid = new B();
          X x2 = plain.make(1L, 2.0, arr, "s");
          X x3 = mid.make(1L, 2.0, arr, "s");
          Y y3 = mid.make(1L, 2.0, arr, "s");
          System.out.println(x2.who() + x3.who() + y3.who());
          Maker m = new YMaker();
          X built = m.buildTwice(3);
          YMaker ym = new YMaker();
          Y direct = ym.build(1);
          System.out.println(built.who() + direct.who());
        }
      }
    `,
    expectedLines: ["ZZZ", "XYY", "YY"],
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

  it("declares enough stack for calls with long and double arguments (checked by the verifier)", () => {
    runTest(
      `
      class Pt {
        long a;
        double b;
        Pt(long a, double b) { this.a = a; this.b = b; }
        Pt(int x) { this.a = x; this.b = x; }
        Pt() { this.a = 10L; this.b = 20.0; }
        long sum(long x, double y, long z) { return a + x + z; }
        double mix(double x, long y, double z, long w) { return x + y + z + w; }
        static double sfn(long x, double y, double z) { return y + z; }
        static long id(long x) { return x; }
        static double dd(double x) { return x; }
      }
      class Sub extends Pt {
        long twice(long q, double r) { return super.sum(q, r, q) + 1L; }
      }
      public class Main {
        static long lf(long a, long b, long c) { return a + b + c; }
        static double df(double a, double b, double c) { return a + b + c; }
        public static void main(String[] args) {
          Pt p = new Pt(1L, 2.0);
          Pt q = new Pt(3);
          Sub s = new Sub();
          long r1 = p.sum(1L, 2.0, 3L);
          double r2 = p.mix(1.0, 2L, 3.0, 4L);
          double r3 = Pt.sfn(1L, 2.0, 3.0);
          long r6 = lf(Pt.id(1L), Pt.id(2L), lf(1L, 2L, 3L));
          double r7 = df(Pt.dd(1.0), df(1.0, 2.0, 3.0), Pt.dd(Pt.dd(2.0)));
          long r8 = s.twice(2L, 3.0);
          double r9 = Math.pow(2.0, 3.0) + Math.max(1.5, 2.5) + Math.hypot(3.0, 4.0);
          Pt n = new Pt(Pt.id(7L), Pt.dd(1.5));
          System.out.println(r1 + " " + r2 + " " + r3);
          System.out.println(r6);
          System.out.println(r7);
          System.out.println(r8);
          System.out.println(r9);
          System.out.println(n.a);
          System.out.println(q.b);
          System.out.println(df(1, 2L, 3.0f));
          System.out.println(lf(1, 2, 3));
        }
      }
    `,
      ["5 10.0 5.0", "9", "9.0", "15", "15.5", "7", "3.0", "6.0", "6"],
      { verify: true }
    );
  });

  it("discards the value of a call or an instantiation used as a statement (checked by the verifier)", () => {
    runTest(
      `
      class Counter { static int made; Counter() { made = made + 1; } }
      public class Main {
        static int total;
        static int next() { total = total + 1; return total; }
        static long wide() { total = total + 1; return 5L; }
        static double real() { total = total + 1; return 1.5; }
        static String text() { total = total + 1; return "t"; }
        public static void main(String[] args) {
          next();
          next();
          wide();
          wide();
          real();
          real();
          text();
          text();
          new Counter();
          new Counter();
          System.out.println(total);
          System.out.println(Counter.made);
        }
      }
    `,
      ["8", "2"],
      { verify: true }
    );
  });

  describe("duplicate declarations", () => {
    const compileClasses = (declarations: string) => {
      const parser = peggy.generate(peggyFunctions + javaPegGrammar, {
        allowedStartRules: ["CompilationUnit"],
      });
      return compile(
        parser.parse(`${declarations} public class Main { public static void main(String[] a) {} }`) as AST
      );
    };

    const rejected: [string, string, RegExp][] = [
      ["two methods that differ only in the return type", "class A { int f() { return 1; } long f() { return 1L; } }", /method f\(\) is already defined in class A/],
      ["two methods with the same signature", "class A { void f(int x) {} void f(int y) {} }", /method f\(int\) is already defined in class A/],
      ["return types that differ in reference types", "class A { String f(int[] x, String s) { return s; } Object f(int[] y, String t) { return t; } }", /method f\(int\[\],String\) is already defined in class A/],
      ["a static and an instance method with the same parameters", "class A { static void f() {} void f() {} }", /method f\(\) is already defined in class A/],
      ["two constructors with the same parameters", "class A { A(int x) {} A(int y) {} }", /constructor A\(int\) is already defined in class A/],
      ["duplicates in a nested class", "class O { static class A { void f() {} int f() { return 1; } } }", /method f\(\) is already defined in class O.A/],
    ];
    for (const [comment, declarations, message] of rejected) {
      it(`rejects ${comment}`, () => expect(() => compileClasses(declarations)).toThrow(message));
    }

    const allowed: [string, string][] = [
      ["overloads with other parameter types", "class A { void f(int x) {} void f(long x) {} void f(String s) {} void f(int x, int y) {} }"],
      ["overloads that differ in the order of parameters", "class A { void f(int x, String s) {} void f(String s, int x) {} }"],
      ["a method and a constructor with the same name", "class A { A() {} void A() {} }"],
      ["the same signature in different classes", "class A { int f() { return 1; } } class B { long f() { return 1L; } }"],
      ["overloaded constructors", "class A { A() {} A(int x) {} A(String s) {} }"],
    ];
    for (const [comment, declarations] of allowed) {
      it(`allows ${comment}`, () => expect(() => compileClasses(declarations)).not.toThrow());
    }
  });

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
          /f\(\) in B cannot override f\(\) in A; overriding method is static/,
        ],
        [
          "a private method that does not implement it",
          "abstract class A { abstract void f(); } class B extends A { private void f() {} }",
          /f\(\) in B cannot override f\(\) in A; attempting to assign weaker access privileges; was package-private/,
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

    describe("a bare this", () => {
      const parser = peggy.generate(peggyFunctions + javaPegGrammar, {
        allowedStartRules: ["CompilationUnit"],
      });
      const parseMember = (member: string) =>
        parser.parse(`class T { int x; ${member} } public class Main { public static void main(String[] a) {} }`);
      // finds the first node of the given kind anywhere in the tree
      const find = (node: any, kind: string): any => {
        if (node === null || typeof node !== "object") return undefined;
        if (node.kind === kind) return node;
        for (const child of Object.values(node)) {
          const found = find(child, kind);
          if (found) return found;
        }
        return undefined;
      };

      const parsed: [string, string][] = [
        ["a return value", "T f() { return this; }"],
        ["a method argument", "void g(T t) {} void f() { g(this); }"],
        ["a variable initializer", "void f() { T t = this; }"],
        ["the right side of an assignment", "void f() { T t = null; t = this; }"],
        ["a cast operand", "void f() { Object o = (Object) this; }"],
        ["a comparison operand", "boolean f() { return this == this; }"],
        ["a conditional operand", "T f(boolean b) { return b ? this : null; }"],
      ];
      for (const [comment, member] of parsed) {
        it(`parses as ${comment}`, () =>
          expect(find(parseMember(member), "ThisExpression")).toBeDefined());
      }

      const unchanged: [string, string][] = [
        ["a field read", "int f() { return this.x; }"],
        ["a field assignment", "void f() { this.x = 1; }"],
        ["a method call", "void g() {} void f() { this.g(); }"],
        ["an increment", "void f() { this.x++; }"],
        ["an identifier that starts with this", "void f() { int thisx = 1; int y = thisx; }"],
      ];
      for (const [comment, member] of unchanged) {
        it(`still handles ${comment} without a ThisExpression`, () =>
          expect(find(parseMember(member), "ThisExpression")).toBeUndefined());
      }
    });

    describe("this in a static context", () => {
      const compileMember = (member: string) => {
        const parser = peggy.generate(peggyFunctions + javaPegGrammar, {
          allowedStartRules: ["CompilationUnit"],
        });
        return compile(
          parser.parse(
            `class T { int x; ${member} } public class Main { public static void main(String[] a) {} }`
          ) as AST
        );
      };
      const message = /non-static variable "this" cannot be referenced from a static context/;
      it("rejects returning this from a static method", () =>
        expect(() => compileMember("static T f() { return null; } static T g() { return this; }")).toThrow(message));
      it("rejects passing this from a static method", () =>
        expect(() => compileMember("static void g(T t) {} static void f() { g(this); }")).toThrow(message));
      it("allows this in an instance method", () =>
        expect(() => compileMember("T f() { return this; }")).not.toThrow());
    });

    describe("method overriding", () => {
      const compileClasses = (declarations: string) => {
        const parser = peggy.generate(peggyFunctions + javaPegGrammar, {
          allowedStartRules: ["CompilationUnit"],
        });
        return compile(
          parser.parse(`${declarations} public class Main { public static void main(String[] a) {} }`) as AST
        );
      };
      const weaker = (was: string) =>
        new RegExp(`attempting to assign weaker access privileges; was ${was}`);

      const rejected: [string, string, RegExp][] = [
        ["a different primitive return type", "abstract class A { abstract int f(); } class B extends A { long f() { return 1L; } }", /f\(\) in B cannot override f\(\) in A; return type long is not compatible with int/],
        ["a void method returning a value", "abstract class A { abstract void f(); } class B extends A { int f() { return 1; } }", /return type int is not compatible with void/],
        ["a value method returning void", "abstract class A { abstract int f(); } class B extends A { void f() {} }", /return type void is not compatible with int/],
        ["an unrelated reference return type", "abstract class A { abstract String f(); } class B extends A { Integer f() { return 1; } }", /return type Integer is not compatible with String/],
        ["a return type that is a superclass", "class X {} class Y extends X {} abstract class A { abstract Y f(); } class B extends A { X f() { return null; } }", /return type X is not compatible with Y/],
        ["an array returned for an element type", "abstract class A { abstract int[] f(); } class B extends A { int f() { return 1; } }", /return type int is not compatible with int\[\]/],
        ["a public abstract method implemented as package-private", "abstract class A { public abstract void f(); } class B extends A { void f() {} }", weaker("public")],
        ["a public abstract method implemented as protected", "abstract class A { public abstract void f(); } class B extends A { protected void f() {} }", weaker("public")],
        ["a protected abstract method implemented as package-private", "abstract class A { protected abstract void f(); } class B extends A { void f() {} }", weaker("protected")],
        ["a public method overridden with weaker access", "class A { public void f() {} } class B extends A { void f() {} }", weaker("public")],
        ["weaker access two levels down", "class A { public void f() {} } class B extends A { public void f() {} } class C extends B { protected void f() {} }", /f\(\) in C cannot override f\(\) in B; .*was public/],
        ["a different return type for a plain override", "class A { int f() { return 1; } } class B extends A { long f() { return 1L; } }", /return type long is not compatible with int/],
        ["a static method hiding an instance method", "class A { void f() {} } class B extends A { static void f() {} }", /overriding method is static/],
        ["an instance method overriding a static method", "class A { static void f() {} } class B extends A { void f() {} }", /overridden method is static/],
        ["a static method hiding with weaker access", "class A { public static void f() {} } class B extends A { static void f() {} }", /cannot hide f\(\) in A; .*was public/],
        ["overriding toString without public", "class B { String toString() { return \"b\"; } }", /toString\(\) in B cannot override toString\(\) in Object; .*was public/],
        ["overriding hashCode with another return type", "class B { public long hashCode() { return 1L; } }", /return type long is not compatible with int/],
        ["overriding a library method with weaker access", "class E extends Exception { String getMessage() { return \"x\"; } }", /getMessage\(\) in E cannot override getMessage\(\) in Throwable/],
        ["implementing a library abstract method with weaker access", "class N extends Number { int intValue() { return 1; } public long longValue() { return 1L; } public float floatValue() { return 1f; } public double doubleValue() { return 1.0; } }", /intValue\(\) in N cannot override intValue\(\) in Number/],
        ["a nested class", "class O { static class A { public int f() { return 1; } } static class B extends A { int f() { return 2; } } }", /f\(\) in O.B cannot override f\(\) in O.A/],
        ["a method that overrides a final method of its parent", "class A { final void f() { } } class B extends A { void f() { } }", /f\(\) in B cannot override f\(\) in A; overridden method is final/],
        ["a method that overrides a final method of its grandparent", "class A { final void f() { } } class B extends A { } class C extends B { void f() { } }", /f\(\) in C cannot override f\(\) in A; overridden method is final/],
        ["a method that overrides a final method three levels up", "class A { final void f() { } } class B extends A { } class C extends B { } class D extends C { void f() { } }", /f\(\) in D cannot override f\(\) in A; overridden method is final/],
        ["a final method of an ancestor when the parent declares other methods", "class A { final void f() { } } class B extends A { void g() { } } class C extends B { void f() { } }", /f\(\) in C cannot override f\(\) in A; overridden method is final/],
        ["a final method of an ancestor declared after the subclass", "class C extends B { void f() { } } class B extends A { } class A { final void f() { } }", /f\(\) in C cannot override f\(\) in A; overridden method is final/],
        ["a method that overrides a final method that overrode a non-final one", "class A { void f() { } } class B extends A { final void f() { } } class C extends B { void f() { } }", /f\(\) in C cannot override f\(\) in B; overridden method is final/],
        ["a final method declared in a middle class", "class A { void f() { } } class B extends A { final void f() { } } class C extends B { } class D extends C { void f() { } }", /f\(\) in D cannot override f\(\) in B; overridden method is final/],
        ["a final method in a nested class hierarchy", "class O { static class A { final void f() { } } static class B extends A { } static class C extends B { void f() { } } }", /f\(\) in O.C cannot override f\(\) in O.A; overridden method is final/],
        ["a static method that hides a final static method", "class A { static final void f() { } } class B extends A { static void f() { } }", /f\(\) in B cannot hide f\(\) in A; overridden method is static final/],
        ["a static method that hides a final static method of a grandparent", "class A { static final void f() { } } class B extends A { } class C extends B { static void f() { } }", /f\(\) in C cannot hide f\(\) in A; overridden method is static final/],
        ["overriding Object.notify", "class C { public void notify() { } }", /notify\(\) in C cannot override notify\(\) in Object; overridden method is final/],
        ["overriding Object.notifyAll", "class C { public void notifyAll() { } }", /notifyAll\(\) in C cannot override notifyAll\(\) in Object; overridden method is final/],
        ["overriding Object.wait", "class C { public void wait() { } }", /wait\(\) in C cannot override wait\(\) in Object; overridden method is final/],
        ["overriding a final library method through an intermediate class", "class P { } class C extends P { public void notify() { } }", /notify\(\) in C cannot override notify\(\) in Object; overridden method is final/],
        ["overriding a final method of a user class that extends a library class", "class C extends Number { public int intValue() { return 1; } public long longValue() { return 1L; } public float floatValue() { return 1f; } public double doubleValue() { return 1.0; } public final int hashCode() { return 1; } } class D extends C { public int hashCode() { return 2; } }", /hashCode\(\) in D cannot override hashCode\(\) in C; overridden method is final/],
      ];
      for (const [comment, declarations, message] of rejected) {
        it(`rejects ${comment}`, () => expect(() => compileClasses(declarations)).toThrow(message));
      }

      const allowed: [string, string][] = [
        ["the same return type and access", "abstract class A { public abstract int f(); } class B extends A { public int f() { return 1; } }"],
        ["a subclass as the return type", "class X {} class Y extends X {} abstract class A { abstract X f(); } class B extends A { Y f() { return null; } }"],
        ["a covariant return type, down to Object", "abstract class A { abstract Object f(); } class B extends A { String f() { return null; } }"],
        ["covariant array element types", "class X {} class Y extends X {} abstract class A { abstract X[] f(); } class B extends A { Y[] f() { return null; } }"],
        ["more access than a protected method", "abstract class A { protected abstract void f(); } class B extends A { public void f() {} }"],
        ["protected for a package-private method", "abstract class A { abstract void f(); } class B extends A { protected void f() {} }"],
        ["an overload with other parameter types", "class A { public int f(int x) { return 1; } } class B extends A { long f(long x) { return 1L; } }"],
        ["a private method that is not inherited", "class A { private int f() { return 1; } } class B extends A { long f() { return 1L; } }"],
        ["a static method hiding a static method", "class A { static void f() {} } class B extends A { static void f() {} }"],
        ["a public toString", "class B { public String toString() { return \"b\"; } }"],
        ["a public equals and hashCode", "class B { public boolean equals(Object o) { return true; } public int hashCode() { return 1; } }"],
        ["a protected clone", "class B { protected Object clone() { return null; } }"],
        ["a public getMessage", "class E extends Exception { public String getMessage() { return \"x\"; } }"],
        ["a nested class", "class O { static class A { public int f() { return 1; } } static class B extends A { public int f() { return 2; } } }"],
        ["an overload of a final method", "class A { final void f() { } } class B extends A { } class C extends B { void f(int x) { } }"],
        ["another method of a class that has a final method", "class A { final void f() { } void g() { } } class B extends A { } class C extends B { void g() { } }"],
        ["a private final method that is not inherited", "class A { private final void f() { } } class B extends A { } class C extends B { void f() { } }"],
        ["a non-final static method hidden two levels down", "class A { static void f() { } } class B extends A { } class C extends B { static void f() { } }"],
        ["a final method in a class that overrides nothing", "class A { final void f() { } void g() { } }"],
        ["a non-final library method", "class E1 extends Exception { } class E2 extends E1 { public String getMessage() { return \"x\"; } }"],
      ];
      for (const [comment, declarations] of allowed) {
        it(`allows ${comment}`, () => expect(() => compileClasses(declarations)).not.toThrow());
      }
    });

    describe("final classes", () => {
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
        ["extending a final class", "final class A {} class B extends A {}", /cannot inherit from final A/],
        [
          "extending a final class declared after the subclass",
          "class B extends A {} final class A {}",
          /cannot inherit from final A/,
        ],
        [
          "extending a final class through an abstract class",
          "final class A {} abstract class B extends A {}",
          /cannot inherit from final A/,
        ],
        [
          "extending a nested final class",
          "class O { static final class A {} static class B extends A {} }",
          /cannot inherit from final O.A/,
        ],
        ["extending a final library class", "class S extends String {}", /cannot inherit from final String/],
        ["extending a wrapper class", "class I extends Integer {}", /cannot inherit from final Integer/],
        ["extending an enum", "enum Color { RED } class C extends Color {}", /cannot inherit from final Color/],
      ];
      for (const [comment, declarations, message] of rejectedDeclarations) {
        it(`rejects ${comment}`, () =>
          expect(() => compileProgram(declarations)).toThrow(message));
      }

      it("allows a final class extending a non-final class", () =>
        expect(() => compileProgram("class A {} final class B extends A {}")).not.toThrow());
      it("allows extending a non-final class that extends a final one's parent", () =>
        expect(() =>
          compileProgram("class A {} final class B extends A {} class C extends A {}")
        ).not.toThrow());
      it("allows extending a non-final library class", () =>
        expect(() =>
          compileProgram("class E extends Exception {} class R extends RuntimeException {}")
        ).not.toThrow());
    });

    it("still allows a concrete subclass", () =>
      expect(() => compileWithClasses("Shape s = new Square(); Polygon p = new Square();")).not.toThrow());
    it("still allows a concrete library class", () =>
      expect(() => compileWithClasses("StringBuilder b = new StringBuilder();")).not.toThrow());
  });
});
