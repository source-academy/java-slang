import { ThreadStatus } from "../constants";
import { JNI } from "../jni";
import { checkSuccess, SuccessResult } from "../types/Result";
import { ReferenceClassData } from "../types/class/ClassData";
import {
  TestSystem,
  TestClassLoader,
  TestThreadPool,
  TestJVM,
  TestThread,
} from "./test-utils";

const callback = jest.fn();
let threadClass: ReferenceClassData;
let testSystem: TestSystem;
let testLoader: TestClassLoader;
let jni: JNI;

beforeEach(() => {
  testSystem = new TestSystem();
  testLoader = new TestClassLoader(testSystem, "", null);
  testLoader.createClass({
    className: "java/lang/Object",
    loader: testLoader,
    superClass: null,
  });
  threadClass = testLoader.createClass({
    className: "java/lang/Thread",
    loader: testLoader,
  }) as ReferenceClassData;
  jni = new JNI("stdlib");

  jest.resetModules();
  jest.restoreAllMocks();
});

describe("JNI", () => {
  test("JNI: get stdlib implementation", () => {
    const jni2 = new JNI("stdlib", {
      "test/Test": {
        methods: {
          "stdrun()V": callback,
        },
      },
    });
    const tPool = new TestThreadPool(() => {});
    const jvm = new TestJVM(testSystem, testLoader, jni2);
    const thread = new TestThread(
      threadClass as ReferenceClassData,
      jvm,
      tPool
    );

    const getResult = jni2.getNativeMethod(thread, "test/Test", "stdrun()V");
    expect(checkSuccess(getResult)).toBe(true);
    (getResult as SuccessResult<any>).result(thread, []);
    expect(callback).toHaveBeenCalled();
  });

  test("JNI: async loading sets thread to waiting", () => {
    jest.mock("../stdlib/java/lang/Class", () => ({
      "stdrun()V": () => {},
    }));
    const tPool = new TestThreadPool(() => {});
    const jvm = new TestJVM(testSystem, testLoader, jni);
    const thread = new TestThread(
      threadClass as ReferenceClassData,
      jvm,
      tPool
    );

    jni.getNativeMethod(thread, "java/lang/Class", "stdrun()V");
    expect(thread.getStatus()).toBe(ThreadStatus.WAITING);
  });
});
