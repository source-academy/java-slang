// import { ErrorResult, ResultType } from '../../types/Result'
import { PrimitiveClassData } from '../../types/class/ClassData'
import AbstractSystem from '../../utils/AbstractSystem'
import BootstrapClassLoader from '../../ClassLoader/BootstrapClassLoader'
import { setupTest } from '../__utils__/test-utils'
import AbstractClassLoader from '../../ClassLoader/AbstractClassLoader'

// let testLoader: AbstractClassLoader
let bootstrapLoader: BootstrapClassLoader
let mockSystem: AbstractSystem

beforeEach(() => {
  const setup = setupTest()
  // testLoader = setup.testLoader
  mockSystem = setup.testSystem
  bootstrapLoader = new BootstrapClassLoader(mockSystem, 'test/path')
})

describe('BootstrapClassLoader', () => {
  test('Should create a BootstrapClassLoader instance with correct parameters', () => {
    const mockSystem = {} as AbstractSystem
    const classPath = 'test/path'
    const bootstrapLoader = new BootstrapClassLoader(mockSystem, classPath)

    expect(bootstrapLoader).toBeInstanceOf(BootstrapClassLoader)
    expect(bootstrapLoader).toBeInstanceOf(AbstractClassLoader)
    expect(bootstrapLoader['nativeSystem']).toBe(mockSystem)
    expect(bootstrapLoader['classPath']).toBe(classPath)
    expect(bootstrapLoader['primitiveClasses']).toEqual({})
  })
  
  // test('Should return an error result when loading an array class fails', () => {
  //   const mockComponentClass: ClassData = {} as ClassData
  //   const mockErrorCallback = jest.fn()
  //   jest.spyOn(ArrayClassData.prototype, 'constructor').mockImplementation(
  //     (_, __, ___, ____, errorCallback) => {
  //       errorCallback({ status: ResultType.ERROR, msg: 'Mock error' })
  //       return {} as ArrayClassData
  //     }
  //   )
  //
  //   const result = bootstrapLoader['_loadArrayClass']('TestArray', mockComponentClass) as ErrorResult
  //
  //   expect(result.status).toBe(ResultType.ERROR)
  //   expect(result.msg).toBe('Mock error')
  //   expect(mockErrorCallback).not.toHaveBeenCalled()
  // })
  
  test('Should throw an error for invalid primitive class names', () => {
    expect(() => {
      bootstrapLoader.getPrimitiveClass('invalid_primitive')
    }).toThrow('Invalid primitive class name: invalid_primitive')

    expect(() => {
      bootstrapLoader.getPrimitiveClass('Object')
    }).toThrow('Invalid primitive class name: Object')

    expect(() => {
      bootstrapLoader.getPrimitiveClass('')
    }).toThrow('Invalid primitive class name: ')
  })

  test('Should return a primitive class instance for valid primitive class names', () => {
    const primitiveClass = bootstrapLoader.getPrimitiveClass('I')

    expect(primitiveClass).toBeInstanceOf(PrimitiveClassData)
    expect(primitiveClass.getDescriptor()).toBe('I')
  })
})
