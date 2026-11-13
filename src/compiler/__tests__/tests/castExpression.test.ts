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
    comment: "Simple primitive casting: int to float",
    program: `
      public class Main {
        public static void main(String[] args) {
          int a = 5;
          float b = (float) a;
          System.out.println(b);
        }
      }
    `,
    expectedLines: ["5.0"],
  },
  {
    comment: "Simple primitive casting: float to int",
    program: `
      public class Main {
        public static void main(String[] args) {
          float a = 2.9f;
          int b = (int) a;
          System.out.println(b);
        }
      }
    `,
    expectedLines: ["2"],
  },
  {
    comment: "Primitive casting: double to long",
    program: `
      public class Main {
        public static void main(String[] args) {
          double a = 123456789.987;
          long b = (long) a;
          System.out.println(b);
        }
      }
    `,
    expectedLines: ["123456789"],
  },
  {
    comment: "Primitive casting: long to byte",
    program: `
      public class Main {
        public static void main(String[] args) {
          long a = 257;
          byte b = (byte) a;
          System.out.println(b);
        }
      }
    `,
    expectedLines: ["1"], // byte wraps around at 256
  },
  {
    comment: "Primitive casting: char to int",
    program: `
      public class Main {
        public static void main(String[] args) {
          char a = 'A';
          int b = (int) a;
          System.out.println(b);
        }
      }
    `,
    expectedLines: ["65"],
  },
  {
    comment: "Primitive casting: int to char",
    program: `
      public class Main {
        public static void main(String[] args) {
          int a = 65;
          char b = (char) a;
          System.out.println(b);
        }
      }
    `,
    expectedLines: ["A"],
  },
  {
    comment: "Primitive casting: int to char",
    program: `
      public class Main {
        public static void main(String[] args) {
          int a = 66;
          char b = (char) a;
          System.out.println(b);
        }
      }
    `,
    expectedLines: ["B"],
  },
  {
    comment: "Primitive casting with loss of precision",
    program: `
      public class Main {
        public static void main(String[] args) {
          double a = 123.456;
          int b = (int) a;
          System.out.println(b);
        }
      }
    `,
    expectedLines: ["123"],
  },
  {
    comment: "Primitive casting: float to short",
    program: `
      public class Main {
        public static void main(String[] args) {
          float a = 32768.0f;
          short b = (short) a;
          System.out.println(b);
        }
      }
    `,
    expectedLines: ["-32768"], // short wraps around
  },
  {
    comment: "Chained casting: double to int to byte",
    program: `
      public class Main {
        public static void main(String[] args) {
          double a = 258.99;
          int b = (int) a;
          byte c = (byte) b;
          System.out.println(c);
        }
      }
    `,
    expectedLines: ["2"], // 258 -> byte wraps around
  },
  {
    comment: "Double to int truncates toward zero",
    program: `
      public class Main {
        public static void main(String[] args) {
          double a = 5.9;
          double b = -5.9;
          System.out.println((int) a);
          System.out.println((int) b);
          System.out.println((int) 2.5);
        }
      }
    `,
    expectedLines: ["5", "-5", "2"],
  },
  {
    comment: "Double and float to long truncate toward zero",
    program: `
      public class Main {
        public static void main(String[] args) {
          double a = 5.9;
          float b = -5.9f;
          System.out.println((long) a);
          System.out.println((long) b);
        }
      }
    `,
    expectedLines: ["5", "-5"],
  },
  {
    comment: "Out-of-range and NaN floating point to int/long",
    program: `
      public class Main {
        public static void main(String[] args) {
          double big = 1e19;
          double nan = 0.0 / 0.0;
          System.out.println((int) big);
          System.out.println((long) -big);
          System.out.println((int) nan);
          System.out.println((long) nan);
        }
      }
    `,
    expectedLines: ["2147483647", "-9223372036854775808", "0", "0"],
  },
  {
    comment: "Double to byte, short and char go via int",
    program: `
      public class Main {
        public static void main(String[] args) {
          double a = 300.9;
          double c = 65535.9;
          System.out.println((byte) a);
          System.out.println((short) a);
          System.out.println((int) (char) c);
          System.out.println((byte) -129.5);
        }
      }
    `,
    expectedLines: ["44", "300", "65535", "127"],
  },
  {
    comment: "Float to byte and char",
    program: `
      public class Main {
        public static void main(String[] args) {
          float a = 255.9f;
          System.out.println((byte) a);
          System.out.println((int) (char) a);
        }
      }
    `,
    expectedLines: ["-1", "255"],
  },
  {
    comment: "Long to short, char and int",
    program: `
      public class Main {
        public static void main(String[] args) {
          long a = 4294967297L;
          long b = 65537L;
          System.out.println((int) a);
          System.out.println((short) b);
          System.out.println((int) (char) -1L);
        }
      }
    `,
    expectedLines: ["1", "1", "65535"],
  },
  {
    comment: "Int to byte and short wrap around",
    program: `
      public class Main {
        public static void main(String[] args) {
          int a = 200;
          int b = 40000;
          System.out.println((byte) a);
          System.out.println((short) b);
        }
      }
    `,
    expectedLines: ["-56", "-25536"],
  },
  {
    comment: "Widening casts from byte, short and char",
    program: `
      public class Main {
        public static void main(String[] args) {
          byte b = (byte) -3;
          short s = (short) 500;
          char c = 'a';
          System.out.println((long) b);
          System.out.println((double) s);
          System.out.println((float) c);
        }
      }
    `,
    expectedLines: ["-3", "500.0", "97.0"],
  },
  {
    comment: "Narrowing cast result assigned to narrow variables",
    program: `
      public class Main {
        public static void main(String[] args) {
          int i = 321;
          byte b = (byte) i;
          short s = (short) 70000;
          char c = (char) 97.9;
          long l = (long) 1.99;
          System.out.println(b);
          System.out.println(s);
          System.out.println(c);
          System.out.println(l);
        }
      }
    `,
    expectedLines: ["65", "4464", "a", "1"],
  },
  {
    comment: "Reference cast: downcast and upcast between classes",
    program: `
      class Animal { public int legs() { return 4; } }
      class Dog extends Animal { public int legs() { return 5; } public String bark() { return "woof"; } }
      public class Main {
        public static void main(String[] args) {
          Animal a = new Dog();
          Dog d = (Dog) a;
          System.out.println(d.bark());
          Animal b = (Animal) d;
          System.out.println(b.legs());
        }
      }
    `,
    expectedLines: ["woof", "5"],
  },
  {
    comment: "Reference cast: Object to String and Integer",
    program: `
      public class Main {
        public static void main(String[] args) {
          Object o = "hello";
          String s = (String) o;
          System.out.println(s);
          Object p = 5;
          Integer i = (Integer) p;
          int j = (Integer) p;
          System.out.println(i + j);
        }
      }
    `,
    expectedLines: ["hello", "10"],
  },
  {
    comment: "Reference cast: cast as argument and method result",
    program: `
      class Animal { public int legs() { return 4; } }
      class Dog extends Animal { public int legs() { return 5; } public int bark(int x) { return x + 1; } }
      public class Main {
        static int f(Dog d) { return d.bark(1); }
        static Animal make() { return new Dog(); }
        public static void main(String[] args) {
          Animal a = new Dog();
          System.out.println(f((Dog) a));
          Dog d = (Dog) make();
          System.out.println(d.bark(2));
          Animal back = (Animal) d;
          System.out.println(back.legs());
        }
      }
    `,
    expectedLines: ["2", "3", "5"],
  },
  {
    comment: "Reference cast: Object/Number to String, Character and Integer",
    program: `
      public class Main {
        public static void main(String[] args) {
          Object o = "abc";
          System.out.println((String) o);
          Object p = 'c';
          char c = (Character) p;
          System.out.println(c);
          Number n = 7;
          Integer k = (Integer) n;
          System.out.println(k);
        }
      }
    `,
    expectedLines: ["abc", "c", "7"],
  },
  {
    comment: "Casting Object or a wrapper to a primitive",
    program: `
      public class Main {
        public static void main(String[] args) {
          Object o = 7;
          int i = (int) o;
          System.out.println(i);
          Integer w = 9;
          long l = (long) w;
          double d = (double) w;
          int j = (int) w;
          System.out.println(l + " " + d + " " + j);
          Object x = 2.5;
          double dd = (double) x;
          System.out.println(dd);
          Object c = 'q';
          char cc = (char) c;
          System.out.println(cc);
          Object bo = true;
          boolean bb = (boolean) bo;
          System.out.println(bb);
        }
      }
    `,
    expectedLines: ["7", "9 9.0 9", "2.5", "q", "true"],
  },
  {
    comment: "Casting a primitive to a reference type boxes it",
    program: `
      public class Main {
        public static void main(String[] args) {
          Object o = (Object) 5;
          Integer i = (Integer) 6;
          Number n = (Number) 7;
          Object p = (Object) 'z';
          Double d = (Double) 1.5;
          System.out.println(o + " " + i + " " + n + " " + p + " " + d);
          String s = (String) "str";
          Object q = (Object) s;
          System.out.println(q);
        }
      }
    `,
    expectedLines: ["5 6 7 z 1.5", "str"],
  },
  {
    comment: "Reference cast: null",
    program: `
      class Animal { }
      class Dog extends Animal { }
      public class Main {
        public static void main(String[] args) {
          Animal a = null;
          Dog d = (Dog) a;
          System.out.println(d == null);
          String s = (String) null;
          System.out.println(s == null);
        }
      }
    `,
    expectedLines: ["true", "true"],
  },
  {
    comment: "Reference cast: multi-level hierarchy",
    program: `
      class A { public int v() { return 1; } }
      class B extends A { public int v() { return 2; } }
      class C extends B { public int v() { return 3; } public int only() { return 30; } }
      public class Main {
        public static void main(String[] args) {
          A a = new C();
          B b = (B) a;
          C c = (C) b;
          System.out.println(b.v() + " " + c.only());
          Object o = a;
          C c2 = (C) o;
          System.out.println(c2.only());
        }
      }
    `,
    expectedLines: ["3 30", "30"],
  },
  {
    comment: "Reference cast: failing cast throws ClassCastException",
    program: `
      class Animal { }
      class Dog extends Animal { }
      class Cat extends Animal { }
      public class Main {
        public static void main(String[] args) {
          Animal a = new Cat();
          try {
            Dog d = (Dog) a;
            System.out.println("unreachable");
          } catch (ClassCastException e) {
            System.out.println("caught");
          }
          Object o = "text";
          try {
            Integer i = (Integer) o;
            System.out.println("unreachable");
          } catch (ClassCastException e) {
            System.out.println("caught again");
          }
          try {
            int n = (int) o;
            System.out.println("unreachable");
          } catch (ClassCastException e) {
            System.out.println("caught primitive");
          }
        }
      }
    `,
    expectedLines: ["caught", "caught again", "caught primitive"],
  },
  {
    comment: "Casting Number or Object to a primitive checks the wrapper class at runtime",
    program: `
      public class Main {
        public static void main(String[] args) {
          Number n = 1.5;
          try {
            int i = (int) n;
            System.out.println("unreachable " + i);
          } catch (ClassCastException e) {
            System.out.println("Double is not an Integer");
          }
          Number m = 7;
          int j = (int) m;
          System.out.println(j);
          Number big = 5000000000L;
          long l = (long) big;
          System.out.println(l);
          Number half = 2.5;
          double d = (double) half;
          System.out.println(d);
          Object o = 3;
          try {
            long wrong = (long) o;
            System.out.println("unreachable " + wrong);
          } catch (ClassCastException e) {
            System.out.println("Integer is not a Long");
          }
          Integer w = 9;
          double widened = (double) w;
          System.out.println(widened);
        }
      }
    `,
    expectedLines: ["Double is not an Integer", "7", "5000000000", "2.5", "Integer is not a Long", "9.0"],
  },
  {
    comment: "casts to library interfaces and calls through them",
    program: `
      public class Main {
        static int length(CharSequence c) { return c.length(); }
        public static void main(String[] args) {
          Object o = "hello";
          CharSequence c = (CharSequence) o;
          System.out.println(c.length());
          System.out.println(c.charAt(1));
          System.out.println(c);
          System.out.println(c.subSequence(1, 3));
          System.out.println(length("abc"));
          Comparable m = (Comparable) o;
          System.out.println(m.compareTo("hellp"));
          Integer i = 5;
          Comparable n = (Comparable) i;
          System.out.println(n.compareTo(3));
          Object p = new Object();
          try {
            Comparable bad = (Comparable) p;
            System.out.println("not reached");
          } catch (ClassCastException e) {
            System.out.println("not Comparable");
          }
        }
      }
    `,
    expectedLines: ["5", "e", "hello", "el", "3", "-1", "1", "not Comparable"],
  },
  {
    comment: "casts between one-dimensional array types and to Object, Cloneable and Serializable",
    program: `
      import java.io.Serializable;
      class Animal { }
      class Dog extends Animal { }
      class Cat extends Animal { }
      class Puppy extends Dog { }
      public class Main {
        static String attempt(int which, Object o) {
          try {
            if (which == 0) { Dog[] t = (Dog[]) o; }
            else if (which == 1) { Cat[] t = (Cat[]) o; }
            else if (which == 2) { Animal[] t = (Animal[]) o; }
            else if (which == 3) { Puppy[] t = (Puppy[]) o; }
            else if (which == 4) { Object[] t = (Object[]) o; }
            else if (which == 5) { int[] t = (int[]) o; }
            else if (which == 6) { long[] t = (long[]) o; }
            else if (which == 7) { String[] t = (String[]) o; }
            else if (which == 8) { Serializable t = (Serializable) o; }
            else if (which == 9) { Cloneable t = (Cloneable) o; }
            else { Comparable[] t = (Comparable[]) o; }
            return "ok";
          } catch (ClassCastException e) {
            return "CCE";
          }
        }
        public static void main(String[] args) {
          Dog[] dogs = {new Dog()};
          int[] ia = {1};
          String[] strings = {"s"};
          Object[] mixed = {"s"};
          Animal[] animals = dogs;
          Object[] viaStrings = (Object[]) strings;
          Object od = (Object) dogs;
          Object oi = (Object) ia;
          Object os = (Object) strings;
          Object om = (Object) mixed;
          Object oa = (Object) animals;
          Object ov = (Object) viaStrings;
          for (int w = 0; w <= 10; w++) {
            System.out.println(w + " " + attempt(w, od) + " " + attempt(w, oi) + " " + attempt(w, os) + " " + attempt(w, om) + " " + attempt(w, oa) + " " + attempt(w, ov));
          }
          Serializable ser = (Serializable) oi;
          Cloneable clone = (Cloneable) oi;
          int[] fromSer = (int[]) ser;
          int[] fromClone = (int[]) clone;
          System.out.println(fromSer.length + fromClone.length);
          Dog[] narrowed = (Dog[]) animals;
          Animal[] widened = (Animal[]) dogs;
          String[] again = (String[]) viaStrings;
          System.out.println(narrowed.length + widened.length + again.length);
          Dog[] none = (Dog[]) null;
          System.out.println(none == null);
        }
      }
    `,
    expectedLines: ["0 ok CCE CCE CCE ok CCE", "1 CCE CCE CCE CCE CCE CCE", "2 ok CCE CCE CCE ok CCE", "3 CCE CCE CCE CCE CCE CCE", "4 ok CCE ok ok ok ok", "5 CCE ok CCE CCE CCE CCE", "6 CCE CCE CCE CCE CCE CCE", "7 CCE CCE ok CCE CCE ok", "8 ok ok ok ok ok ok", "9 ok ok ok ok ok ok", "10 CCE CCE ok CCE CCE ok", "2", "3", "true"],
  },
];

const compileProgram = (body: string) => {
  const parser = peggy.generate(peggyFunctions + javaPegGrammar, {
    allowedStartRules: ["CompilationUnit"],
  });
  const program = `
    public class Main {
      public static void main(String[] args) {
        ${body}
      }
    }
  `;
  return compile(parser.parse(program) as AST);
};

export const castExpressionTest = () => describe("cast expression", () => {
  for (let testCase of testCases) {
    const { comment: comment, program: program, expectedLines: expectedLines } = testCase;
    it(comment, () => runTest(program, expectedLines));
  }

  describe("casts between classes", () => {
    const classes = `
      class Animal {}
      class Dog extends Animal {}
      class Puppy extends Dog {}
      class Cat extends Animal {}
      class Rock {}
      final class Sealed extends Animal {}
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

    const rejected: [string, string][] = [
      ["sibling classes", "Cat c = new Cat(); Dog d = (Dog) c;"],
      ["unrelated classes", "Rock r = new Rock(); Dog d = (Dog) r;"],
      ["unrelated classes, other direction", "Dog d = new Dog(); Rock r = (Rock) d;"],
      ["String to Integer", "String s = \"1\"; Integer i = (Integer) s;"],
      ["Integer to String", "Integer i = 1; String s = (String) i;"],
      ["Integer to Long", "Integer i = 1; Long l = (Long) i;"],
      ["arrays of unrelated classes", "Cat[] c = {new Cat()}; Dog[] d = (Dog[]) c;"],
      ["arrays of sibling-related final and non-final classes", "Sealed[] s = {new Sealed()}; Dog[] d = (Dog[]) s;"],
      ["a final class array to an unrelated array", "Dog[] d = {new Dog()}; Sealed[] s = (Sealed[]) d;"],
      ["arrays of unrelated library classes", "Integer[] i = {1}; String[] s = (String[]) i;"],
      ["a final class array to an interface array it does not implement", "String[] s = {\"s\"}; Runnable[] r = (Runnable[]) s;"],
      ["int[] to long[]", "int[] a = {1}; long[] l = (long[]) a;"],
      ["long[] to int[]", "long[] a = {1L}; int[] i = (int[]) a;"],
      ["int[] to byte[]", "int[] a = {1}; byte[] b = (byte[]) a;"],
      ["a primitive array to a reference array", "int[] a = {1}; Object[] o = (Object[]) a;"],
      ["a reference array to a primitive array", "Object[] a = {\"s\"}; int[] i = (int[]) a;"],
      ["a class to an array of it", "Dog d = new Dog(); Dog[] a = (Dog[]) d;"],
      ["an array to its component class", "Dog[] a = {new Dog()}; Dog d = (Dog) a;"],
      ["an array to an unrelated class", "String[] a = {\"s\"}; String s = (String) a;"],
      ["an array to a superclass of its component", "Integer[] a = {1}; Number n = (Number) a;"],
      ["an array to an interface other than Cloneable and Serializable", "Dog[] a = {new Dog()}; Runnable r = (Runnable) a;"],
      ["a primitive array to an interface other than Cloneable and Serializable", "int[] a = {1}; Runnable r = (Runnable) a;"],
      ["a final class to an interface it does not implement", "String s = \"a\"; Object o = (Runnable) s;"],
      ["a wrapper to an interface it does not implement", "Integer i = 1; Object o = (CharSequence) i;"],
      ["an interface to a final class that does not implement it", "CharSequence c = \"a\"; Object o = (Integer) c;"],
      ["a final class to a sibling class", "Sealed s = new Sealed(); Cat c = (Cat) s;"],
      ["a final library class to a subclass of its parent", "String s = \"1\"; Number n = (Number) s;"],
    ];
    for (const [comment, body] of rejected) {
      it(`rejects ${comment}`, () =>
        expect(() => compileWithClasses(body)).toThrow(/incompatible types/));
    }

    const allowed: [string, string][] = [
      ["downcast", "Animal a = new Dog(); Dog d = (Dog) a;"],
      ["downcast across several levels", "Animal a = new Puppy(); Puppy p = (Puppy) a;"],
      ["upcast", "Puppy p = new Puppy(); Animal a = (Animal) p;"],
      ["identity cast", "Dog d = new Dog(); Dog e = (Dog) d;"],
      ["Object to any class", "Object o = new Rock(); Rock r = (Rock) o;"],
      ["any class to Object", "Rock r = new Rock(); Object o = (Object) r;"],
      ["Object to String", "Object o = \"s\"; String s = (String) o;"],
      ["Number to Integer", "Number n = 1; Integer i = (Integer) n;"],
      ["Integer to Number", "Integer i = 1; Number n = (Number) i;"],
      ["null", "Dog d = (Dog) null;"],
      ["Object to an array", "Object o = null; Dog[] d = (Dog[]) o;"],
      ["Object to a primitive array", "Object o = null; int[] a = (int[]) o;"],
      ["an array to Object", "Dog[] a = {new Dog()}; Object o = (Object) a;"],
      ["a primitive array to Object", "int[] a = {1}; Object o = (Object) a;"],
      ["an array to a superclass array (widening)", "Dog[] a = {new Dog()}; Animal[] b = (Animal[]) a;"],
      ["an array to a subclass array (narrowing)", "Animal[] a = {new Dog()}; Dog[] b = (Dog[]) a;"],
      ["narrowing across several levels", "Dog[] a = {new Puppy()}; Puppy[] b = (Puppy[]) a;"],
      ["an array to the same array type", "Dog[] a = {new Dog()}; Dog[] b = (Dog[]) a;"],
      ["a final class array to an array of its superclass", "Sealed[] a = {new Sealed()}; Animal[] b = (Animal[]) a;"],
      ["Object[] to String[]", "Object[] a = {\"s\"}; String[] s = (String[]) a;"],
      ["String[] to Object[]", "String[] a = {\"s\"}; Object[] o = (Object[]) a;"],
      ["an array to an array of an interface it implements", "String[] a = {\"s\"}; Comparable[] c = (Comparable[]) a;"],
      ["an interface array to an array of a class implementing it", "Comparable[] a = {\"s\"}; String[] s = (String[]) a;"],
      ["Number[] to Integer[]", "Number[] a = {1}; Integer[] i = (Integer[]) a;"],
      ["Object[] to an interface array", "Object[] a = {\"s\"}; Runnable[] r = (Runnable[]) a;"],
      ["a non-final class array to an interface array", "Animal[] a = {new Dog()}; Runnable[] r = (Runnable[]) a;"],
      ["an array to Cloneable", "int[] a = {1}; Object o = (Cloneable) a;"],
      ["Cloneable to an array", "Cloneable c = null; int[] a = (int[]) c;"],
      ["null to an array type", "Dog[] a = (Dog[]) null;"],
      ["a final class to an interface it implements", "String s = \"a\"; Object o = (CharSequence) s;"],
      ["a final class to an interface implemented by its superclass", "StringBuilder b = new StringBuilder(); Object o = (CharSequence) b;"],
      ["a wrapper to Comparable", "Integer i = 1; Object o = (Comparable) i;"],
      ["a primitive to an interface its wrapper implements", "Object o = (Comparable) 5;"],
      ["a non-final class to an interface", "Number n = 1; Object o = (Runnable) n;"],
      ["Object to an interface", "Object o = \"a\"; Object p = (Runnable) o;"],
      ["an interface to a final class that implements it", "CharSequence c = \"a\"; String s = (String) c;"],
      ["an interface to Object", "CharSequence c = \"a\"; Object o = (Object) c;"],
      ["an interface to a non-final class", "CharSequence c = \"a\"; Dog d = (Dog) c;"],
      ["an interface to another interface", "CharSequence c = \"a\"; Object o = (Comparable) c;"],
      ["a final class to its superclass", "Sealed s = new Sealed(); Animal a = (Animal) s;"],
      ["a final class to itself", "Sealed s = new Sealed(); Sealed t = (Sealed) s;"],
      ["a final class to Object", "Sealed s = new Sealed(); Object o = (Object) s;"],
      ["a superclass to a final class", "Animal a = new Sealed(); Sealed s = (Sealed) a;"],
      ["a final library class to Object", "String s = \"1\"; Object o = (Object) s;"],
    ];
    for (const [comment, body] of allowed) {
      it(`allows ${comment}`, () => expect(() => compileWithClasses(body)).not.toThrow());
    }
  });

  describe("rejects casts that are not allowed", () => {
    const rejected: [string, string][] = [
      ["boolean to int", "boolean b = true; int i = (int) b;"],
      ["int to boolean", "int i = 1; boolean b = (boolean) i;"],
      ["String to int", "String s = \"1\"; int i = (int) s;"],
      ["int to String", "String s = (String) 1;"],
      ["wrapper to a narrower primitive", "Integer i = 1; short s = (short) i;"],
      ["wrapper to an unrelated primitive", "Integer i = 1; boolean b = (boolean) i;"],
      ["Number to char", "Number n = 1; char c = (char) n;"],
      ["Number to boolean", "Number n = 1; boolean b = (boolean) n;"],
      ["int to an interface its wrapper does not implement", "Object o = (CharSequence) 5;"],
    ];
    for (const [comment, body] of rejected) {
      it(comment, () => expect(() => compileProgram(body)).toThrow());
    }
  });
});