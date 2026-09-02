import {
  runTest,
  testCase,
} from "../__utils__/test-utils";
import { compileFromSource } from "../../index";

const testCases: testCase[] = [
  {
    comment: "member enum constant access",
    program: `
      public class Main {
        public enum Day {
          SUNDAY,
          MONDAY,
          TUESDAY,
          WEDNESDAY,
          THURSDAY,
          FRIDAY,
          SATURDAY
        }

        public static void main(String[] args) {
          Day day = Day.SUNDAY;
        }
      }
    `,
    expectedLines: [],
  },
  {
    comment: "member enum switch selects the matching constant",
    program: `
      public class Main {
        public enum Light { RED, YELLOW, GREEN }

        public static void main(String[] args) {
          Light light = Light.GREEN;
          switch (light) {
            case RED:
              System.out.println("stop");
              break;
            case GREEN:
              System.out.println("go");
              break;
            default:
              System.out.println("wait");
          }
        }
      }
    `,
    expectedLines: ["go"],
  },
  {
    comment: "member enum switch matches the first of seven constants",
    program: `
      class Main {
        public enum Day {
          SUNDAY, MONDAY, TUESDAY, WEDNESDAY,
          THURSDAY, FRIDAY, SATURDAY
        }

        public static void main(String[] args) {
          Day day = Day.SUNDAY;
          System.out.println(10);
          switch (day) {
            case SUNDAY:
              System.out.println(0);
              break;
            case MONDAY:
              System.out.println(1);
              break;
            case TUESDAY:
              System.out.println(2);
              break;
            case WEDNESDAY:
              System.out.println(3);
              break;
            case THURSDAY:
              System.out.println(4);
              break;
            case FRIDAY:
              System.out.println(5);
              break;
            case SATURDAY:
              System.out.println(6);
              break;
            default:
              break;
          }
        }
      }
    `,
    expectedLines: ["10", "0"],
  },
];

export const enumTest = () => describe("enums", () => {
  for (let testCase of testCases) {
    const { comment: comment, program: program, expectedLines: expectedLines } = testCase;
    it(comment, () => runTest(program, expectedLines));
  }

  it("rejects qualified enum switch labels", () => {
    expect(() =>
      compileFromSource(`
        class Main {
          enum Day { SUNDAY }

          public static void main(String[] args) {
            Day day = Day.SUNDAY;
            switch (day) {
              case Day.SUNDAY:
                break;
            }
          }
        }
      `)
    ).toThrow(SyntaxError);
  });
});
