import * as fs from 'node:fs'
import * as path from 'node:path'
import { generatedLibInfo as libInfo } from '../import/generated-lib-info'
import { extractClassMetaFromBuffer } from '../import/extract-metadata'
import { computeClosure, resolveClassFile } from '../import/lib-closure'

const CLASS_ROOT = 'rt'
const hasClassRoot = fs.existsSync(CLASS_ROOT)
const describeWithClassRoot = hasClassRoot ? describe : describe.skip

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
})
