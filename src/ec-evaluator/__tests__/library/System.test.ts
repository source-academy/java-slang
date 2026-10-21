import { runECEvaluator } from '../..'
import { NullPointerException } from '../../errors'
import { expectStableAcrossSteps, program, run } from '../__utils__/library'

describe('System.out.println', () => {
  it('prints a string literal without its quotes', async () => {
    const { result, out, err } = await run(program(`System.out.println("hello");`))
    expect(result.status).toBe('finished')
    expect(out).toEqual(['hello'])
    expect(err).toEqual([])
  })

  it('decodes escape sequences', async () => {
    const { out } = await run(program(`System.out.println("a\\tb\\"c\\\\d\\ne");`))
    expect(out).toEqual(['a\tb"c\\d\ne'])
  })

  it('decodes octal escape sequences', async () => {
    const { out } = await run(program(`System.out.println("\\141|\\60|\\0x|\\377|\\400");`))
    expect(out).toEqual(['a|0|\0x|\xff|\x200'])
  })

  it('prints the empty string', async () => {
    const { out } = await run(program(`System.out.println("");`))
    expect(out).toEqual([''])
  })

  it('prints a String variable', async () => {
    const { out } = await run(program(`String s = "x"; System.out.println(s);`))
    expect(out).toEqual(['x'])
  })

  it('prints an int literal and an int variable', async () => {
    const { out } = await run(program(`System.out.println(7); int x = 42; System.out.println(x);`))
    expect(out).toEqual(['7', '42'])
  })

  it('prints the result of toString', async () => {
    const { out } = await run(
      program(`Dog d = new Dog(); String s = d.toString(); System.out.println(s);`, 'class Dog {}')
    )
    expect(out[0]).toMatch(/^Dog@[0-9a-f]+$/)
  })

  it('prints in program order', async () => {
    const { out } = await run(
      program(`System.out.println("a"); System.out.println("b"); System.out.println("c");`)
    )
    expect(out).toEqual(['a', 'b', 'c'])
  })

  it('works through a PrintStream variable', async () => {
    const { out } = await run(program(`PrintStream p = System.out; p.println("via p");`))
    expect(out).toEqual(['via p'])
  })

  it('throws NullPointerException through a null PrintStream', async () => {
    const { result, out } = await run(program(`PrintStream p = null; p.println("x");`))
    expect(result.status).toBe('error')
    expect(result.context.errors[0]).toBeInstanceOf(NullPointerException)
    expect(out).toEqual([])
  })

  it('prints only what a partial run reaches', async () => {
    const full = await expectStableAcrossSteps(
      program(`System.out.println("a"); int x = 1; System.out.println("b");`)
    )
    expect(full.out).toEqual(['a', 'b'])
  })

  it('defaults to console.log without io callbacks', async () => {
    const log = jest.spyOn(console, 'log').mockImplementation(() => {})
    try {
      const result = await runECEvaluator(program(`System.out.println("hi");`))
      expect(result.status).toBe('finished')
      expect(log).toHaveBeenCalledWith('hi')
    } finally {
      log.mockRestore()
    }
  })

  // RES_TYPE (overload resolution) types only literals of int/String, names and classes.
  it.todo('prints a method call result directly, e.g. println(d.toString())')
  it.todo('prints a string concatenation, e.g. println("a" + 1)')
  it.todo('prints boolean and char values')
})

describe('System.out', () => {
  it('is a PrintStream object that exists before the program starts', async () => {
    const { result } = await run(program(`int x = 1;`), 0)
    const objects = result.context.environment.objects
    expect(objects.map(o => o.class.classDecl.typeIdentifier)).toEqual(['PrintStream'])
  })
})
