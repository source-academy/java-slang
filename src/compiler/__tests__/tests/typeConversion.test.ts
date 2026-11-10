import {
  runTest,
  testCase,
} from "../__utils__/test-utils";
import * as peggy from "peggy";
import { compile } from "../../index";
import { AST } from "../../../ast/types/packages-and-modules";
import { javaPegGrammar } from "../../grammar";
import { peggyFunctions } from "../../peggy-functions";

// Expected output of each program is what the real JVM prints for the javac-compiled program.
const testCases: testCase[] = [
  {
    comment: "comparison as a boolean value",
    program: `
      public class Main {
        static void p(Object o) {
        System.out.println(o);
        }

        public static void main(String[] args) {
          boolean b = 1 < 2;
          System.out.println(b);
          boolean c = 3 < 2;
          System.out.println(c);
        }
      }
    `,
    expectedLines: ["true", "false"],
  },
  {
    comment: "long comparison in condition and value contexts",
    program: `
      public class Main {
        static void p(Object o) {
        System.out.println(o);
        }

        public static void main(String[] args) {
          long a = 5L;
          long b = 7L;
          if (a < b) System.out.println(1);
          else System.out.println(0);
          boolean r = a > b;
          System.out.println(r);
        }
      }
    `,
    expectedLines: ["1", "false"],
  },
  {
    comment: "double compared with int",
    program: `
      public class Main {
        static void p(Object o) {
        System.out.println(o);
        }

        public static void main(String[] args) {
          double a = 5.5;
          int b = 7;
          if (a < b) System.out.println(1);
          else System.out.println(0);
        }
      }
    `,
    expectedLines: ["1"],
  },
  {
    comment: "int constants narrowed to byte, short and char",
    program: `
      public class Main {
        static void p(Object o) {
        System.out.println(o);
        }

        public static void main(String[] args) {
          byte b = -3;
          short s = 500;
          char c = 65;
          byte d = 'a';
          char e = 'a' + 1;
          byte f = (1 + 2) * 3;
          System.out.println(b);
          System.out.println(s);
          System.out.println(c);
          System.out.println(d);
          System.out.println(e);
          System.out.println(f);
        }
      }
    `,
    expectedLines: ["-3", "500", "A", "97", "b", "9"],
  },
  {
    comment: "widening from byte, short and char",
    program: `
      public class Main {
        static void p(Object o) {
        System.out.println(o);
        }

        public static void main(String[] args) {
          byte b = 5;
          short s = 6;
          char c = 'x';
          long l = b;
          float f = s;
          double d = c;
          int i = c;
          int j = b;
          short k = b;
          System.out.println(l);
          System.out.println(f);
          System.out.println(d);
          System.out.println(i + j + k);
        }
      }
    `,
    expectedLines: ["5", "6.0", "120.0", "130"],
  },
  {
    comment: "return value converted to the declared return type",
    program: `
      public class Main {
        static void p(Object o) {
        System.out.println(o);
        }
  static long f() {
        return 3;
        }
  static double g() {
        return 3;
        }
  static byte h() {
        return 7;
        }
  static char k() {
        return 66;
        }
  static float m(int x) {
        return x;
        }

        public static void main(String[] args) {
          System.out.println(f());
          System.out.println(g());
          System.out.println(h());
          System.out.println(k());
          System.out.println(m(4));
        }
      }
    `,
    expectedLines: ["3", "3.0", "7", "B", "4.0"],
  },
  {
    comment: "method arguments widened to parameter types",
    program: `
      public class Main {
        static void p(Object o) {
        System.out.println(o);
        }
  static long f(long x) {
        return x;
        }
  static double g(double x) {
        return x;
        }
  static int h(int x) {
        return x;
        }

        public static void main(String[] args) {
          byte b = 3;
          char c = 'a';
          short s = 9;
          int i = 4;
          System.out.println(f(b));
          System.out.println(g(c));
          System.out.println(h(s));
          System.out.println(f(i));
          System.out.println(g(5L));
          System.out.println(g(2.5f));
        }
      }
    `,
    expectedLines: ["3", "97.0", "9", "4", "5.0", "2.5"],
  },
  {
    comment: "compound assignment narrows implicitly",
    program: `
      public class Main {
        static void p(Object o) {
        System.out.println(o);
        }

        public static void main(String[] args) {
          byte b = 120;
          b += 10;
          System.out.println(b);
          short s = 1;
          s *= 40000;
          System.out.println(s);
          char c = 'a';
          c += 2;
          System.out.println(c);
          int i = 5;
          i += 2.7;
          System.out.println(i);
          i -= 10.5;
          System.out.println(i);
          long l = 3;
          l += 2.5f;
          System.out.println(l);
          i <<= 33;
          System.out.println(i);
        }
      }
    `,
    expectedLines: ["-126", "-25536", "c", "7", "-3", "5", "-6"],
  },
  {
    comment: "increment/decrement of narrow, long and floating point variables",
    program: `
      public class Main {
        static void p(Object o) {
        System.out.println(o);
        }

        public static void main(String[] args) {
          byte b = 127;
          b++;
          System.out.println(b);
          short s = -32768;
          s--;
          System.out.println(s);
          char c = 'a';
          ++c;
          System.out.println(c);
          long l = 5;
          l++;
          System.out.println(l);
          double d = 1.5;
          d++;
          System.out.println(d);
          float f = 1;
          --f;
          System.out.println(f);
        }
      }
    `,
    expectedLines: ["-128", "32767", "b", "6", "2.5", "0.0"],
  },
  {
    comment: "binary numeric promotion",
    program: `
      public class Main {
        static void p(Object o) {
        System.out.println(o);
        }

        public static void main(String[] args) {
          byte b = 100;
          short s = 200;
          char c = 'a';
          long l = 3;
          float f = 1.5f;
          double d = 2.5;
          System.out.println(b + s);
          System.out.println(b + c);
          System.out.println(b + l);
          System.out.println(s * f);
          System.out.println(c + d);
          System.out.println(l * f);
          System.out.println(l + d);
          System.out.println(b + b);
          int x = b * b;
          System.out.println(x);
        }
      }
    `,
    expectedLines: ["300", "197", "103", "300.0", "99.5", "4.5", "5.5", "200", "10000"],
  },
  {
    comment: "shift operand promotion",
    program: `
      public class Main {
        static void p(Object o) {
        System.out.println(o);
        }

        public static void main(String[] args) {
          long l = 1;
          int sh = 40;
          System.out.println(l << sh);
          byte b = 1;
          System.out.println(b << 10);
          System.out.println(l << 3);
          long m = -1;
          System.out.println(m >>> 60);
          int i = 1;
          long cnt = 3;
          System.out.println(i << cnt);
        }
      }
    `,
    expectedLines: ["1099511627776", "1024", "8", "15", "8"],
  },
  {
    comment: "unary numeric promotion",
    program: `
      public class Main {
        static void p(Object o) {
        System.out.println(o);
        }

        public static void main(String[] args) {
          byte b = 5;
          short s = -7;
          char c = 'a';
          System.out.println(-b);
          System.out.println(-s);
          System.out.println(-c);
          System.out.println(~b);
          long l = 5;
          System.out.println(~l);
          System.out.println(+b);
          System.out.println(-l);
        }
      }
    `,
    expectedLines: ["-5", "7", "-97", "-6", "-6", "5", "-5"],
  },
  {
    comment: "conditional expression operand promotion",
    program: `
      public class Main {
        public static void main(String[] args) {
          boolean t = true;
          byte b = 1;
          short s = 2;
          long l = 3;
          int i = 4;
          double d = 5.5;
          System.out.println(t ? b : s);
          System.out.println(t ? i : d);
          System.out.println(!t ? i : l);
          System.out.println(t ? 1 : 2.5);
          char c = t ? 'a' : 'b';
          System.out.println(c);
          byte q = t ? b : 5;
          System.out.println(q);
          System.out.println(t ? 'a' : 0);
          System.out.println(t ? 'a' : i);
        }
      }
    `,
    expectedLines: ["1", "4.0", "3", "1.0", "a", "1", "a", "97"],
  },
  {
    comment: "boxing, unboxing and widening",
    program: `
      public class Main {
        static void p(Object o) {
        System.out.println(o);
        }

        public static void main(String[] args) {
          Integer i = 5;
          long l = i;
          double d = i;
          Object o = 5;
          Number n = 7;
          Character c = 'x';
          Byte b = 3;
          Short s = 4;
          long w = 1;
          System.out.println(l);
          System.out.println(d);
          System.out.println(o);
          System.out.println(n);
          System.out.println(c);
          System.out.println(b);
          System.out.println(s);
        }
      }
    `,
    expectedLines: ["5", "5.0", "5", "7", "x", "3", "4"],
  },
  {
    comment: "string concatenation with narrow types",
    program: `
      public class Main {
        static void p(Object o) {
        System.out.println(o);
        }

        public static void main(String[] args) {
          char c = 'a';
          byte b = 3;
          short s = 4;
          System.out.println("x" + c + b + s);
          System.out.println(c + b);
          System.out.println((char)(c + 1));
        }
      }
    `,
    expectedLines: ["xa34", "100", "b"],
  },
  {
    comment: "comparisons of mixed types, including NaN",
    program: `
      public class Main {
        static void p(Object o) {
        System.out.println(o);
        }

        public static void main(String[] args) {
          byte b = 3;
          char c = 'a';
          long l = 4;
          float f = 2.5f;
          double d = 3.5;
          System.out.println(b < c);
          System.out.println(l > b);
          System.out.println(f <= d);
          System.out.println(l == 4);
          System.out.println(c == 97);
          System.out.println(d != f);
          if (b < l) System.out.println("y");
          while (f < 4) {
          f += 1;
          }
          System.out.println(f);
          double nan = 0.0/0;
          System.out.println(nan < 1);
          System.out.println(nan > 1);
          System.out.println(nan == nan);
          System.out.println(nan != nan);
          if (nan >= 1) System.out.println("bad");
          if (!(nan < 1)) System.out.println("ok");
        }
      }
    `,
    expectedLines: ["true", "true", "true", "true", "true", "true", "y", "4.5", "false", "false", "false", "true", "ok"],
  },
  {
    comment: "mixed int/long/float division",
    program: `
      public class Main {
        public static void main(String[] args) {
          int a = 7;
          long b = 2;
          System.out.println(a / b);
          System.out.println(a % b);
          double d = a / 2;
          System.out.println(d);
          float f = a;
          System.out.println(f / 2);
          long big = 2147483647;
          System.out.println(big + 1);
        }
      }
    `,
    expectedLines: ["3", "1", "3.0", "3.5", "2147483648"],
  },
  {
    comment: "overload resolution with widening",
    program: `
      public class Main {
        public static int f(long x) {
        return 1;
        }
        public static int f(int x) {
        return 2;
        }
        public static int f(double x) {
        return 3;
        }
        public static int g(double x) {
        return 4;
        }
        public static int g(Object x) {
        return 5;
        }

        public static void main(String[] args) {
          byte b = 1;
          short s = 2;
          char c = 'c';
          float fl = 1f;
          System.out.println(f(b));
          System.out.println(f(s));
          System.out.println(f(c));
          System.out.println(f(fl));
          System.out.println(f(3L));
          System.out.println(g(1));
          System.out.println(g("s"));
        }
      }
    `,
    expectedLines: ["2", "2", "2", "3", "1", "4", "5"],
  },
  {
    comment: "short array element assignment",
    program: `
      public class Main {
        public static void main(String[] args) {
          short[] sh = {1, 2};
          sh[0] = 5;
          System.out.println(sh[0]);
        }
      }
    `,
    expectedLines: ["5"],
  },
  {
    comment: "byte array element constant narrowing",
    program: `
      public class Main {
        public static void main(String[] args) {
          byte[] bb = {0, 0, 0};
          bb[1] = 100;
          System.out.println(bb[1]);
        }
      }
    `,
    expectedLines: ["100"],
  },
  {
    comment: "byte array element compound assignment",
    program: `
      public class Main {
        public static void main(String[] args) {
          byte[] bb = {0, 0, 0};
          bb[2] += 100;
          System.out.println(bb[2]);
        }
      }
    `,
    expectedLines: ["100"],
  },
  {
    comment: "byte array element increment",
    program: `
      public class Main {
        public static void main(String[] args) {
          byte[] bb = {0, 0, 0};
          bb[0]++;
          System.out.println(bb[0]);
        }
      }
    `,
    expectedLines: ["1"],
  },
  {
    comment: "char array element compound assignment",
    program: `
      public class Main {
        public static void main(String[] args) {
          char[] cs = {97};
          cs[0] += 1;
          System.out.println(cs[0]);
        }
      }
    `,
    expectedLines: ["b"],
  },
  {
    comment: "long array element compound assignment with double",
    program: `
      public class Main {
        public static void main(String[] args) {
          long[] ls = {1, 2};
          ls[1] = 7;
          ls[0] += 1.5;
          System.out.println(ls[0] + " " + ls[1]);
        }
      }
    `,
    expectedLines: ["2 7"],
  },
  {
    comment: "double array element widening",
    program: `
      public class Main {
        public static void main(String[] args) {
          double[] ds = {1, 2L, 3.5f};
          ds[0] = 3;
          byte b = 4;
          ds[1] = b;
          System.out.println(ds[0] + " " + ds[1] + " " + ds[2]);
        }
      }
    `,
    expectedLines: ["3.0 4.0 3.5"],
  },
  {
    comment: "static field narrowing and widening",
    program: `
      public class Main {
        public static byte sb = 4;
        public static long sl = 9;

        public static void main(String[] args) {
          sb = 7;
          sl = sb;
          System.out.println(sb + " " + sl);
        }
      }
    `,
    expectedLines: ["7 7"],
  },
  {
    comment: "static byte field increment and compound assignment",
    program: `
      public class Main {
        public static byte sb = 4;

        public static void main(String[] args) {
          sb++;
          sb += 2;
          System.out.println(sb);
        }
      }
    `,
    expectedLines: ["7"],
  },
  {
    comment: "instance field narrowing",
    program: `
      public class Main {
        public byte ib;
        public char ic;

        public static void main(String[] args) {
          Main m = new Main();
          m.ib = 2;
          m.ic = 100;
          System.out.println(m.ib + " " + m.ic);
        }
      }
    `,
    expectedLines: ["2 d"],
  },
  {
    comment: "instance byte field compound assignment",
    program: `
      public class Main {
        public byte ib;

        public static void main(String[] args) {
          Main m = new Main();
          m.ib += 5;
          System.out.println(m.ib);
        }
      }
    `,
    expectedLines: ["5"],
  },
  {
    comment: "constructor with int argument",
    program: `
      public class Main {
        public int v;
        public Main(int x) {
        this.v = x;
        }

        public static void main(String[] args) {
          Main m = new Main(3);
          System.out.println(m.v);
        }
      }
    `,
    expectedLines: ["3"],
  },
  {
    comment: "constructor arguments widened",
    program: `
      public class Main {
        public int v;
        public long w;
        public Main(long x, double y) {
        this.v = (int) x;
        this.w = (long) y;
        }

        public static void main(String[] args) {
          Main m = new Main(3, 4);
          System.out.println(m.v + " " + m.w);
        }
      }
    `,
    expectedLines: ["3 4"],
  },
  {
    comment: "constructor overload resolution with widening",
    program: `
      public class Main {
        public int r;
        public Main(long x) {
        this.r = 1;
        }
        public Main(int x) {
        this.r = 2;
        }
        public Main(double x) {
        this.r = 3;
        }

        public static void main(String[] args) {
          byte b = 1;
          char c = 'a';
          Main m1 = new Main(b);
          Main m2 = new Main(5L);
          Main m3 = new Main(2.5f);
          Main m4 = new Main(c);
          Main m5 = new Main(7);
          System.out.println(m1.r + " " + m2.r + " " + m3.r + " " + m4.r + " " + m5.r);
        }
      }
    `,
    expectedLines: ["2 1 3 2 2"],
  },
  {
    comment: "widening and char constants in declarations",
    program: `
      public class Main {
        public static void main(String[] args) {
          int a = 'a';
          long b = 'a' + 1;
          float c = 1L;
          double d = 1f;
          char e = 'a' + 'b' - 'a';
          byte f = 'a';
          short g = 'a';
          System.out.println(a + " " + b + " " + c + " " + d + " " + e + " " + f + " " + g);
        }
      }
    `,
    expectedLines: ["97 98 1.0 1.0 b 97 97"],
  },
  {
    comment: "more compound assignments",
    program: `
      public class Main {
        public static void main(String[] args) {
          byte b = 10;
          b *= b;
          System.out.println(b);
          b >>= 1;
          System.out.println(b);
          b <<= 3;
          System.out.println(b);
          short s = 5;
          s -= 10;
          s |= 28672;
          System.out.println(s);
          char c = 'z';
          c -= 25;
          System.out.println(c);
          int i = 100;
          i /= 0.3;
          System.out.println(i);
          i %= 7L;
          System.out.println(i);
          long l = 10;
          l *= 1.5;
          System.out.println(l);
          l <<= 62;
          System.out.println(l);
          float f = 10;
          f /= 4;
          System.out.println(f);
          double d = 3;
          d -= 'a';
          System.out.println(d);
        }
      }
    `,
    expectedLines: ["100", "50", "-112", "-5", "a", "333", "4", "15", "-4611686018427387904", "2.5", "-94.0"],
  },
  {
    comment: "mixed arithmetic",
    program: `
      public class Main {
        public static void main(String[] args) {
          int x = 7;
          double d = x / 2 + x / 2.0;
          System.out.println(d);
          long l = x * 3000000000L;
          System.out.println(l);
          float f = x / 2f;
          System.out.println(f);
          short s = 3;
          byte b = 4;
          int r = s * b - 'a' % 7;
          System.out.println(r);
          long big = 1L << 40 | 5;
          System.out.println(big);
          System.out.println(big >> 38);
          System.out.println((byte) big + (short) big);
        }
      }
    `,
    expectedLines: ["6.5", "21000000000", "3.5", "6", "1099511627781", "4", "10"],
  },
  {
    comment: "returns with widening, boxing and unboxing",
    program: `
      public class Main {
        public static long f(int x) {
        if (x > 0) {
        return x;
        }
        else {
        return -x * 2;
        }
        }
        public static double g(char c) {
        return c;
        }
        public static float h(long l) {
        return l;
        }
        public static short k() {
        return 'a' - 90;
        }
        public static Integer w() {
        return 5;
        }
        public static long u() {
        return w();
        }
        public static Object o() {
        return 9;
        }
        public static int unb(Integer i) {
        return i;
        }
        public static long unw(Integer i) {
        return i;
        }
        public static double dd(Long l) {
        return l;
        }

        public static void main(String[] args) {
          System.out.println(f(3));
          System.out.println(f(-3));
          System.out.println(g('b'));
          System.out.println(h(3L));
          System.out.println(k());
          System.out.println(w());
          System.out.println(u());
          System.out.println(o());
          System.out.println(unb(4));
          System.out.println(unw(5));
          System.out.println(dd(6L));
        }
      }
    `,
    expectedLines: ["3", "6", "98.0", "3.0", "7", "5", "5", "9", "4", "5", "6.0"],
  },
  {
    comment: "conditional expressions with mixed types",
    program: `
      public class Main {
        public static void main(String[] args) {
          boolean t = true;
          int i = 3;
          long l = 5;
          char c = 'a';
          System.out.println(t ? i : l);
          System.out.println(t ? c : i);
          System.out.println(t ? c : 98);
          System.out.println(!t ? 1 : (t ? 2L : 3));
          short s = t ? (short) 4 : 5;
          System.out.println(s);
          System.out.println(t ? 1 : 2.0f);
        }
      }
    `,
    expectedLines: ["3", "97", "a", "2", "4", "1.0"],
  },
  {
    comment: "comparison operators with mixed types",
    program: `
      public class Main {
        public static void main(String[] args) {
          long a = 3;
          int b = 3;
          long c = 4;
          System.out.println(a == b);
          System.out.println(a != c);
          System.out.println(a >= b);
          System.out.println(b < c);
          char x = 'a';
          System.out.println(x == 97);
          System.out.println(x < 98L);
          float f = 1.5f;
          System.out.println(f > 1);
          System.out.println(f == 1.5);
          double d = 0.1;
          System.out.println(d == 0.1f);
          int cnt = 0;
          for (long k = 0;
          k < 5;
          k++) {
          cnt += k;
          }
          System.out.println(cnt);
          long w = 10;
          while (w > 7) {
          w--;
          }
          System.out.println(w);
          boolean r1 = a < c && b <= a;
          System.out.println(r1);
          System.out.println(!(a > c) || false);
        }
      }
    `,
    expectedLines: ["true", "true", "true", "true", "true", "true", "true", "true", "false", "10", "7", "true", "true"],
  },
  {
    comment: "wrapper class arithmetic and comparisons",
    program: `
      public class Main {
        public static void main(String[] args) {
          Integer i = 5;
          Long l = 6L;
          Double d = 7.5;
          Character c = 'q';
          System.out.println(i + 1);
          System.out.println(l + i);
          System.out.println(d * i);
          System.out.println(c + 1);
          System.out.println(i < l);
          System.out.println(i == 5);
          Integer j = 3;
          j += 4;
          System.out.println(j);
          j++;
          System.out.println(j);
          Byte b = 100;
          Short s = 200;
          System.out.println(b + s);
          Character ch = 97;
          System.out.println(ch);
          Object o = 'x';
          Number n = 2.5;
          System.out.println(o + " " + n);
        }
      }
    `,
    expectedLines: ["6", "11", "37.5", "114", "true", "true", "7", "8", "300", "a", "x 2.5"],
  },
  {
    comment: "constant expressions and casts",
    program: `
      public class Main {
        public static void main(String[] args) {
          int x = -(5);
          long y = -x;
          byte b = -128;
          byte c = (byte) 200;
          short d = (short) (b - 1);
          char e = (char) -1;
          int f = e;
          System.out.println(x + " " + y + " " + b + " " + c + " " + d + " " + f);
          final int k = 10;
          byte m = 10 + 5 * 2;
          char n = 65;
          System.out.println(m + " " + n);
        }
      }
    `,
    expectedLines: ["-5 5 -128 -56 -129 65535", "20 A"],
  },
  {
    comment: "method overloads chosen by widening",
    program: `
      public class Main {
        public static int f(long a, double b, float c) {
        return (int) (a + b + c);
        }
        public static void p(int x) {
        System.out.println("int");
        }
        public static void p(long x) {
        System.out.println("long");
        }
        public static void p(double x) {
        System.out.println("double");
        }
        public static void q(long x) {
        System.out.println("qlong");
        }
        public static void q(float x) {
        System.out.println("qfloat");
        }

        public static void main(String[] args) {
          byte b = 1;
          short s = 2;
          char c = 'c';
          System.out.println(f(b, s, c));
          p(b);
          p(s);
          p(c);
          p(5);
          p(5L);
          p(5f);
          p(2.5);
          q(b);
          q(3);
          q(3L);
          q(1.5f);
          q(c);
        }
      }
    `,
    expectedLines: ["102", "int", "int", "int", "int", "long", "double", "double", "qlong", "qlong", "qlong", "qfloat", "qlong"],
  },
  {
    comment: "compound assignment with wider right operand",
    program: `
      public class Main {
        public static void main(String[] args) {
          int i = 0;
          i += 'a';
          System.out.println(i);
          long l = 0;
          l += i;
          l += 2.9;
          System.out.println(l);
          i = 5;
          i *= 2.5;
          System.out.println(i);
          int j = 2147483647;
          j += 1L;
          System.out.println(j);
          short s = 1;
          s += 70000;
          System.out.println(s);
          byte by = 1;
          by += 300;
          System.out.println(by);
          char ch = 65;
          ch += 1.9;
          System.out.println(ch);
          float f = 3;
          f += 0.1;
          System.out.println(f);
          long m = 1;
          m += 3000000000L;
          m -= 'a';
          System.out.println(m);
        }
      }
    `,
    expectedLines: ["97", "99", "12", "-2147483648", "4465", "45", "B", "3.1", "2999999904"],
  },
  {
    comment: "bitwise and shift operators on boolean and integral operands",
    program: `
      public class Main {
        public static void main(String[] args) {
          boolean t = true;
          boolean f = false;
          System.out.println(t & f);
          System.out.println(t | f);
          System.out.println(t ^ f);
          System.out.println((t & f) | (t ^ f));
          boolean acc = true;
          acc &= f;
          acc |= t;
          acc ^= t;
          System.out.println(acc);
          byte b = 12;
          char c = 'a';
          short s = 5;
          long l = 1L << 40;
          System.out.println(b & c);
          System.out.println(c | s);
          System.out.println(l | b);
          System.out.println(l ^ c);
          System.out.println(b & l);
          System.out.println(b << l);
          System.out.println(l >> b);
          System.out.println(c >>> s);
          int i = 6;
          i <<= 2L;
          i ^= 'a';
          i &= l | 255;
          System.out.println(i);
        }
      }
    `,
    expectedLines: ["false", "true", "true", "true", "false", "0", "101", "1099511627788", "1099511627873", "0", "12", "268435456", "3", "121"],
  },
  {
    comment: "relational and equality operators on numeric, boolean, wrapper and reference operands",
    program: `
      class Foo {}
      class Bar extends Foo {}
      public class Main {
        public static void main(String[] args) {
          byte b = 3;
          char c = 'a';
          long l = 4;
          float f = 2.5f;
          double d = 3.5;
          System.out.println(b < c);
          System.out.println(l >= b);
          System.out.println(f > l);
          System.out.println(d <= f);
          System.out.println(c == 97);
          System.out.println(l != 4.0);
          boolean t = true;
          boolean u = false;
          System.out.println(t == u);
          System.out.println(t != u);
          System.out.println((b < l) == (f < d));
          Integer i = 7;
          Boolean flag = true;
          System.out.println(i < 8);
          System.out.println(i == 7);
          System.out.println(7 == i);
          System.out.println(flag == t);
          System.out.println(i >= l);
          Foo foo = new Foo();
          Foo same = foo;
          Foo other = new Foo();
          Bar bar = new Bar();
          Foo viaParent = bar;
          System.out.println(foo == same);
          System.out.println(foo != other);
          System.out.println(bar == viaParent);
          System.out.println(viaParent == bar);
          Object o = i;
          System.out.println(i == o);
          System.out.println(o != i);
          Object p = foo;
          System.out.println(p == foo);
          String s = "abc";
          Object so = s;
          System.out.println(s == so);
          int count = 0;
          for (long k = 0; k < 3L; k++) {
            if (k != 1) {
              count++;
            }
          }
          System.out.println(count);
        }
      }
    `,
    expectedLines: ["true", "true", "false", "false", "true", "false", "false", "true", "true", "true", "true", "true", "true", "true", "true", "true", "true", "true", "true", "false", "true", "true", "2"],
  },
  {
    comment: "negative long constants keep their sign in the constant pool",
    program: `
      public class Main {
        public static void main(String[] args) {
          long a = -128L;
          long b = -5000000000L;
          long c = -9223372036854775807L - 1L;
          long d = 9223372036854775807L;
          long e = -1L;
          long f = 4294967296L;
          System.out.println(a);
          System.out.println(b);
          System.out.println(c);
          System.out.println(d);
          System.out.println(e);
          System.out.println(f);
          System.out.println(a < 0L);
          System.out.println(b + f);
          long mask = ~0L;
          System.out.println(mask);
          long flipped = ~a;
          System.out.println(flipped);
          System.out.println(a >= -128L);
          System.out.println(a >= -129L);
        }
      }
    `,
    expectedLines: ["-128", "-5000000000", "-9223372036854775808", "9223372036854775807", "-1", "4294967296", "true", "-705032704", "-1", "127", "true", "true"],
  },
  {
    comment: "== and != on two wrappers compare references, so only cached values are equal",
    program: `
      public class Main {
        public static void main(String[] args) {
          { Integer a = -129; Integer b = -129; Object x = a; Object y = b; System.out.println("Integer -129 " + (a == b) + " " + (a != b) + " " + (x == y)); }
          { Integer a = -128; Integer b = -128; Object x = a; Object y = b; System.out.println("Integer -128 " + (a == b) + " " + (a != b) + " " + (x == y)); }
          { Integer a = 127; Integer b = 127; Object x = a; Object y = b; System.out.println("Integer 127 " + (a == b) + " " + (a != b) + " " + (x == y)); }
          { Integer a = 128; Integer b = 128; Object x = a; Object y = b; System.out.println("Integer 128 " + (a == b) + " " + (a != b) + " " + (x == y)); }
          { Long a = -129L; Long b = -129L; Object x = a; Object y = b; System.out.println("Long -129 " + (a == b) + " " + (a != b) + " " + (x == y)); }
          { Long a = -128L; Long b = -128L; Object x = a; Object y = b; System.out.println("Long -128 " + (a == b) + " " + (a != b) + " " + (x == y)); }
          { Long a = 127L; Long b = 127L; Object x = a; Object y = b; System.out.println("Long 127 " + (a == b) + " " + (a != b) + " " + (x == y)); }
          { Long a = 128L; Long b = 128L; Object x = a; Object y = b; System.out.println("Long 128 " + (a == b) + " " + (a != b) + " " + (x == y)); }
          { Short a = (short) -129; Short b = (short) -129; Object x = a; Object y = b; System.out.println("Short -129 " + (a == b) + " " + (a != b) + " " + (x == y)); }
          { Short a = (short) -128; Short b = (short) -128; Object x = a; Object y = b; System.out.println("Short -128 " + (a == b) + " " + (a != b) + " " + (x == y)); }
          { Short a = (short) 127; Short b = (short) 127; Object x = a; Object y = b; System.out.println("Short 127 " + (a == b) + " " + (a != b) + " " + (x == y)); }
          { Short a = (short) 128; Short b = (short) 128; Object x = a; Object y = b; System.out.println("Short 128 " + (a == b) + " " + (a != b) + " " + (x == y)); }
          { Byte a = (byte) -128; Byte b = (byte) -128; Object x = a; Object y = b; System.out.println("Byte -128 " + (a == b) + " " + (a != b) + " " + (x == y)); }
          { Byte a = (byte) 127; Byte b = (byte) 127; Object x = a; Object y = b; System.out.println("Byte 127 " + (a == b) + " " + (a != b) + " " + (x == y)); }
          { Character a = (char) 0; Character b = (char) 0; Object x = a; Object y = b; System.out.println("Character 0 " + (a == b) + " " + (a != b) + " " + (x == y)); }
          { Character a = (char) 127; Character b = (char) 127; Object x = a; Object y = b; System.out.println("Character 127 " + (a == b) + " " + (a != b) + " " + (x == y)); }
          { Character a = (char) 128; Character b = (char) 128; Object x = a; Object y = b; System.out.println("Character 128 " + (a == b) + " " + (a != b) + " " + (x == y)); }
          { Boolean a = true; Boolean b = true; Object x = a; Object y = b; System.out.println("Boolean true " + (a == b) + " " + (a != b) + " " + (x == y)); }
          { Float a = 0.0f; Float b = 0.0f; Object x = a; Object y = b; System.out.println("Float " + (a == b) + " " + (a != b) + " " + (x == y)); }
          { Double a = 0.0; Double b = 0.0; Object x = a; Object y = b; System.out.println("Double " + (a == b) + " " + (a != b) + " " + (x == y)); }
          Integer big = 1000;
          Integer alias = big;
          System.out.println(big == alias);
          System.out.println(big == 1000);
          System.out.println(1000 == big);
          Integer other = 1000;
          System.out.println(big.equals(other));
          System.out.println(big < other);
          System.out.println(big <= other);
          Long wide = 1000L;
          System.out.println(big == wide.intValue());
        }
      }
    `,
    expectedLines: ["Integer -129 false true false", "Integer -128 true false true", "Integer 127 true false true", "Integer 128 false true false", "Long -129 false true false", "Long -128 true false true", "Long 127 true false true", "Long 128 false true false", "Short -129 false true false", "Short -128 true false true", "Short 127 true false true", "Short 128 false true false", "Byte -128 true false true", "Byte 127 true false true", "Character 0 true false true", "Character 127 true false true", "Character 128 false true false", "Boolean true true false true", "Float false true false", "Double false true false", "true", "true", "true", "true", "false", "true", "true"],
  },
  {
    comment: "0.0 and -0.0 (and NaN, infinities) are distinct constants",
    program: `
      public class Main {
        public static void main(String[] args) {
          double negative = -0.0;
          double positive = 0.0;
          System.out.println(negative);
          System.out.println(positive);
          float fn = -0.0f;
          float fp = 0.0f;
          System.out.println(fn);
          System.out.println(fp);
          System.out.println(1.0 / negative);
          System.out.println(1.0 / positive);
          System.out.println(1.0f / fn);
          System.out.println(1.0f / fp);
          double nan = 0.0 / 0.0;
          System.out.println(nan);
          System.out.println(nan == nan);
          double inf = 1.0 / 0.0;
          System.out.println(inf);
          System.out.println(-inf);
        }
      }
    `,
    expectedLines: ["-0.0", "0.0", "-0.0", "0.0", "-Infinity", "Infinity", "-Infinity", "Infinity", "NaN", "false", "Infinity", "-Infinity"],
  },
  {
    comment: "implicit widening to library interfaces",
    program: `
      public class Main {
        static CharSequence field = "static field";
        static CharSequence echo(CharSequence c) { return c; }
        static Comparable fromInteger() { return 42; }
        public static void main(String[] args) {
          String s = "hi";
          CharSequence c = s;
          Comparable m = s;
          Integer i = 5;
          Comparable n = i;
          Object o = c;
          CharSequence[] arr = {"x", s};
          System.out.println(c);
          System.out.println(m);
          System.out.println(n);
          System.out.println(o);
          System.out.println(echo("arg"));
          System.out.println(fromInteger());
          System.out.println(arr.length);
          System.out.println(field);
        }
      }
    `,
    expectedLines: ["hi", "hi", "5", "hi", "arg", "42", "2", "static field"],
  },
  {
    comment: "widening reference conversions of one-dimensional array types",
    program: `
      import java.io.Serializable;
      class Animal { String name() { return "animal"; } }
      class Dog extends Animal { String name() { return "dog"; } }
      class Puppy extends Dog { String name() { return "puppy"; } }
      public class Main {
        static int length(Object[] items) { return items.length; }
        static Animal first(Animal[] animals) { return animals[0]; }
        static Animal[] widen(Dog[] dogs) { return dogs; }
        static boolean same(Object a, Object b) { return a == b; }
        static int total(Serializable s, Cloneable c) { return 1; }
        public static void main(String[] args) {
          int[] ia = {1, 2, 3};
          char[] ch = {'a', 'b'};
          Dog[] dogs = {new Dog(), new Puppy()};
          String[] strings = {"x", "y", "z"};
          Integer[] ints = {1, 2};
          Object o = ia;
          Object oc = ch;
          Object od = dogs;
          Animal[] animals = dogs;
          Object[] asObjects = dogs;
          Object[] stringObjects = strings;
          Object[] intObjects = ints;
          Number[] numbers = ints;
          Comparable[] comparable = strings;
          CharSequence[] sequences = strings;
          Serializable ser = ia;
          Serializable serDogs = dogs;
          Cloneable clone = ia;
          Cloneable cloneStrings = strings;
          int[] none = null;
          Dog[] noDogs = null;
          System.out.println(animals.length);
          Animal second = animals[1];
          System.out.println(second.name());
          System.out.println(asObjects.length);
          System.out.println(stringObjects.length);
          System.out.println(intObjects.length);
          System.out.println(numbers[1]);
          System.out.println(comparable[2]);
          System.out.println(sequences[0]);
          System.out.println(o == ia);
          System.out.println(oc == ch);
          System.out.println(od == dogs);
          System.out.println(ser == ia);
          System.out.println(clone == ia);
          System.out.println(serDogs == animals);
          System.out.println(none == null);
          System.out.println(noDogs == null);
          System.out.println(length(dogs));
          System.out.println(length(strings));
          Animal f = first(dogs);
          Animal[] w = widen(dogs);
          System.out.println(f.name());
          Animal wsecond = w[1];
          System.out.println(wsecond.name());
          System.out.println(same(ia, ia));
          System.out.println(same(ia, ch));
          System.out.println(same(dogs, animals));
          System.out.println(total(ia, strings));
          Object[] reassigned = dogs;
          reassigned = strings;
          System.out.println(reassigned.length);
        }
      }
    `,
    expectedLines: ["2", "puppy", "2", "3", "2", "2", "z", "x", "true", "true", "true", "true", "true", "true", "true", "true", "2", "3", "dog", "puppy", "true", "false", "true", "1", "3"],
  },
  {
    comment: "logical and/or on boolean and Boolean operands, with short-circuiting",
    program: `
      public class Main {
        static int calls;
        static boolean yes() { calls++; return true; }
        static boolean no() { calls++; return false; }
        static Boolean wrappedYes() { calls++; return true; }
        public static void main(String[] args) {
          Boolean t = true;
          Boolean f = false;
          boolean p = true;
          boolean q = false;
          System.out.println(t && f);
          System.out.println(t || f);
          System.out.println(t && p);
          System.out.println(q || f);
          System.out.println(!f && t);
          System.out.println(!t || !q);
          System.out.println((t && p) || (f && q));
          System.out.println(t && f || t);
          System.out.println(f && t || f);
          boolean r1 = t && wrappedYes();
          boolean r2 = f && wrappedYes();
          boolean r3 = t || wrappedYes();
          System.out.println(r1);
          System.out.println(r2);
          System.out.println(r3);
          System.out.println(calls);
          calls = 0;
          boolean s1 = no() && yes();
          boolean s2 = yes() || no();
          boolean s3 = yes() && yes() && no();
          boolean s4 = no() || no() || yes();
          System.out.println(s1 + " " + s2 + " " + s3 + " " + s4 + " " + calls);
          int hits = 0;
          if (t && p) { hits = hits + 1; }
          if (f || q) { hits = hits + 10; }
          if (t && !f) { hits = hits + 100; }
          if (f || t) { hits = hits + 1000; }
          int i = 0;
          while (i < 5 && !f) { i = i + 1; }
          System.out.println(hits + " " + i);
          int x = 3;
          int y = 4;
          System.out.println(x < y && y < 5);
          System.out.println(x > y || y > 3);
          System.out.println((x < y) && t);
          System.out.println(t && (x < y));
          boolean viaBitwise = (p & q) || (p | q) && (p ^ q);
          System.out.println(viaBitwise);
          Boolean lazy = t ? f : t;
          System.out.println(lazy || p);
        }
      }
    `,
    expectedLines: ["false", "true", "true", "false", "true", "true", "true", "true", "false", "true", "false", "true", "1", "false true false true 8", "1101 5", "true", "true", "true", "true", "true", "true"],
  },
  {
    comment: "! and conditions on boolean and Boolean values",
    program: `
      public class Main {
        static int calls;
        static Boolean wrapped(boolean v) { calls++; return v; }
        public static void main(String[] args) {
          Boolean t = true;
          Boolean f = false;
          boolean p = true;
          boolean q = false;
          System.out.println(!t);
          System.out.println(!f);
          System.out.println(!p);
          System.out.println(!q);
          System.out.println(!!t);
          System.out.println(!(p && q));
          System.out.println(!(t || f));
          boolean n1 = !t;
          boolean n2 = !f;
          Boolean n3 = !t;
          Boolean n4 = !f;
          System.out.println(n1 + " " + n2 + " " + n3 + " " + n4);
          System.out.println(!wrapped(false) && !wrapped(true));
          System.out.println(calls);
          int r = 0;
          if (t) { r = r + 1; }
          if (f) { r = r + 10; }
          if (!t) { r = r + 100; }
          if (!f) { r = r + 1000; }
          if (wrapped(true)) { r = r + 10000; }
          System.out.println(r);
          int i = 0;
          while (t && i < 3) { i = i + 1; if (i == 3) { t = false; } }
          System.out.println(i);
          int j = 0;
          do { j = j + 1; } while (f);
          System.out.println(j);
          int k = 0;
          for (; !f && k < 4; k++) { }
          System.out.println(k);
          for (Boolean go = true; go; go = false) { k = k + 10; }
          System.out.println(k);
          int tern1 = t ? 1 : 2;
          int tern2 = f ? 1 : 2;
          int tern3 = !f ? 1 : 2;
          int tern4 = wrapped(false) ? 1 : 2;
          int tern5 = (p && q) ? 1 : 2;
          System.out.println(tern1 + " " + tern2 + " " + tern3 + " " + tern4 + " " + tern5);
          String label = t ? "yes" : "no";
          System.out.println(label);
          System.out.println(calls);
        }
      }
    `,
    expectedLines: ["false", "true", "false", "true", "true", "true", "false", "false true false true", "false", "2", "11001", "3", "1", "4", "14", "2 2 1 2 2", "no", "4"],
  },
  {
    comment: "unary +, -, ~, ++ and -- on every numeric type and wrapper",
    program: `
      public class Main {
        static int field = 5;
        int inst = 7;
        static long counter;
        static int next() { counter++; return (int) counter; }
        public static void main(String[] args) {
          int x = 7;
          long l = 5000000000L;
          float f = 1.5f;
          double d = -2.5;
          char ch = 'c';
          byte by = 100;
          short sh = -300;
          Integer wi = 8;
          Long wl = 9L;
          Double wd = 2.5;
          Character wc = 'a';
          Byte wby = 7;
          Float wf = 0.5f;
          Short wsh = 12;
          System.out.println(-x);
          System.out.println(+x);
          System.out.println(-l);
          System.out.println(-f);
          System.out.println(-d);
          System.out.println(-ch);
          System.out.println(+ch);
          System.out.println(-by);
          System.out.println(+by);
          System.out.println(-sh);
          System.out.println(~sh);
          System.out.println(-wi);
          System.out.println(+wi);
          System.out.println(-wl);
          System.out.println(-wd);
          System.out.println(-wc);
          System.out.println(+wc);
          System.out.println(-wby);
          System.out.println(-wf);
          System.out.println(-wsh);
          System.out.println(~x);
          System.out.println(~l);
          System.out.println(~ch);
          System.out.println(~by);
          System.out.println(~wi);
          System.out.println(~wl);
          System.out.println(~wc);
          System.out.println(~wby);
          System.out.println(~~x);
          System.out.println(- -x);
          System.out.println(-(-x));
          System.out.println(-~x);
          System.out.println(~-x);
          System.out.println(-(x + 1) * 2);
          int min = -2147483647 - 1;
          System.out.println(-min);
          System.out.println(~min);
          long lmin = -9223372036854775807L - 1L;
          System.out.println(-lmin);
          double zero = 0.0;
          System.out.println(-zero);
          System.out.println(-zero + 0.0);
          int viaInt = -ch;
          long viaLong = ~x;
          long widened = -by;
          double dbl = -ch;
          Integer boxed = -x;
          Long boxedL = ~l;
          Object obj = -ch;
          System.out.println(viaInt + " " + viaLong + " " + widened + " " + dbl + " " + boxed + " " + boxedL + " " + obj);
          byte cast = (byte) -by;
          char castC = (char) -ch;
          short castS = (short) ~sh;
          System.out.println(cast + " " + (int) castC + " " + castS);
          int[] arr = {3, 4};
          double[] darr = {1.5};
          System.out.println(-arr[1]);
          System.out.println(~arr[0]);
          System.out.println(-darr[0]);
          int i = 0;
          System.out.println(i++);
          System.out.println(i);
          System.out.println(++i);
          System.out.println(i--);
          System.out.println(--i);
          System.out.println(i);
          long lc = 4000000000L;
          lc++;
          ++lc;
          System.out.println(lc);
          float fc = 1.5f;
          fc++;
          System.out.println(--fc + " " + fc--);
          System.out.println(fc);
          double dc = 0.5;
          dc--;
          System.out.println(dc);
          char cc = 'y';
          cc++;
          ++cc;
          System.out.println(cc);
          System.out.println(cc--);
          System.out.println(--cc);
          byte bc = 127;
          bc++;
          System.out.println(bc);
          bc--;
          System.out.println(bc);
          short sc = 32767;
          ++sc;
          System.out.println(sc);
          wi++;
          ++wi;
          System.out.println(wi);
          System.out.println(wi++);
          System.out.println(++wi);
          System.out.println(wi--);
          System.out.println(--wi);
          wl--;
          System.out.println(wl);
          wd++;
          System.out.println(wd);
          wc++;
          System.out.println(wc);
          ++wc;
          System.out.println(wc);
          System.out.println(wc--);
          System.out.println(--wc);
          wby++;
          System.out.println(wby);
          wby = 127;
          wby++;
          System.out.println(wby);
          ++wsh;
          System.out.println(wsh);
          wf--;
          System.out.println(wf);
          arr[0]++;
          ++arr[1];
          arr[0] += arr[1]++;
          System.out.println(arr[0] + " " + arr[1]);
          darr[0]--;
          System.out.println(darr[0]);
          field++;
          ++field;
          System.out.println(field);
          System.out.println(field--);
          System.out.println(Main.field);
          Main m = new Main();
          m.inst++;
          ++m.inst;
          System.out.println(m.inst);
          System.out.println(m.inst--);
          System.out.println(m.inst);
          int sum = x++ + ++x;
          System.out.println(sum + " " + x);
          int mixed = -x++ + ~x-- - -(--x);
          System.out.println(mixed + " " + x);
          counter = 0;
          int idx = next() + next();
          System.out.println(idx + " " + counter);
        }
      }
    `,
    expectedLines: ["-7", "7", "-5000000000", "-1.5", "2.5", "-99", "99", "-100", "100", "300", "299", "-8", "8", "-9", "-2.5", "-97", "97", "-7", "-0.5", "-12", "-8", "-5000000001", "-100", "-101", "-9", "-10", "-98", "-8", "7", "7", "7", "8", "6", "-16", "-2147483648", "2147483647", "-9223372036854775808", "-0.0", "0.0", "-99 -8 -100 -99.0 -7 -5000000001 -99", "-100 65437 299", "-4", "-4", "-1.5", "0", "1", "2", "2", "0", "0", "4000000002", "1.5 1.5", "0.5", "-0.5", "{", "{", "y", "-128", "127", "-32768", "10", "10", "12", "12", "10", "8", "3.5", "b", "c", "c", "a", "8", "-128", "13", "-0.5", "9 6", "0.5", "7", "7", "6", "9", "9", "8", "16 9", "-12 8", "3 2"],
  },
]

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

export const typeConversionTest = () => describe("type conversion", () => {
  for (let testCase of testCases) {
    const { comment: comment, program: program, expectedLines: expectedLines } = testCase;
    it(comment, () => runTest(program, expectedLines));
  }

  describe("rejects comparisons of unrelated classes", () => {
    const parse = (body: string) => {
      const parser = peggy.generate(peggyFunctions + javaPegGrammar, {
        allowedStartRules: ["CompilationUnit"],
      });
      return compile(
        parser.parse(`
          class Foo {}
          class Bar extends Foo {}
          class Baz {}
          public class Main {
            public static void main(String[] args) {
              ${body}
            }
          }
        `) as AST
      );
    };
    const rejected: [string, string][] = [
      ["unrelated classes", "Foo f = new Foo(); Baz z = new Baz(); boolean b = f == z;"],
      ["Integer and String", "Integer i = 1; String s = \"1\"; boolean b = i == s;"],
      ["Integer and Long", "Integer i = 1; Long l = 1L; boolean b = i == l;"],
    ];
    for (const [comment, body] of rejected) {
      it(`rejects ${comment}`, () => expect(() => parse(body)).toThrow(/incompatible types/));
    }
    it("allows a class and its subclass", () =>
      expect(() =>
        parse("Foo f = new Foo(); Bar b = new Bar(); boolean x = f == b; boolean y = b != f;")
      ).not.toThrow());
  });

  describe("rejects operators applied to illegal operand types", () => {
    const rejected: [string, string][] = [
      ["shift with a double distance", "int i = 1 << 2.0;"],
      ["shift of a double", "int i = (int) (1.5 << 1);"],
      ["shift of a float by a long", "float f = 1f; long l = 1; float g = f >> l;"],
      ["shift of a boolean", "boolean b = true; int i = b << 1;"],
      ["shift by a boolean", "boolean b = true; int i = 1 >>> b;"],
      ["bitwise and of an int and a double", "double d = 1 & 2.5;"],
      ["bitwise or of a float", "float f = 1f; int i = (int) (f | 1);"],
      ["bitwise xor of two doubles", "double d = 1.0 ^ 2.0;"],
      ["bitwise and of a boolean and an int", "boolean b = true; int i = b & 1;"],
      ["bitwise or of an int and a boolean", "boolean b = true; int i = 1 | b;"],
      ["addition of a boolean and an int", "int i = true + 1;"],
      ["multiplication of two booleans", "boolean b = true * false;"],
      ["remainder by a boolean", "int i = 1 % true;"],
      ["subtraction of a boolean", "boolean b = true; int i = 1 - b;"],
      ["compound shift by a double", "int i = 1; i <<= 2.0;"],
      ["compound bitwise and of a double variable", "double d = 1; d &= 1;"],
      ["compound addition to a boolean", "boolean b = true; b += 1;"],
      ["less-than on booleans", "boolean b = true < false;"],
      ["less-than of an int and a boolean", "boolean b = true; boolean c = 1 < b;"],
      ["greater-or-equal on Strings", "boolean b = \"a\" >= \"b\";"],
      ["relational operator on Objects", "Object o = 1; Object p = 2; boolean b = o > p;"],
      ["equality of a boolean and an int", "boolean b = true == 1;"],
      ["equality of an int and a boolean", "boolean t = true; boolean b = 1 != t;"],
      ["equality of a String and an int", "String s = \"1\"; boolean b = s == 1;"],
      ["equality of an Object and an int", "Object o = 1; boolean b = o == 1;"],
      ["logical and of an int and a boolean", "boolean b = 1 && true;"],
      ["logical and of a boolean and an int", "boolean b = true && 1;"],
      ["logical or of two ints", "boolean b = 1 || 2;"],
      ["logical and with a String", "boolean b = \"s\" && true;"],
      ["logical and with null", "boolean b = null && true;"],
      ["logical or with null on the right", "boolean b = true || null;"],
      ["logical or with a double", "boolean b = 1.5 || true;"],
      ["logical and with a char", "boolean b = true; char c = 'c'; boolean d = c && b;"],
      ["logical and with a long variable", "long l = 1L; boolean b = l && true;"],
      ["logical or with an int variable", "int i = 1; boolean b = true || i;"],
      ["logical and with an Integer", "Integer i = 1; boolean b = i && true;"],
      ["logical and with an array", "int[] a = {1}; boolean b = a && true;"],
      ["logical and with a negative int", "int i = 1; boolean b = -i && true;"],
      ["logical or with a complemented int", "int i = 1; boolean b = ~i || true;"],
      ["logical and with an arithmetic result", "boolean b = true && (1 + 2);"],
      ["logical and with a bitwise int result", "int i = 1; boolean b = (i & 1) && true;"],
      ["logical and with a parenthesised bad operand", "boolean b = (true && 1) || false;"],
      ["a bad operand deep in a chain", "boolean a = true; boolean b = a && a && a || 1;"],
      ["a bad right operand in a condition", "boolean a = true; if (a && 1) { a = false; }"],
      ["a bad left operand in a loop condition", "int i = 0; while (i && true) { i = 1; }"],
    ];
    for (const [comment, body] of rejected) {
      it(`rejects ${comment}`, () =>
        expect(() => compileProgram(body)).toThrow(/bad operand types/));
    }
  });

  describe("rejects conditions and operands of ! that are not boolean", () => {
    const rejectedConditions: [string, string][] = [
      ["an int in an if", "int x = 1; if (x) { x = 2; }"],
      ["an int literal in an if", "int x = 0; if (1) { x = 2; }"],
      ["a double in an if", "double d = 1.5; int x = 0; if (d) { x = 2; }"],
      ["a String in an if", "String s = \"s\"; int x = 0; if (s) { x = 2; }"],
      ["null in an if", "int x = 0; if (null) { x = 2; }"],
      ["an Integer in an if", "Integer i = 1; int x = 0; if (i) { x = 2; }"],
      ["an arithmetic result in an if", "int x = 1; if (x + 1) { x = 2; }"],
      ["an int in the else-if of an if", "boolean b = true; int x = 1; if (b) { x = 2; } else if (x) { x = 3; }"],
      ["an int in a while", "int x = 1; while (x) { x = 0; }"],
      ["a String in a while", "String s = \"s\"; while (s) { s = null; }"],
      ["an int in a do-while", "int x = 1; do { x = 0; } while (x);"],
      ["a double in a do-while", "int x = 1; do { x = 0; } while (1.5);"],
      ["an int in a for", "for (int i = 0; i; i++) { }"],
      ["an int variable in a for", "int x = 1; for (int i = 0; x; i++) { }"],
      ["an int in a for without an initializer", "int x = 1; for (; x; ) { x = 0; }"],
      ["an int in a conditional expression", "int x = 1; int y = x ? 2 : 3;"],
      ["an int literal in a conditional expression", "int y = 1 ? 2 : 3;"],
      ["a String in a conditional expression", "String s = \"s\"; int y = s ? 2 : 3;"],
      ["an Integer in a conditional expression", "Integer i = 1; int y = i ? 2 : 3;"],
    ];
    for (const [comment, body] of rejectedConditions) {
      it(`rejects ${comment}`, () =>
        expect(() => compileProgram(body)).toThrow(/incompatible types: .* cannot be converted to boolean/));
    }

    const rejectedNegations: [string, string][] = [
      ["! of an int", "int x = 1; boolean b = !x;"],
      ["! of an int literal", "boolean b = !1;"],
      ["! of a char", "char c = 'c'; boolean b = !c;"],
      ["! of a double", "double d = 1.5; boolean b = !d;"],
      ["! of a long", "long l = 1L; boolean b = !l;"],
      ["! of a String", "String s = \"s\"; boolean b = !s;"],
      ["! of null", "boolean b = !null;"],
      ["! of an Integer", "Integer i = 1; boolean b = !i;"],
      ["! of an array", "int[] a = {1}; boolean b = !a;"],
      ["! of an arithmetic result", "int x = 1; boolean b = !(x + 1);"],
      ["! of an int inside a condition", "int x = 1; if (!x) { x = 2; }"],
      ["! of an int inside a loop condition", "int x = 1; while (!x) { x = 2; }"],
      ["! of an int as an operand of &&", "int x = 1; boolean a = true; boolean b = a && !x;"],
      ["! of an int on the left of ||", "int x = 1; boolean a = true; boolean b = !x || a;"],
      ["a double negation of an int", "int x = 1; boolean b = !!x;"],
    ];
    for (const [comment, body] of rejectedNegations) {
      it(`rejects ${comment}`, () =>
        expect(() => compileProgram(body)).toThrow(/bad operand type .* for unary operator '!'/));
    }

    const allowed: [string, string][] = [
      ["boolean and Boolean conditions", "boolean a = true; Boolean w = false; int x = 0; if (a) { x = 1; } if (w) { x = 2; } while (w) { x = 3; } do { x = 4; } while (w); for (; w; ) { x = 5; } x = w ? 1 : 2;"],
      ["comparisons and logical operators as conditions", "int x = 1; int y = 2; boolean a = true; if (x < y && a || !a) { x = 3; } while (x == y) { x = 0; } x = (x > y) ? 1 : 2;"],
      ["a for without a condition", "for (;;) { break; }"],
      ["constant conditions", "int x = 0; if (true) { x = 1; } while (false) { x = 2; } x = true ? 1 : 2;"],
      ["! of booleans and Booleans", "boolean a = true; Boolean w = false; boolean b = !a; boolean c = !w; Boolean d = !w; boolean e = !(a && w); boolean f = !!a;"],
    ];
    for (const [comment, body] of allowed) {
      it(`accepts ${comment}`, () => expect(() => compileProgram(body)).not.toThrow());
    }
  });

  describe("rejects unary operators applied to illegal operand types", () => {
    const rejected: [string, string, string][] = [
      ["unary - of a boolean", "boolean a = true; Object r = -a;", "-"],
      ["unary - of a boolean literal", "Object r = -true;", "-"],
      ["unary - of a boolean array element", "boolean[] a = {true}; Object r = -a[0];", "-"],
      ["unary - of a Boolean", "Boolean a = true; Object r = -a;", "-"],
      ["unary - of a String", "String a = \"s\"; Object r = -a;", "-"],
      ["unary - of a string literal", "Object r = -\"s\";", "-"],
      ["unary - of null", "Object r = -null;", "-"],
      ["unary - of an array", "int[] a = {1}; Object r = -a;", "-"],
      ["unary - of an Object", "Object a = null; Object r = -a;", "-"],
      ["unary + of a boolean", "boolean a = true; Object r = +a;", "+"],
      ["unary + of a boolean literal", "Object r = +true;", "+"],
      ["unary + of a boolean array element", "boolean[] a = {true}; Object r = +a[0];", "+"],
      ["unary + of a Boolean", "Boolean a = true; Object r = +a;", "+"],
      ["unary + of a String", "String a = \"s\"; Object r = +a;", "+"],
      ["unary + of a string literal", "Object r = +\"s\";", "+"],
      ["unary + of null", "Object r = +null;", "+"],
      ["unary + of an array", "int[] a = {1}; Object r = +a;", "+"],
      ["unary + of an Object", "Object a = null; Object r = +a;", "+"],
      ["~ of a float", "float a = 1f; Object r = ~a;", "~"],
      ["~ of a double", "double a = 1.5; Object r = ~a;", "~"],
      ["~ of a double literal", "Object r = ~1.5;", "~"],
      ["~ of a boolean", "boolean a = true; Object r = ~a;", "~"],
      ["~ of a boolean literal", "Object r = ~true;", "~"],
      ["~ of a Float", "Float a = 1f; Object r = ~a;", "~"],
      ["~ of a Double", "Double a = 1.5; Object r = ~a;", "~"],
      ["~ of a Boolean", "Boolean a = true; Object r = ~a;", "~"],
      ["~ of a String", "String a = \"s\"; Object r = ~a;", "~"],
      ["~ of null", "Object r = ~null;", "~"],
      ["~ of an array", "int[] a = {1}; Object r = ~a;", "~"],
      ["~ of a double array element", "double[] a = {1.5}; Object r = ~a[0];", "~"],
      ["~ of an Object", "Object a = null; Object r = ~a;", "~"],
      ["prefix ++ of a boolean", "boolean a = true; ++a;", "++"],
      ["postfix ++ of a boolean", "boolean a = true; a++;", "++"],
      ["prefix ++ of a Boolean", "Boolean a = true; ++a;", "++"],
      ["postfix ++ of a Boolean", "Boolean a = true; a++;", "++"],
      ["prefix ++ of a String", "String a = \"s\"; ++a;", "++"],
      ["postfix ++ of a String", "String a = \"s\"; a++;", "++"],
      ["prefix ++ of an array", "int[] a = {1}; ++a;", "++"],
      ["postfix ++ of an array", "int[] a = {1}; a++;", "++"],
      ["prefix ++ of an Object", "Object a = null; ++a;", "++"],
      ["postfix ++ of an Object", "Object a = null; a++;", "++"],
      ["prefix ++ of a boolean array element", "boolean[] a = {true}; ++a[0];", "++"],
      ["postfix ++ of a boolean array element", "boolean[] a = {true}; a[0]++;", "++"],
      ["prefix -- of a boolean", "boolean a = true; --a;", "--"],
      ["postfix -- of a boolean", "boolean a = true; a--;", "--"],
      ["prefix -- of a Boolean", "Boolean a = true; --a;", "--"],
      ["postfix -- of a Boolean", "Boolean a = true; a--;", "--"],
      ["prefix -- of a String", "String a = \"s\"; --a;", "--"],
      ["postfix -- of a String", "String a = \"s\"; a--;", "--"],
      ["prefix -- of an array", "int[] a = {1}; --a;", "--"],
      ["postfix -- of an array", "int[] a = {1}; a--;", "--"],
      ["prefix -- of an Object", "Object a = null; --a;", "--"],
      ["postfix -- of an Object", "Object a = null; a--;", "--"],
      ["prefix -- of a boolean array element", "boolean[] a = {true}; --a[0];", "--"],
      ["postfix -- of a boolean array element", "boolean[] a = {true}; a[0]--;", "--"],
    ];
    for (const [comment, body, operator] of rejected) {
      it(`rejects ${comment}`, () =>
        expect(() => compileProgram(body)).toThrow(
          `bad operand type`
        ));
      it(`names the operator when it rejects ${comment}`, () =>
        expect(() => compileProgram(body)).toThrow(
          new RegExp(`for unary operator '${operator.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}'$`)
        ));
    }
  });

  describe("accepts logical operators on boolean operands", () => {
    const allowed: [string, string][] = [
      ["boolean literals", "boolean b = true && false || true;"],
      ["boolean variables", "boolean a = true; boolean b = false; boolean c = a && b || !a;"],
      ["Boolean variables", "Boolean a = true; Boolean b = false; boolean c = a && b || a;"],
      ["a mix of boolean and Boolean", "Boolean a = true; boolean b = false; boolean c = a && b; boolean d = b || a;"],
      ["comparisons", "int x = 1; int y = 2; boolean b = x < y && y > x || x == y;"],
      ["comparison of booleans", "boolean a = true; boolean b = false; boolean c = a == b && a != b;"],
      ["bitwise operators on booleans", "boolean a = true; boolean b = false; boolean c = (a & b) && (a | b) || (a ^ b);"],
      ["negations", "boolean a = true; boolean b = !a && !(a || !a);"],
      ["a conditional expression", "boolean a = true; boolean b = (a ? a : false) && a;"],
      ["nested parentheses", "boolean a = true; boolean b = ((a && (a || a)) && ((a)));"],
      ["a condition", "boolean a = true; if (a && !a || a) { a = false; }"],
    ];
    for (const [comment, body] of allowed) {
      it(`accepts ${comment}`, () => expect(() => compileProgram(body)).not.toThrow());
    }
  });

  describe("rejects conversions that are not implicit", () => {
    const rejected: [string, string][] = [
      ["int constant too large for byte", "byte b = 128;"],
      ["negative int constant for char", "char c = -1;"],
      ["int constant too large for short", "short s = 40000;"],
      ["non-constant int to byte", "int i = 1; byte b = i;"],
      ["long constant to int", "int i = 5L;"],
      ["double to float", "float f = 1.5;"],
      ["double to long", "long l = 2.5;"],
      ["float to int", "float f = 1f; int i = f;"],
      ["char to short", "char c = 'a'; short s = c;"],
      ["short to char", "short s = 1; char c = s;"],
      ["byte to char", "byte b = 1; char c = b;"],
      ["a negated byte to byte", "byte b = 1; byte c = -b;"],
      ["a negated short to short", "short s = 1; short t = -s;"],
      ["a negated char to char", "char c = 'a'; char d = -c;"],
      ["a unary plus on a char to char", "char c = 'a'; char d = +c;"],
      ["a complemented byte to byte", "byte b = 1; byte c = ~b;"],
      ["a complemented short to short", "short s = 1; short t = ~s;"],
      ["a complemented long to int", "long l = 1L; int i = ~l;"],
      ["a negated long to int", "long l = 1L; int i = -l;"],
      ["a negated double to float", "double d = 1.5; float f = -d;"],
      ["a negated Integer to byte", "Integer i = 1; byte b = -i;"],
      ["int[] to Object[]", "int[] a = {1}; Object[] o = a;"],
      ["int[] to long[]", "int[] a = {1}; long[] l = a;"],
      ["byte[] to int[]", "byte[] a = {1}; int[] i = a;"],
      ["Object[] to String[]", "Object[] a = {\"s\"}; String[] s = a;"],
      ["Integer[] to String[]", "Integer[] a = {1}; String[] s = a;"],
      ["Number[] to Comparable[]", "Number[] a = {1}; Comparable[] c = a;"],
      ["Object to int[]", "Object o = null; int[] a = o;"],
      ["String to String[]", "String s = \"s\"; String[] a = s;"],
      ["String[] to String", "String[] a = {\"s\"}; String s = a;"],
      ["an int to an array", "int[] a = 1;"],
      ["an int to a String", "String s = 5;"],
      ["an Object to a String", "Object o = null; String s = o;"],
      ["a boolean to a String", "String s = true;"],
      ["an array to an int", "int[] a = {1}; int i = a;"],
      ["a class to an interface it does not implement", "Runnable r = \"x\";"],
      ["a wrapper to an interface it does not implement", "Integer i = 1; CharSequence c = i;"],
      ["a primitive to an interface that is not a wrapper's", "CharSequence c = 5;"],
    ];
    for (const [comment, body] of rejected) {
      it(comment, () => expect(() => compileProgram(body)).toThrow());
    }
  });
});
