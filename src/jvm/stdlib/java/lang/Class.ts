import AbstractClassLoader from '../../../ClassLoader/AbstractClassLoader'
import Thread from '../../../thread'
import { ErrorResult, ResultType } from '../../../types/Result'
import { InnerClasses } from '../../../types/class/Attributes'
import { ClassData, ArrayClassData, ReferenceClassData } from '../../../types/class/ClassData'
import { JvmObject } from '../../../types/reference/Object'
import { j2jsString, logger, primitiveNameToType } from '../../../utils'

const functions = {
  /**
   * @todo Not implemented. Returns 0 (assertions disabled).
   * @param thread
   */
  'desiredAssertionStatus0(Ljava/lang/Class;)Z': (thread: Thread) => {
    logger.warn('Class.desiredAssertionStatus0: assertions disabled')
    thread.returnStackFrame(0)
  },

  'getModifiers()I': (thread: Thread, locals: any[]) => {
    const clsObj = locals[0] as JvmObject
    const clsRef = clsObj.getNativeField('classRef') as ClassData
    thread.returnStackFrame(clsRef.getAccessFlags())
  },

  'getSuperclass()Ljava/lang/Class;': (thread: Thread, locals: any[]) => {
    const clsObj = locals[0] as JvmObject
    const clsRef = clsObj.getNativeField('classRef') as ClassData
    const superCls = clsRef.getSuperClass()
    if (!superCls) {
      thread.returnStackFrame(null)
      return
    }
    thread.returnStackFrame(superCls.getJavaObject())
  },

  /**
   * NOP.
   * @param thread
   * @param locals
   */
  'registerNatives()V': (thread: Thread) => {
    thread.returnStackFrame()
  },

  'getDeclaredFields0(Z)[Ljava/lang/reflect/Field;': (thread: Thread, locals: any[]) => {
    const clsObj = locals[0] as JvmObject
    const clsRef = clsObj.getNativeField('classRef') as ClassData
    const fields = clsRef.getDeclaredFields()

    const result = []

    for (const field of Object.values(fields)) {
      const refRes = field.getReflectedObject(thread)
      if (refRes.status === ResultType.ERROR) {
        thread.returnStackFrame()
        thread.throwNewException(refRes.exceptionCls, refRes.msg)
        return
      }
      result.push(refRes.result)
    }

    const faClsRes = thread.getClass().getLoader().getClass('[Ljava/lang/reflect/Field;')
    if (faClsRes.status === ResultType.ERROR) {
      thread.returnStackFrame()
      thread.throwNewException(faClsRes.exceptionCls, faClsRes.msg)
      return
    }
    const faCls = faClsRes.result as ArrayClassData
    const faObj = faCls.instantiate()
    faObj.initArray(result.length, result)

    thread.returnStackFrame(faObj)
  },

  'getPrimitiveClass(Ljava/lang/String;)Ljava/lang/Class;': (thread: Thread, locals: any[]) => {
    const javaStr = locals[0] as JvmObject
    const primitiveName = j2jsString(javaStr)
    const primitiveClsName = primitiveNameToType(primitiveName) ?? primitiveName

    const cls = thread.getClass().getLoader().getPrimitiveClass(primitiveClsName)
    const initRes = cls.initialize(thread)
    if (initRes.status !== ResultType.SUCCESS) {
      if (initRes.status === ResultType.ERROR) {
        thread.throwNewException(initRes.exceptionCls, initRes.msg)
      }
      return
    }
    thread.returnStackFrame(cls.getJavaObject())
  },

  'isArray()Z': (thread: Thread, locals: any[]) => {
    const clsObj = locals[0] as JvmObject
    const clsRef = clsObj.getNativeField('classRef') as ReferenceClassData
    thread.returnStackFrame(clsRef.checkArray() ? 1 : 0)
  },

  'isPrimitive()Z': (thread: Thread, locals: any[]) => {
    const clsObj = locals[0] as JvmObject
    const clsRef = clsObj.getNativeField('classRef') as ClassData
    thread.returnStackFrame(clsRef.checkPrimitive() ? 1 : 0)
  },

  'getName0()Ljava/lang/String;': (thread: Thread, locals: any[]) => {
    const clsObj = locals[0] as JvmObject
    const clsRef = clsObj.getNativeField('classRef') as ClassData
    // Replace slashes with ., Class splits by . to get simple name
    const name = clsRef.getName().replaceAll('/', '.')
    const strRes = thread.getJVM().getInternedString(name)
    thread.returnStackFrame(strRes)
  },

  'getComponentType()Ljava/lang/Class;': (thread: Thread, locals: any[]) => {
    const clsObj = locals[0] as JvmObject
    const clsRef = clsObj.getNativeField('classRef') as ClassData

    if (!clsRef.checkArray()) {
      thread.returnStackFrame(null)
      return
    }

    const itemCls = clsRef.getComponentClass()
    thread.returnStackFrame(itemCls.getJavaObject())
  },

  /**
   * @todo Partially implemented. Throws an error when called with a non-null classloader.
   * @param thread
   * @param locals
   * @returns
   */
  'forName0(Ljava/lang/String;ZLjava/lang/ClassLoader;Ljava/lang/Class;)Ljava/lang/Class;': (
    thread: Thread,
    locals: any[]
  ) => {
    const nameJStr = locals[0] as JvmObject
    const initialize = (locals[1] as number) === 1
    const loaderObj = locals[2] as JvmObject

    const name = j2jsString(nameJStr).replaceAll('.', '/')

    let loader: AbstractClassLoader
    if (loaderObj) {
      throw new Error('forName0 via application class loader object not handled')
    } else {
      loader = thread.getJVM().getBootstrapClassLoader()
    }

    const loadRes = loader.getClass(name)
    if (loadRes.status === ResultType.ERROR) {
      thread.returnStackFrame()
      thread.throwNewException(loadRes.exceptionCls, loadRes.msg)
      return
    }
    const loadedCls = loadRes.result

    if (!initialize) {
      thread.returnStackFrame(loadedCls.getJavaObject())
      return
    }

    const initRes = loadedCls.initialize(thread)
    if (initRes.status !== ResultType.SUCCESS) {
      if (initRes.status === ResultType.ERROR) {
        thread.returnStackFrame()
        thread.throwNewException(initRes.exceptionCls, initRes.msg)
        return
      }
      return
    }
    thread.returnStackFrame(loadedCls.getJavaObject())
  },

  'isInterface()Z': (thread: Thread, locals: any[]) => {
    const clsObj = locals[0] as JvmObject
    const clsRef = clsObj.getNativeField('classRef') as ClassData
    thread.returnStackFrame(clsRef.checkInterface() ? 1 : 0)
  },

  'getDeclaredConstructors0(Z)[Ljava/lang/reflect/Constructor;': (
    thread: Thread,
    locals: any[]
  ) => {
    const clsObj = locals[0] as JvmObject
    const publicOnly = locals[1] === 1

    const clsRef = clsObj.getNativeField('classRef') as ClassData
    const methods: JvmObject[] = []
    let error: ErrorResult | null = null
    Object.entries(clsRef.getDeclaredMethods()).forEach(([key, value]) => {
      if (!key.startsWith('<init>') || (publicOnly && !value.checkPublic())) {
        return
      }

      const refRes = value.getReflectedObject(thread)
      if (refRes.status === ResultType.ERROR) {
        error = refRes
        return
      }
      methods.push(refRes.result)
    })
    if (error) {
      thread.returnStackFrame()
      thread.throwNewException((error as ErrorResult).exceptionCls, (error as ErrorResult).msg)
      return
    }

    const caRes = clsRef.getLoader().getClass('[Ljava/lang/reflect/Constructor;')
    if (caRes.status === ResultType.ERROR) {
      thread.returnStackFrame()
      thread.throwNewException(caRes.exceptionCls, caRes.msg)
      return
    }
    const caCls = caRes.result as ArrayClassData
    const caObj = caCls.instantiate()
    caObj.initArray(methods.length, methods)

    thread.returnStackFrame(caObj)
  },

  'getDeclaredMethods0(Z)[Ljava/lang/reflect/Method;': (thread: Thread, locals: any[]) => {
    const clsObj = locals[0] as JvmObject
    const classRef = clsObj.getNativeField('classRef') as ClassData
    const methods = classRef.getDeclaredMethods()
    const publicOnly = locals[1] === 1

    const mArrRes = classRef.getLoader().getClass('[Ljava/lang/reflect/Method;')
    if (mArrRes.status === ResultType.ERROR) {
      thread.throwNewException(mArrRes.exceptionCls, mArrRes.msg)
      return
    }
    const mArrCls = mArrRes.result as ArrayClassData
    const mArr = mArrCls.instantiate()

    const jsMethodArr = []
    for (const [name, method] of Object.entries(methods)) {
      if (publicOnly && !method.checkPublic()) {
        continue
      }

      if (name.startsWith('<init>')) {
        continue
      }

      const refRes = method.getReflectedObject(thread)
      if (refRes.status === ResultType.ERROR) {
        thread.throwNewException(refRes.exceptionCls, refRes.msg)
        return
      }
      jsMethodArr.push(refRes.result)
    }
    mArr.initArray(jsMethodArr.length, jsMethodArr)
    thread.returnStackFrame(mArr)
  },

  'getDeclaringClass0()Ljava/lang/Class;': (thread: Thread, locals: any[]) => {
    const clsObj = locals[0] as JvmObject
    const classRef = clsObj.getNativeField('classRef') as ClassData

    if (!classRef.checkReference()) {
      thread.returnStackFrame(null)
      return
    }

    const innerAttrib = classRef.getAttribute('InnerClasses') as InnerClasses
    if (innerAttrib) {
      for (const cls of innerAttrib.classes) {
        if (cls.innerClass.getClassName() === classRef.getName()) {
          if (cls.outerClass === null) {
            thread.returnStackFrame(null)
          } else {
            const outerResolution = cls.outerClass.resolve()
            if (outerResolution.status === ResultType.ERROR) {
              thread.throwNewException(outerResolution.exceptionCls, outerResolution.msg)
              return
            }
            thread.returnStackFrame(outerResolution.result.getJavaObject())
            return
          }
        }
      }
    }

    thread.returnStackFrame(null)
  },

  'isAssignableFrom(Ljava/lang/Class;)Z': (thread: Thread, locals: any[]) => {
    const clsObj = locals[0] as JvmObject
    const clsRef = clsObj.getNativeField('classRef') as ClassData
    const clsObj2 = locals[1] as JvmObject
    const clsRef2 = clsObj2.getNativeField('classRef') as ClassData
    thread.returnStackFrame(clsRef2.checkCast(clsRef) ? 1 : 0)
  },

  /**
   * @todo Partially implemented. Not implemented for reference classes, get data from enclosingmethod attribute for that.
   * @param thread
   * @param locals
   * @returns
   */
  'getEnclosingMethod0()[Ljava/lang/Object;': (thread: Thread, locals: any[]) => {
    const jThis = locals[0] as JvmObject
    const thisCls = jThis.getNativeField('classRef') as ClassData
    if (thisCls.checkPrimitive() || thisCls.checkArray()) {
      thread.returnStackFrame(null)
      return
    }

    const attrib = thisCls.getAttribute('EnclosingMethod')
    if (attrib) {
      logger.warn('native method missing: Class.getEnclosingMethod0() for reference class')
    }
    thread.returnStackFrame(null)
  },

  'getDeclaredClasses0()[Ljava/lang/Class;': (thread: Thread, locals: any[]) => {
    const jThis = locals[0] as JvmObject
    const thisCls = jThis.getNativeField('classRef') as ClassData

    const clsArrRes = thisCls.getLoader().getClass('[Ljava/lang/Class;')
    if (clsArrRes.status === ResultType.ERROR) {
      thread.throwNewException(clsArrRes.exceptionCls, clsArrRes.msg)
      return
    }
    const clsArrCls = clsArrRes.result as ArrayClassData
    const clsArr = clsArrCls.instantiate()
    const jsClsArr = []

    if (thisCls.checkPrimitive() || thisCls.checkArray()) {
      clsArr.initArray(0)
      thread.returnStackFrame(clsArr)
      return
    }

    const innerclassesAttr = thisCls.getAttribute('InnerClasses') as InnerClasses
    if (innerclassesAttr) {
      for (const cls of innerclassesAttr.classes) {
        if (!cls.outerClass) continue

        const outerRes = cls.outerClass.resolve()
        if (outerRes.status !== ResultType.SUCCESS) {
          continue
        }
        if (outerRes.result !== thisCls) continue
        const innerRes = cls.innerClass.resolve()
        if (innerRes.status !== ResultType.SUCCESS) {
          if (innerRes.status === ResultType.ERROR) {
            thread.throwNewException(innerRes.exceptionCls, innerRes.msg)
          }
          return
        }
        jsClsArr.push(innerRes.result.getJavaObject())
      }
      clsArr.initArray(jsClsArr.length, jsClsArr)
    } else {
      clsArr.initArray(0)
    }

    thread.returnStackFrame(clsArr)
  },

  'isInstance(Ljava/lang/Object;)Z': (thread: Thread, locals: any[]) => {
    const jThis = locals[0] as JvmObject
    const thisCls = jThis.getNativeField('classRef') as ClassData
    const obj = locals[1] as JvmObject | null
    if (obj === null) {
      thread.returnStackFrame(0)
      return
    }
    thread.returnStackFrame(obj.getClass().checkCast(thisCls) ? 1 : 0)
  },

  'getProtectionDomain0()Ljava/security/ProtectionDomain;': (thread: Thread, locals: any[]) => {
    thread.returnStackFrame(
      (locals[0] as JvmObject).getNativeField('classRef').getProtectionDomain()
    )
  }
}

export default functions
