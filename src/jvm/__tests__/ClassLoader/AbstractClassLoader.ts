import { JvmObject } from '../../types/reference/Object'
import AbstractSystem from '../../utils/AbstractSystem'
import AbstractClassLoader, { ApplicationClassLoader } from '../../ClassLoader/AbstractClassLoader'
import { TestClassLoader } from '../__utils__/test-utils'

describe('AbstractClassLoader', () => {
  test('Should properly delegate primitive class loading to the parent loader', () => {
    const mockParentLoader = {
      getPrimitiveClass: jest.fn().mockReturnValue({
        getName: () => 'int',
        checkPrimitive: () => true
      })
    }

    const mockSystem = {} as AbstractSystem
    const testLoader = new TestClassLoader(mockSystem, '/test/path', mockParentLoader as unknown as AbstractClassLoader)

    const result = testLoader.getPrimitiveClass("I")

    expect(result.getName()).toBe("int")
    expect(result.checkPrimitive()).toBe(true)
  })

  test('Should properly set and return the Java object representing the ApplicationClassLoader', () => {
    const mockParentLoader = {
      getPrimitiveClass: jest.fn().mockReturnValue({
        getName: () => 'int',
        checkPrimitive: () => true
      })
    }

    const mockSystem = {} as AbstractSystem
    const testLoader = new ApplicationClassLoader(mockSystem, '/test/path', mockParentLoader as unknown as AbstractClassLoader)
  
    expect(testLoader.getJavaObject()).toBeNull()

    const mockJavaObject = {} as JvmObject
    testLoader._setJavaClassLoader(mockJavaObject)

    expect(testLoader.getJavaObject()).toBe(mockJavaObject)
  })
})
