import { compileFromSource } from '../index'

describe('compiled class ordering', () => {
  it('keeps the top-level class first when a member enum is present', () => {
    const program = `
      class Main {
        public enum Day { SUNDAY, MONDAY }
        public static void main(String[] args) {
          System.out.println(0);
        }
      }
    `
    const classes = compileFromSource(program)
    expect(classes.map(c => c.className)).toEqual(['Main', 'Day'])
  })

  it('keeps top-level declaration order, with member enums appended', () => {
    const program = `
      class Main {
        public enum A { X }
        public enum B { Y }
        public static void main(String[] args) {}
      }
    `
    const classes = compileFromSource(program)
    expect(classes[0].className).toBe('Main')
    expect(new Set(classes.map(c => c.className))).toEqual(new Set(['Main', 'A', 'B']))
  })

  it('is unchanged when there is no enum', () => {
    const program = `
      class Main {
        public static void main(String[] args) {
          System.out.println(0);
        }
      }
    `
    const classes = compileFromSource(program)
    expect(classes.map(c => c.className)).toEqual(['Main'])
  })
})
