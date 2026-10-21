import { typeCheck } from '../../../types'
import { createContext } from '../..'
import { UndefinedNativeMethod } from '../../errors'
import { LFSR, libraryClasses } from '../../lib'
import { isNode } from '../../utils'
import { program, run } from '../__utils__/library'

describe('library loading', () => {
  it('defines the library classes before the first step', async () => {
    const { result } = await run(program(`int x = 1;`), 0)
    expect([...result.context.environment.global.frame.keys()]).toEqual([
      'Object',
      'PrintStream',
      'System'
    ])
  })

  it('does not step through the library: step 0 is the user program', async () => {
    const { result } = await run(program(`int x = 1;`), 0)
    expect(result.context.totalSteps).toBe(0)
    const top = result.context.control.peek()
    expect(top && isNode(top) && top.kind).toBe('CompilationUnit')
  })

  it('makes user classes subclasses of the library Object', async () => {
    const { result } = await run(program(`int x = 1;`, 'class Dog {}'))
    const dog = result.context.environment.getClass('Dog')
    expect(dog.superclass?.frame.name).toBe('Object')
  })

  it('library classes type check on their own', () => {
    expect(typeCheck(libraryClasses).hasTypeErrors).toBe(false)
  })

  it('type checks user code against the library', () => {
    const code = program(
      `Dog d = new Dog(); String s = d.toString(); int h = d.hashCode();`,
      'class Dog {}'
    )
    expect(typeCheck(libraryClasses, code).hasTypeErrors).toBe(false)
  })

  it('reports type errors through stderr', async () => {
    const { result, out, err } = await run(program(`int x = "s";`))
    expect(result.status).toBe('error')
    expect(out).toEqual([])
    expect(err).toHaveLength(1)
    expect(err[0]).toMatch(/^TypeCheck: .*incompatible types/s)
  })

  it('reports type errors only through the stderr callback', async () => {
    const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {})
    try {
      await run(program(`int x = "s";`))
      expect(consoleError).not.toHaveBeenCalled()
    } finally {
      consoleError.mockRestore()
    }
  })

  it('resolves to an error when the type checker throws', async () => {
    // the type checker throws 'Not implemented' on records
    const { result } = await run('record P(int x) {}\n' + program(`int y = 1;`))
    expect(result.status).toBe('error')
    expect(result.context.errors).toHaveLength(1)
  })

  it('creates a context without arguments', () => {
    expect(createContext().interfaces.statics.lfsr.next()).toBeGreaterThan(0)
  })

  it('rejects an unregistered native method when its class is declared', async () => {
    const { result } = await run(program(``, 'class Dog { native void bark(); }'))
    expect(result.status).toBe('error')
    expect(result.context.errors[0]).toBeInstanceOf(UndefinedNativeMethod)
  })
})

describe('LFSR', () => {
  it('is deterministic for a seed', () => {
    const a = new LFSR('class Main {}')
    const b = new LFSR('class Main {}')
    expect(Array.from({ length: 10 }, () => a.next())).toEqual(
      Array.from({ length: 10 }, () => b.next())
    )
  })

  it('does not saturate, whatever the seed', () => {
    for (let i = 0; i < 64; i++) {
      const lfsr = new LFSR(`program ${i}`)
      const draws = Array.from({ length: 100 }, () => lfsr.next())
      expect(draws.every(d => d > 0 && d < 2 ** 31)).toBe(true)
      expect(new Set(draws).size).toBe(draws.length)
    }
  })

  it('survives the empty seed', () => {
    const lfsr = new LFSR('')
    expect(lfsr.next()).toBeGreaterThan(0)
  })
})
