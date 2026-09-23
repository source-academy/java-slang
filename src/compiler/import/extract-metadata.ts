import { ClassFile } from '../../ClassFile/types'
import { ConstantClassInfo, ConstantUtf8Info } from '../../ClassFile/types/constants'
import { METHOD_FLAGS } from '../../ClassFile/types/methods'
import parseBin from '../../jvm/utils/disassembler'
import { ClassMeta, MemberMeta } from './class-meta'

/** Members that are part of a class's usable public API. */
const VISIBLE = METHOD_FLAGS.ACC_PUBLIC | METHOD_FLAGS.ACC_PROTECTED
/** Compiler-generated members that are never referenced from source. */
const SYNTHETIC = METHOD_FLAGS.ACC_SYNTHETIC | METHOD_FLAGS.ACC_BRIDGE

const utf8 = (cf: ClassFile, index: number): string =>
  (cf.constantPool[index] as ConstantUtf8Info).value

const classNameAt = (cf: ClassFile, index: number): string | null => {
  if (index === 0) return null
  const classInfo = cf.constantPool[index] as ConstantClassInfo
  return utf8(cf, classInfo.nameIndex)
}

type RawMember = { accessFlags: number; nameIndex: number; descriptorIndex: number }

const collectMembers = (cf: ClassFile, members: RawMember[]): MemberMeta[] =>
  members
    .filter(m => (m.accessFlags & VISIBLE) !== 0 && (m.accessFlags & SYNTHETIC) === 0)
    .map(m => ({
      name: utf8(cf, m.nameIndex),
      descriptor: utf8(cf, m.descriptorIndex),
      accessFlags: m.accessFlags
    }))
    // `<clinit>` is never public/protected, but guard anyway; keep `<init>`.
    .filter(m => m.name !== '<clinit>')

/**
 * Reads a class file and returns descriptor-level metadata for it. Only the
 * constant pool and the field / method tables are inspected; `Code` and other
 * attributes are parsed by `parseBin` but ignored here.
 */
export function extractClassMeta(bytes: DataView): ClassMeta {
  const cf = parseBin(bytes)

  const name = classNameAt(cf, cf.thisClass)
  if (name === null) {
    throw new Error('Class file has no this_class entry')
  }

  return {
    name,
    accessFlags: cf.accessFlags,
    superClass: classNameAt(cf, cf.superClass),
    interfaces: cf.interfaces.map(i => classNameAt(cf, i)).filter((n): n is string => n !== null),
    fields: collectMembers(cf, cf.fields),
    methods: collectMembers(cf, cf.methods)
  }
}

/** Convenience wrapper for Node build scripts working with `Buffer`s. */
export function extractClassMetaFromBuffer(buffer: Uint8Array): ClassMeta {
  return extractClassMeta(new DataView(buffer.buffer, buffer.byteOffset, buffer.byteLength))
}
