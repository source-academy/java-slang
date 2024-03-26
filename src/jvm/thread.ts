import JVM from "./jvm";
import { ThreadStatus } from "./constants";
import { StackFrame, InternalStackFrame, JavaStackFrame } from "./stackframe";
import { ThreadPool } from "./threadpool";
import { Code } from "./types/class/Attributes";
import { ReferenceClassData, ClassData } from "./types/class/ClassData";
import { Method } from "./types/class/Method";
import { JvmObject } from "./types/reference/Object";
import { ImmediateResult, ResultType } from "./types/Result";
import { INACCESSIBLE } from "./utils";

export default class Thread {
  private static threadIdCounter = 0;

  private status: ThreadStatus = ThreadStatus.NEW;
  private stack: StackFrame[];
  private stackPointer: number;
  private javaObject: JvmObject;
  private threadClass: ReferenceClassData;
  private jvm: JVM;
  private threadId: number;

  private maxRecursionDepth = 1000;
  private quantumLeft: number = 0;
  private tpool: ThreadPool;

  private isShuttingDown = false;

  constructor(
    threadClass: ReferenceClassData,
    jvm: JVM,
    tpool: ThreadPool,
    threadObj: JvmObject
  ) {
    this.jvm = jvm;
    this.threadClass = threadClass;
    this.stack = [];
    this.stackPointer = -1;
    this.javaObject = threadObj;
    this.tpool = tpool;

    this.threadId = Thread.threadIdCounter;
    Thread.threadIdCounter += 1;
  }

  initialize(thread: Thread) {
    const init = this.threadClass.getMethod('<init>()V') as Method;
    if (!init) {
      throw new Error('Thread constructor not found');
    }

    thread.invokeStackFrame(
      new InternalStackFrame(
        this.threadClass,
        init,
        0,
        [this.javaObject],
        () => {}
      )
    );
  }

  runFor(quantum: number) {
    if (this.quantumLeft > 0) {
      return;
    }
    this.quantumLeft = quantum;

    while (
      this.quantumLeft &&
      this.stack.length > 0 &&
      this.status === ThreadStatus.RUNNABLE
    ) {
      this.peekStackFrame().run(this);
      this.quantumLeft -= 1;

      if (this.stack.length === 0 && !this.isShuttingDown) {
        this._exit();
      }
    }

    this.quantumLeft = 0;
    this.tpool.quantumOver(this);
  }

  /**
   * Used internally to run the thread without terminating the thread at the end.
   */
  _run() {
    while (this.stack.length > 0) {
      this.peekStackFrame().run(this);
    }
  }

  _exit() {
    if (this.isShuttingDown) {
      return;
    }

    this.isShuttingDown = true;
    const monitor = this.javaObject.getMonitor();
    monitor.enter(this, () => {
      const exitMethod = this.threadClass.getMethod('exit()V');
      if (!exitMethod) {
        throw new Error('Thread exit method not found');
      }

      this.invokeStackFrame(
        new InternalStackFrame(
          this.threadClass,
          exitMethod,
          0,
          [this.javaObject],
          () => {
            monitor.notifyAll(this);
            monitor.exit(this);
            this.setStatus(ThreadStatus.TERMINATED);
          }
        )
      );
    });
  }

  // #region getters

  getJVM() {
    return this.jvm;
  }

  getStatus() {
    return this.status;
  }

  getJavaObject() {
    return this.javaObject;
  }

  getFrames() {
    return this.stack;
  }

  getPC(): number {
    return this.stack[this.stackPointer].pc;
  }

  getThreadPool(): ThreadPool {
    return this.tpool;
  }

  /**
   * Gets class of current method
   * @returns
   */
  getClass(): ClassData {
    return this.stack[this.stackPointer].class;
  }

  getMethod(): Method {
    return this.stack[this.stackPointer].method;
  }

  getCode(): DataView {
    return (this.stack[this.stackPointer].method._getCode() as Code).code;
  }

  getThreadId() {
    return this.threadId;
  }

  // #endregion

  // #region setters

  setStatus(status: ThreadStatus) {
    const oldStatus = this.status;
    this.status = status;
    this.tpool.updateStatus(this, oldStatus);
  }

  offsetPc(pc: number) {
    const sf = this.stack[this.stackPointer];

    // no more stackframes or native method
    if (!sf || sf.checkNative()) {
      return;
    }

    this.stack[this.stackPointer].pc += pc;
  }

  setPc(pc: number) {
    this.stack[this.stackPointer].pc = pc;
  }

  // #endregion

  // #region stack

  /**
   * Returns true if there are no stackframes left.
   */
  isStackEmpty() {
    return this.stack.length === 0;
  }

  peekStackFrame() {
    return this.stack[this.stackPointer];
  }

  /**
   * Pushes a value onto the stack. Throws an error if the stack is full.
   * @param value
   * @returns true if successful, false if stack overflow
   */
  pushStack(value: JvmObject | number | bigint | null): boolean {
    if (
      this.stack[this.stackPointer].maxStack >= 0 &&
      this.stack[this.stackPointer].operandStack.length + 1 >
        this.stack[this.stackPointer].maxStack
    ) {
      console.log(this.stack[this.stackPointer]);
      this.throwNewException('java/lang/StackOverflowError', '');
      return false;
    }

    this.stack[this.stackPointer].operandStack.push(value);
    return true;
  }

  /**
   * Pushes a wide value onto the stack. Throws an error if the stack is full.
   * @param value
   * @returns true if successful, false if stack overflow
   */
  pushStack64(value: bigint | number): boolean {
    if (
      this.stack[this.stackPointer].maxStack >= 0 &&
      this.stack[this.stackPointer].operandStack.length + 2 >
        this.stack[this.stackPointer].maxStack
    ) {
      this.throwNewException('java/lang/StackOverflowError', '');
      return false;
    }
    this.stack[this.stackPointer].operandStack.push(value);
    this.stack[this.stackPointer].operandStack.push(INACCESSIBLE);
    return true;
  }

  /**
   * Pops a wide value from the stack. Throws an error if the stack is empty.
   * @returns result of the pop
   */
  popStack64(): ImmediateResult<any> {
    if (
      this.stackPointer >= this.stack.length ||
      this.stack?.[this.stackPointer]?.operandStack?.length <= 1
    ) {
      this.throwNewException('java/lang/RuntimeException', 'Stack Underflow');
      return {
        status: ResultType.ERROR,
        exceptionCls: 'java/lang/RuntimeException',
        msg: 'Stack Underflow',
      };
    }
    this.stack?.[this.stackPointer]?.operandStack?.pop();
    const value = this.stack?.[this.stackPointer]?.operandStack?.pop();
    return { status: ResultType.SUCCESS, result: value };
  }

  /**
   * Pops a value from the stack. Throws an error if the stack is empty.
   * @returns result of the pop
   */
  popStack(): ImmediateResult<any> {
    if (
      this.stackPointer >= this.stack.length ||
      this.stack?.[this.stackPointer]?.operandStack?.length <= 0
    ) {
      this.throwNewException('java/lang/RuntimeException', 'Stack Underflow');
      return {
        status: ResultType.ERROR,
        exceptionCls: 'java/lang/RuntimeException',
        msg: 'Stack Underflow',
      };
    }
    const value = this.stack?.[this.stackPointer]?.operandStack?.pop();
    return { status: ResultType.SUCCESS, result: value };
  }

  private _returnSF(ret?: any, err?: JvmObject, isWide?: boolean) {
    const sf = this.stack.pop();
    this.stackPointer -= 1;

    if (this.stackPointer < -1 || sf === undefined) {
      this.throwNewException('java/lang/RuntimeException', 'Stack Underflow');
      throw new Error('Stack Underflow');
    }

    if (err) {
      sf.onError(this, err);
      return sf;
    }

    isWide ? sf.onReturn64(this, ret) : sf.onReturn(this, ret);
    return sf;
  }

  returnStackFrame(ret?: any, err?: JvmObject): StackFrame {
    return this._returnSF(ret, err, false);
  }

  returnStackFrame64(ret?: any, err?: JvmObject): StackFrame {
    return this._returnSF(ret, err, true);
  }

  invokeStackFrame(sf: StackFrame) {
    if (this.stackPointer > this.maxRecursionDepth) {
      this.throwNewException(
        'java/lang/StackOverflowError',
        'maximum recursion depth exceeded'
      );
      return;
    }

    if (sf.method.checkSynchronized()) {
      if (sf.method.checkStatic()) {
        sf.method.getClass().getJavaObject().getMonitor().enter(this);
      } else {
        sf.locals[0].getMonitor().enter(this);
      }
    }

    if (sf) this.stack.push(sf);
    this.stackPointer += 1;
  }

  /**
   * Creates an InternalStackFrame and pushes it onto the stack.
   * Workaround for circular dependencies in JvmObject
   */
  _invokeInternal(
    cls: ReferenceClassData,
    method: Method,
    pc: number,
    locals: any[],
    callback: (ret: any, err?: any) => void
  ) {
    const sf = new InternalStackFrame(cls, method, pc, locals, callback);
    this.invokeStackFrame(sf);
  }

  // #endregion

  // #region locals

  storeLocal(index: number, value: JvmObject | number | bigint | null) {
    this.stack[this.stackPointer].locals[index] = value;
  }

  storeLocal64(index: number, value: JvmObject | number | bigint | null) {
    this.stack[this.stackPointer].locals[index] = value;
    this.stack[this.stackPointer].locals[index + 1] = INACCESSIBLE;
  }

  loadLocal(index: number): JvmObject | number | bigint | null {
    return this.stack[this.stackPointer].locals[index];
  }

  // #endregion

  // #region exceptions

  throwNewException(className: string, msg: string) {
    // Initialize exception
    const clsRes = this.getClass().getLoader().getClass(className);
    if (clsRes.status === ResultType.ERROR) {
      if (clsRes.exceptionCls === 'java/lang/ClassNotFoundException') {
        throw new Error(
          'Infinite loop detected: ClassNotFoundException not found'
        );
      }

      this.throwNewException(clsRes.exceptionCls, clsRes.msg);
      return;
    }

    const exceptionCls = clsRes.result;
    const initRes = exceptionCls.initialize(this);
    if (initRes.status !== ResultType.SUCCESS) {
      if (initRes.status === ResultType.ERROR) {
        this.throwNewException(initRes.exceptionCls, initRes.msg);
      }
      return;
    }

    this.throwException(exceptionCls.instantiate());
  }

  throwException(exception: JvmObject) {
    const exceptionCls = exception.getClass();

    // Find a stackframe with appropriate exception handlers
    while (this.stack.length > 0) {
      const method = this.getMethod();

      // Native methods cannot handle exceptions
      if (method.checkNative()) {
        this.returnStackFrame(null, exception);
        continue;
      }

      const eTable = method.getExceptionHandlers();
      const pc = this.getPC();

      for (const handler of eTable) {
        let handlerCls: ClassData | null;
        if (handler.catchType !== null) {
          const clsResolution = handler.catchType.resolve();
          if (clsResolution.status === ResultType.ERROR) {
            this.throwNewException(
              clsResolution.exceptionCls,
              clsResolution.msg
            );
            return;
          }
          handlerCls = clsResolution.result;
        } else {
          handlerCls = null;
        }

        if (
          pc >= handler.startPc &&
          pc < handler.endPc &&
          (handlerCls === null || exceptionCls.checkCast(handlerCls))
        ) {
          // clear the operand stack and push exception
          this.stack[this.stackPointer].operandStack = [exception];
          this.setPc(handler.handlerPc);
          return;
        }
      }

      // No handler found, unwind stack
      if (method.checkSynchronized()) {
        if (method.checkStatic()) {
          method.getClass().getJavaObject().getMonitor().exit(this);
        } else {
          (this.loadLocal(0) as JvmObject).getMonitor().exit(this);
        }
      }
      this.returnStackFrame(null, exception);
    }

    if (!this.getJVM().checkInitialized()) {
      throw new Error('Exception in JVM initialization');
    }

    const unhandledMethod = this.threadClass.getMethod(
      'dispatchUncaughtException(Ljava/lang/Throwable;)V'
    );
    if (unhandledMethod === null) {
      throw new Error(
        'Uncaught exception could not be thrown: dispatchUncaughtException(Ljava/lang/Throwable;)V not found'
      );
    }
    if (!exception) {
      throw new Error('Undefined exception thrown');
    }

    this.invokeStackFrame(
      new JavaStackFrame(this.threadClass, unhandledMethod, 0, [
        this.getJavaObject(),
        exception,
      ])
    );
  }

  // #endregion
}
