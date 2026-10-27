import javaMode from '../mode'

describe('javaMode', () => {
  test('returns well-shaped SyntaxHighlightData', () => {
    const mode = javaMode()

    expect(mode.id).toBe('ace/mode/java')
    expect(mode.lineCommentStart).toBe('//')
    expect(mode.highlightRules.start).toBeDefined()
    expect(mode.highlightRules.statements).toBeDefined()
    expect(mode.foldingRules).toEqual({ hookFrom: 'ace/mode/folding/java', args: [] })
    expect(mode.indents).toEqual({ hookFrom: 'ace/mode/java' })
    expect(mode.outdents).toEqual({ hookFrom: 'ace/mode/java' })
    expect(mode.autoOutdent).toEqual({ hookFrom: 'ace/mode/java' })
  })
})
