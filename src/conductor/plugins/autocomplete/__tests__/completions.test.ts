import { CompletionItemKind } from '@sourceacademy/common-autocomplete'
import { computeCompletions } from '../completions'

const names = (entries: ReturnType<typeof computeCompletions>) => entries.map(e => e.name)

describe('computeCompletions', () => {
  test('matches a keyword by prefix in bare-identifier position', () => {
    const entries = computeCompletions('whil', 1, 5)

    const whileEntry = entries.find(e => e.name === 'while')
    expect(whileEntry).toBeDefined()
    expect(whileEntry?.meta).toBe(CompletionItemKind.Keyword)
  })

  test('matches a stdlib class name by prefix in bare-identifier position', () => {
    const entries = computeCompletions('Arra', 1, 5)

    const arraysEntry = entries.find(e => e.name === 'Arrays')
    expect(arraysEntry).toBeDefined()
    expect(arraysEntry?.meta).toBe(CompletionItemKind.Class)
  })

  test('suggests only member names after a dot, not keywords or class names', () => {
    const code = 'System.out.prin'
    const entries = computeCompletions(code, 1, code.length + 1)

    expect(names(entries)).toContain('println')
    expect(names(entries)).not.toContain('Arrays')
    expect(names(entries)).not.toContain('while')
  })

  test('returns no suggestions for an empty prefix', () => {
    expect(computeCompletions('   ', 1, 4)).toEqual([])
    expect(computeCompletions('', 1, 1)).toEqual([])
  })

  test('returns no suggestions past the end of the code', () => {
    expect(computeCompletions('int x', 5, 1)).toEqual([])
  })
})
