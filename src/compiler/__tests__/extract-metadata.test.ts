import * as fs from 'node:fs'
import * as path from 'node:path'
import { CONSTANT_TAG } from '../../ClassFile/constants/constants'
import { ClassFile } from '../../ClassFile/types'
import { ConstantInfo } from '../../ClassFile/types/constants'
import { generatedLibInfo as libInfo } from '../import/generated-lib-info'
import { extractClassMetaFromBuffer } from '../import/extract-metadata'
import { computeClosure, resolveClassFile } from '../import/lib-closure'
import { collectReferencedClassNames } from '../import/referenced-classes'

const CLASS_ROOT = 'rt'
const hasClassRoot = fs.existsSync(CLASS_ROOT)
const describeWithClassRoot = hasClassRoot ? describe : describe.skip

/** Minimal fake ClassFile with just a constant pool, for collectReferencedClassNames tests. */
function fakeClassFile(constantPool: ConstantInfo[]): ClassFile {
  return {
    magic: 0xcafebabe,
    minorVersion: 0,
    majorVersion: 52,
    constantPoolCount: constantPool.length,
    constantPool,
    accessFlags: 0,
    thisClass: 0,
    superClass: 0,
    interfacesCount: 0,
    interfaces: [],
    fieldsCount: 0,
    fields: [],
    methodsCount: 0,
    methods: [],
    attributesCount: 0,
    attributes: []
  }
}

describe('collectReferencedClassNames', () => {
  it('collects a plain (non-array) class entry', () => {
    const cf = fakeClassFile([
      { tag: CONSTANT_TAG.Class, nameIndex: 0 }, // dummy at index 0
      { tag: CONSTANT_TAG.Utf8, length: 0, value: 'java/util/Arrays' },
      { tag: CONSTANT_TAG.Class, nameIndex: 1 }
    ])
    expect(collectReferencedClassNames(cf)).toEqual(['java/util/Arrays'])
  })

  it('unwraps a single-dimension object array descriptor to its component class', () => {
    const cf = fakeClassFile([
      { tag: CONSTANT_TAG.Class, nameIndex: 0 },
      { tag: CONSTANT_TAG.Utf8, length: 0, value: '[Ljava/lang/String;' },
      { tag: CONSTANT_TAG.Class, nameIndex: 1 }
    ])
    expect(collectReferencedClassNames(cf)).toEqual(['java/lang/String'])
  })

  it('unwraps a multi-dimension object array descriptor to its component class', () => {
    const cf = fakeClassFile([
      { tag: CONSTANT_TAG.Class, nameIndex: 0 },
      { tag: CONSTANT_TAG.Utf8, length: 0, value: '[[Ljava/lang/String;' },
      { tag: CONSTANT_TAG.Class, nameIndex: 1 }
    ])
    expect(collectReferencedClassNames(cf)).toEqual(['java/lang/String'])
  })

  it('drops a primitive array descriptor (no classfile needed)', () => {
    const cf = fakeClassFile([
      { tag: CONSTANT_TAG.Class, nameIndex: 0 },
      { tag: CONSTANT_TAG.Utf8, length: 0, value: '[I' },
      { tag: CONSTANT_TAG.Class, nameIndex: 1 }
    ])
    expect(collectReferencedClassNames(cf)).toEqual([])
  })

  it('ignores the dummy sentinel at index 0 and deduplicates', () => {
    const cf = fakeClassFile([
      { tag: CONSTANT_TAG.Class, nameIndex: 0 }, // dummy - would crash if not skipped
      { tag: CONSTANT_TAG.Utf8, length: 0, value: 'java/lang/Object' },
      { tag: CONSTANT_TAG.Class, nameIndex: 1 },
      { tag: CONSTANT_TAG.Class, nameIndex: 1 } // same class referenced twice
    ])
    expect(collectReferencedClassNames(cf)).toEqual(['java/lang/Object'])
  })
})

describe('generated-lib-info.json', () => {
  it('contains the java.lang exception hierarchy', () => {
    expect(libInfo['java/lang/NullPointerException']).toBeDefined()
    expect(libInfo['java/lang/RuntimeException']).toBeDefined()
    expect(libInfo['java/lang/Exception']).toBeDefined()
    expect(libInfo['java/lang/Throwable']).toBeDefined()
    expect(libInfo['java/lang/Object']).toBeDefined()
  })

  it('is closed under superclass and interface edges', () => {
    const gaps: string[] = []
    for (const [name, meta] of Object.entries(libInfo)) {
      for (const dep of [meta.superClass, ...meta.interfaces]) {
        if (dep !== null && !libInfo[dep]) gaps.push(`${dep} (referenced by ${name})`)
      }
    }
    expect(gaps).toEqual([])
  })

  it('records real superclass chains', () => {
    expect(libInfo['java/lang/NullPointerException'].superClass).toBe('java/lang/RuntimeException')
    expect(libInfo['java/lang/RuntimeException'].superClass).toBe('java/lang/Exception')
    expect(libInfo['java/lang/Exception'].superClass).toBe('java/lang/Throwable')
    expect(libInfo['java/lang/Throwable'].superClass).toBe('java/lang/Object')
    expect(libInfo['java/lang/Object'].superClass).toBeNull()
  })

  it('captures member descriptors', () => {
    const system = libInfo['java/lang/System']
    const out = system.fields.find(f => f.name === 'out')
    expect(out?.descriptor).toBe('Ljava/io/PrintStream;')

    const printStream = libInfo['java/io/PrintStream']
    const printlnDescriptors = printStream.methods
      .filter(m => m.name === 'println')
      .map(m => m.descriptor)
    expect(printlnDescriptors).toEqual(expect.arrayContaining(['(Ljava/lang/String;)V', '(I)V']))
  })

  it('excludes private and synthetic members', () => {
    for (const meta of Object.values(libInfo)) {
      for (const member of [...meta.fields, ...meta.methods]) {
        // ACC_PRIVATE = 0x0002, ACC_SYNTHETIC = 0x1000, ACC_BRIDGE = 0x0040
        expect(member.accessFlags & 0x0002).toBe(0)
        expect(member.accessFlags & 0x1000).toBe(0)
      }
    }
  })
})

describeWithClassRoot('extractClassMeta (against the class tree)', () => {
  it('parses NullPointerException.class directly', () => {
    const file = resolveClassFile(CLASS_ROOT, 'java/lang/NullPointerException')
    expect(file).not.toBeNull()

    const meta = extractClassMetaFromBuffer(fs.readFileSync(file as string))
    expect(meta.name).toBe('java/lang/NullPointerException')
    expect(meta.superClass).toBe('java/lang/RuntimeException')
    expect(meta.methods.some(m => m.name === '<init>' && m.descriptor === '()V')).toBe(true)
    expect(
      meta.methods.some(m => m.name === '<init>' && m.descriptor === '(Ljava/lang/String;)V')
    ).toBe(true)
  })

  it('parses every class file in the java.lang package without desyncing', () => {
    const dir = resolveClassFile(CLASS_ROOT, 'java/lang/Object')!.replace(/\/Object\.class$/, '')
    const classFiles = fs.readdirSync(dir).filter(f => f.endsWith('.class'))
    expect(classFiles.length).toBeGreaterThan(0)

    for (const entry of classFiles) {
      const buffer = fs.readFileSync(path.join(dir, entry))
      expect(() => extractClassMetaFromBuffer(buffer)).not.toThrow()
    }
  })

  it('regenerates a closure that matches the committed metadata', () => {
    const { metadata, unresolved } = computeClosure(CLASS_ROOT)
    expect(unresolved).toEqual([])
    expect(new Set(Object.keys(metadata))).toEqual(new Set(Object.keys(libInfo)))
  })

  it('omits referencedClasses entirely unless asked for it', () => {
    const file = resolveClassFile(CLASS_ROOT, 'java/util/Arrays')
    const defaultMeta = extractClassMetaFromBuffer(fs.readFileSync(file as string))
    expect('referencedClasses' in defaultMeta).toBe(false)

    const withRefs = extractClassMetaFromBuffer(fs.readFileSync(file as string), {
      includeReferencedClasses: true
    })
    expect(withRefs.referencedClasses).toContain('java/util/DualPivotQuicksort')
  })

  it('does not follow implementation dependencies by default (type-checker allow-list)', () => {
    const { metadata } = computeClosure(CLASS_ROOT)
    expect(metadata['java/util/DualPivotQuicksort']).toBeUndefined()
    expect(metadata['java/util/TimSort']).toBeUndefined()
    expect(metadata['java/util/ComparableTimSort']).toBeUndefined()
  })

  it('follows implementation dependencies when asked (JVM runtime bundle) - Arrays.sort helpers', () => {
    const { metadata, unresolved } = computeClosure(CLASS_ROOT, [], {
      followImplementationDependencies: true
    })
    expect(unresolved).toEqual([])
    expect(metadata['java/util/DualPivotQuicksort']).toBeDefined()
    expect(metadata['java/util/TimSort']).toBeDefined()
    expect(metadata['java/util/ComparableTimSort']).toBeDefined()
  })
})
