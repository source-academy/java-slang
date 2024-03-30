import { ThreadStatus } from './constants'
import Thread from './thread'
import { Result, ResultType } from './types/Result'
import AbstractSystem from './utils/AbstractSystem'

export type Lib = {
  [className: string]: {
    methods?: { [key: string]: (thread: Thread, locals: any[]) => void }
    blocking?: Thread[]
  }
}

export class JNI {
  private classes: Lib
  private classPath: string
  private system: AbstractSystem

  constructor(classPath: string, system: AbstractSystem, stdlib?: Lib) {
    this.classes = stdlib ?? {}
    this.classPath = classPath
    this.system = system
  }

  /**
   * Registers a lambda function as a native method.
   * @param className
   * @param methodName
   * @param method
   */
  registerNativeMethod(
    className: string,
    methodName: string,
    method: (thread: Thread, locals: any[]) => void
  ) {
    // TODO: should we try to load the class?
    if (!this.classes[className]) {
      this.classes[className] = {
        methods: {}
      }
    }
    this.classes[className].methods![methodName] = method
  }

  /**
   * Gets the lambda function for a native method.
   * Sets the thread to WAITING until the method is loaded if it is not already.
   * @param thread
   * @param className
   * @param methodName
   * @returns
   */
  getNativeMethod(
    thread: Thread,
    className: string,
    methodName: string
  ): Result<(thread: Thread, locals: any[]) => void> {
    // classname not found
    if (!this.classes?.[className]) {
      this.classes[className] = {}
    }

    if (!this.classes?.[className]?.methods) {
      // Methods not yet loaded
      if (!this.classes[className].blocking) {
        this.classes[className].blocking = [thread]
        thread.setStatus(ThreadStatus.WAITING)
        this.system
          .readFile(this.classPath ? this.classPath + '/' + className : className)
          .then(lib => {
            this.classes[className].methods = lib.default
          })
          .catch(_ => {
            this.classes[className].methods = {}
          })
          .finally(() => {
            this.classes[className].blocking?.forEach(thread => {
              thread.setStatus(ThreadStatus.RUNNABLE)
            })
            this.classes[className].blocking = []
          })
      } else {
        this.classes[className].blocking!.push(thread)
        thread.setStatus(ThreadStatus.WAITING)
      }
      return { status: ResultType.DEFER }
    }

    // native method does not exist
    if (!this.classes?.[className]?.methods?.[methodName]) {
      return {
        status: ResultType.ERROR,
        exceptionCls: 'java/lang/UnsatisfiedLinkError',
        msg: `${className}.${methodName} implementation not found`
      }
    }

    return {
      status: ResultType.SUCCESS,
      result: (this.classes[className].methods as any)[methodName]
    }
  }
}
