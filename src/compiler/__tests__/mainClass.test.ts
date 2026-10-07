import { compileFromSource, findMainClass, parseFromSource } from '../index'

const mainOf = (source: string) => findMainClass(parseFromSource(source))

describe('main class selection', () => {
  describe('exactly one public class', () => {
    it('uses it, whatever its name or position', () => {
      expect(
        mainOf(`
          class Helper {}
          public class App { public static void main(String[] args) {} }
          class Other { public static void main(String[] args) {} }
        `)
      ).toBe('App')
    })

    it('errors if it has no main method, even if another class has one', () => {
      expect(() =>
        mainOf(`
          class Other { public static void main(String[] args) {} }
          public class App {}
        `)
      ).toThrow('Main method not found in public class App')
    })

    it('errors if its main has the wrong signature', () => {
      expect(() => mainOf('public class App { static void main(String[] args) {} }')).toThrow(
        'Main method not found in public class App'
      )
      expect(() => mainOf('public class App { public static void main(int x) {} }')).toThrow(
        'Main method not found in public class App'
      )
    })

    it('ignores public nested classes', () => {
      expect(
        mainOf(`
          public class Main {
            public static class Inner { public static void main(String[] args) {} }
            public static void main(String[] args) {}
          }
        `)
      ).toBe('Main')
    })

    it('does not require the parameter to be named args', () => {
      expect(mainOf('public class App { public static void main(String[] a) {} }')).toBe('App')
    })

    it('counts a public enum as the public class', () => {
      expect(() =>
        mainOf('public enum E { A } class Main { public static void main(String[] args) {} }')
      ).toThrow('Main method not found in public class E')
    })
  })

  describe('two or more public classes', () => {
    it('errors, listing them', () => {
      expect(() =>
        mainOf(`
          public class A { public static void main(String[] args) {} }
          public class B { public static void main(String[] args) {} }
        `)
      ).toThrow('Multiple public classes found (A, B)')
    })
  })

  describe('no public classes', () => {
    it('uses the first class declaring main, in source order', () => {
      expect(
        mainOf(`
          class Helper {}
          class First { public static void main(String[] args) {} }
          class Second { public static void main(String[] args) {} }
        `)
      ).toBe('First')
    })

    it('errors if no class declares main', () => {
      expect(() => mainOf('class A {} class B {}')).toThrow('No main method found')
    })
  })

  it('is enforced by compile, not just by findMainClass', () => {
    expect(() => compileFromSource('class A {}')).toThrow('No main method found')
    expect(() =>
      compileFromSource(
        'public class A { public static void main(String[] args) {} } public class B {}'
      )
    ).toThrow('Multiple public classes found (A, B)')
  })
})
