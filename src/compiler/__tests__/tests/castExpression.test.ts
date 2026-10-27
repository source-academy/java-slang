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

  describe("rejects casts that are not allowed", () => {
    const rejected: [string, string][] = [
      ["boolean to int", "boolean b = true; int i = (int) b;"],
      ["int to boolean", "int i = 1; boolean b = (boolean) i;"],
      ["String to int", "String s = \"1\"; int i = (int) s;"],
      ["int to String", "String s = (String) 1;"],
    ];
    for (const [comment, body] of rejected) {
      it(comment, () => expect(() => compileProgram(body)).toThrow());
    }
  });
});