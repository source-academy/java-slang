import { StructType } from '../../types'
import { expectStableAcrossSteps, program, run } from '../__utils__/library'

const HEX_LABEL = /^([\w.]+)@([0-9a-f]+)$/

describe('Object.hashCode', () => {
  it('is stable across calls on the same object', async () => {
    const { result, out } = await run(
      program(
        `Dog d = new Dog();
         int a = d.hashCode(); int b = d.hashCode();
         System.out.println(a); System.out.println(b);`,
        'class Dog {}'
      )
    )
    expect(result.status).toBe('finished')
    expect(out[1]).toBe(out[0])
  })

  it('is distinct and non-negative across many objects', async () => {
    const n = 40
    const body = Array.from(
      { length: n },
      (_, i) => `Dog d${i} = new Dog(); int h${i} = d${i}.hashCode(); System.out.println(h${i});`
    ).join('\n')
    const { result, out } = await run(program(body, 'class Dog {}'))
    expect(result.status).toBe('finished')
    expect(out).toHaveLength(n)
    expect(out.every(h => Number(h) > 0)).toBe(true)
    expect(new Set(out).size).toBe(n)
  })

  it('is inherited by subclasses and works on Object itself', async () => {
    const { result, out } = await run(
      program(
        `Dog d = new Dog(); int a = d.hashCode(); System.out.println(a);
         Object o = new Object(); int b = o.hashCode(); System.out.println(b);`,
        'class Animal {} class Dog extends Animal {}'
      )
    )
    expect(result.status).toBe('finished')
    expect(out).toHaveLength(2)
    expect(out[0]).not.toBe(out[1])
  })

  it('gives the same values when the same program is run again', async () => {
    const code = program(
      `Dog d = new Dog(); Dog e = new Dog();
       int a = d.hashCode(); int b = e.hashCode();
       System.out.println(a); System.out.println(b);`,
      'class Dog {}'
    )
    expect((await run(code)).out).toEqual((await run(code)).out)
  })

  it('is deterministic across re-runs to any step', async () => {
    const full = await expectStableAcrossSteps(
      program(
        `Dog d = new Dog(); Dog e = new Dog();
         int h = d.hashCode(); System.out.println(h);
         String s = e.toString(); System.out.println(s);
         int k = d.hashCode(); System.out.println(k);`,
        'class Dog {}'
      )
    )
    expect(full.out).toHaveLength(3)
    expect(full.out[2]).toBe(full.out[0])
  })

  it('can be overridden', async () => {
    const { out } = await run(
      program(
        `Dog d = new Dog(); int h = d.hashCode(); System.out.println(h);`,
        'class Dog { public int hashCode() { return 255; } }'
      )
    )
    expect(out).toEqual(['255'])
  })
})

describe('Object.toString', () => {
  it('is ClassName@hex, with the hex of hashCode', async () => {
    const { result, out } = await run(
      program(
        `Dog d = new Dog();
         int h = d.hashCode(); String s = d.toString();
         System.out.println(h); System.out.println(s);`,
        'class Dog {}'
      )
    )
    expect(result.status).toBe('finished')
    const [, className, hex] = out[1].match(HEX_LABEL)!
    expect(className).toBe('Dog')
    expect(parseInt(hex, 16)).toBe(Number(out[0]))
  })

  it('is stable for one object and distinct between objects', async () => {
    const { out } = await run(
      program(
        `Dog d = new Dog(); Dog e = new Dog();
         String a = d.toString(); String b = e.toString(); String c = d.toString();
         System.out.println(a); System.out.println(b); System.out.println(c);`,
        'class Dog {}'
      )
    )
    expect(out[0]).toMatch(HEX_LABEL)
    expect(out[1]).toMatch(HEX_LABEL)
    expect(out[0]).not.toBe(out[1])
    expect(out[2]).toBe(out[0])
  })

  it('names the runtime class by its binary name, not the declared type', async () => {
    const { out } = await run(
      program(
        `Animal a = new Dog(); String s = a.toString(); System.out.println(s);
         Object o = new Dog(); String t = o.toString(); System.out.println(t);
         Object p = new Object(); String u = p.toString(); System.out.println(u);`,
        'class Animal {} class Dog extends Animal {}'
      )
    )
    expect(out.map(s => s.match(HEX_LABEL)![1])).toEqual(['Dog', 'Dog', 'java.lang.Object'])
  })

  it('can be overridden', async () => {
    const { out } = await run(
      program(
        `Dog d = new Dog(); String s = d.toString(); System.out.println(s);`,
        'class Dog { public String toString() { return "a dog"; } }'
      )
    )
    expect(out).toEqual(['a dog'])
  })

  it('returns a string literal with its quotes, like any other string value', async () => {
    // the visualizer renders literalType.value verbatim
    const code = program(`Dog d = new Dog(); String s = d.toString();`, 'class Dog {}')
    const { result } = await run(code)
    let found: string | undefined
    for (let step = 0; step <= result.context.totalSteps && !found; step++) {
      const top = (await run(code, step)).result.context.stash.peek()
      if (top?.kind === 'Literal' && top.literalType.value.includes('Dog@')) {
        found = top.literalType.value
      }
    }
    expect(found).toMatch(/^"Dog@[0-9a-f]+"$/)
  })

  it('is backed by the memoised hash on the object', async () => {
    const { result } = await run(
      program(`Dog d = new Dog(); String s = d.toString();`, 'class Dog {}')
    )
    const dogs = result.context.environment.objects.filter(
      o => o.kind === StructType.OBJECT && o.class.classDecl.typeIdentifier === 'Dog'
    )
    expect(dogs).toHaveLength(1)
    expect(dogs[0].hashCode).toBeGreaterThan(0)
  })

  // Java's Object.toString calls the (overridable) hashCode(); the native reads the hash directly.
  it.todo('uses an overridden hashCode')
})
