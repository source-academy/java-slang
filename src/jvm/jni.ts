import { ThreadStatus } from "./constants";
import Thread from "./thread";
import { Result } from "./types/Result";
import { JavaType } from "./types/reference/Object";
import { parseFieldDescriptor } from "./utils";

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

  constructor(stdlib?: Lib) {
    this.classes = stdlib ?? {};
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
    classPath: string,
    methodName: string
  ): Result<(thread: Thread, locals: any[]) => void> {
    // classname not found
    if (!this.classes?.[className]) {
      this.classes[className] = {};
    }

    // dynamic import class native lambdas
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
          const cp = "../../" + classPath + "/" + className;
          import(cp)
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
      // FIXME: Returns a dummy function for now, but should throw an error
      console.error(`Native method missing: ${className}.${methodName} `);
      const retType = parseFieldDescriptor(methodName.split(")")[1], 0).type;

      switch (retType) {
        case JavaType.array:
          return {
            result: (thread: Thread, ...params: any) => {
              thread.returnStackFrame(null);
            },
          };
        case JavaType.byte:
        case JavaType.int:
        case JavaType.boolean:
        case JavaType.char:
        case JavaType.short:
          return {
            result: (thread: Thread, ...params: any) => {
              thread.returnStackFrame(0);
            },
          };
        case JavaType.double:
          return {
            result: (thread: Thread, ...params: any) => {
              thread.returnStackFrame64(0.0);
            },
          };
        case JavaType.float:
          return {
            result: (thread: Thread, ...params: any) => {
              thread.returnStackFrame(0.0);
            },
          };
        case JavaType.long:
          return {
            result: (thread: Thread, ...params: any) => {
              thread.returnStackFrame64(BigInt(0));
            },
          };
        case JavaType.reference:
          return {
            result: (thread: Thread, ...params: any) => {
              thread.returnStackFrame(null);
            },
          };
        case JavaType.void:
          return {
            result: (thread: Thread, ...params: any) => {
              thread.returnStackFrame();
            },
          };
        default:
          return {
            result: (thread: Thread, ...params: any) => {
              thread.returnStackFrame();
            },
          };
      }
    }

    return { result: (this.classes[className].methods as any)[methodName] };
  }
}
