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
    expect(classes.map(c => c.className)).toEqual(['Main', 'Main$Day'])
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
    expect(new Set(classes.map(c => c.className))).toEqual(
      new Set(['Main', 'Main$A', 'Main$B'])
    )
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

  it('puts the public class first, then the rest in declaration order', () => {
    const program = `
      class Test1 { public static void main(String[] args) {} }
      class Helper {}
      public class Test2 { public static void main(String[] args) {} }
    `
    const classes = compileFromSource(program)
    expect(classes.map(c => c.className)).toEqual(['Test2', 'Test1', 'Helper'])
  })

  it('puts the first class declaring main first when there is no public class', () => {
    const program = `
      class Helper {}
      class First { public static void main(String[] args) {} }
      class Second { public static void main(String[] args) {} }
    `
    const classes = compileFromSource(program)
    expect(classes.map(c => c.className)).toEqual(['First', 'Helper', 'Second'])
  })

  it('keeps member types after the top-level classes when the main class is not first', () => {
    const program = `
      class Helper { public enum Color { RED } }
      public class Main {
        public static void main(String[] args) {}
      }
    `
    const classes = compileFromSource(program)
    expect(classes.map(c => c.className)).toEqual(['Main', 'Helper', 'Helper$Color'])
  })
})
