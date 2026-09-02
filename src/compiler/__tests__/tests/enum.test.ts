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
  {
    comment: "enum switch and synthetic methods",
    program: `
      public enum Color {
        RED,
        BLUE
      }

      public class Main {
        public static void main(String[] args) {
          Color red = Color.valueOf("RED");
          System.out.println(Color.RED.ordinal());
          System.out.println(Color.BLUE.name());
          System.out.println(red.toString());

          Color selector = Color.BLUE;
          switch (selector) {
            case RED:
              System.out.println("bad");
              break;
            case BLUE:
              System.out.println("ok");
              break;
            default:
              System.out.println("default");
          }
        }
      }
    `,
    expectedLines: ["0", "BLUE", "RED", "ok"],
  },
  {
    comment: "enum values returns cloned array",
    program: `
      public enum Direction {
        NORTH,
        SOUTH
      }

      public class Main {
        public static void main(String[] args) {
          Direction[] copy = Direction.values();
          copy[0] = Direction.SOUTH;
          Direction[] fresh = Direction.values();

          switch (fresh[0]) {
            case NORTH:
              System.out.println("fresh");
              break;
            default:
              System.out.println("bad");
          }

          switch (copy[0]) {
            case SOUTH:
              System.out.println("mutated");
              break;
            default:
              System.out.println("bad");
          }
        }
      }
    `,
    expectedLines: ["fresh", "mutated"],
  },
  {
    comment: "enum constructors and instance fields",
    program: `
      public enum Planet {
        EARTH(1),
        MARS(2);

        private int moons;

        private Planet(int moons) {
          this.moons = moons;
        }

        public int moons() {
          return this.moons;
        }
      }

      public class Main {
        public static void main(String[] args) {
          Planet mars = Planet.valueOf("MARS");
          System.out.println(Planet.EARTH.moons());
          System.out.println(mars.moons());
        }
      }
    `,
    expectedLines: ["1", "2"],
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
