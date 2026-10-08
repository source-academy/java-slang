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

    // The deployed evaluator runs inside a browser Worker, which has no
    // `Buffer` global - remove it for this test so a stray `Buffer` usage
    // anywhere in the JVM/stdlib call graph (e.g. System.out's native
    // writeBytes) fails here instead of only in a real deployment, where
    // Node's always-present `Buffer` would otherwise mask it.
    const originalBuffer = (globalThis as any).Buffer
    delete (globalThis as any).Buffer
    try {
      await ev.evaluateChunk(`
        public class Main {
          public static void main(String[] args) {
            System.out.println("hello from conductor");
          }
        }
      `)
    } finally {
      ;(globalThis as any).Buffer = originalBuffer
    }

    expect(mock.errors).toHaveLength(0)
    expect(mock.outputs.join('')).toContain('hello from conductor')
    expect(mock.results).toHaveLength(1)
  })

  test('evaluateChunk runs Arrays.sort, which depends on classes never named in source', async () => {
    const mock = new MockConductor()
    const ev = new JavaEvaluator(mock as any)

    // Arrays.sort(int[]) is a supported call, but its bytecode body calls into
    // java/util/DualPivotQuicksort - a class no Java source can ever name, so
    // the compiler's own allow-list has no reason to know about it. If the
    // JVM bundle's closure only follows superclass/interface edges (missing
    // this "implementation dependency"), this compiles fine and then fails
    // at runtime with a missing-class error instead of printing the result.
    const originalBuffer = (globalThis as any).Buffer
    delete (globalThis as any).Buffer
    try {
      await ev.evaluateChunk(`
        import java.util.Arrays;
        public class Main {
          public static void main(String[] args) {
            int[] arr = {5, 3, 1, 4, 2};
            Arrays.sort(arr);
            System.out.println(arr[0]);
            System.out.println(arr[1]);
            System.out.println(arr[2]);
            System.out.println(arr[3]);
            System.out.println(arr[4]);
          }
        }
      `)
    } finally {
      ;(globalThis as any).Buffer = originalBuffer
    }

    expect(mock.errors).toHaveLength(0)
    expect(mock.outputs.join('')).toBe('1\n2\n3\n4\n5\n')
    expect(mock.results).toHaveLength(1)
  })

  test('evaluateChunk reports a compile error instead of silently discarding it', async () => {
    const mock = new MockConductor()
    const ev = new JavaEvaluator(mock as any)

    await ev.evaluateChunk('this is not valid java')

    expect(mock.errors).toHaveLength(1)
    expect(mock.results).toHaveLength(0)
  })
})
