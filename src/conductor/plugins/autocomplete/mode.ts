import { SyntaxHighlightData } from '@sourceacademy/common-autocomplete'
import { JavaHighlightRules } from './highlight-rules'

/**
 * Syntax highlighting data for Java, broadcast to the web plugin over the
 * syntax channel. Tokenizer rules are our own (`highlight-rules.ts`, ported
 * from ace-builds); folding, indentation and auto-outdent are delegated to
 * ace-builds' own existing Java mode rather than reimplemented, matching the
 * `ace/mode/folding/java` / `ace/mode/java` names that ship in ace-builds
 * (`JavaFoldMode` takes no constructor args, unlike some other languages'
 * fold modes).
 */
export default function javaMode(): SyntaxHighlightData {
  return {
    highlightRules: JavaHighlightRules,
    foldingRules: { hookFrom: 'ace/mode/folding/java', args: [] },
    lineCommentStart: '//',
    pairQuotesAfter: {},
    indents: { hookFrom: 'ace/mode/java' },
    outdents: { hookFrom: 'ace/mode/java' },
    autoOutdent: { hookFrom: 'ace/mode/java' },
    id: 'ace/mode/java'
  }
}
