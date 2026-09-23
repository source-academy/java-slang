import { Frame } from '../environment'
import { ClassType } from '../../types/classes'
import { Type } from '../../types/type'

const LOCATION = { startLine: -1, startOffset: -1 } as any

const frame = Frame.globalFrame()

const getClassType = (name: string): ClassType => {
  const type = frame.getType(name, LOCATION)
  expect(type).toBeInstanceOf(ClassType)
  return type as ClassType
}

/** Simple-name chain from `name` up to (and including) its last known ancestor. */
const ancestry = (name: string): string[] => {
  const chain: string[] = []
  let current: Type = getClassType(name)
  while (current instanceof ClassType) {
    chain.push(current.name)
    const parent = current.getParentClass()
    if (!(parent instanceof ClassType) || parent.name === current.name) break
    current = parent
  }
  return chain
}

describe('standard-library inheritance derived from class-file metadata', () => {
  it('preserves the core throwable chain', () => {
    expect(ancestry('NullPointerException')).toEqual([
      'NullPointerException',
      'RuntimeException',
      'Exception',
      'Throwable',
      'Object'
    ])
    expect(ancestry('Error')).toEqual(['Error', 'Throwable', 'Object'])
  })

  it('uses the real JDK parent where the old hard-coded table was imprecise', () => {
    expect(getClassType('NumberFormatException').getParentClass()).toBe(
      getClassType('IllegalArgumentException')
    )
    expect(getClassType('ArrayIndexOutOfBoundsException').getParentClass()).toBe(
      getClassType('IndexOutOfBoundsException')
    )
    expect(getClassType('IllegalThreadStateException').getParentClass()).toBe(
      getClassType('IllegalArgumentException')
    )
  })

  it('keeps subtypes assignable to every ancestor (catch compatibility)', () => {
    const nfe = getClassType('NumberFormatException')
    expect(getClassType('IllegalArgumentException').canBeAssigned(nfe)).toBe(true)
    expect(getClassType('RuntimeException').canBeAssigned(nfe)).toBe(true)
    expect(getClassType('Exception').canBeAssigned(nfe)).toBe(true)
    expect(getClassType('Throwable').canBeAssigned(nfe)).toBe(true)

    const aioobe = getClassType('ArrayIndexOutOfBoundsException')
    expect(getClassType('IndexOutOfBoundsException').canBeAssigned(aioobe)).toBe(true)
    expect(getClassType('RuntimeException').canBeAssigned(aioobe)).toBe(true)
  })

  it('does not relate unrelated exception types', () => {
    expect(
      getClassType('NumberFormatException').canBeAssigned(getClassType('IllegalStateException'))
    ).toBe(false)
  })
})
