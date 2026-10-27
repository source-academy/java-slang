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
    ];
    for (const [comment, body] of rejected) {
      it(comment, () => expect(() => compileProgram(body)).toThrow());
    }
  });
});
