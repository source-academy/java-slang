import { CONSTANT_TAG } from '../../ClassFile/constants/constants'
import { ConstantInfo } from '../../ClassFile/types/constants'
import { ClassData } from '../types/class/ClassData'
import {
  // Constant,
  ConstantInteger,
  ConstantFloat,
  ConstantLong,
  ConstantDouble,
  ConstantUtf8,
  ConstantString,
  ConstantNameAndType,
  ConstantMethodType,
  ConstantClass,
  ConstantInvokeDynamic,
  ConstantFieldref,
  ConstantMethodref,
  ConstantInterfaceMethodref,
  ConstantMethodHandle
} from '../types/class/Constants'
// import { JvmArray } from '../types/reference/Array'
import { ConstantPool } from '../constant-pool'
import { setupTest } from './__utils__/test-utils'

// let testLoader: TestClassLoader
let classData: ClassData
let constantInfos: ConstantInfo[]
let constantPool: ConstantPool

beforeEach(() => {
  const setup = setupTest()
  // testLoader = setup.testLoader
  classData = setup.classes.testClass
  constantInfos = [
    { tag: CONSTANT_TAG.Integer, value: 0 },
    { tag: CONSTANT_TAG.Integer, value: 42 },
    { tag: CONSTANT_TAG.Float, value: 3.14 },
    { tag: CONSTANT_TAG.Long, value: BigInt(1234567890) },
    { tag: CONSTANT_TAG.Double, value: 2.71828 },
    { tag: CONSTANT_TAG.Utf8, length: 13, value: 'Hello, World!' },
    { tag: CONSTANT_TAG.String, stringIndex: 5 },
    { tag: CONSTANT_TAG.NameAndType, nameIndex: 5, descriptorIndex: 5 },
    { tag: CONSTANT_TAG.MethodType, descriptorIndex: 5 },
    { tag: CONSTANT_TAG.Class, nameIndex: 5 },
    { tag: CONSTANT_TAG.InvokeDynamic, bootstrapMethodAttrIndex: 1, nameAndTypeIndex: 7 },
    { tag: CONSTANT_TAG.Fieldref, classIndex: 9, nameAndTypeIndex: 7 },
    { tag: CONSTANT_TAG.Methodref, classIndex: 9, nameAndTypeIndex: 7 },
    { tag: CONSTANT_TAG.InterfaceMethodref, classIndex: 9, nameAndTypeIndex: 7 },
    { tag: CONSTANT_TAG.MethodHandle, referenceKind: 1, referenceIndex: 12 }
  ]

  constantPool = new ConstantPool(classData, constantInfos)
})

describe('ConstantPool', () => {
  test('Should correctly initialize the constant pool with all provided constant types', () => {
    expect(constantPool.size()).toBe(15)
    expect(constantPool.get(1)).toBeInstanceOf(ConstantInteger)
    expect(constantPool.get(2)).toBeInstanceOf(ConstantFloat)
    expect(constantPool.get(3)).toBeInstanceOf(ConstantLong)
    expect(constantPool.get(4)).toBeInstanceOf(ConstantDouble)
    expect(constantPool.get(5)).toBeInstanceOf(ConstantUtf8)
    expect(constantPool.get(6)).toBeInstanceOf(ConstantString)
    expect(constantPool.get(7)).toBeInstanceOf(ConstantNameAndType)
    expect(constantPool.get(8)).toBeInstanceOf(ConstantMethodType)
    expect(constantPool.get(9)).toBeInstanceOf(ConstantClass)
    expect(constantPool.get(10)).toBeInstanceOf(ConstantInvokeDynamic)
    expect(constantPool.get(11)).toBeInstanceOf(ConstantFieldref)
    expect(constantPool.get(12)).toBeInstanceOf(ConstantMethodref)
    expect(constantPool.get(13)).toBeInstanceOf(ConstantInterfaceMethodref)
    expect(constantPool.get(14)).toBeInstanceOf(ConstantMethodHandle)

    expect((constantPool.get(1) as ConstantInteger).get()).toBe(42)
    expect((constantPool.get(2) as ConstantFloat).get()).toBe(3.14)
    expect((constantPool.get(3) as ConstantLong).get()).toBe(BigInt(1234567890))
    expect((constantPool.get(4) as ConstantDouble).get()).toBe(2.71828)
    expect((constantPool.get(5) as ConstantUtf8).get()).toBe('Hello, World!')
  })

  test('Should throw an error when get method is called with an invalid index', () => {
    const constantPool = new ConstantPool(classData, [
      { tag: CONSTANT_TAG.Utf8, length: 5, value: 'Test' }
    ])

    expect(constantPool.get(-1)).toBe(undefined)
    expect(constantPool.get(16)).toBe(undefined)
  })
})
