import { jest } from '@jest/globals'
import { WEB_PLUGIN_ID } from '@sourceacademy/common-autocomplete'
import JavaEvaluator from '../JavaEvaluator'
import AutoCompletePlugin from '../plugins/autocomplete'

class MockConductor {
  outputs: string[] = []
  results: (string | undefined)[] = []
  errors: string[] = []
  registerPlugin = jest.fn()
  hostLoadPlugin = jest.fn()
  sendOutput(message: string): void {
    this.outputs.push(message)
  }
  sendResult(result: string | undefined): void {
    this.results.push(result)
  }
  sendError(error: Error): void {
    this.errors.push(error.message)
  }
}

describe('JavaEvaluator', () => {
  test('registers the autocomplete plugin and tells the host to load it', () => {
    const mock = new MockConductor()
    new JavaEvaluator(mock as any)

    expect(mock.registerPlugin).toHaveBeenCalledWith(AutoCompletePlugin)
    expect(mock.hostLoadPlugin).toHaveBeenCalledWith(WEB_PLUGIN_ID)
  })

  test('evaluateFile with a non-.class filename runs the source as the program entry point', async () => {
    const mock = new MockConductor()
    const ev = new JavaEvaluator(mock as any)

    // Conductor's BasicEvaluator.startEvaluator calls evaluateFile exactly
    // once per run, with the host's own name for the program being run (e.g.
    // "program.txt" here, deliberately not ending in .class) and the
    // program's Java source as fileContent - this is the real shape of every
    // live "Run" click, not a precompiled classfile upload. It must be
    // treated like a chunk, not rejected.
    const originalBuffer = (globalThis as any).Buffer
    delete (globalThis as any).Buffer
    let result: void
    try {
      result = await ev.evaluateFile(
        'program.txt',
        `
        public class Main {
          public static void main(String[] args) {
            System.out.println("hello from evaluateFile");
          }
        }
      `
      )
    } finally {
      ;(globalThis as any).Buffer = originalBuffer
    }

    expect(mock.errors).toHaveLength(0)
    expect(mock.outputs.join('')).toContain('hello from evaluateFile')
    // The result is returned, not sent directly - BasicEvaluator.startEvaluator
    // sends it itself (see the "does not report a spurious result" test below).
    // `undefined`, not '' - a void main() has nothing to report, and the host
    // only suppresses display for undefined (see that same test).
    expect(result).toBeUndefined()
    expect(mock.results).toHaveLength(0)
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
    let result: void
    try {
      result = await ev.evaluateChunk(`
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
    expect(result).toBeUndefined()
    expect(mock.results).toHaveLength(0)
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
    let result: void
    try {
      result = await ev.evaluateChunk(`
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
    expect(result).toBeUndefined()
    expect(mock.results).toHaveLength(0)
  })

  test('does not report a spurious result for a successful run with nothing to show', async () => {
    // Mirrors the real end-to-end pipeline, not just our own method call:
    //  - BasicEvaluator.startEvaluator (@sourceacademy/conductor) always does
    //    `sendResult(await evaluateChunk(...))` itself for every run - calling
    //    sendResult internally too (the first regression this guarded
    //    against) would double-report.
    //  - The frontend's own display gate (WorkspaceSaga/helpers/evalCode.ts,
    //    handleResults) only suppresses display when the result is exactly
    //    `undefined` - `if (result !== undefined) dispatch(...)`. A Java
    //    `void main()` has no value, so returning '' instead of undefined (the
    //    second regression) made every successful run show a spurious `""`.
    // Together: a successful run must both return undefined AND, once passed
    // through the host's real gate, add nothing to what's displayed.
    const mock = new MockConductor()
    const ev = new JavaEvaluator(mock as any)

    const originalBuffer = (globalThis as any).Buffer
    delete (globalThis as any).Buffer
    let result: void
    try {
      result = await ev.evaluateChunk(`
        public class Main {
          public static void main(String[] args) {
            System.out.println("hello from conductor");
          }
        }
      `)
    } finally {
      ;(globalThis as any).Buffer = originalBuffer
    }
    if (result !== undefined) mock.sendResult(result)

    expect(result).toBeUndefined()
    expect(mock.results).toHaveLength(0)
  })

  test('reports an uncaught exception once, naming the main thread and the exception', async () => {
    const mock = new MockConductor()
    const ev = new JavaEvaluator(mock as any)

    await ev.evaluateChunk(`
      public class Main {
        public static void main(String[] args) {
          int i = 1 / 0;
        }
      }
    `)

    expect(mock.errors).toHaveLength(0)
    expect(mock.outputs).toEqual([
      'ERR: Exception in thread "main" java.lang.ArithmeticException: / by zero\n'
    ])
  })

  test('evaluateChunk reports a compile error instead of silently discarding it', async () => {
    const mock = new MockConductor()
    const ev = new JavaEvaluator(mock as any)

    await ev.evaluateChunk('this is not valid java')

    expect(mock.errors).toHaveLength(1)
    expect(mock.results).toHaveLength(0)
  })
})
