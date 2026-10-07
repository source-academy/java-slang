import JavaEvaluator from '../JavaEvaluator'

class MockConductor {
  outputs: string[] = []
  results: string[] = []
  errors: string[] = []
  sendOutput(message: string): void {
    this.outputs.push(message)
  }
  sendResult(result: string): void {
    this.results.push(result)
  }
  sendError(error: Error): void {
    this.errors.push(error.message)
  }
}

describe('JavaEvaluator', () => {
  test('reports unsupported file type for non-.class files', async () => {
    const mock = new MockConductor()
    const ev = new JavaEvaluator(mock as any)

    await ev.evaluateFile('program.txt', 'ignored')

    expect(mock.outputs).toContain('JavaEvaluator: unsupported file type')
    expect(mock.results).toHaveLength(0)
    expect(mock.errors).toHaveLength(0)
  })

  test('reports an error when the submitted class file is not valid', async () => {
    const mock = new MockConductor()
    const ev = new JavaEvaluator(mock as any)

    // pass some base64 that is not a valid classfile; parseBin should throw
    const invalidBytes = Buffer.from([0x00, 0x01, 0x02]).toString('base64')

    await ev.evaluateFile('Main.class', invalidBytes)

    expect(mock.results).toHaveLength(0)
    expect(mock.errors).toHaveLength(1)
  })

  test('evaluateChunk compiles and runs source text, reporting a result', async () => {
    const mock = new MockConductor()
    const ev = new JavaEvaluator(mock as any)

    await ev.evaluateChunk(`
      public class Main {
        public static void main(String[] args) {
          System.out.println("hello from conductor");
        }
      }
    `)

    expect(mock.errors).toHaveLength(0)
    expect(mock.outputs.join('')).toContain('hello from conductor')
    expect(mock.results).toHaveLength(1)
  })

  test('evaluateChunk reports a compile error instead of silently discarding it', async () => {
    const mock = new MockConductor()
    const ev = new JavaEvaluator(mock as any)

    await ev.evaluateChunk('this is not valid java')

    expect(mock.errors).toHaveLength(1)
    expect(mock.results).toHaveLength(0)
  })

  const run = async (source: string) => {
    const mock = new MockConductor()
    await new JavaEvaluator(mock as any).evaluateChunk(source)
    return mock
  }

  test('evaluateChunk runs the single public class, whatever its name', async () => {
    const mock = await run(`
      public class App {
        public static void main(String[] args) {
          System.out.println("app");
        }
      }
    `)

    expect(mock.errors).toHaveLength(0)
    expect(mock.outputs.join('')).toContain('app')
    expect(mock.results).toHaveLength(1)
  })

  test('evaluateChunk runs the public class even if another class with main is declared first', async () => {
    const mock = await run(`
      class Helper { public int f() { return 7; } public static void main(String[] args) { System.out.println("helper"); } }
      public class Main {
        public static void main(String[] args) {
          Helper h = new Helper();
          System.out.println(h.f());
        }
      }
      class Other { public static void main(String[] args) { System.out.println("other"); } }
    `)

    expect(mock.errors).toHaveLength(0)
    expect(mock.outputs.join('')).toBe('7\n')
  })

  test('evaluateChunk with no public class runs the first class declaring main', async () => {
    const mock = await run(`
      class Helper { public int f() { return 7; } }
      class Test {
        public static void main(String[] args) {
          Helper h = new Helper();
          System.out.println(h.f());
        }
      }
      class Other { public static void main(String[] args) { System.out.println("other"); } }
    `)

    expect(mock.errors).toHaveLength(0)
    expect(mock.outputs.join('')).toBe('7\n')
    expect(mock.results).toHaveLength(1)
  })

  test('evaluateChunk errors when there is no public class and no main method', async () => {
    const mock = await run('class A {} class B {}')

    expect(mock.outputs).toHaveLength(0)
    expect(mock.results).toHaveLength(0)
    expect(mock.errors).toHaveLength(1)
    expect(mock.errors[0]).toContain('No main method found')
  })

  test('evaluateChunk errors when there are multiple public classes', async () => {
    const mock = await run(`
      public class A { public static void main(String[] args) {} }
      public class B { public static void main(String[] args) {} }
    `)

    expect(mock.outputs).toHaveLength(0)
    expect(mock.results).toHaveLength(0)
    expect(mock.errors).toHaveLength(1)
    expect(mock.errors[0]).toContain('Multiple public classes found (A, B)')
  })

  test('evaluateChunk ignores public nested classes when counting public classes', async () => {
    const mock = await run(`
      public class Main {
        public static class Inner {}
        public static void main(String[] args) {
          System.out.println("ok");
        }
      }
    `)

    expect(mock.errors).toHaveLength(0)
    expect(mock.outputs.join('')).toContain('ok')
  })

  test('evaluateChunk errors when the public class has no main method', async () => {
    const mock = await run(`
      class App { public static void main(String[] args) {} }
      public class Main { }
    `)

    expect(mock.results).toHaveLength(0)
    expect(mock.errors).toHaveLength(1)
    expect(mock.errors[0]).toContain('Main method not found in public class Main')
  })
})
