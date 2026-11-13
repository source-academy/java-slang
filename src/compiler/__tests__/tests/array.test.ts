import * as peggy from "peggy";
import { compile } from "../../index";
import { AST } from "../../../ast/types/packages-and-modules";
import { javaPegGrammar } from "../../grammar";
import { peggyFunctions } from "../../peggy-functions";
import {
  runTest,
  testCase,
} from "../__utils__/test-utils";

const testCases: testCase[] = [
  {
    comment: "array creation",
    program: `
      public class Main {
        public static void main(String[] args) {
          int[] a = {1, 2, 3};
          System.out.println("success");
        }
      }
    `,
    expectedLines: ["success"],
  },
  {
    comment: "array accesses",
    program: `
      public class Main {
        public static void main(String[] args) {
          int[] a = {1, 2, 3};
          System.out.println(a[0]);
          System.out.println(a[1]);
          System.out.println(a[2]);
        }
      }
    `,
    expectedLines: ["1", "2", "3"],
  },
  {
    comment: "array length",
    program: `
      public class Main {
        public static void main(String[] args) {
          int[] a = {};
          int[] b = {4, 6, 7};
          int[] c = {3};
          int[] d = {11, 99};

          System.out.println(a.length);
          System.out.println(b.length);
          System.out.println(c.length);
          System.out.println(d.length);
        }
      }
    `,
    expectedLines: ["0", "3", "1", "2"],
  },
  {
    comment: "array manipulation",
    program: `
      public class Main {
        public static void main(String[] args) {
          int[] a = {1, 2, 3};
          a[0] = 100;
          System.out.println(a[0]);
          a[1] = a[2] + 5;
          System.out.println(a[1]);
          a[2] += 7;
          System.out.println(a[2]);
        }
      }
    `,
    expectedLines: ["100", "8", "10"],
  },
  {
    comment: "sum of two arrays",
    program: `
      public class Main {
        public static void main(String[] args) {
          int[] a = {1, 2, 3, 4, 5};
          int[] b = {6, 7, 8, 9, 10};
          int[] c = {0, 0, 0, 0, 0};
          for (int i = 0; i < 5; i++) {
            c[i] = a[i] + b[i];
          }
          for (int j = 0; j < c.length; j++) {
            System.out.println(c[j]);
          }
        }
      }
    `,
    expectedLines: ["7", "9", "11", "13", "15"],
  },
  {
    comment: "pass array to and from function",
    program: `
      public class Main {
        public static void printArr(int[] a) {
          for (int i = 0; i < a.length; i++) {
            System.out.println(a[i]);
          }
        }

        public static int[] getSampleArr() {
          int[] arr = {3, 1, 4, 1, 5, 9};
          return arr;
        }

        public static void main(String[] args) {
          int[] a = {1, 2, 3, 4, 5};
          printArr(a);

          a = getSampleArr();
          printArr(a);
        }
      }
    `,
    expectedLines: ["1", "2", "3", "4", "5", "3", "1", "4", "1", "5", "9"],
  },
  {
    comment: "array of float",
    program: `
      public class Main {
        public static void main(String[] args) {
          float[] b = {1.1f, 8.8f, 3.14f};
          for (int i = 0; i < b.length; i++) {
            System.out.println(b[i]);
          }
        }
      }
    `,
    expectedLines: ["1.1", "8.8", "3.14"],
  },
  {
    comment: "array of long",
    program: `
      public class Main {
        public static void main(String[] args) {
          long[] a = {3L, 5L, 7L};
          for (int i = 0; i < a.length; i++) {
            System.out.println(a[i]);
          }
        }
      }
    `,
    expectedLines: ["3", "5", "7"],
  },
  {
    comment: "array of double",
    program: `
      public class Main {
        public static void main(String[] args) {
          double[] b = {3.3, 5.5, 7.9};
          for (int i = 0; i < b.length; i++) {
            System.out.println(b[i]);
          }
        }
      }
    `,
    expectedLines: ["3.3", "5.5", "7.9"],
  },
  {
    comment: "array of boolean",
    program: `
      public class Main {
        public static void main(String[] args) {
          boolean[] a = {true, false, false, true};
          for (int i = 0; i < a.length; i++) {
            System.out.println(a[i]);
          }
        }
      }
    `,
    expectedLines: ["true", "false", "false", "true"],
  },
  {
    comment: "array of char",
    program: `
      public class Main {
        public static void main(String[] args) {
          char[] a = {'J', 'a', 'v', 'a'};
          for (int i = 0; i < a.length; i++) {
            System.out.println(a[i]);
          }
        }
      }
    `,
    expectedLines: ["J", "a", "v", "a"],
  },
  {
    comment: "array of string",
    program: `
      public class Main {
        public static void main(String[] args) {
          String[] sarr = {"asdf", "qwer", "zxcv"};
          for (int i = 0; i < sarr.length; i++) {
            System.out.println(sarr[sarr.length - 1 - i]);
          }
        }
      }
    `,
    expectedLines: ["zxcv", "qwer", "asdf"],
  },
  {
    comment: "array of reference type",
    program: `
      public class Main {
        public int data;
        Main(int data) {
          this.data = data;
        }
        public static void main(String[] args) {
          Main[] a = {new Main(7), new Main(2), new Main(5), new Main(6)};
          for (int i = 0; i < a.length; i++) {
            Main m = a[i];
            System.out.println(m.data);
          }
        }
      }
    `,
    expectedLines: ["7", "2", "5", "6"],
  },
  {
    comment: "array creation with default values and with an explicit initializer",
    program: `
      class Animal { String name() { return "animal"; } }
      class Dog extends Animal { String name() { return "dog"; } }
      class Holder {
        int[] counts = new int[3];
        static String[] names = new String[2];
        double[] weights = new double[] {1.5, 2.5};
        static int[] primes = new int[] {2, 3, 5, 7};
      }
      public class Main {
        static int sum(int[] values) {
          int total = 0;
          for (int i = 0; i < values.length; i++) { total = total + values[i]; }
          return total;
        }
        static int[] squares(int n) {
          int[] result = new int[n];
          for (int i = 0; i < n; i++) { result[i] = i * i; }
          return result;
        }
        static int[] pair(int a, int b) { return new int[] {a, b}; }
        static String describe(Object[] items) { return "objects:" + items.length; }

        public static void main(String[] args) {
          int[] ints = new int[5];
          long[] longs = new long[2];
          short[] shorts = new short[2];
          byte[] bytes = new byte[2];
          char[] chars = new char[2];
          boolean[] flags = new boolean[2];
          float[] floats = new float[2];
          double[] doubles = new double[2];
          String[] strings = new String[2];
          Animal[] animals = new Animal[2];
          System.out.println(ints.length + " " + ints[0] + ints[4]);
          System.out.println(longs[1]);
          System.out.println(shorts[0] + bytes[1]);
          System.out.println((int) chars[0]);
          System.out.println(flags[0]);
          System.out.println(floats[1]);
          System.out.println(doubles[0]);
          System.out.println(strings[1] == null);
          System.out.println(animals[0] == null);

          int n = 3;
          int[] sized = new int[n * 2 + 1];
          System.out.println(sized.length);
          char c = 4;
          byte b = 2;
          short s = 3;
          Integer boxed = 6;
          int[] ac = new int[c];
          int[] ab = new int[b];
          int[] as = new int[s];
          int[] aw = new int[boxed];
          System.out.println(ac.length + ab.length + as.length + aw.length);

          int[] explicit = new int[] {1, 2, 3, 4, 5};
          System.out.println(sum(explicit));
          int[] empty = new int[] {};
          int[] zero = new int[0];
          System.out.println(empty.length + zero.length);
          long[] widened = new long[] {1, n, 'a'};
          double[] doubled = new double[] {1, 2.5f, 'a'};
          char[] letters = new char[] {'a', 98, 'c'};
          byte[] tiny = new byte[] {1, 2, 3};
          System.out.println(widened[2] + " " + doubled[2] + " " + letters[1] + " " + tiny[2]);
          String[] words = new String[] {"x", "y" + 1, null};
          Object[] mixed = new Object[] {"s", 1, null, 2.5};
          System.out.println(words[1] + " " + words.length + " " + mixed.length);
          Animal[] pets = new Animal[] {new Dog(), new Animal()};
          Animal first = pets[0];
          System.out.println(first.name());

          int[] filled = squares(5);
          System.out.println(sum(filled));
          System.out.println(sum(new int[] {10, 20, 30}));
          System.out.println(sum(new int[4]));
          int[] two = pair(7, 8);
          System.out.println(two[0] + two[1]);
          System.out.println(describe(new String[3]));
          System.out.println(describe(new Object[] {1, 2}));

          int[] reassigned = new int[2];
          reassigned = new int[] {9, 9, 9};
          System.out.println(reassigned.length);
          int cstyle[] = new int[3];
          cstyle[2] = 5;
          System.out.println(cstyle[2] + cstyle.length);

          Animal[] covariant = new Dog[2];
          Object[] asObjects = new String[2];
          Object anArray = new int[3];
          System.out.println(covariant.length + asObjects.length);
          Comparable[] comparables = new String[] {"b", "a"};
          System.out.println(comparables.length);

          Holder h = new Holder();
          System.out.println(h.counts.length);
          h.counts[1] = 4;
          System.out.println(h.counts[1]);
          System.out.println(Holder.names.length);
          System.out.println(h.weights[1]);
          System.out.println(Holder.primes[3]);

          try {
            int[] bad = new int[n - 10];
            System.out.println("not reached");
          } catch (NegativeArraySizeException e) {
            System.out.println("negative size");
          }
          try {
            Object[] stores = new String[1];
            stores[0] = Integer.valueOf(1);
            System.out.println("not reached");
          } catch (ArrayStoreException e) {
            System.out.println("array store");
          }
          try {
            int[] small = new int[2];
            small[2] = 1;
            System.out.println("not reached");
          } catch (ArrayIndexOutOfBoundsException e) {
            System.out.println("out of bounds");
          }
          System.out.println(new int[3] == new int[3]);
        }
      }
    `,
    expectedLines: ["5 00", "0", "0", "0", "false", "0.0", "0.0", "true", "true", "7", "15", "15", "0", "97 97.0 b 3", "y1 3 4", "dog", "30", "60", "0", "15", "objects:3", "objects:2", "3", "8", "4", "2", "3", "4", "2", "2.5", "7", "negative size", "array store", "out of bounds", "false"],
  },
];

export const arrayTest = () => describe("arrays", () => {
  for (let testCase of testCases) {
    const { comment: comment, program: program, expectedLines: expectedLines } = testCase;
    it(comment, () => runTest(program, expectedLines));
  }
  describe("array creation expressions", () => {
    const compileBody = (body: string) => {
      const parser = peggy.generate(peggyFunctions + javaPegGrammar, {
        allowedStartRules: ["CompilationUnit"],
      });
      return compile(
        parser.parse(`
          abstract class Shape { }
          class Circle extends Shape { }
          class Plain { }
          public class Main {
            public static void main(String[] args) {
              int n = 4; long l = 3L; double d = 2.0; float f = 1f; char ch = 3; byte by = 2; short sh = 2;
              boolean b = true; Integer wi = 2; Long wl = 2L; Character wc = 'c'; Byte wby = 1; Boolean wb = true;
              String s = "s"; int[] ia = {1}; Object o = null;
              ${body}
            }
          }
        `) as AST
      );
    };

    const accepted: [string, string][] = [
      ["an int array of a given size", "int[] a = new int[5];"],
      ["a double array", "double[] a = new double[3];"],
      ["a boolean array", "boolean[] a = new boolean[2];"],
      ["a char array", "char[] a = new char[2];"],
      ["a byte array", "byte[] a = new byte[2];"],
      ["a short array", "short[] a = new short[2];"],
      ["a long array", "long[] a = new long[2];"],
      ["a float array", "float[] a = new float[2];"],
      ["a String array", "String[] a = new String[3];"],
      ["an Object array", "Object[] a = new Object[3];"],
      ["an array of a user class", "Plain[] a = new Plain[3];"],
      ["an array of an abstract class", "Shape[] a = new Shape[3];"],
      ["an array of an interface", "Runnable[] a = new Runnable[2];"],
      ["an array of a wrapper class", "Integer[] a = new Integer[2];"],
      ["a size from a variable", "int[] a = new int[n];"],
      ["a size from an expression", "int[] a = new int[n * 2 - 1];"],
      ["a size of zero", "int[] a = new int[0];"],
      ["a negative size, which fails at run time", "int[] a = new int[-1];"],
      ["a size from an array element", "int[] a = new int[ia[0]];"],
      ["a size from a length", "int[] a = new int[ia.length];"],
      ["a char size", "int[] a = new int[ch];"],
      ["a byte size", "int[] a = new int[by];"],
      ["a short size", "int[] a = new int[sh];"],
      ["a char literal size", "int[] a = new int['c'];"],
      ["an Integer size", "int[] a = new int[wi];"],
      ["a Character size", "int[] a = new int[wc];"],
      ["a Byte size", "int[] a = new int[wby];"],
      ["a size with a side effect", "int[] a = new int[n++];"],
      ["a cast size", "int[] a = new int[(int) l];"],
      ["a conditional size", "int[] a = new int[n > 2 ? 3 : 4];"],
      ["an assignment of a new array", "int[] a; a = new int[5];"],
      ["a C-style declarator", "int a[] = new int[5];"],
      ["a reassignment", "int[] a = new int[5]; a = new int[2];"],
      ["an explicit initializer", "int[] a = new int[] {1, 2, 3, 4, 5};"],
      ["an empty explicit initializer", "int[] a = new int[] {};"],
      ["initializer elements that are expressions", "int[] a = new int[] {n, n + 1};"],
      ["initializer elements that are narrower", "int[] a = new int[] {ch, by};"],
      ["initializer elements that are widened", "long[] a = new long[] {1, n};"],
      ["initializer elements widened to double", "double[] a = new double[] {1, 2.5f, ch};"],
      ["a String initializer", "String[] a = new String[] {\"a\", \"b\"};"],
      ["an Object initializer with boxing", "Object[] a = new Object[] {\"a\", 1, null};"],
      ["an initializer of subclasses", "Shape[] a = new Shape[] {new Circle()};"],
      ["an initializer of wrappers", "Number[] a = new Number[] {1, 2L};"],
      ["a boolean initializer", "boolean[] a = new boolean[] {true, false};"],
      ["a char initializer from an int constant", "char[] a = new char[] {'a', 98};"],
      ["a byte initializer", "byte[] a = new byte[] {1, 2};"],
      ["an assignment of an explicit initializer", "int[] a; a = new int[] {1, 2};"],
      ["a created array as an Object", "Object o2 = new int[3];"],
      ["a created String array as an Object", "Object o2 = new String[3];"],
      ["a created array as an array of a superclass", "Object[] a = new String[3];"],
      ["a created array as an array of a superclass of its element", "Shape[] a = new Circle[2];"],
      ["a created array as an array of an interface it implements", "Comparable[] a = new String[2];"],
    ];
    for (const [comment, body] of accepted) {
      it(`accepts ${comment}`, () => expect(() => compileBody(body)).not.toThrow());
    }

    const rejected: [string, string, RegExp | undefined][] = [
      ["a long size", "int[] a = new int[l];", /incompatible types: possible lossy conversion from (long|float|double) to int/],
      ["a double size", "int[] a = new int[d];", /incompatible types: possible lossy conversion from (long|float|double) to int/],
      ["a float size", "int[] a = new int[f];", /incompatible types: possible lossy conversion from (long|float|double) to int/],
      ["a double literal size", "int[] a = new int[2.5];", /incompatible types: possible lossy conversion from (long|float|double) to int/],
      ["a long literal size", "int[] a = new int[3L];", /incompatible types: possible lossy conversion from (long|float|double) to int/],
      ["a Long size", "int[] a = new int[wl];", /incompatible types: possible lossy conversion from (long|float|double) to int/],
      ["a boolean size", "int[] a = new int[b];", /incompatible types: .* cannot be converted to int/],
      ["a boolean literal size", "int[] a = new int[true];", /incompatible types: .* cannot be converted to int/],
      ["a String size", "int[] a = new int[s];", /incompatible types: .* cannot be converted to int/],
      ["a string literal size", "int[] a = new int[\"3\"];", /incompatible types: .* cannot be converted to int/],
      ["a null size", "int[] a = new int[null];", /incompatible types: .* cannot be converted to int/],
      ["a Boolean size", "int[] a = new int[wb];", /incompatible types: .* cannot be converted to int/],
      ["an Object size", "int[] a = new int[o];", /incompatible types: .* cannot be converted to int/],
      ["an array size", "int[] a = new int[ia];", /incompatible types: .* cannot be converted to int/],
      ["an initializer element of the wrong type", "int[] a = new int[] {1, \"s\"};", undefined],
      ["an initializer element that needs a narrowing", "int[] a = new int[] {1, 2.5};", undefined],
      ["a long in an int initializer", "int[] a = new int[] {1L};", undefined],
      ["an int in a String initializer", "String[] a = new String[] {\"a\", 1};", undefined],
      ["an int in a boolean initializer", "boolean[] a = new boolean[] {1};", undefined],
      ["a byte initializer constant that does not fit", "byte[] a = new byte[] {200};", undefined],
      ["an int array assigned to a long array", "long[] a = new int[3];", undefined],
      ["a long array assigned to an int array", "int[] a = new long[3];", undefined],
      ["an Integer array assigned to an int array", "int[] a = new Integer[3];", undefined],
      ["an int array assigned to an Object array", "Object[] a = new int[3];", undefined],
      ["a String array assigned to an int array", "int[] a = new String[3];", undefined],
      ["a superclass array assigned to a subclass array", "Circle[] a = new Shape[2];", undefined],
      ["an array assigned to an int", "int x = new int[3];", undefined],
      ["an array assigned to a String", "String t = new int[3];", undefined],
      ["a two-dimensional creation", "int[][] a = new int[2][3];", /multidimensional array creation/],
      ["a creation with an unsized dimension", "int[][] a = new int[2][];", /multidimensional array creation/],
      ["a two-dimensional initializer", "int[][] a = new int[][] {{1}};", /multidimensional array creation/],
    ];
    for (const [comment, body, message] of rejected) {
      it(`rejects ${comment}`, () =>
        message === undefined
          ? expect(() => compileBody(body)).toThrow()
          : expect(() => compileBody(body)).toThrow(message));
    }
  });
});
