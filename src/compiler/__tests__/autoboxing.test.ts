import { runTest, testCase } from './__utils__/test-utils'

const testCases: testCase[] = [
  {
    comment: 'autoboxes an int literal to Integer, then unboxes it back',
    program: `
      public class Main {
        public static void main(String[] args) {
          Integer i = 1;
          int j = i;
          System.out.println(j);
        }
      }
    `,
    expectedLines: ['1']
  },
  {
    comment: 'autoboxes and unboxes a wide primitive (long)',
    program: `
      public class Main {
        public static void main(String[] args) {
          Long x = 10L;
          long y = x;
          System.out.println(y);
        }
      }
    `,
    expectedLines: ['10']
  },
  {
    comment: 'autoboxes and unboxes double and boolean',
    program: `
      public class Main {
        public static void main(String[] args) {
          Double d = 2.5;
          double e = d;
          Boolean b = true;
          boolean c = b;
          System.out.println(e);
          System.out.println(c);
        }
      }
    `,
    expectedLines: ['2.5', 'true']
  },
  {
    comment: 'boxes an int expression when assigned to a wrapper field',
    program: `
      public class Main {
        static Integer boxed;
        public static void main(String[] args) {
          int n = 20;
          boxed = n + 1;
          int back = boxed;
          System.out.println(back);
        }
      }
    `,
    expectedLines: ['21']
  },
  {
    comment: 'unboxes a wrapper operand in an arithmetic expression',
    program: `
      public class Main {
        public static void main(String[] args) {
          Integer i = 1;
          System.out.println(i + 2);
        }
      }
    `,
    expectedLines: ['3']
  },
  {
    comment: 'unboxes both wrapper operands in an arithmetic expression',
    program: `
      public class Main {
        public static void main(String[] args) {
          Integer i = 10;
          Integer j = 4;
          int diff = j - i;
          System.out.println(diff);
        }
      }
    `,
    expectedLines: ['-6']
  },
  {
    comment: 'unboxes a Long wrapper operand in an arithmetic expression',
    program: `
      public class Main {
        public static void main(String[] args) {
          Long a = 5L;
          long total = a + 3L;
          System.out.println(total);
        }
      }
    `,
    expectedLines: ['8']
  }
]

export const autoboxingTest = () =>
  describe('primitive-literal autoboxing', () => {
    for (const { comment, program, expectedLines } of testCases) {
      it(comment, () => runTest(program, expectedLines))
    }
  })

autoboxingTest()
