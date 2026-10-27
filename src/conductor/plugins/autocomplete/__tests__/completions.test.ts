import { CompletionItemKind } from '@sourceacademy/common-autocomplete'
import { computeCompletions } from '../completions'

const names = (entries: ReturnType<typeof computeCompletions>) => entries.map(e => e.name)

// Protocol-accurate cursor positions: row is 1-indexed, column is 0-indexed
// (confirmed against py-slang's working resolver, despite the package's own
// type docstrings claiming column is also 1-indexed). A cursor placed right
// after N typed characters on the first line is therefore (row=1, column=N).

describe('computeCompletions', () => {
  test('matches a keyword by prefix in bare-identifier position', () => {
    const entries = computeCompletions('whil', 1, 4)

    const whileEntry = entries.find(e => e.name === 'while')
    expect(whileEntry).toBeDefined()
    expect(whileEntry?.meta).toBe(CompletionItemKind.Keyword)
  })

  test('matches a keyword after typing only its first character', () => {
    // Regression guard: treating column as 1-indexed (subtracting 1) made the
    // prefix empty here, since the single typed character would be excluded.
    const entries = computeCompletions('w', 1, 1)

    expect(names(entries)).toContain('while')
  })

  test('matches a stdlib class name by prefix in bare-identifier position', () => {
    const entries = computeCompletions('Arra', 1, 4)

    const arraysEntry = entries.find(e => e.name === 'Arrays')
    expect(arraysEntry).toBeDefined()
    expect(arraysEntry?.meta).toBe(CompletionItemKind.Class)
  })

  test('suggests only member names after a dot, not keywords or class names', () => {
    const code = 'System.out.prin'
    const entries = computeCompletions(code, 1, code.length)

    expect(names(entries)).toContain('println')
    expect(names(entries)).not.toContain('Arrays')
    expect(names(entries)).not.toContain('while')
  })

  test('returns no suggestions for an empty prefix', () => {
    expect(computeCompletions('   ', 1, 3)).toEqual([])
    expect(computeCompletions('', 1, 0)).toEqual([])
  })

  test('returns no suggestions past the end of the code', () => {
    expect(computeCompletions('int x', 5, 0)).toEqual([])
  })
})
