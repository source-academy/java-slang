import { AttributeInfo } from '../../ClassFile/types/attributes'
import AbstractClassLoader from '../ClassLoader/AbstractClassLoader'
import { ConstantPool } from '../constant-pool'
import Thread from '../thread'
import { IAttribute, info2Attribute } from '../types/class/Attributes'
import { ArrayClassData, ReferenceClassData, ClassData } from '../types/class/ClassData'
import { ConstantUtf8 } from '../types/class/Constants'
import { Field } from '../types/class/Field'
import { JvmArray } from '../types/reference/Array'
import { JvmObject, JavaType } from '../types/reference/Object'
import { SuccessResult, ResultType } from '../types/Result'

const _ = {}
export const INACCESSIBLE = new Proxy(_, {
  get: () => {
    throw new Error('Inaccessible')
  },
  set: () => {
    throw new Error('Inaccessible')
  }
})

/**
 * Converts a Java String to a JS string
 * @param str Java String object
 */
export const j2jsString = (str: JvmObject) => {
  return String.fromCharCode(
    ...(str._getField('value', '[C', 'java/lang/String') as JvmArray).getJsArray()
  )
}

function newCharArr(loader: AbstractClassLoader, str: string): JvmArray {
  // Assume char array loaded at init
  const cArrRes = loader.getClass('[C') as SuccessResult<ArrayClassData>
  const cArrCls = cArrRes.result
  const cArr = cArrCls.instantiate()
  const jsArr = []
  for (let i = 0; i < str.length; i++) {
    jsArr.push(str.charCodeAt(i))
  }
  cArr.initArray(str.length, jsArr)
  return cArr
}

/**
 * Converts a JS string to a Java String. Assumes java/lang/String and [C is loaded.
 */
export function js2jString(loader: AbstractClassLoader, str: string): JvmObject {
  const charArr = newCharArr(loader, str)
  const strRes = loader.getClass('java/lang/String') as SuccessResult<ReferenceClassData>
  const strCls = strRes.result
  const strObj = strCls.instantiate()
  const fieldRef = strCls.lookupField('value[C') as Field
  strObj.putField(fieldRef, charArr)
  return strObj
}

/**
 * Returns the number of bytes that a primitive or reference takes up in memory.
 * @param cls ClassRef of the primitive or reference
 */
export const typeIndexScale = (cls: ClassData) => {
  // Reference type
  if (!cls.checkPrimitive()) {
    return 4
  }

  const componentName = cls.getName()
  switch (componentName) {
    case 'long':
    case 'double':
      return 8

    case 'int':
    case 'float':
      return 4

    case 'short':
    case 'char':
      return 2

    case 'byte':
    case 'boolean':
      return 1

    default:
      return -1
  }
}

export const byteArray2charArray = (byteArray: number[]) => {
  const res: number[] = []
  byteArray.forEach((byte, index) => {
    if (index % 2 === 0) {
      res.push((byte << 8) | byteArray[index + 1])
    }
  })
  return res
}

export function parseFieldDescriptor(
  descriptor: string,
  index: number
): { type: string; referenceCls?: string; index: number } {
  switch (descriptor[index]) {
    case JavaType.byte:
    case JavaType.char:
    case JavaType.double:
    case JavaType.float:
    case JavaType.int:
    case JavaType.long:
    case JavaType.short:
    case JavaType.boolean:
      return { type: descriptor[index], index: index + 1 }
    case JavaType.array:
      const res = parseFieldDescriptor(descriptor, index + 1)
      const clsName = '[' + (res.referenceCls ? 'L' + res.referenceCls + ';' : res.type)
      return { type: JavaType.array, referenceCls: clsName, index: res.index }
    case JavaType.reference:
      const sub = descriptor.substring(index)
      const end = sub.indexOf(';')
      return {
        type: JavaType.reference,
        referenceCls: sub.substring(1, end),
        index: index + end + 1
      }
    case JavaType.void:
      return { type: JavaType.void, index: index + 1 }
    default:
      throw new Error(`Unknown type ${descriptor[index]}`)
  }
}

export function parseMethodDescriptor(desc: string) {
  const _split = desc.split(')')
  let args = _split[0]
  const ret = _split[1]
  args = args.substring(1)
  const argTypes = []

  let index = 0
  while (index < args.length) {
    const { type, referenceCls, index: newIndex } = parseFieldDescriptor(args, index)
    argTypes.push({ type, referenceCls })
    index = newIndex
  }

  const retType = parseFieldDescriptor(ret, 0)
  return {
    args: argTypes,
    ret: { type: retType.type, referenceCls: retType.referenceCls }
  }
}

export function getArgs(thread: Thread, descriptor: string, isNative: boolean): any[] {
  // We should memoize parsing in the future.
  const methodDesc = parseMethodDescriptor(descriptor)
  const args = []
  for (let i = methodDesc.args.length - 1; i >= 0; i--) {
    let popResult
    switch (methodDesc.args[i].type) {
      case 'V':
        break // should not happen
      case 'D':
        popResult = thread.popStack64()
        if (popResult.status === ResultType.ERROR) {
          break
        }
        args.push(asDouble(popResult.result))
        if (!isNative) {
          args.push(asDouble(popResult.result))
        }
        break
      case 'F':
        popResult = thread.popStack()
        if (popResult.status === ResultType.ERROR) {
          break
        }
        args.push(asFloat(popResult.result))
        break
      case 'J':
        popResult = thread.popStack64()
        if (popResult.status === ResultType.ERROR) {
          break
        }
        args.push(popResult.result)
        if (!isNative) {
          args.push(popResult.result)
        }
        break
      case '[':
      case 'B':
      case 'C':
      case 'I':
      case 'S':
      case 'Z':
      default: // also references + arrays
        popResult = thread.popStack()
        if (popResult.status === ResultType.ERROR) {
          break
        }
        args.push(popResult.result)
        break
    }
  }

  return args.reverse()
}

export function getField(ref: any, fieldName: string, type: JavaType) {
  ref.getField(fieldName, type)
}

export function asDouble(value: number): number {
  return value
}

export function asFloat(value: number): number {
  return Math.fround(value)
}

export function primitiveTypeToName(type: JavaType) {
  switch (type) {
    case JavaType.byte:
      return 'byte'
    case JavaType.char:
      return 'char'
    case JavaType.double:
      return 'double'
    case JavaType.float:
      return 'float'
    case JavaType.int:
      return 'int'
    case JavaType.long:
      return 'long'
    case JavaType.short:
      return 'short'
    case JavaType.boolean:
      return 'boolean'
    case JavaType.void:
      return 'void'
    default:
      return null
  }
}

export function primitiveNameToType(pName: string) {
  switch (pName) {
    case 'byte':
      return JavaType.byte
    case 'char':
      return JavaType.char
    case 'double':
      return JavaType.double
    case 'float':
      return JavaType.float
    case 'int':
      return JavaType.int
    case 'long':
      return JavaType.long
    case 'short':
      return JavaType.short
    case 'boolean':
      return JavaType.boolean
    case 'void':
      return JavaType.void
    default:
      return null
  }
}

export function attrInfo2Interface(infoArr: AttributeInfo[], constantPool: ConstantPool) {
  const attributes: { [attributeName: string]: IAttribute } = {}
  // attributes
  infoArr.forEach(attr => {
    const attrName = (constantPool.get(attr.attributeNameIndex) as ConstantUtf8).get()
    attributes[attrName] = info2Attribute(attr, constantPool)
  })
  return attributes
}

export function autoBox(obj: any) {
  logger.warn('Auto boxing not implemented')
  return obj
}

export function autoUnbox(obj: any) {
  logger.warn('Auto unboxing not implemented')
  return obj
}

export function arraybuffer2string(buffer: ArrayBuffer) {
  return String.fromCharCode(...new Uint8Array(buffer))
}

export function string2arraybuffer(str: string) {
  const buf = new ArrayBuffer(str.length) // 2 bytes for each char
  const bufView = new Uint8Array(buf)
  for (let i = 0, strLen = str.length; i < strLen; i++) {
    bufView[i] = str.charCodeAt(i)
  }
  return buf
}

export const logger: {
  warnings: string[]
  warn: (msg: string) => void
} = {
  warnings: [],
  warn: (msg: string) => logger.warnings.push(msg)
}
