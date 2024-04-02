import { AttributeInfo } from '../../../../ClassFile/types/attributes'
import { ConstantInfo } from '../../../../ClassFile/types/constants'
import { FieldInfo, FIELD_FLAGS } from '../../../../ClassFile/types/fields'
import { readAttribute } from './readAttributes'

export function readField(
  constPool: Array<ConstantInfo>,
  view: DataView,
  offset: number
): { result: FieldInfo; offset: number } {
  const accessFlags = view.getUint16(offset)
  offset += 2

  const nameIndex = view.getUint16(offset)
  offset += 2

  const descriptorIndex = view.getUint16(offset)
  offset += 2

  const attributesCount = view.getUint16(offset)
  offset += 2

  const attributes = []

  for (let i = 0; i < attributesCount; i += 1) {
    const { result, offset: newOffset } = readAttribute(constPool, view, offset)

    attributes.push(result as unknown as AttributeInfo)
    offset = newOffset
  }

  return {
    result: {
      accessFlags,
      nameIndex,
      descriptorIndex,
      attributes,
      attributesCount: attributesCount
    },
    offset
  }
}

export function checkPublic(field: FieldInfo): boolean {
  return (field.accessFlags & FIELD_FLAGS.ACC_PUBLIC) !== 0
}

export function checkPrivate(field: FieldInfo): boolean {
  return (field.accessFlags & FIELD_FLAGS.ACC_PRIVATE) !== 0
}

export function checkProtected(field: FieldInfo): boolean {
  return (field.accessFlags & FIELD_FLAGS.ACC_PROTECTED) !== 0
}

export function checkStatic(field: FieldInfo): boolean {
  return (field.accessFlags & FIELD_FLAGS.ACC_STATIC) !== 0
}

export function checkFinal(field: FieldInfo): boolean {
  return (field.accessFlags & FIELD_FLAGS.ACC_FINAL) !== 0
}

export function checkVolatile(field: FieldInfo): boolean {
  return (field.accessFlags & FIELD_FLAGS.ACC_VOLATILE) !== 0
}

export function checkTransient(field: FieldInfo): boolean {
  return (field.accessFlags & FIELD_FLAGS.ACC_TRANSIENT) !== 0
}

export function checkSynthetic(field: FieldInfo): boolean {
  return (field.accessFlags & FIELD_FLAGS.ACC_SYNTHETIC) !== 0
}
