import { ApplicationClassLoader } from "./ClassLoader/AbstractClassLoader";
import BootstrapClassLoader from "./ClassLoader/BootstrapClassLoader";
import { ThreadStatus } from "./constants";
import { JNI } from "./jni";
import { InternalStackFrame, JavaStackFrame } from "./stackframe";
import Thread from "./thread";
import { AbstractThreadPool, RoundRobinThreadPool } from "./threadpool";
import { checkError, checkSuccess } from "./types/Result";
import { ReferenceClassData } from "./types/class/ClassData";
import { JvmObject } from "./types/reference/Object";
import { UnsafeHeap } from "./unsafe-heap";
import { js2jString } from "./utils";
import AbstractSystem from "./utils/AbstractSystem";

export default class JVM {
  private jvmOptions: {
    javaClassPath: string;
    userDir: string;
  };
  private isInitialized = false;

  private bootstrapClassLoader: BootstrapClassLoader;
  private applicationClassLoader: ApplicationClassLoader;
  private nativeSystem: AbstractSystem;
  private jni: JNI;
  private threadpool: AbstractThreadPool;

  private internedStrings: { [key: string]: JvmObject } = {};
  private unsafeHeap: UnsafeHeap = new UnsafeHeap();

  constructor(
    nativeSystem: AbstractSystem,
    options?: {
      javaClassPath?: string;
      userDir?: string;
    }
  ) {
    this.jvmOptions = {
      javaClassPath: "natives",
      userDir: "example",
      ...options,
    };
    this.nativeSystem = nativeSystem;
    this.bootstrapClassLoader = new BootstrapClassLoader(
      this.nativeSystem,
      this.jvmOptions.javaClassPath
    );
    this.jni = new JNI();
    this.threadpool = new RoundRobinThreadPool(() => {});
    this.applicationClassLoader = new ApplicationClassLoader(
      this.nativeSystem,
      this.jvmOptions.userDir,
      this.bootstrapClassLoader
    );
  }

  run(className: string, onInitialized?: () => void) {
    // #region load classes
    const objRes = this.bootstrapClassLoader.getClass("java/lang/Object");
    const tRes = this.bootstrapClassLoader.getClass("java/lang/Thread");
    const sysRes = this.bootstrapClassLoader.getClass("java/lang/System");
    const clsRes = this.bootstrapClassLoader.getClass("java/lang/Class");
    const tgRes = this.bootstrapClassLoader.getClass("java/lang/ThreadGroup");
    const unsafeRes = this.bootstrapClassLoader.getClass("sun/misc/Unsafe");
    if (
      checkError(objRes) ||
      checkError(sysRes) ||
      checkError(tRes) ||
      checkError(tgRes) ||
      checkError(clsRes) ||
      checkError(unsafeRes)
    ) {
      throw new Error("Initialization classes not found");
    }
    const sysCls = sysRes.result;
    const threadCls = tRes.result;
    const threadGroupCls = tgRes.result;
    // #endregion

    const javaObject = threadCls.instantiate();
    const mainThread = new Thread(
      threadCls as ReferenceClassData,
      this,
      this.threadpool,
      javaObject
    );
    javaObject.putNativeField("thread", mainThread);

    const tasks: (() => void)[] = [];
    // #region initialize threadgroup object
    const tgInitRes = threadGroupCls.initialize(mainThread);
    if (!checkSuccess(tgInitRes)) {
      throw new Error("ThreadGroup initialization failed");
    }
    const initialTg = threadGroupCls.instantiate();
    tasks.push(() => initialTg.initialize(mainThread));
    // #endregion

    // #region initialize Thread class
    const tgfr = threadCls.lookupField("groupLjava/lang/ThreadGroup;");
    const pFr = threadCls.lookupField("priorityI");
    if (!tgfr || !pFr) {
      throw new Error("Initial thread fields not found");
    }
    const javaThread = mainThread.getJavaObject();
    javaThread.putField(tgfr, initialTg);
    javaThread.putField(pFr, 1);
    tasks.push(() => threadCls.initialize(mainThread));
    // #endregion

    // #region initialize thread object
    tasks.push(() => mainThread.initialize(mainThread));
    // #endregion

    // #region initialize system class
    const sInitMr = sysCls.getMethod("initializeSystemClass()V");
    if (!sInitMr) {
      throw new Error("System initialization method not found");
    }

    tasks.push(() =>
      mainThread.invokeStackFrame(
        new InternalStackFrame(
          sysCls as ReferenceClassData,
          sInitMr,
          0,
          [],
          () => {
            this.isInitialized = true;
            onInitialized && onInitialized();
          }
        )
      )
    );
    // #endregion

    // #region run main

    // convert args to Java String[]
    const mainRes = this.applicationClassLoader.getClass(className);
    if (checkError(mainRes)) {
      throw new Error("Main class not found");
    }

    const mainCls = mainRes.result;

    const mainMethod = mainCls.getMethod("main([Ljava/lang/String;)V");
    if (!mainMethod) {
      throw new Error("Main method not found");
    }

    tasks.push(() => mainCls.initialize(mainThread));
    tasks.push(() => {
      mainThread.invokeStackFrame(
        new JavaStackFrame(mainCls, mainMethod, 0, [])
      );
    });
    // #endregion

    tasks.reverse().forEach((task) => task());
    mainThread.setStatus(ThreadStatus.RUNNABLE);

    this.threadpool.addThread(mainThread);
    this.threadpool.run();
  }

  getInternedString(str: string) {
    if (this.internedStrings[str]) {
      return this.internedStrings[str];
    }
    this.internedStrings[str] = js2jString(this.bootstrapClassLoader, str);
    return this.internedStrings[str];
  }

  getBootstrapClassLoader() {
    return this.bootstrapClassLoader;
  }

  getUnsafeHeap() {
    return this.unsafeHeap;
  }

  getSystem() {
    return this.nativeSystem;
  }

  getJNI() {
    return this.jni;
  }

  checkInitialized() {
    return this.isInitialized;
  }
}
