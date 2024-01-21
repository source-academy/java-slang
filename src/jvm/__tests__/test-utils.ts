import JVM from "..";
import { CONSTANT_TAG } from "../../ClassFile/constants/constants";
import { OPCODE } from "../../ClassFile/constants/instructions";
import { ACCESS_FLAGS, ClassFile } from "../../ClassFile/types";
import { AttributeInfo, CodeAttribute } from "../../ClassFile/types/attributes";
import {
  ConstantInfo,
  ConstantUtf8Info,
} from "../../ClassFile/types/constants";
import { FIELD_FLAGS, FieldInfo } from "../../ClassFile/types/fields";
import { METHOD_FLAGS, MethodInfo } from "../../ClassFile/types/methods";
import AbstractClassLoader from "../ClassLoader/AbstractClassLoader";
import { CLASS_STATUS, ThreadStatus } from "../constants";
import { JNI } from "../jni";
import Thread from "../thread";
import { AbstractThreadPool } from "../threadpool";
import { ImmediateResult, checkError, checkSuccess } from "../types/Result";
import {
  PrimitiveClassData,
  ReferenceClassData,
  ArrayClassData,
  ClassData,
} from "../types/class/ClassData";
import { Field } from "../types/class/Field";
import { Method } from "../types/class/Method";
import { JvmArray } from "../types/reference/Array";
import { JvmObject, JavaType } from "../types/reference/Object";
import { primitiveTypeToName } from "../utils";
import AbstractSystem from "../utils/AbstractSystem";

export class TestClassLoader extends AbstractClassLoader {
  getJavaObject(): JvmObject | null {
    return null;
  }
  private primitiveClasses: { [className: string]: PrimitiveClassData } = {};
  getPrimitiveClass(className: string): PrimitiveClassData {
    if (this.primitiveClasses[className]) {
      return this.primitiveClasses[className];
    }
    const internalName = primitiveTypeToName(className as JavaType);
    if (!internalName) {
      throw new Error(`Invalid primitive class name: ${className}`);
    }

    const cls = new PrimitiveClassData(this, internalName);
    this.primitiveClasses[internalName] = cls;
    return cls;
  }

  private loadArray(
    className: string,
    componentCls: ReferenceClassData
  ): ImmediateResult<ArrayClassData> {
    // #region load array superclasses/interfaces
    const objRes = this.getClass("java/lang/Object");
    if (checkError(objRes)) {
      return objRes;
    }
    const cloneableRes = this.getClass("java/lang/Cloneable");
    if (checkError(cloneableRes)) {
      return cloneableRes;
    }
    const serialRes = this.getClass("java/io/Serializable");
    if (checkError(serialRes)) {
      return serialRes;
    }
    // #endregion

    const arrayClass = new ArrayClassData(
      ACCESS_FLAGS.ACC_PUBLIC,
      className,
      this,
      componentCls,
      () => {}
    );

    this.loadClass(arrayClass);
    return { result: arrayClass };
  }

  load(className: string): ImmediateResult<ReferenceClassData> {
    const stubRef = this.createClass({
      className: className,
      loader: this,
    }) as ReferenceClassData;
    return { result: this.loadClass(stubRef) as ReferenceClassData };
  }

  loadTestClassRef(className: string, ref: ClassData) {
    this.loadedClasses[className] = ref;
  }

  createClass(options: {
    className?: string;
    loader?: TestClassLoader;
    superClass?: ReferenceClassData | null;
    constants?: ((c: ConstantInfo[]) => ConstantInfo)[];
    interfaces?: ReferenceClassData[];
    methods?: {
      accessFlags?: METHOD_FLAGS[];
      name?: string;
      descriptor?: string;
      attributes?: AttributeInfo[];
      code: DataView;
      exceptionTable?: {
        startPc: number;
        endPc: number;
        handlerPc: number;
        catchType: string;
      }[];
    }[];
    fields?: {
      accessFlags?: FIELD_FLAGS[];
      name?: string;
      descriptor?: string;
      attributes?: Array<AttributeInfo>;
      data?: any;
    }[];
    flags?: number;
    status?: CLASS_STATUS;
    arrayComponent?: ClassData;
  }) {
    let constantPool: ConstantInfo[] = [
      { tag: 7, nameIndex: 0 }, // dummy
      { tag: 7, nameIndex: 2 }, // superclass
      {
        tag: 1,
        length: 16,
        value: options.superClass
          ? options.superClass?.getClassname()
          : "java/lang/Object",
      }, // superclass name
      { tag: 7, nameIndex: 4 },
      {
        tag: 1,
        length: options.className?.length ?? 9,
        value: options.className ?? "Test/Test",
      },
      {
        tag: CONSTANT_TAG.Utf8,
        length: 4,
        value: "Code",
      },
    ];
    if (options.constants) {
      options.constants.forEach((func) => {
        constantPool.push(func(constantPool));
      });
    }

    const methods = options.methods
      ? options.methods.map((method, index) => {
          constantPool.push({
            tag: CONSTANT_TAG.Utf8,
            length: 3,
            value: method.descriptor ?? `()V`,
          });

          constantPool.push({
            tag: CONSTANT_TAG.Utf8,
            length: 5,
            value: method.name ?? `test${index}`,
          });
          constantPool.push({
            tag: CONSTANT_TAG.Utf8,
            length: 4,
            value: "Test",
          });
          constantPool.push({
            tag: CONSTANT_TAG.NameAndType,
            nameIndex: constantPool.length - 2,
            descriptorIndex: constantPool.length - 3,
          });
          constantPool.push({
            tag: CONSTANT_TAG.Class,
            nameIndex: constantPool.length - 2,
          });
          constantPool.push({
            tag: CONSTANT_TAG.Methodref,
            classIndex: constantPool.length - 1,
            nameAndTypeIndex: constantPool.length - 2,
          });

          const temp: MethodInfo = {
            accessFlags: (method.accessFlags ?? []).reduce((a, b) => a | b, 0),
            nameIndex: constantPool.length - 5,
            descriptorIndex: constantPool.length - 6,
            attributes: method.attributes ?? [],
            attributesCount: method.attributes?.length ?? 0,
          };

          temp.attributes.push({
            attributeNameIndex: 5,
            attributeLength: 0,
            maxStack: 100,
            maxLocals: 0,
            codeLength: 0,
            code: method.code,
            exceptionTableLength: method.exceptionTable?.length ?? 0,
            exceptionTable:
              method.exceptionTable?.map((handler) => {
                if (handler.catchType === "") {
                  return {
                    startPc: handler.startPc,
                    endPc: handler.endPc,
                    handlerPc: handler.handlerPc,
                    catchType: 0,
                  };
                }

                const catchType = constantPool.length;
                constantPool.push({
                  tag: CONSTANT_TAG.Class,
                  nameIndex: constantPool.length + 1,
                });
                constantPool.push({
                  tag: CONSTANT_TAG.Utf8,
                  value: handler.catchType,
                } as ConstantUtf8Info);
                return {
                  startPc: handler.startPc,
                  endPc: handler.endPc,
                  handlerPc: handler.handlerPc,
                  catchType,
                };
              }) ?? [],
            attributesCount: 0,
            attributes: [],
          } as CodeAttribute);

          return temp;
        })
      : [];
    const loader =
      options.loader ?? new TestClassLoader(new TestSystem(), "test/", null);

    const fields: FieldInfo[] = options.fields
      ? options.fields.map((field, index) => {
          constantPool.push({
            tag: CONSTANT_TAG.Utf8,
            length: 3,
            value: field.descriptor ?? `I`,
          });
          constantPool.push({
            tag: CONSTANT_TAG.Utf8,
            length: 6,
            value: field.name ?? `field${index}`,
          });
          constantPool.push({
            tag: CONSTANT_TAG.Utf8,
            length: 4,
            value: options.className ?? "Test",
          });
          constantPool.push({
            tag: CONSTANT_TAG.NameAndType,
            nameIndex: constantPool.length - 2,
            descriptorIndex: constantPool.length - 3,
          });
          constantPool.push({
            tag: CONSTANT_TAG.Class,
            nameIndex: constantPool.length - 2,
          });
          constantPool.push({
            tag: CONSTANT_TAG.Methodref,
            classIndex: constantPool.length - 1,
            nameAndTypeIndex: constantPool.length - 2,
          });

          return {
            accessFlags: (field.accessFlags ?? []).reduce((a, b) => a | b, 0),
            nameIndex: constantPool.length - 5,
            descriptorIndex: constantPool.length - 6,
            attributes: field.attributes ?? [],
            attributesCount: field.attributes?.length ?? 0,
          };
        })
      : [];

    const interfaces = options.interfaces
      ? options.interfaces.map(
          (interfaceCls: ReferenceClassData, index: number) => {
            const clsIndex = constantPool.length;
            constantPool.push({
              tag: CONSTANT_TAG.Class,
              nameIndex: clsIndex + 1,
            });
            constantPool.push({
              tag: CONSTANT_TAG.Utf8,
              value: interfaceCls.getClassname(),
            } as ConstantUtf8Info);
            return clsIndex;
          }
        )
      : [];

    const clsRef = options.arrayComponent
      ? new ArrayClassData(
          options.flags ?? 33,
          options.className ?? "[LTest",
          loader,
          options.arrayComponent,
          () => {}
        )
      : new ReferenceClassData(
          {
            magic: 0xcafebabe,
            minorVersion: 0,
            majorVersion: 52,
            constantPoolCount: constantPool.length,
            constantPool: constantPool,
            accessFlags: options.flags ?? 33,
            thisClass: constantPool.length - 5,
            superClass: options.superClass === null ? 0 : 1,
            interfacesCount: interfaces.length,
            interfaces,
            fieldsCount: fields.length,
            fields: fields,
            methodsCount: methods.length,
            methods: methods,
            attributesCount: 0,
            attributes: [],
          },
          loader,
          options.className ?? "Test/Test",
          () => {}
        );
    clsRef.status = options.status ?? CLASS_STATUS.PREPARED;

    loader.loadTestClassRef(options.className ?? "Test/Test", clsRef);
    return clsRef;
  }

  protected _loadArrayClass(
    className: string,
    componentCls: ReferenceClassData
  ): ImmediateResult<ArrayClassData> {
    return this.loadArray(className, componentCls);
  }
}

export class TestSystem extends AbstractSystem {
  stdout(message: string): void {
    throw new Error("Method not implemented.");
  }
  stderr(message: string): void {
    throw new Error("Method not implemented.");
  }
  readFile(path: string): ClassFile {
    throw new Error("Method not implemented.");
  }
}

export class TestThreadPool extends AbstractThreadPool {
  constructor(onEmpty: () => void) {
    super(onEmpty);
  }
  addThread(thread: Thread): void {}
  updateStatus(thread: Thread, oldStatus: ThreadStatus): void {}

  quantumOver(thread: Thread): void {}
  run(): void {}
}

export class TestThread extends Thread {
  constructor(
    threadClass: ReferenceClassData,
    jvm: JVM,
    tpool: AbstractThreadPool
  ) {
    super(threadClass, jvm, tpool, new JvmObject(threadClass));
    this.setStatus(ThreadStatus.RUNNABLE);
  }
}

export class TestJVM extends JVM {
  testLoader: TestClassLoader;
  tinternedStrings: {
    [key: string]: JvmObject;
  } = {};
  tJNI: JNI;
  constructor(
    nativeSystem: AbstractSystem,
    testLoader: TestClassLoader,
    testJNI: JNI,
    options?: {
      javaClassPath?: string;
      userDir?: string;
    }
  ) {
    super(nativeSystem, options);
    this.testLoader = testLoader;
    this.tJNI = testJNI;
  }

  checkInitialized(): boolean {
    return true;
  }

  private tnewCharArr(str: string): ImmediateResult<JvmArray> {
    const cArrRes = this.testLoader.getClass("[C");
    if (checkError(cArrRes)) {
      return cArrRes;
    }

    const cArrCls = cArrRes.result;
    const cArr = cArrCls.instantiate() as JvmArray;
    const jsArr = [];
    for (let i = 0; i < str.length; i++) {
      jsArr.push(str.charCodeAt(i));
    }
    cArr.initArray(str.length, jsArr);
    return { result: cArr };
  }

  private tnewString(str: string): ImmediateResult<JvmObject> {
    const charArr = this.tnewCharArr(str);

    if (!checkSuccess(charArr)) {
      return charArr;
    }

    const strRes = this.testLoader.getClass("java/lang/String");

    if (checkError(strRes)) {
      return strRes;
    }
    const strCls = strRes.result;
    const strObj = strCls.instantiate();
    const fieldRef = strCls.lookupField("value[C") as Field;
    strObj.putField(fieldRef as Field, charArr.result);
    return { result: strObj };
  }

  getInternedString(str: string) {
    if (this.tinternedStrings[str]) {
      return this.tinternedStrings[str];
    }
    const strRes = this.tnewString(str);
    if (checkError(strRes)) {
      throw new Error("testString creation failed");
    }

    this.tinternedStrings[str] = strRes.result;
    return this.tinternedStrings[str];
  }

  getJNI(): JNI {
    return this.tJNI;
  }
}

export const setupTest = () => {
  const jni = new JNI("stdlib");
  const testSystem = new TestSystem();
  const testLoader = new TestClassLoader(testSystem, "", null);

  // #region create dummy classes
  const dispatchUncaughtCode = new DataView(new ArrayBuffer(8));
  dispatchUncaughtCode.setUint8(0, OPCODE.RETURN);
  testLoader.createClass({
    className: "java/lang/Object",
    loader: testLoader,
    superClass: null,
  });
  const threadClass = testLoader.createClass({
    className: "java/lang/Thread",
    methods: [
      {
        accessFlags: [METHOD_FLAGS.ACC_PROTECTED],
        name: "dispatchUncaughtException",
        descriptor: "(Ljava/lang/Throwable;)V",
        attributes: [],
        code: dispatchUncaughtCode,
      },
    ],
    loader: testLoader,
  }) as ReferenceClassData;
  const clsClass = testLoader.createClass({
    className: "java/lang/Class",
    loader: testLoader,
    fields: [
      {
        accessFlags: [FIELD_FLAGS.ACC_PUBLIC],
        name: "classLoader",
        descriptor: "Ljava/lang/ClassLoader;",
        attributes: [],
      },
    ],
  });
  testLoader.createClass({
    className: "java/lang/Cloneable",
    loader: testLoader,
    flags: ACCESS_FLAGS.ACC_INTERFACE | ACCESS_FLAGS.ACC_PUBLIC,
  });
  testLoader.createClass({
    className: "java/io/Serializable",
    loader: testLoader,
    flags: ACCESS_FLAGS.ACC_INTERFACE | ACCESS_FLAGS.ACC_PUBLIC,
  });
  const strClass = testLoader.createClass({
    className: "java/lang/String",
    loader: testLoader,
    fields: [
      {
        accessFlags: [FIELD_FLAGS.ACC_FINAL, FIELD_FLAGS.ACC_PRIVATE],
        name: "value",
        descriptor: "[C",
        attributes: [],
      },
    ],
  });

  const code = new DataView(new ArrayBuffer(100));
  const testClass = testLoader.createClass({
    className: "Test",
    constants: [
      () => ({
        tag: CONSTANT_TAG.Utf8,
        length: 3,
        value: "()V",
      }),
      () => ({
        tag: CONSTANT_TAG.Utf8,
        length: 5,
        value: "test0",
      }),
      () => ({
        tag: CONSTANT_TAG.Utf8,
        length: 4,
        value: "Test",
      }),
      (cPool) => ({
        tag: CONSTANT_TAG.NameAndType,
        nameIndex: cPool.length - 2,
        descriptorIndex: cPool.length - 3,
      }),
      (cPool) => ({
        tag: CONSTANT_TAG.Class,
        nameIndex: cPool.length - 2,
      }),
      (cPool) => {
        return {
          tag: CONSTANT_TAG.Methodref,
          classIndex: cPool.length - 1,
          nameAndTypeIndex: cPool.length - 2,
        };
      },
    ],
    methods: [
      {
        accessFlags: [METHOD_FLAGS.ACC_STATIC],
        name: "test0",
        descriptor: "()V",
        attributes: [],
        code: code,
      },
    ],
    loader: testLoader,
  });
  const method = testClass.getMethod("test0()V") as Method;
  // #endregion

  // #region exception classes
  const Throwable = testLoader.createClass({
    className: "java/lang/Throwable",
    loader: testLoader,
    flags: ACCESS_FLAGS.ACC_PUBLIC,
  });
  const NullPointerException = testLoader.createClass({
    className: "java/lang/NullPointerException",
    superClass: Throwable as ReferenceClassData,
    loader: testLoader,
    flags: ACCESS_FLAGS.ACC_PUBLIC,
  });
  const ArithmeticException = testLoader.createClass({
    className: "java/lang/ArithmeticException",
    superClass: Throwable as ReferenceClassData,
    loader: testLoader,
    flags: ACCESS_FLAGS.ACC_PUBLIC,
  });
  const IllegalAccessError = testLoader.createClass({
    className: "java/lang/IllegalAccessError",
    superClass: Throwable as ReferenceClassData,
    loader: testLoader,
    flags: ACCESS_FLAGS.ACC_PUBLIC,
  });
  testLoader.createClass({
    className: "java/lang/NegativeArraySizeException",
    loader: testLoader,
    flags: ACCESS_FLAGS.ACC_PUBLIC,
  });

  //   #endregion

  const tPool = new TestThreadPool(() => {});
  const jvm = new TestJVM(testSystem, testLoader, jni);
  const thread = new TestThread(threadClass as ReferenceClassData, jvm, tPool);

  return {
    jni,
    testSystem,
    testLoader,
    thread,
    method,
    code,
    classes: {
      threadClass,
      testClass,
      clsClass,
      strClass,
      Throwable,
      NullPointerException,
      ArithmeticException,
      IllegalAccessError,
    },
    tPool,
  };
};
