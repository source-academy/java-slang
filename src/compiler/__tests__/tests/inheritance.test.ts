import { runTest, testCase } from '../__utils__/test-utils'
import * as peggy from 'peggy'
import { compile } from '../../index'
import { AST } from '../../../ast/types/packages-and-modules'
import { javaPegGrammar } from '../../grammar'
import { peggyFunctions } from '../../peggy-functions'

// Expected output of each program is what a real JDK 8 prints for the javac-compiled program.
const testCases: testCase[] = [
  {
    comment: 'methods, fields and static members inherited through one and several levels',
    program: `
      class A {
        public int x = 10;
        public static int count = 100;
        public int f() { return 1; }
        public int g(int n) { return n + 1; }
        public static int sf() { return 7; }
        public int callF() { return f(); }
      }
      class B extends A {
        public int h() { return 2; }
      }
      class C extends B {
        public int k() { return 3; }
      }
      public class Main {
        public static void main(String[] args) {
          B b = new B();
          C c = new C();
          System.out.println(b.f());
          System.out.println(b.g(4));
          System.out.println(b.h());
          System.out.println(c.f());
          System.out.println(c.h());
          System.out.println(c.k());
          System.out.println(c.callF());
          System.out.println(B.sf());
          System.out.println(C.sf());
          System.out.println(b.x);
          System.out.println(c.x);
          System.out.println(B.count);
          b.x = 55;
          System.out.println(b.x);
          System.out.println(b.callF());
          A a = c;
          System.out.println(a.f());
        }
      }
    `,
    expectedLines: ['1', '5', '2', '1', '2', '3', '1', '7', '7', '10', '10', '100', '55', '1', '1']
  },
  {
    comment: 'overloads spread over a class hierarchy, overriding, and this.f()',
    program: `
      class A {
        public int x = 1;
        public int f() { return 1; }
        public int f(int n) { return n * 2; }
      }
      class B extends A {
        public int f(String s) { return s.length(); }
        public int sum() { return f() + f(5) + f("abc") + x; }
        public int viaThis() { return this.f() + this.f(6) + this.x; }
        public void bump() { x++; x += 10; this.x = x + 1; }
      }
      class C extends B {
        public int f() { return 100; }
        public int total() { return f() + sum(); }
      }
      public class Main {
        public static void main(String[] args) {
          B b = new B();
          System.out.println(b.f());
          System.out.println(b.f(7));
          System.out.println(b.f("hello"));
          System.out.println(b.sum());
          System.out.println(b.viaThis());
          b.bump();
          System.out.println(b.x);
          C c = new C();
          System.out.println(c.f());
          System.out.println(c.f(2));
          System.out.println(c.f("xy"));
          System.out.println(c.total());
          B asB = c;
          System.out.println(asB.f());
          System.out.println(asB.sum());
        }
      }
    `,
    expectedLines: ['1', '14', '5', '15', '14', '13', '100', '4', '2', '214', '100', '114']
  },
  {
    comment: 'abstract methods inherited by abstract and concrete subclasses',
    program: `
      abstract class Shape {
        public abstract int sides();
        public abstract String name();
        public String describe() { return name() + " has " + sides() + " sides"; }
      }
      abstract class Polygon extends Shape {
        public String name() { return "polygon"; }
        public int twice() { return sides() * 2; }
      }
      class Square extends Polygon {
        public int sides() { return 4; }
      }
      public class Main {
        public static void main(String[] args) {
          Polygon p = new Polygon2();
          System.out.println(p.sides());
          System.out.println(p.describe());
          System.out.println(p.twice());
          Square s = new Square();
          System.out.println(s.sides());
          System.out.println(s.name());
          System.out.println(s.describe());
          System.out.println(s.twice());
        }
      }
      class Polygon2 extends Polygon {
        public int sides() { return 6; }
      }
    `,
    expectedLines: ['6', 'polygon has 6 sides', '12', '4', 'polygon', 'polygon has 4 sides', '8']
  },
  {
    comment: 'methods inherited from Object, called with and without a qualifier',
    program: `
      class Base {
        public int hash() { return hashCode() == hashCode() ? 1 : 0; }
        public boolean same(Base other) { return this.equals(other); }
      }
      class Mid extends Base { }
      class Leaf extends Mid { }
      public class Main {
        public static void main(String[] args) {
          Leaf l = new Leaf();
          Mid m = new Mid();
          System.out.println(l.hash());
          System.out.println(l.same(l));
          System.out.println(l.same(m));
          System.out.println(l.equals(l));
          System.out.println(l.hashCode() == l.hashCode());
          System.out.println(m.equals(l));
          Object o = l;
          System.out.println(o.equals(l));
        }
      }
    `,
    expectedLines: ['1', 'true', 'false', 'true', 'true', 'false', 'true']
  },
  {
    comment:
      'super.f() calls with an override in between, and a constructor assigning an inherited field',
    program: `
      class Animal {
        protected int legs = 4;
        public String sound() { return "..."; }
        public String describe() { return "animal with " + legs + " legs says " + sound(); }
        public int twice(int n) { return n * 2; }
      }
      class Mammal extends Animal {
        public String sound() { return "grr"; }
        public String parentSound() { return super.sound(); }
      }
      class Lion extends Mammal {
        public Lion() { legs = 5; }
        public String sound() { return "roar"; }
        public String chain() { return super.sound() + "/" + super.parentSound() + "/" + this.sound() + "/" + describe(); }
        public int quad(int n) { return twice(twice(n)); }
      }
      public class Main {
        public static void main(String[] args) {
          Lion lion = new Lion();
          Mammal m = new Mammal();
          System.out.println(lion.sound());
          System.out.println(lion.parentSound());
          System.out.println(lion.chain());
          System.out.println(lion.describe());
          System.out.println(m.describe());
          System.out.println(lion.quad(3));
          System.out.println(lion.legs);
          System.out.println(m.legs);
          lion.legs = 6;
          System.out.println(lion.describe());
          Animal a = lion;
          System.out.println(a.describe());
        }
      }
    `,
    expectedLines: [
      'roar',
      '...',
      'grr/.../roar/animal with 5 legs says roar',
      'animal with 5 legs says roar',
      'animal with 4 legs says grr',
      '12',
      '5',
      '4',
      'animal with 6 legs says roar',
      'animal with 6 legs says roar'
    ]
  },
  {
    comment: 'field shadowing, static method hiding and inherited static members',
    program: `
      class Base {
        public int v = 1;
        public static int shared = 10;
        public static int hidden() { return 1; }
        public static int util() { return 99; }
        public int get() { return v; }
      }
      class Derived extends Base {
        public int v = 2;
        public static int hidden() { return 2; }
        public int getBoth() { return v + this.v; }
        public static int useStatic() { return shared + util(); }
        public int readShared() { return shared; }
        public void setShared() { shared = shared + 5; }
      }
      public class Main {
        public static void main(String[] args) {
          Derived d = new Derived();
          Base b = d;
          System.out.println(d.v);
          System.out.println(b.v);
          System.out.println(d.get());
          System.out.println(d.getBoth());
          System.out.println(Derived.hidden());
          System.out.println(Base.hidden());
          System.out.println(Derived.util());
          System.out.println(Derived.shared);
          System.out.println(Derived.useStatic());
          System.out.println(d.readShared());
          d.setShared();
          System.out.println(Base.shared);
          System.out.println(Derived.shared);
        }
      }
    `,
    expectedLines: ['2', '1', '1', '4', '2', '1', '99', '10', '109', '10', '15', '15']
  },
  {
    comment: 'method calls and assignments through chains of inherited fields',
    program: `
      class Engine {
        public int power = 100;
        public int horsepower() { return power; }
      }
      class TurboEngine extends Engine {
        public int boost() { return power * 2; }
      }
      class Vehicle {
        public Engine engine = new Engine();
        public int wheels = 4;
        public int wheelCount() { return wheels; }
      }
      class Car extends Vehicle {
        public TurboEngine turbo = new TurboEngine();
        public int total() { return wheelCount() + engine.horsepower() + turbo.horsepower() + turbo.boost(); }
      }
      class Garage {
        public Car car = new Car();
      }
      public class Main {
        public static void main(String[] args) {
          Car car = new Car();
          Garage g = new Garage();
          System.out.println(car.total());
          System.out.println(car.engine.power);
          System.out.println(car.engine.horsepower());
          System.out.println(car.turbo.horsepower());
          System.out.println(car.turbo.power);
          System.out.println(car.wheelCount());
          System.out.println(g.car.wheels);
          System.out.println(g.car.wheelCount());
          System.out.println(g.car.engine.horsepower());
          System.out.println(g.car.turbo.boost());
          car.engine.power = 7;
          car.wheels = 3;
          System.out.println(car.engine.power + " " + car.wheelCount());
        }
      }
    `,
    expectedLines: ['404', '100', '100', '100', '100', '4', '4', '4', '100', '200', '7 3']
  },
  {
    comment: 'assigning inherited fields without a qualifier',
    program: `
      class Counter {
        private int count = 0;
        protected int step = 1;
        public void inc() { count = count + step; }
        public void inc2() { count++; count += step; }
        public int get() { return count; }
      }
      class Fancy extends Counter {
        public Fancy() { step = 3; }
        public void bump() { inc(); this.inc2(); step++; step += 1; }
        public int getStep() { return step; }
      }
      public class Main {
        public static void main(String[] args) {
          Fancy f = new Fancy();
          f.bump();
          System.out.println(f.get());
          System.out.println(f.getStep());
          f.inc();
          System.out.println(f.get());
          Counter c = new Counter();
          c.inc();
          c.inc2();
          System.out.println(c.get());
        }
      }
    `,
    expectedLines: ['7', '5', '12', '3']
  },
  {
    comment:
      'reading and writing super.field: shadowed fields, statics, arrays, ++ and +=, conditions',
    program: `
      class Base {
        public int v = 1;
        public static int count = 100;
        public int[] arr;
        public void init() { int[] t = {10, 20, 30}; arr = t; }
        public boolean flag = true;
        public String name = "base";
        public int getV() { return v; }
      }
      class Derived extends Base {
        public int v = 2;
        public String name = "derived";
        public int both() { return v + super.v + this.v; }
        public String names() { return name + "/" + super.name + "/" + this.name; }
        public int viaStatic() { return super.count + count; }
        public int element() { return super.arr[1] + super.arr.length; }
        public void changes() {
          super.v = 50;
          super.v++;
          super.v += 4;
          this.v = super.v * 2;
          super.arr[0] = 99;
          super.arr[2] += 5;
          super.name = "changed";
        }
        public boolean test() { return super.flag && !(super.v < 0); }
        public int ternary() { return super.flag ? super.v : this.v; }
        public int callBase() { return super.getV() + getV(); }
      }
      public class Main {
        public static void main(String[] args) {
          Derived d = new Derived();
          d.init();
          System.out.println(d.both());
          System.out.println(d.names());
          System.out.println(d.viaStatic());
          System.out.println(d.element());
          d.changes();
          System.out.println(d.v);
          Base b = d;
          System.out.println(b.v);
          System.out.println(b.arr[0] + " " + b.arr[1] + " " + b.arr[2]);
          System.out.println(b.name);
          System.out.println(d.names());
          System.out.println(d.both());
          System.out.println(d.test());
          System.out.println(d.ternary());
          System.out.println(d.callBase());
        }
      }
    `,
    expectedLines: [
      '5',
      'derived/base/derived',
      '200',
      '23',
      '110',
      '55',
      '99 20 35',
      'changed',
      'derived/changed/derived',
      '275',
      'true',
      '55',
      '110'
    ]
  },
  {
    comment: 'super.field.method() and super.field.field, and names that merely start with super',
    program: `
      class Wheel {
        public int size = 17;
        public int spin() { return size * 2; }
      }
      class Holder {
        public Wheel wheel = new Wheel();
        public int super_count = 5;
        public int superb = 6;
        public int supers() { return super_count + superb; }
      }
      class Mid extends Holder {
        public Wheel wheel = new Wheel();
        public int viaSuper() { return super.wheel.spin() + super.wheel.size + super.supers(); }
        public void modify() { super.wheel.size = 20; super.wheel.size++; }
      }
      class Leaf extends Mid {
        public int up() { return super.wheel.size + super.super_count + super.superb; }
      }
      public class Main {
        public static void main(String[] args) {
          Mid m = new Mid();
          System.out.println(m.viaSuper());
          m.modify();
          System.out.println(m.viaSuper());
          System.out.println(m.wheel.size);
          Leaf l = new Leaf();
          System.out.println(l.up());
          System.out.println(l.supers());
        }
      }
    `,
    expectedLines: ['62', '74', '17', '28', '11']
  },
  {
    comment: 'assigning super fields in a constructor, including a static one',
    program: `
      class Parent {
        protected int value = 7;
        protected static int total = 1;
      }
      class Child extends Parent {
        public Child() {
          super.value = super.value + 1;
          super.total += 10;
        }
        public int get() { return super.value; }
        public static int stat() { return Parent.total; }
      }
      public class Main {
        public static void main(String[] args) {
          Child c = new Child();
          System.out.println(c.get());
          System.out.println(Child.stat());
          Child c2 = new Child();
          System.out.println(c2.get());
          System.out.println(Child.stat());
        }
      }
    `,
    expectedLines: ['8', '11', '8', '21']
  }
]

const compileWithClasses = (classes: string, body: string) => {
  const parser = peggy.generate(peggyFunctions + javaPegGrammar, {
    allowedStartRules: ['CompilationUnit']
  })
  return compile(
    parser.parse(`
      ${classes}
      public class Main {
        public static void main(String[] args) {
          ${body}
        }
      }
    `) as AST
  )
}

export const inheritanceTest = () =>
  describe('inheritance', () => {
    for (let testCase of testCases) {
      const { comment: comment, program: program, expectedLines: expectedLines } = testCase
      it(comment, () => runTest(program, expectedLines))
    }

    describe('does not make more visible than Java does', () => {
      const classes = `
      class Parent {
        private int secret = 1;
        private int hidden() { return 1; }
        public int visible() { return 2; }
      }
      class Child extends Parent {
        public int childOnly() { return 3; }
      }
      class Other {
        public int unrelated() { return 4; }
      }
    `
      const rejected: [string, string][] = [
        ['a private method of a superclass', 'Child c = new Child(); int n = c.hidden();'],
        ['assigning a private field of a superclass', 'Child c = new Child(); c.secret = 5;'],
        [
          'a method that only the subclass has, through a superclass variable',
          'Parent p = new Child(); int n = p.childOnly();'
        ],
        ['a method of an unrelated class', 'Child c = new Child(); int n = c.unrelated();'],
        ['a method that does not exist', 'Child c = new Child(); int n = c.nothing();'],
        ['assigning a field that does not exist', 'Child c = new Child(); c.nothing = 5;']
      ]
      for (const [comment, body] of rejected) {
        it(`rejects ${comment}`, () =>
          expect(() => compileWithClasses(classes, body)).toThrow(
            /cannot resolve symbol|is not defined|not a valid method|No method matching/
          ))
      }

      it('allows a public method of a superclass', () =>
        expect(() =>
          compileWithClasses(classes, 'Child c = new Child(); int n = c.visible();')
        ).not.toThrow())
      it("allows the subclass's own method", () =>
        expect(() =>
          compileWithClasses(classes, 'Child c = new Child(); int n = c.childOnly();')
        ).not.toThrow())

      describe('super.field', () => {
        const parent = `
        class Parent {
          private int secret = 1;
          public int shown = 2;
        }
      `
        const withChild = (member: string) => `
        ${parent}
        class Child extends Parent {
          ${member}
        }
      `
        const rejected: [string, string][] = [
          ['a private field of the superclass', 'public int get() { return super.secret; }'],
          [
            'assigning a private field of the superclass',
            'public void set() { super.secret = 3; }'
          ],
          ['a field the superclass does not have', 'public int get() { return super.nothing; }'],
          [
            'assigning a field the superclass does not have',
            'public void set() { super.nothing = 3; }'
          ],
          [
            'an instance field in a static method',
            'public static int get() { return super.shown; }'
          ]
        ]
        for (const [comment, member] of rejected) {
          it(`rejects ${comment}`, () =>
            expect(() => compileWithClasses(withChild(member), 'int x = 1;')).toThrow(
              /cannot resolve symbol|is not defined|non-static|Unsupported class type conversion/
            ))
        }
        it('rejects super.field in a class whose superclass is Object', () =>
          expect(() =>
            compileWithClasses(
              'class Loner { public int get() { return super.shown; } }',
              'int x = 1;'
            )
          ).toThrow(/cannot resolve symbol|is not defined|Unsupported class type conversion/))
        it('allows a public field of the superclass', () =>
          expect(() =>
            compileWithClasses(withChild('public int get() { return super.shown; }'), 'int x = 1;')
          ).not.toThrow())
      })

      it('rejects assigning an instance field without a qualifier in a static method', () =>
        expect(() =>
          compileWithClasses(
            'class Holder { int n; public static void set() { n = 1; } }',
            'Holder.set();'
          )
        ).toThrow(/non-static/))
    })
    describe('cyclic inheritance', () => {
      const rejected: [string, string, string][] = [
        ['a class that extends itself', 'class A extends A { }', 'A'],
        ['two classes that extend each other', 'class A extends B { } class B extends A { }', 'A'],
        [
          'a cycle of three classes',
          'class A extends B { } class B extends C { } class C extends A { }',
          'A'
        ],
        [
          'a cycle declared in another order, naming the first class declared in it',
          'class C extends A { } class B extends C { } class A extends B { }',
          'C'
        ],
        [
          'a class that extends into a cycle, naming a class on the cycle',
          'class A extends B { } class B extends A { } class D extends A { }',
          'A'
        ],
        [
          'a class that extends into a cycle, declared before it',
          'class D extends A { } class A extends B { } class B extends A { }',
          'A'
        ],
        [
          'a cycle after unrelated classes',
          'class Z { } class Y extends Z { } class A extends B { } class B extends A { }',
          'A'
        ],
        [
          'a long cycle',
          'class A extends B { } class B extends C { } class C extends D { } class D extends E { } class E extends A { }',
          'A'
        ],
        [
          'a cycle whose classes have members',
          'class A extends B { int x; void f() { } A() { } } class B extends A { int y; void g() { } B() { } }',
          'A'
        ],
        [
          'a cycle of abstract classes',
          'abstract class A extends B { abstract void f(); } abstract class B extends A { }',
          'A'
        ],
        ['a cycle with a final class', 'final class A extends B { } class B extends A { }', 'A'],
        [
          'a cycle of nested classes',
          'class O { static class A extends B { } static class B extends A { } }',
          'A'
        ],
        ['a nested class that extends itself', 'class O { static class A extends A { } }', 'A'],
        [
          'two separate cycles, naming the first',
          'class A extends B { } class B extends A { } class X extends Y { } class Y extends X { }',
          'A'
        ],
        [
          'a cycle among classes that extend library classes elsewhere',
          'class E extends Exception { } class A extends B { } class B extends A { }',
          'A'
        ]
      ]
      for (const [comment, classes, involved] of rejected) {
        it(`rejects ${comment}`, () =>
          expect(() => compileWithClasses(classes, 'int x = 1;')).toThrow(
            `cyclic inheritance involving ${involved}`
          ))
      }

      const allowed: [string, string][] = [
        ['a chain of classes', 'class A { } class B extends A { } class C extends B { }'],
        ['a chain declared backwards', 'class C extends B { } class B extends A { } class A { }'],
        [
          'a tree of classes',
          'class A { } class B extends A { } class C extends A { } class D extends B { }'
        ],
        [
          'a class that extends a library class',
          'class A extends Exception { } class B extends A { }'
        ],
        ['a class that extends Object explicitly', 'class A extends Object { }'],
        [
          'a nested class that extends its enclosing class',
          'class O { static class A extends O { } }'
        ],
        [
          'a nested class that extends a sibling',
          'class O { static class A { } static class B extends A { } }'
        ],
        [
          'a class that extends a nested class of another class',
          'class O { static class A { } } class B extends O.A { }'
        ]
      ]
      for (const [comment, classes] of allowed) {
        it(`allows ${comment}`, () =>
          expect(() => compileWithClasses(classes, 'int x = 1;')).not.toThrow())
      }
    })
  })
