import {
  runTest,
  testCase,
} from "../__utils__/test-utils";
import * as peggy from "peggy";
import { compile } from "../../index";
import { AST } from "../../../ast/types/packages-and-modules";
import { javaPegGrammar } from "../../grammar";
import { peggyFunctions } from "../../peggy-functions";

// Expected output of each program is what a real JDK 8 prints for the javac-compiled program.
const testCases: testCase[] = [
  {
    comment: "integer literals: hexadecimal, octal, binary, underscores, int and long",
    program: `
      public class Main {
        public static void main(String[] args) {
          System.out.println(0x1F);
          System.out.println(0XaB);
          System.out.println(0x7fffffff);
          System.out.println(0x80000000);
          System.out.println(0xFFFFFFFF);
          System.out.println(-0x10);
          System.out.println(017);
          System.out.println(010);
          System.out.println(0_7);
          System.out.println(0b1010);
          System.out.println(0B1111_0000);
          System.out.println(1_000_000);
          System.out.println(2_147_483_647);
          System.out.println(-2147483648);
          System.out.println(0x7fffffffffffffffL);
          System.out.println(0xFFFFFFFFFFFFFFFFL);
          System.out.println(0x8000000000000000L);
          System.out.println(0xFFFFFFFFL);
          System.out.println(0b11L);
          System.out.println(0777L);
          System.out.println(-9223372036854775808L);
          System.out.println(9_223_372_036_854_775_807L);
          System.out.println(100L);
          System.out.println(0L);
          System.out.println(0);
        }
      }
    `,
    expectedLines: ["31", "171", "2147483647", "-2147483648", "-1", "-16", "15", "8", "7", "10", "240", "1000000", "2147483647", "-2147483648", "9223372036854775807", "-1", "-9223372036854775808", "4294967295", "3", "511", "-9223372036854775808", "9223372036854775807", "100", "0", "0"],
  },
  {
    comment: "literals in expressions, constant narrowing, bit masks and floating point with underscores",
    program: `
      public class Main {
        public static void main(String[] args) {
          byte b = 0x7F;
          byte nb = (byte) 0xFF;
          char c = 0x41;
          char c2 = 0b1000011;
          short s = 0x7FFF;
          byte o = 0177;
          int mask = 0xFF;
          int x = 0x12345678;
          System.out.println(b + " " + nb + " " + c + " " + c2 + " " + s + " " + o);
          System.out.println(x & mask);
          System.out.println(x >>> 0x4);
          System.out.println((x >> 8) & 0xFF);
          System.out.println(x | 0xF0000000);
          System.out.println(x ^ 0xFFFFFFFF);
          long big = 0x123456789ABCDEFL;
          System.out.println(big & 0xFFFFFFFFL);
          System.out.println(big >>> 32);
          System.out.println(big & 0xFF);
          long flags = 0b1L << 40 | 0x1L << 3;
          System.out.println(flags);
          int sum = 0x10 + 010 + 0b10 + 10;
          System.out.println(sum);
          System.out.println(0x10 * 2 - 1_0);
          char hexChar = (char) (0x30 + 7);
          System.out.println(hexChar);
          System.out.println(1_000.5);
          System.out.println(3.141_592);
          System.out.println(1e1_0);
          System.out.println(1_0.0f);
          System.out.println(0.5_5);
        }
      }
    `,
    expectedLines: ["127 -1 A C 32767 127", "120", "19088743", "86", "-231451016", "-305419897", "2309737967", "19088743", "239", "1099511627784", "36", "22", "7", "1000.5", "3.141592", "1.0E10", "10.0", "0.55"],
  },
  {
    comment: "hexadecimal, octal, binary and char switch labels",
    program: `
      public class Main {
        static String name(int v) {
          switch (v) {
            case -0x1: return "minus one";
            case 0x0: return "zero";
            case 0x8: return "eight";
            case 020: return "sixteen";
            case 0b11000: return "twenty-four";
            case 1_000: return "thousand";
            default: return "other";
          }
        }
        static String letter(char ch) {
          switch (ch) {
            case 'a': return "A";
            case 'b': return "B";
            case 0x63: return "C";
            default: return "?";
          }
        }
        public static void main(String[] args) {
          for (int i = 0; i < 5; i++) {
            System.out.println(name(i * 8));
          }
          System.out.println(name(-1));
          System.out.println(name(1000));
          System.out.println(letter('a') + letter('b') + letter('c') + letter('d'));
        }
      }
    `,
    expectedLines: ["zero", "eight", "sixteen", "twenty-four", "other", "minus one", "thousand", "ABC?"],
  },
  {
    comment: "identifiers containing underscores, including ones that start with true, false, null or a keyword",
    program: `
      class My_Class {
        public int max_size = 10;
        public int _hidden = 2;
        public static int count_all = 3;
        public int get_value() { return max_size + _hidden; }
        public static int add_one(int the_number) { return the_number + 1; }
      }
      public class Main {
        public static void main(String[] args) {
          int my_var = 1;
          int _x = 2;
          int x_1 = 3;
          int x__y = 4;
          int a_b_c = my_var + _x + x_1 + x__y;
          String first_name = "ada";
          int true_count = 5;
          int nullable = 6;
          boolean falsey = true;
          int null_ptr = 7;
          int int_value = 8;
          int do_it = 9;
          int class_name = 10;
          int truely = 11;
          int falsehood = 12;
          My_Class my_obj = new My_Class();
          System.out.println(a_b_c);
          System.out.println(first_name);
          System.out.println(true_count + nullable + null_ptr);
          System.out.println(falsey);
          System.out.println(int_value + do_it + class_name + truely + falsehood);
          System.out.println(my_obj.get_value());
          System.out.println(my_obj.max_size);
          System.out.println(My_Class.count_all);
          System.out.println(My_Class.add_one(my_obj._hidden));
          boolean is_ok = !falsey;
          System.out.println(is_ok);
          int[] number_list = {1, 2, 3};
          int total_sum = 0;
          for (int list_index = 0; list_index < number_list.length; list_index++) {
            total_sum += number_list[list_index];
          }
          System.out.println(total_sum);
          System.out.println(null_ptr == 7 ? "seven" : "other");
        }
      }
    `,
    expectedLines: ["10", "ada", "18", "true", "50", "12", "10", "3", "3", "false", "6", "seven"],
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

export const literalTest = () => describe("literals and identifiers", () => {
  for (let testCase of testCases) {
    const { comment: comment, program: program, expectedLines: expectedLines } = testCase;
    it(comment, () => runTest(program, expectedLines));
  }

  describe("rejects literals that are out of range", () => {
    const rejected: [string, string][] = [
      ["decimal int one past the maximum", "int x = 2147483648;"],
      ["decimal int far past the maximum", "int x = 99999999999;"],
      ["hexadecimal int wider than 32 bits", "int x = 0x1FFFFFFFF;"],
      ["binary int wider than 32 bits", "int x = 0b111111111111111111111111111111111;"],
      ["decimal long one past the maximum", "long x = 9223372036854775808L;"],
      ["hexadecimal long wider than 64 bits", "long x = 0x1FFFFFFFFFFFFFFFFL;"],
    ];
    for (const [comment, body] of rejected) {
      it(`rejects ${comment}`, () => expect(() => compileProgram(body)).toThrow(/too large/));
    }

    const accepted: [string, string][] = [
      ["the smallest int", "int x = -2147483648;"],
      ["the largest int", "int x = 2147483647;"],
      ["the smallest long", "long x = -9223372036854775808L;"],
      ["the largest long", "long x = 9223372036854775807L;"],
      ["the largest hexadecimal int", "int x = 0xFFFFFFFF;"],
      ["the largest hexadecimal long", "long x = 0xFFFFFFFFFFFFFFFFL;"],
    ];
    for (const [comment, body] of accepted) {
      it(`accepts ${comment}`, () => expect(() => compileProgram(body)).not.toThrow());
    }
  });

  describe("applies the usual conversion rules to non-decimal literals", () => {
    it("rejects a hexadecimal int constant too large for a byte", () =>
      expect(() => compileProgram("byte b = 0xFF;")).toThrow());
    it("accepts a hexadecimal int constant that fits a byte", () =>
      expect(() => compileProgram("byte b = 0x7F;")).not.toThrow());
    it("rejects an octal int constant too large for a char", () =>
      expect(() => compileProgram("char c = 0200000;")).toThrow());
  });
});
