import { AutoCompleteEntry, CompletionItemKind } from '@sourceacademy/common-autocomplete'
import { generatedLibInfo } from '../../../compiler/import/generated-lib-info'
import { JAVA_KEYWORDS } from './keywords'

interface CompletionPool {
  classNames: string[]
  methodNames: string[]
  fieldNames: string[]
}

let cachedPool: CompletionPool | null = null

/**
 * Flat, deduplicated name pools built from the compiler's own stdlib allow-list
 * (`generated-lib-info.json`). Not type-resolved - a `.`-suggestion lists every
 * stdlib method/field name that matches the prefix, regardless of which class
 * it actually belongs to or the real type of the expression before the dot.
 * Overloads of the same method name collapse to a single entry.
 */
function buildPool(): CompletionPool {
  if (cachedPool) return cachedPool

  const classNames = new Set<string>()
  const methodNames = new Set<string>()
  const fieldNames = new Set<string>()

  for (const meta of Object.values(generatedLibInfo)) {
    classNames.add(meta.name.slice(meta.name.lastIndexOf('/') + 1))
    for (const method of meta.methods) {
      if (method.name !== '<init>') methodNames.add(method.name)
    }
    for (const field of meta.fields) {
      fieldNames.add(field.name)
    }
  }

  cachedPool = {
    classNames: [...classNames].sort(),
    methodNames: [...methodNames].sort(),
    fieldNames: [...fieldNames].sort()
  }
  return cachedPool
}

/**
 * The identifier prefix ending at (row, column), and whether it's preceded by
 * a `.`. `row` is 1-indexed but `column` is 0-indexed, despite both being
 * documented as 1-indexed in `@sourceacademy/common-autocomplete` - confirmed
 * against py-slang's own working `convertPosToIndex`, which uses `column`
 * directly with no subtraction. Subtracting 1 from `column` here would make
 * every lookup trail the real cursor by one character: the prefix would be
 * truncated (empty after typing just the first character of a word), and
 * longer prefixes would match one character short of what's actually typed.
 */
function currentWordAndContext(
  code: string,
  row: number,
  column: number
): { prefix: string; afterDot: boolean } {
  const lines = code.split('\n')
  const lineIndex = row - 1
  if (lineIndex < 0 || lineIndex >= lines.length) return { prefix: '', afterDot: false }

  const line = lines[lineIndex]
  const col = Math.max(0, Math.min(column, line.length))

  let start = col
  while (start > 0 && /[A-Za-z0-9_]/.test(line[start - 1])) start--
  const prefix = line.slice(start, col)

  let before = start - 1
  while (before >= 0 && /\s/.test(line[before])) before--
  const afterDot = before >= 0 && line[before] === '.'

  return { prefix, afterDot }
}

function matchEntries(prefix: string, candidates: string[], meta: CompletionItemKind): AutoCompleteEntry[] {
  const entries: AutoCompleteEntry[] = []
  for (const name of candidates) {
    if (name.startsWith(prefix)) entries.push({ name, meta })
  }
  return entries
}

/**
 * Java autocomplete suggestions for the given code and cursor position
 * (`row` 1-indexed, `column` 0-indexed - see `currentWordAndContext`).
 * Deliberately simple: Java keywords and stdlib class/method/field names
 * filtered by the identifier prefix at the cursor, not real AST-based scope
 * resolution (no local variables/user-defined symbols) - see the autocomplete
 * plan for the reasoning and how this could be upgraded later.
 */
export function computeCompletions(code: string, row: number, column: number): AutoCompleteEntry[] {
  const { prefix, afterDot } = currentWordAndContext(code, row, column)
  if (prefix.length === 0) return []

  const pool = buildPool()

  if (afterDot) {
    return [
      ...matchEntries(prefix, pool.methodNames, CompletionItemKind.Method),
      ...matchEntries(prefix, pool.fieldNames, CompletionItemKind.Field)
    ]
  }

  return [
    ...matchEntries(prefix, JAVA_KEYWORDS, CompletionItemKind.Keyword),
    ...matchEntries(prefix, pool.classNames, CompletionItemKind.Class)
  ]
}
