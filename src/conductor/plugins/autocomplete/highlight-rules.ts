import { AceRules } from '@sourceacademy/common-autocomplete'

/**
 * Java Ace tokenizer rules, ported from ace-builds' `ace/mode/java_highlight_rules`
 * (https://github.com/ajaxorg/ace-builds/blob/master/src-noconflict/mode-java.js),
 * adapted to the static `AceRules` shape this protocol transfers (no live
 * `TextHighlightRules` instance/methods - `createKeywordMapper`'s raw
 * `{map, defaultToken}` arguments are sent as data instead of a constructed
 * function; the web side reconstructs the mapper locally).
 *
 * Deliberately simplified relative to the original: the Java 9+ `module { ... }`
 * block rule is dropped (out of scope for this subset), and `/** ... *&#47;` doc
 * comments are highlighted the same as ordinary `/* ... *&#47;` comments rather
 * than embedding a separate doc-comment sub-highlighter. `constant.language`
 * also drops `Infinity|NaN|undefined`, which the upstream Java rules carry over
 * from a shared JavaScript template despite not being Java keywords.
 */
export const JavaHighlightRules: AceRules = {
  start: [
    { include: 'comments' },
    { include: 'multiline-strings' },
    { include: 'strings' },
    { include: 'constants' },
    { include: 'statements' }
  ],
  comments: [
    { token: 'comment', regex: '\\/\\/.*$' },
    { token: 'comment', regex: '\\/\\*', push: 'comment-block' }
  ],
  'comment-block': [
    { token: 'comment', regex: '\\*\\/', next: 'pop' },
    { defaultToken: 'comment' }
  ],
  strings: [
    {
      token: 'string', // single line
      regex: '["](?:(?:\\\\.)|(?:[^"\\\\]))*?["]'
    },
    {
      token: 'string', // single line
      regex: "['](?:(?:\\\\.)|(?:[^'\\\\]))*?[']"
    }
  ],
  'multiline-strings': [{ token: 'string', regex: '"""', push: 'multiline-string-body' }],
  'multiline-string-body': [
    { token: 'string', regex: '"""', next: 'pop' },
    { token: 'constant.language.escape', regex: '\\\\.' },
    { defaultToken: 'string' }
  ],
  constants: [
    {
      token: 'constant.numeric', // hex / binary
      regex: '0(?:[xX][0-9a-fA-F][0-9a-fA-F_]*|[bB][01][01_]*)[LlSsDdFfYy]?\\b'
    },
    {
      token: 'constant.numeric', // decimal / float
      regex: '[+-]?\\d[\\d_]*(?:(?:\\.[\\d_]*)?(?:[eE][+-]?[\\d_]+)?)?[LlSsDdFfYy]?\\b'
    },
    {
      token: 'constant.language.boolean',
      regex: '(?:true|false)\\b'
    }
  ],
  statements: [
    {
      token: 'keyword',
      regex:
        '(?:abstract|continue|for|new|switch|' +
        'assert|default|goto|package|synchronized|' +
        'boolean|do|if|private|this|' +
        'break|double|implements|protected|throw|' +
        'byte|else|import|public|throws|' +
        'case|enum|instanceof|return|transient|' +
        'catch|extends|int|short|try|' +
        'char|final|interface|static|void|' +
        'class|finally|long|strictfp|volatile|' +
        'const|float|native|super|while)\\b'
    },
    {
      token: 'storage.type.annotation',
      regex: '@[a-zA-Z_$][a-zA-Z0-9_$]*\\b'
    },
    {
      token: 'entity.name.function',
      regex: '[a-zA-Z_$][a-zA-Z0-9_$]*(?=\\()'
    },
    {
      token: {
        map: {
          'variable.language': 'this',
          'constant.language': 'null',
          'support.function':
            'AbstractMethodError|AssertionError|ClassCircularityError|' +
            'ClassFormatError|Deprecated|EnumConstantNotPresentException|' +
            'ExceptionInInitializerError|IllegalAccessError|' +
            'IllegalThreadStateException|InstantiationError|InternalError|' +
            'NegativeArraySizeException|NoSuchFieldError|Override|Process|' +
            'ProcessBuilder|SecurityManager|StringIndexOutOfBoundsException|' +
            'SuppressWarnings|TypeNotPresentException|UnknownError|' +
            'UnsatisfiedLinkError|UnsupportedClassVersionError|VerifyError|' +
            'InstantiationException|IndexOutOfBoundsException|' +
            'ArrayIndexOutOfBoundsException|CloneNotSupportedException|' +
            'NoSuchFieldException|IllegalArgumentException|NumberFormatException|' +
            'SecurityException|Void|InheritableThreadLocal|IllegalStateException|' +
            'InterruptedException|NoSuchMethodException|IllegalAccessException|' +
            'UnsupportedOperationException|Enum|StrictMath|Package|Compiler|' +
            'Readable|Runtime|StringBuilder|Math|IncompatibleClassChangeError|' +
            'NoSuchMethodError|ThreadLocal|RuntimePermission|ArithmeticException|' +
            'NullPointerException|Long|Integer|Short|Byte|Double|Number|Float|' +
            'Character|Boolean|StackTraceElement|Appendable|StringBuffer|' +
            'Iterable|ThreadGroup|Runnable|Thread|IllegalMonitorStateException|' +
            'StackOverflowError|OutOfMemoryError|VirtualMachineError|' +
            'ArrayStoreException|ClassCastException|LinkageError|' +
            'NoClassDefFoundError|ClassNotFoundException|RuntimeException|' +
            'Exception|ThreadDeath|Error|Throwable|System|ClassLoader|' +
            'Cloneable|Class|CharSequence|Comparable|String|Object'
        },
        defaultToken: 'identifier'
      },
      regex: '[a-zA-Z_$][a-zA-Z0-9_$]*\\b'
    },
    {
      token: 'keyword.operator',
      regex:
        '!|\\$|%|&|\\||\\^|\\*|\\/|\\-\\-|\\-|\\+\\+|\\+|~|===|==|=|!=|!==|<=|>=|<<=|>>=|>>>=|<>|<|>|!|&&|\\|\\||\\?|\\:|\\*=|\\/=|%=|\\+=|\\-=|&=|\\|=|\\^=|\\binstanceof\\b|\\bnew\\b'
    },
    { token: 'lparen', regex: '[[({]' },
    { token: 'rparen', regex: '[\\])}]' },
    { token: 'text', regex: '\\s+' }
  ]
}
