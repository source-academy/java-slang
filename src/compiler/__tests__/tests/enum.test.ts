import {
  runTest,
  testCase,
} from "../__utils__/test-utils";

const testCases: testCase[] = [
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
            case Color.RED:
              System.out.println("bad");
              break;
            case Color.BLUE:
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
            case Direction.NORTH:
              System.out.println("fresh");
              break;
            default:
              System.out.println("bad");
          }

          switch (copy[0]) {
            case Direction.SOUTH:
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
});
