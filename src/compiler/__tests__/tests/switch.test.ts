import { runTest, testCase } from '../__utils__/test-utils'

const testCases: testCase[] = [
  {
    comment: 'More basic switch case',
    program: `
      public class Basic {
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
  }
]

export const switchTest = () =>
  describe('Switch statements', () => {
    for (let testCase of testCases) {
      const { comment, program, expectedLines } = testCase
      it(comment, () => runTest(program, expectedLines))
    }
  })
