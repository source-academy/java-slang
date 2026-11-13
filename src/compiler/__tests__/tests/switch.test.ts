import { runTest, testCase } from '../__utils__/test-utils'

const testCases: testCase[] = [
  {
    comment: 'More basic switch case',
    program: `
      public class Main {
        public static void main(String[] args) {
          int x = 1;
          switch (x) {
            case 1:
              System.out.println("One");
              break;
          }
        }
      }
    `,
    expectedLines: ['One']
  },
  {
    comment: 'Basic switch case',
    program: `
      public class Main {
        public static void main(String[] args) {
          int x = 2;
          switch (x) {
            case 1:
              System.out.println("One");
              break;
            case 2:
              System.out.println("Two");
              break;
            case 3:
              System.out.println("Three");
              break;
            default:
              System.out.println("Default");
          }
        }
      }
    `,
    expectedLines: ['Two']
  },
  {
    comment: 'Switch with default case',
    program: `
      public class Main {
        public static void main(String[] args) {
          int x = 5;
          switch (x) {
            case 1:
              System.out.println("One");
              break;
            case 2:
              System.out.println("Two");
              break;
            default:
              System.out.println("Default");
          }
        }
      }
    `,
    expectedLines: ['Default']
  },
  {
    comment: 'Switch fallthrough behavior',
    program: `
      public class Main {
        public static void main(String[] args) {
          int x = 2;
          switch (x) {
            case 1:
              System.out.println("One");
            case 2:
              System.out.println("Two");
            case 3:
              System.out.println("Three");
            default:
              System.out.println("Default");
          }
        }
      }
    `,
    expectedLines: ['Two', 'Three', 'Default']
  },
  {
    comment: 'Switch with break statements',
    program: `
      public class Main {
        public static void main(String[] args) {
          int x = 3;
          switch (x) {
            case 1:
              System.out.println("One");
              break;
            case 2:
              System.out.println("Two");
              break;
            case 3:
              System.out.println("Three");
              break;
            default:
              System.out.println("Default");
          }
        }
      }
    `,
    expectedLines: ['Three']
  },
  {
    comment: 'Switch with strings',
    program: `
      public class Main {
        public static void main(String[] args) {
          String day = "Tuesday";
          switch (day) {
            case "Monday":
              System.out.println("Start of the week");
              break;
            case "Tuesday":
              System.out.println("Second day");
              break;
            case "Friday":
              System.out.println("Almost weekend");
              break;
            default:
              System.out.println("Midweek or weekend");
          }
        }
      }
    `,
    expectedLines: ['Second day']
  },
  {
    comment: 'Nested switch statements',
    program: `
      public class Main {
        public static void main(String[] args) {
          int outer = 2;
          int inner = 1;
          switch (outer) {
            case 1:
              switch (inner) {
                case 1:
                  System.out.println("Inner One");
                  break;
                case 2:
                  System.out.println("Inner Two");
                  break;
              }
              break;
            case 2:
              switch (inner) {
                case 1:
                  System.out.println("Outer Two, Inner One");
                  break;
                case 2:
                  System.out.println("Outer Two, Inner Two");
                  break;
              }
              break;
            default:
              System.out.println("Default case");
          }
        }
      }
    `,
    expectedLines: ['Outer Two, Inner One']
  },

  {
    comment: 'Switch with far apart cases',
    program: `
      public class Main {
        public static void main(String[] args) {
          int x = 1331;
          switch (x) {
            case 1:
              System.out.println("No");
              break;
            case 1331:
              System.out.println("Yes");
              break;
            case 999999999:
              System.out.println("No");
              break;
            default:
              System.out.println("Default");
          }
        }
      }
    `,
    expectedLines: ['Yes']
  },
  {
    comment: 'break inside a switch inside for, while and do-while loops leaves only the switch',
    program: `
      public class Main {
        public static void main(String[] args) {
          // switch in for: break leaves only the switch
          for (int i = 0; i < 4; i++) {
            switch (i) {
              case 0: System.out.println("zero"); break;
              case 1: System.out.println("one"); break;
              case 2: System.out.println("two"); break;
              default: System.out.println("other");
            }
            System.out.println("after " + i);
          }
          // switch in while
          int n = 0;
          while (n < 3) {
            switch (n) {
              case 0: System.out.println("w0"); break;
              case 1: System.out.println("w1"); break;
              default: System.out.println("w2");
            }
            n++;
          }
          // switch in do-while
          int d = 0;
          do {
            switch (d) {
              case 0: System.out.println("d0"); break;
              case 1: System.out.println("d1"); break;
            }
            d++;
          } while (d < 2);
          // break in a loop (not in a switch) still leaves the loop
          for (int j = 0; j < 10; j++) {
            if (j == 3) break;
            System.out.println("j" + j);
          }
          System.out.println("done");
        }
      }
    `,
    expectedLines: [
      'zero',
      'after 0',
      'one',
      'after 1',
      'two',
      'after 2',
      'other',
      'after 3',
      'w0',
      'w1',
      'w2',
      'd0',
      'd1',
      'j0',
      'j1',
      'j2',
      'done'
    ]
  },
  {
    comment: 'break and continue with loops and switches nested in each other',
    program: `
      public class Main {
        public static void main(String[] args) {
          // loop inside a switch case: break leaves the loop, then the switch
          int mode = 1;
          switch (mode) {
            case 0:
              System.out.println("mode zero");
              break;
            case 1:
              for (int i = 0; i < 10; i++) {
                if (i == 2) break;
                System.out.println("loop " + i);
              }
              System.out.println("after loop");
              break;
            case 2:
              System.out.println("mode two");
              break;
          }
          System.out.println("after switch");
          // switch in switch: the inner break leaves only the inner switch
          int a = 1;
          int b = 2;
          switch (a) {
            case 1:
              switch (b) {
                case 1: System.out.println("inner one"); break;
                case 2: System.out.println("inner two"); break;
              }
              System.out.println("outer one continues");
              break;
            case 2:
              System.out.println("outer two");
              break;
          }
          // continue inside a switch inside a loop continues the loop
          for (int i = 0; i < 5; i++) {
            switch (i % 3) {
              case 0: continue;
              case 1: System.out.println("rem1 at " + i); break;
              case 2: System.out.println("rem2 at " + i); break;
            }
            System.out.println("end of body " + i);
          }
          // nested loops with a switch in the inner one
          for (int x = 0; x < 2; x++) {
            for (int y = 0; y < 3; y++) {
              switch (y) {
                case 1: break;
                default: System.out.println(x + "," + y);
              }
            }
          }
        }
      }
    `,
    expectedLines: [
      'loop 0',
      'loop 1',
      'after loop',
      'after switch',
      'inner two',
      'outer one continues',
      'rem1 at 1',
      'end of body 1',
      'rem2 at 2',
      'end of body 2',
      'rem1 at 4',
      'end of body 4',
      '0,0',
      '0,2',
      '1,0',
      '1,2'
    ]
  },
  {
    comment: 'int and char case labels in any order, including extreme values and shared bodies',
    program: `
      public class Main {
        static String name(int v) {
          switch (v) {
            case 1000: return "thousand";
            case 5: return "five";
            case -7: return "minus seven";
            case 2147483647: return "max";
            case 0: return "zero";
            case -2147483648: return "min";
            case 42: return "forty-two";
            case -100000: return "minus hundred thousand";
            default: return "other";
          }
        }
        static int rank(char c) {
          switch (c) {
            case 'z': return 1;
            case 'a': return 2;
            case 'm': return 3;
            case 'b': return 4;
            case 'y': return 5;
            default: return 0;
          }
        }
        static String shared(int v) {
          switch (v) {
            case 900:
            case 3:
              return "nine hundred or three";
            case 70:
            case -4:
              return "seventy or minus four";
            case 20: return "twenty";
            default: return "none";
          }
        }
        public static void main(String[] args) {
          int[] values = {1000, 5, -7, 2147483647, 0, -2147483648, 42, -100000, 1, -1, 999, 2147483646};
          for (int i = 0; i < values.length; i++) {
            System.out.println(values[i] + " " + name(values[i]));
          }
          char[] cs = {'z', 'a', 'm', 'b', 'y', 'q'};
          for (int i = 0; i < cs.length; i++) {
            System.out.println(cs[i] + " " + rank(cs[i]));
          }
          int[] vs = {900, 3, 70, -4, 20, 21};
          for (int i = 0; i < vs.length; i++) {
            System.out.println(vs[i] + " " + shared(vs[i]));
          }
        }
      }
    `,
    expectedLines: [
      '1000 thousand',
      '5 five',
      '-7 minus seven',
      '2147483647 max',
      '0 zero',
      '-2147483648 min',
      '42 forty-two',
      '-100000 minus hundred thousand',
      '1 other',
      '-1 other',
      '999 other',
      '2147483646 other',
      'z 1',
      'a 2',
      'm 3',
      'b 4',
      'y 5',
      'q 0',
      '900 nine hundred or three',
      '3 nine hundred or three',
      '70 seventy or minus four',
      '-4 seventy or minus four',
      '20 twenty',
      '21 none'
    ]
  },
  {
    comment: 'String case labels in any order',
    program: `
      public class Main {
        static int code(String s) {
          switch (s) {
            case "zebra": return 1;
            case "apple": return 2;
            case "mango": return 3;
            case "banana": return 4;
            case "a": return 5;
            case "kiwi": return 6;
            case "the quick brown fox jumps over the lazy dog": return 7;
            case "": return 8;
            default: return 0;
          }
        }
        public static void main(String[] args) {
          String[] words = {"zebra", "apple", "mango", "banana", "a", "kiwi", "the quick brown fox jumps over the lazy dog", "", "grape", "ab"};
          for (int i = 0; i < words.length; i++) {
            System.out.println("[" + words[i] + "] " + code(words[i]));
          }
          String s = "banana";
          switch (s) {
            case "cherry": System.out.println("c"); break;
            case "banana": System.out.println("b"); break;
            case "apple": System.out.println("a"); break;
          }
          for (int i = 0; i < 3; i++) {
            switch (i == 0 ? "x" : i == 1 ? "y" : "z") {
              case "z": System.out.println("zed"); break;
              case "x": System.out.println("ex"); break;
              case "y": System.out.println("why"); break;
            }
            System.out.println("next " + i);
          }
        }
      }
    `,
    expectedLines: [
      '[zebra] 1',
      '[apple] 2',
      '[mango] 3',
      '[banana] 4',
      '[a] 5',
      '[kiwi] 6',
      '[the quick brown fox jumps over the lazy dog] 7',
      '[] 8',
      '[grape] 0',
      '[ab] 0',
      'b',
      'ex',
      'next 0',
      'why',
      'next 1',
      'zed',
      'next 2'
    ]
  },
  {
    comment: 'do-while loop whose body is a switch',
    program: `
      public class Main {
        public static void main(String[] args) {
      int d = 0; do { switch (d) { case 0: System.out.println("d0"); break; case 1: System.out.println("d1"); break; } d++; } while (d < 2); System.out.println("done");
        }
      }
    `,
    expectedLines: ['d0', 'd1', 'done']
  },
  {
    comment: 'do-while loop whose body contains an if statement',
    program: `
      public class Main {
        public static void main(String[] args) {
      int i = 0; do { if (i == 1) { System.out.println("one"); } else { System.out.println("not one " + i); } i++; } while (i < 3); System.out.println("done");
        }
      }
    `,
    expectedLines: ['not one 0', 'one', 'not one 2', 'done']
  },
  {
    comment: 'do-while loop with a && condition',
    program: `
      public class Main {
        public static void main(String[] args) {
      int i = 0; int j = 5; do { i++; j--; } while (i < 3 && j > 0); System.out.println(i + " " + j);
        }
      }
    `,
    expectedLines: ['3 2']
  },
  {
    comment: 'nested do-while loops with break',
    program: `
      public class Main {
        public static void main(String[] args) {
      int i = 0; do { int j = 0; do { if (j == 1) break; System.out.println(i + "-" + j); j++; } while (j < 3); i++; } while (i < 2); System.out.println("done");
        }
      }
    `,
    expectedLines: ['0-0', '1-0', 'done']
  },
  {
    comment: 'break out of a while loop',
    program: `
      public class Main {
        public static void main(String[] args) {
      int k = 0; while (true) { if (k == 2) break; System.out.println("k" + k); k++; } System.out.println("done");
        }
      }
    `,
    expectedLines: ['k0', 'k1', 'done']
  },
  {
    comment: 'break out of a do-while loop',
    program: `
      public class Main {
        public static void main(String[] args) {
      int k = 0; do { if (k == 2) break; System.out.println("k" + k); k++; } while (k < 10); System.out.println("done");
        }
      }
    `,
    expectedLines: ['k0', 'k1', 'done']
  }
]

export const switchTest = () =>
  describe('Switch statements', () => {
    for (let testCase of testCases) {
      const { comment, program, expectedLines } = testCase
      it(comment, () => runTest(program, expectedLines))
    }
  })
