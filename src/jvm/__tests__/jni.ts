import { JNI } from "../jni";
import { ResultType, SuccessResult } from "../types/Result";
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

beforeEach(() => {
  testSystem = new TestSystem();
  testLoader = new TestClassLoader(testSystem, '', null);
  testLoader.createClass({
    className: 'java/lang/Object',
    loader: testLoader,
    superClass: null,
  });
  threadClass = testLoader.createClass({
    className: 'java/lang/Thread',
    loader: testLoader,
  }) as ReferenceClassData;

  jest.resetModules();
  jest.restoreAllMocks();
});

describe('JNI', () => {
  test('JNI: get stdlib implementation', () => {
    const jni2 = new JNI('stdlib', testSystem, {
      // @ts-ignore
      'test/Test': {
        methods: {
          'stdrun()V': callback,
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

    const getResult = jni2.getNativeMethod(thread, 'test/Test', 'stdrun()V');
    expect(getResult.status === ResultType.SUCCESS).toBe(true);
    (getResult as SuccessResult<any>).result(thread, []);
    expect(callback).toHaveBeenCalled();
  });
});
