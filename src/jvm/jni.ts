import { ThreadStatus } from "./constants";
import Thread from "./thread";
import { Result } from "./types/Result";
import AbstractSystem from "./utils/AbstractSystem";

type Lib = {
  [className: string]: {
    loader?: (
      onFinish: (lib: {
        [key: string]: (thread: Thread, locals: any[]) => void;
      }) => void
    ) => void;
    methods?: { [key: string]: (thread: Thread, locals: any[]) => void };
    blocking?: Thread[];
  };
};

export class JNI {
  private classes: Lib;
  private classPath: string;
  private system: AbstractSystem;

  constructor(classPath: string, system: AbstractSystem, stdlib?: Lib) {
    this.classes = stdlib ?? {};
    this.classPath = classPath;
    this.system = system;
  }

  /**
   * Registers a lambda function as a native method
   * @param className
   * @param methodName
   * @param method
   */
  registerNativeMethod(
    className: string,
    methodName: string,
    method: (thread: Thread, locals: any[]) => void
  ) {
    if (!this.classes[className]) {
      this.classes[className] = {
        methods: {},
      };
    }
    this.classes[className].methods![methodName] = method;
  }

  /**
   * Gets the lambda function for a native method
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
      this.classes[className] = {};
    }

    if (!this.classes?.[className]?.methods) {
      if (!this.classes[className].blocking) {
        this.classes[className].blocking = [thread];
        thread.setStatus(ThreadStatus.WAITING);
        if (this.classes[className].loader) {
          // @ts-ignore
          this.classes[className].loader((lib) => {
            this.classes[className].methods = lib;
            this.classes[className].blocking?.forEach((thread) => {
              thread.setStatus(ThreadStatus.RUNNABLE);
            });
            this.classes[className].blocking = [];
          });
        } else {
          this.system
            .readFile(this.classPath + "/" + className)
            .then((lib) => {
              this.classes[className].methods = lib.default;
            })
            .catch((e) => {
              this.classes[className].methods = {};
            })
            .finally(() => {
              this.classes[className].blocking?.forEach((thread) => {
                thread.setStatus(ThreadStatus.RUNNABLE);
              });
              this.classes[className].blocking = [];
            });
        }
      } else {
        this.classes[className].blocking!.push(thread);
        thread.setStatus(ThreadStatus.WAITING);
      }
      return { isDefer: true };
    }

    // native method does not exist
    if (!this.classes?.[className]?.methods?.[methodName]) {
      return {
        exceptionCls: "java/lang/UnsatisfiedLinkError",
        msg: `${className}.${methodName} implementation not found`,
      };
    }

    return { result: (this.classes[className].methods as any)[methodName] };
  }
}
