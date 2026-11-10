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

  test('runs overrides with covariant return types through their superclasses', async () => {
    const mock = new MockConductor()
    const ev = new JavaEvaluator(mock as any)
    const originalBuffer = (globalThis as any).Buffer
    delete (globalThis as any).Buffer
    try {
      await ev.evaluateChunk(`
        class X { String who() { return "X"; } }
        class Y extends X { String who() { return "Y"; } }
        class A { X make(long n) { return new X(); } }
        class B extends A { Y make(long n) { return new Y(); } }
        public class Main {
          public static void main(String[] args) {
            A a = new B();
            X viaBase = a.make(1L);
            B b = new B();
            Y viaSub = b.make(2L);
            System.out.println(viaBase.who());
            System.out.println(viaSub.who());
          }
        }
      `)
    } finally {
      ;(globalThis as any).Buffer = originalBuffer
    }
    expect(mock.errors).toHaveLength(0)
    expect(mock.outputs).toEqual(['Y', 'Y'])
  })

  test('widens and casts array types', async () => {
    const mock = new MockConductor()
    const ev = new JavaEvaluator(mock as any)
    const originalBuffer = (globalThis as any).Buffer
    delete (globalThis as any).Buffer
    try {
      await ev.evaluateChunk(`
        import java.io.Serializable;
        class Animal { }
        class Dog extends Animal { }
        class Cat extends Animal { }
        public class Main {
          static int count(Object[] items) { return items.length; }
          static String attempt(Object o) {
            try {
              Cat[] cats = (Cat[]) o;
              return "cats";
            } catch (ClassCastException e) {
              return "not cats";
            }
          }
          public static void main(String[] args) {
            Dog[] dogs = {new Dog(), new Dog()};
            int[] ints = {1, 2, 3};
            Animal[] animals = dogs;
            Object[] objects = dogs;
            Object asObject = ints;
            Serializable serializable = ints;
            Cloneable cloneable = dogs;
            Dog[] back = (Dog[]) animals;
            int[] backInts = (int[]) serializable;
            Object plain = (Object) dogs;
            System.out.println(count(dogs));
            System.out.println(animals.length + objects.length);
            System.out.println(back.length + backInts.length);
            System.out.println(attempt(plain));
            System.out.println(attempt(asObject));
          }
        }
      `)
    } finally {
      ;(globalThis as any).Buffer = originalBuffer
    }
    expect(mock.errors).toHaveLength(0)
    expect(mock.outputs).toEqual(['2', '4', '5', 'not cats', 'not cats'])
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
    expect(mock.outputs).toEqual(['1', '2', '3', '4', '5'])
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
      'ERR: Exception in thread "main" java.lang.ArithmeticException: / by zero'
    ])
  })

  test('evaluateChunk reports a compile error instead of silently discarding it', async () => {
    const mock = new MockConductor()
    const ev = new JavaEvaluator(mock as any)

    await ev.evaluateChunk('this is not valid java')

    expect(mock.errors).toHaveLength(1)
    expect(mock.results).toHaveLength(0)
  })

  describe('program output', () => {
    const run = async (body: string): Promise<string[]> => {
      const mock = new MockConductor()
      const ev = new JavaEvaluator(mock as any)
      const originalBuffer = (globalThis as any).Buffer
      delete (globalThis as any).Buffer
      try {
        await ev.evaluateChunk(`
          public class Main {
            public static void main(String[] args) {
              ${body}
            }
          }
        `)
      } finally {
        ;(globalThis as any).Buffer = originalBuffer
      }
      expect(mock.errors).toHaveLength(0)
      return mock.outputs
    }

    test('sends each println as one message, with no separate newline message', async () => {
      expect(await run('System.out.println("a"); System.out.println(42);')).toEqual(['a', '42'])
    })

    test('joins print calls into the line that the next println ends', async () => {
      expect(
        await run(
          'System.out.print("b"); System.out.print("c"); System.out.println(); System.out.println("d");'
        )
      ).toEqual(['bc', 'd'])
    })

    test('keeps an intentional blank line', async () => {
      expect(
        await run('System.out.println("a"); System.out.println(); System.out.println("b");')
      ).toEqual(['a', '', 'b'])
    })

    test('splits a string containing newlines into lines', async () => {
      expect(await run('System.out.println("a\\nb");')).toEqual(['a', 'b'])
    })

    test('still sends output that is not terminated by a newline', async () => {
      expect(await run('System.out.println("a"); System.out.print("tail");')).toEqual(['a', 'tail'])
    })

    test('sends no output for a program that prints nothing', async () => {
      expect(await run('int i = 1;')).toEqual([])
    })

    test('compiles hexadecimal, octal and binary literals, underscores in numbers and in names', async () => {
      expect(
        await run(`
              int max_value = 0x7FFF;
              int flags = 0b1010_1010;
              long big_mask = 0xFFFF_FFFFL;
              int permissions = 0755;
              double side_length = Math.sqrt(1_024.0);
              int true_count = 3;
              System.out.println(max_value);
              System.out.println(flags & 0xF0);
              System.out.println(big_mask);
              System.out.println(permissions);
              System.out.println(side_length);
              System.out.println(Math.pow(2, 0x10));
              System.out.println(Math.hypot(3, 4) + true_count);
              System.out.println(0xFFFFFFFF);
            `)
      ).toEqual(['32767', '160', '4294967295', '493', '32.0', '65536.0', '8.0', '-1'])
    })

    test('calls methods through library interface types', async () => {
      expect(
        await run(`
              Object o = "hello";
              CharSequence c = (CharSequence) o;
              System.out.println(c.length());
              System.out.println(c.charAt(1));
              System.out.println(c.subSequence(1, 3));
              Comparable m = (Comparable) o;
              System.out.println(m.compareTo("hellp"));
              Integer i = 5;
              Comparable n = i;
              System.out.println(n.compareTo(3));
            `)
      ).toEqual(['5', 'e', 'el', '-1', '1'])
    })

    test('computes Math and StrictMath functions exactly as JDK 8 does', async () => {
      // expected values were printed by a real JDK 8 (the bundled JDK classes are JDK 8's)
      expect(
        await run(`
              System.out.println(Math.sqrt(2.0));
              System.out.println(Math.sqrt(-1.0));
              System.out.println(Math.cbrt(27.0));
              System.out.println(Math.pow(2.0, 10.0));
              System.out.println(Math.pow(0.0, 0.0));
              System.out.println(Math.pow(-8.0, 3.0));
              System.out.println(Math.log(10.0));
              System.out.println(Math.log10(1000.0));
              System.out.println(Math.sin(1.0));
              System.out.println(Math.cos(1.0));
              System.out.println(Math.tan(1.0));
              System.out.println(Math.asin(0.5));
              System.out.println(Math.acos(0.5));
              System.out.println(Math.atan(1.0));
              System.out.println(Math.atan2(1.0, 2.0));
              System.out.println(Math.sinh(1.0));
              System.out.println(Math.hypot(3.0, 4.0));
              System.out.println(Math.expm1(1.0));
              System.out.println(Math.log1p(1.0));
              System.out.println(Math.IEEEremainder(10.0, 3.0));
              System.out.println(Math.abs(-2.5));
              System.out.println(Math.max(1.5, 2.5));
              System.out.println(Math.min(1, 2));
              System.out.println(Math.floor(2.7));
              System.out.println(Math.ceil(2.1));
              System.out.println(Math.round(2.5));
              System.out.println(Math.rint(2.5));
              System.out.println(Math.signum(-3.0));
              System.out.println(Math.toRadians(180.0));
              System.out.println(Math.toDegrees(3.14159));
              System.out.println(Math.floorDiv(-7, 2));
              System.out.println(Math.floorMod(-7, 2));
              System.out.println(Math.ulp(1.0));
              System.out.println(StrictMath.exp(1.0));
              System.out.println(StrictMath.pow(8.90146915459615, 10.0));
              System.out.println(StrictMath.cbrt(-5.289524187047496));
              System.out.println(StrictMath.cosh(1.0));
              System.out.println(StrictMath.tanh(1.504982710822767e-13));
              System.out.println(StrictMath.hypot(-1.0, 7.5));
              System.out.println(StrictMath.atan2(1e300, -1.0));
              System.out.println(Math.tanh(0.5));
              System.out.println(Math.cosh(2.0));
            `)
      ).toEqual([
        '1.4142135623730951',
        'NaN',
        '3.0',
        '1024.0',
        '1.0',
        '-512.0',
        '2.302585092994046',
        '3.0',
        '0.8414709848078965',
        '0.5403023058681398',
        '1.5574077246549023',
        '0.5235987755982989',
        '1.0471975511965979',
        '0.7853981633974483',
        '0.4636476090008061',
        '1.1752011936438014',
        '5.0',
        '1.718281828459045',
        '0.6931471805599453',
        '1.0',
        '2.5',
        '2.5',
        '1',
        '2.0',
        '3.0',
        '3',
        '2.0',
        '-1.0',
        '3.141592653589793',
        '179.99984796050427',
        '-4',
        '1',
        '2.220446049250313E-16',
        '2.7182818284590455',
        '3.1233230954451427E9',
        '-1.7423639190433036',
        '1.543080634815244',
        '1.5049827108227673E-13',
        '7.566372975210778',
        '1.5707963267948968',
        '0.46211715726000974',
        '3.7621956910836314'
      ])
    })

    test('prints floats and doubles', async () => {
      expect(
        await run(`
              System.out.println(1.5f);
              System.out.println(2.5);
              System.out.println(0.1);
              System.out.println(0.1f);
              System.out.println(100.0);
              System.out.println(1.0f / 3);
              System.out.println(1.0 / 3);
              System.out.println(3.14159);
              System.out.println(2.71828f);
              System.out.println(-7.25);
              System.out.println(1.0);
              System.out.println(10.0f);
            `)
      ).toEqual([
        '1.5',
        '2.5',
        '0.1',
        '0.1',
        '100.0',
        '0.33333334',
        '0.3333333333333333',
        '3.14159',
        '2.71828',
        '-7.25',
        '1.0',
        '10.0'
      ])
    })

    test('prints floats and doubles across the whole range, including -0.0 and 0.0', async () => {
      expect(
        await run(`
              System.out.println(1e10);
              System.out.println(1.0E-5);
              System.out.println(123456789.123);
              System.out.println(1e7f);
              System.out.println(3.4028235e38f);
              System.out.println(1.4e-45f);
              System.out.println(1.7976931348623157e308);
              System.out.println(4.9e-324);
              System.out.println(-0.0);
              System.out.println(0.0);
              System.out.println(9999999.0);
              System.out.println(10000000.0);
              System.out.println(0.001);
              System.out.println(0.0001);
            `)
      ).toEqual([
        '1.0E10',
        '1.0E-5',
        '1.23456789123E8',
        '1.0E7',
        '3.4028235E38',
        '1.4E-45',
        '1.7976931348623157E308',
        '4.9E-324',
        '-0.0',
        '0.0',
        '9999999.0',
        '1.0E7',
        '0.001',
        '1.0E-4'
      ])
    })

    test('prints infinities and NaN', async () => {
      expect(
        await run(`
              double z = 0.0;
              System.out.println(1 / z);
              System.out.println(-1 / z);
              System.out.println(z / z);
              float fz = 0f;
              System.out.println(1 / fz);
              System.out.println(fz / fz);
            `)
      ).toEqual(['Infinity', '-Infinity', 'NaN', 'Infinity', 'NaN'])
    })

    test('concatenates every primitive type into a string', async () => {
      expect(
        await run(`
              float f = 2.5f;
              double d = 7.25;
              long l = 9L;
              System.out.println("f=" + f + " d=" + d + " l=" + l + " b=" + true + " c=" + (char) 66 + " i=" + 3 + " s=" + (short) 4 + " y=" + (byte) 5);
            `)
      ).toEqual(['f=2.5 d=7.25 l=9 b=true c=B i=3 s=4 y=5'])
    })

    test('print (without a newline) of every primitive type', async () => {
      expect(
        await run(`
              System.out.print(1.5f);
              System.out.print(" ");
              System.out.print(2.5);
              System.out.print(" ");
              System.out.print(7L);
              System.out.print(" ");
              System.out.print(true);
              System.out.print(" ");
              System.out.print((char) 90);
              System.out.print(" ");
              System.out.print(8);
              System.out.println();
            `)
      ).toEqual(['1.5 2.5 7 true Z 8'])
    })

    test('String.valueOf of every primitive type', async () => {
      expect(
        await run(`
              System.out.println(String.valueOf(1.5) + String.valueOf(2.5f) + String.valueOf(7L) + String.valueOf(true) + String.valueOf((char) 67) + String.valueOf(9));
            `)
      ).toEqual(['1.52.57trueC9'])
    })

    test('prints the result of floating point arithmetic and conversions', async () => {
      expect(
        await run(`
              double a = 0.1;
              double b = 0.2;
              System.out.println(a + b);
              float x = 0.1f;
              float y = 0.2f;
              System.out.println(x + y);
              System.out.println(a * 3);
              System.out.println((float) a);
              System.out.println((double) x);
              System.out.println(10 / 4.0);
              System.out.println(7 / 2.0f);
              System.out.println(1.1 * 1.1);
              System.out.println(100 * 1.1);
            `)
      ).toEqual([
        '0.30000000000000004',
        '0.3',
        '0.30000000000000004',
        '0.1',
        '0.10000000149011612',
        '2.5',
        '3.5',
        '1.2100000000000002',
        '110.00000000000001'
      ])
    })

    test('prints cast results', async () => {
      expect(
        await run(`
              double d = 5.9;
              System.out.println((int) d);
              System.out.println((long) -5.9);
              System.out.println((double) 5);
              System.out.println((float) 1 / 3);
              float f = 16777217;
              System.out.println(f);
              System.out.println((float) 0.1);
              System.out.println((double) 1.1f);
            `)
      ).toEqual(['5', '-5', '5.0', '0.33333334', '1.6777216E7', '0.1', '1.100000023841858'])
    })

    test('parses and formats floating point strings', async () => {
      expect(
        await run(`
              System.out.println(Double.parseDouble("3.75"));
              System.out.println(Float.parseFloat("2.5"));
              System.out.println(Double.valueOf("1e3"));
              System.out.println(Double.toString(2.0));
              System.out.println(Float.toString(8.5f));
              System.out.println(Double.parseDouble("0.1"));
              System.out.println(Float.parseFloat("0.1"));
            `)
      ).toEqual(['3.75', '2.5', '1000.0', '2.0', '8.5', '0.1', '0.1'])
    })

    test('prints boxed values', async () => {
      expect(
        await run(`
              Double d = 3.5;
              Float f = 1.25f;
              System.out.println(d);
              System.out.println(f);
              Object o = 2.75;
              System.out.println(o);
              System.out.println(d + f);
              Long l = 7L;
              Integer i = 8;
              Character c = (char) 67;
              Boolean b = true;
              System.out.println(l);
              System.out.println(i);
              System.out.println(c);
              System.out.println(b);
            `)
      ).toEqual(['3.5', '1.25', '2.75', '4.75', '7', '8', 'C', 'true'])
    })

    test('prints integral, boolean and char values', async () => {
      expect(
        await run(`
              System.out.println(5);
              System.out.println(5000000000L);
              System.out.println((byte) 3);
              System.out.println((short) 4);
              System.out.println(true);
              System.out.println((char) 120);
              System.out.println(2147483647);
              System.out.println(-9223372036854775807L - 1L);
              System.out.println(-2147483647 - 1);
            `)
      ).toEqual([
        '5',
        '5000000000',
        '3',
        '4',
        'true',
        'x',
        '2147483647',
        '-9223372036854775808',
        '-2147483648'
      ])
    })

    test('prints values accumulated in loops', async () => {
      expect(
        await run(`
              double sum = 0;
              for (int i = 0;
              i < 10;
              i++) {
              sum += 0.1;
              }
              System.out.println(sum);
              float fs = 0;
              for (int i = 0;
              i < 10;
              i++) {
              fs += 0.1f;
              }
              System.out.println(fs);
              double t = 1;
              for (int i = 0;
              i < 5;
              i++) {
              t = t / 3;
              System.out.println(t);
              }
            `)
      ).toEqual([
        '0.9999999999999999',
        '1.0000001',
        '0.3333333333333333',
        '0.1111111111111111',
        '0.037037037037037035',
        '0.012345679012345678',
        '0.004115226337448559'
      ])
    })
  })
})
