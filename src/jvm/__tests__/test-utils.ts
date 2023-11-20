import JVM from "..";
import { CONSTANT_TAG } from "../../ClassFile/constants/constants";
import { OPCODE } from "../../ClassFile/constants/instructions";
import { ClassFile } from "../../ClassFile/types";
import { CodeAttribute, AttributeInfo } from "../../ClassFile/types/attributes";
import { ConstantInfo, ConstantUtf8Info } from "../../ClassFile/types/constants";
import { FIELD_FLAGS, FieldInfo } from "../../ClassFile/types/fields";
import { MethodInfo, METHOD_FLAGS } from "../../ClassFile/types/methods";
import AbstractClassLoader from "../ClassLoader/AbstractClassLoader";
import { JNI } from "../jni";
import Thread, { ThreadStatus } from "../thread";
import { AbstractThreadPool } from "../threadpool";
import { ArrayClassData } from "../types/class/ArrayClassData";
import { ClassData, CLASS_STATUS } from "../types/class/ClassData";
import { Field } from "../types/class/Field";
import { MethodHandler, Method } from "../types/class/Method";
import { JvmArray } from "../types/reference/Array";
import { JvmObject, JavaType } from "../types/reference/Object";
import AbstractSystem from "../utils/AbstractSystem";
import { ImmediateResult, checkError, checkSuccess } from "../utils/Result";
import { ACCESS_FLAGS as CLASS_FLAGS } from "../../ClassFile/types";

export class TestClassLoader extends AbstractClassLoader {
  getJavaObject(): JvmObject | null {
    return null;
  }
  private primitiveClasses: { [className: string]: ClassData } = {};
  getPrimitiveClassRef(className: string): ClassData {
    if (this.primitiveClasses[className]) {
      return this.primitiveClasses[className];
    }

    let internalName = '';
    switch (className) {
      case JavaType.byte:
        internalName = 'byte';
        break;
      case JavaType.char:
        internalName = 'char';
        break;
      case JavaType.double:
        internalName = 'double';
        break;
      case JavaType.float:
        internalName = 'float';
        break;
      case JavaType.int:
        internalName = 'int';
        break;
      case JavaType.long:
        internalName = 'long';
        break;
      case JavaType.short:
        internalName = 'short';
        break;
      case JavaType.boolean:
        internalName = 'boolean';
        break;
      case JavaType.void:
        internalName = 'void';
        break;
      default:
        throw new Error(`Not a primitive: ${className}`);
    }

    const cls = new ClassData(
      [],
      CLASS_FLAGS.ACC_PUBLIC,
      internalName,
      null,
      [],
      [],
      [],
      [],
      this
    );
    this.primitiveClasses[className] = cls;
    return cls;
  }

  private loadArray(
    className: string,
    componentCls: ClassData
  ): ImmediateResult<ClassData> {
    // #region load array superclasses/interfaces
    const objRes = this.getClassRef('java/lang/Object');
    if (checkError(objRes)) {
      return objRes;
    }
    const cloneableRes = this.getClassRef('java/lang/Cloneable');
    if (checkError(cloneableRes)) {
      return cloneableRes;
    }
    const serialRes = this.getClassRef('java/io/Serializable');
    if (checkError(serialRes)) {
      return serialRes;
    }
    // #endregion

    const arrayClass = new ArrayClassData(
      [],
      CLASS_FLAGS.ACC_PUBLIC,
      className,
      objRes.result,
      [cloneableRes.result, serialRes.result],
      [],
      [],
      [],
      this
    );
    arrayClass.setComponentClass(componentCls);

    this.loadClass(arrayClass);
    return { result: arrayClass };
  }

  load(className: string): ImmediateResult<ClassData> {
    const stubRef = this.createClass({
      className: className,
      loader: this,
    });
    return { result: stubRef };
  }

  loadTestClassRef(className: string, ref: ClassData) {
    this.loadedClasses[className] = ref;
  }

  private linkMethod2(
    constantPool: ConstantInfo[],
    method: MethodInfo
  ): ImmediateResult<{
    method: MethodInfo;
    exceptionHandlers: MethodHandler[];
    code: CodeAttribute | null;
  }> {
    // get code attribute
    let code: CodeAttribute | null = null;
    for (const attr of method.attributes) {
      const attrname = (
        constantPool[attr.attributeNameIndex] as ConstantUtf8Info
      ).value;
      if (attrname === 'Code') {
        code = attr as CodeAttribute;
      }
    }

    const handlderTable: MethodHandler[] = [];
    if (code) {
      for (const handler of code.exceptionTable) {
        const catchType = handler.catchType;
        const ctRes = this.getClassRef(catchType as unknown as string);
        if (checkError(ctRes)) {
          return { exceptionCls: 'java/lang/NoClassDefFoundError', msg: '' };
        }
        const clsRef = ctRes.result;

        handlderTable.push({
          startPc: handler.startPc,
          endPc: handler.endPc,
          handlerPc: handler.handlerPc,
          catchType: clsRef,
        });
      }
    }

    return {
      result: {
        method,
        exceptionHandlers: handlderTable,
        code,
      },
    };
  }

  createClass(options: {
    className?: string;
    loader?: TestClassLoader;
    superClass?: ClassData;
    constants?: ((c: ConstantInfo[]) => ConstantInfo)[];
    interfaces?: ClassData[];
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
    isArray?: boolean;
  }) {
    let constantPool: ConstantInfo[] = [
      { tag: 7, nameIndex: 0 }, // dummy
      { tag: 7, nameIndex: 2 }, // superclass
      {
        tag: 1,
        length: 16,
        value:
          typeof options.superClass === 'string'
            ? options.superClass
            : 'java/lang/Object',
      }, // superclass name
      { tag: 7, nameIndex: 4 },
      {
        tag: 1,
        length: options.className?.length ?? 9,
        value: options.className ?? 'Test/Test',
      },
      {
        tag: CONSTANT_TAG.Utf8,
        length: 4,
        value: 'Code',
      },
    ];
    if (options.constants) {
      options.constants.forEach(func => {
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
            value: 'Test',
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

          const temp: any = {
            accessFlags: (method.accessFlags ?? []).reduce((a, b) => a | b, 0),
            nameIndex: constantPool.length - 5,
            name: method.name ?? `test${index}`,
            descriptor: method.descriptor ?? `()V`,
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
            exceptionTable: (method.exceptionTable as any) ?? [],
            attributesCount: 0,
            attributes: [],
          } as CodeAttribute);

          const res = this.linkMethod2(constantPool, temp);
          if (checkError(res)) {
            throw new Error("Can't link method");
          }

          return res.result;
        })
      : [];
    const loader =
      options.loader ?? new TestClassLoader(new TestSystem(), 'test/', null);

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
            value: options.className ?? 'Test',
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

    const interfaces = options.interfaces ?? [];

    const clsRef = options.isArray
      ? new ArrayClassData(
          constantPool,
          options.flags ?? 33,
          options.className ?? '[LTest',
          options.superClass ?? (null as any),
          interfaces,
          fields,
          methods,
          [],
          loader
        )
      : new ClassData(
          constantPool,
          options.flags ?? 33,
          options.className ?? 'Test/Test',
          options.superClass ?? null,
          interfaces,
          fields,
          methods,
          [],
          loader
        );
    clsRef.status = options.status ?? CLASS_STATUS.PREPARED;

    loader.loadTestClassRef(options.className ?? 'Test/Test', clsRef);
    return clsRef;
  }

  protected _loadArrayClass(
    className: string,
    componentCls: ClassData
  ): ImmediateResult<ClassData> {
    return this.loadArray(className, componentCls);
  }
}

export class TestSystem extends AbstractSystem {
  stdout(message: string): void {
    throw new Error('Method not implemented.');
  }
  stderr(message: string): void {
    throw new Error('Method not implemented.');
  }
  readFile(path: string): ClassFile {
    throw new Error('Method not implemented.');
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
  constructor(threadClass: ClassData, jvm: JVM, tpool: AbstractThreadPool) {
    super(threadClass, jvm, tpool);
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

  private tnewCharArr(str: string): ImmediateResult<JvmArray> {
    const cArrRes = this.testLoader.getClassRef('[C');
    if (checkError(cArrRes)) {
      return cArrRes;
    }

    const cArrCls = cArrRes.result;
    const cArr = cArrCls.instantiate() as JvmArray;
    const jsArr: any[] = [];
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

    const strRes = this.testLoader.getClassRef('java/lang/String');

    if (checkError(strRes)) {
      return strRes;
    }
    const strCls = strRes.result;
    const strObj = strCls.instantiate();
    const fieldRef = strCls.getFieldRef('value[C') as Field;
    strObj.putField(fieldRef as Field, charArr.result);
    return { result: strObj };
  }

  getInternedString(str: string) {
    if (this.tinternedStrings[str]) {
      return this.tinternedStrings[str];
    }
    const strRes = this.tnewString(str);
    if (checkError(strRes)) {
      throw new Error('testString creation failed');
    }

    this.tinternedStrings[str] = strRes.result;
    return this.tinternedStrings[str];
  }

  getJNI(): JNI {
    return this.tJNI;
  }
}

export const setupTest = () => {
  const jni = new JNI();
  const testSystem = new TestSystem();
  const testLoader = new TestClassLoader(testSystem, '', null);

  // #region create dummy classes
  const dispatchUncaughtCode = new DataView(new ArrayBuffer(8));
  dispatchUncaughtCode.setUint8(0, OPCODE.RETURN);
  const threadClass = testLoader.createClass({
    className: 'java/lang/Thread',
    methods: [
      {
        accessFlags: [METHOD_FLAGS.ACC_PROTECTED],
        name: 'dispatchUncaughtException',
        descriptor: '(Ljava/lang/Throwable;)V',
        attributes: [],
        code: dispatchUncaughtCode,
      },
    ],
    loader: testLoader,
  });
  const clsClass = testLoader.createClass({
    className: 'java/lang/Class',
    loader: testLoader,
    fields: [
      {
        accessFlags: [FIELD_FLAGS.ACC_PUBLIC],
        name: 'classLoader',
        descriptor: 'Ljava/lang/ClassLoader;',
        attributes: [],
      },
    ],
  });
  testLoader.createClass({
    className: 'java/lang/Object',
    loader: testLoader,
  });
  testLoader.createClass({
    className: 'java/lang/Cloneable',
    loader: testLoader,
    flags: CLASS_FLAGS.ACC_INTERFACE | CLASS_FLAGS.ACC_PUBLIC,
  });
  testLoader.createClass({
    className: 'java/io/Serializable',
    loader: testLoader,
    flags: CLASS_FLAGS.ACC_INTERFACE | CLASS_FLAGS.ACC_PUBLIC,
  });
  const strClass = testLoader.createClass({
    className: 'java/lang/String',
    loader: testLoader,
    fields: [
      {
        accessFlags: [FIELD_FLAGS.ACC_FINAL, FIELD_FLAGS.ACC_PRIVATE],
        name: 'value',
        descriptor: '[C',
        attributes: [],
      },
    ],
  });

  const code = new DataView(new ArrayBuffer(100));
  const testClass = testLoader.createClass({
    className: 'Test',
    constants: [
      () => ({
        tag: CONSTANT_TAG.Utf8,
        length: 3,
        value: '()V',
      }),
      () => ({
        tag: CONSTANT_TAG.Utf8,
        length: 5,
        value: 'test0',
      }),
      () => ({
        tag: CONSTANT_TAG.Utf8,
        length: 4,
        value: 'Test',
      }),
      cPool => ({
        tag: CONSTANT_TAG.NameAndType,
        nameIndex: cPool.length - 2,
        descriptorIndex: cPool.length - 3,
      }),
      cPool => ({
        tag: CONSTANT_TAG.Class,
        nameIndex: cPool.length - 2,
      }),
      cPool => {
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
        name: 'test0',
        descriptor: '()V',
        attributes: [],
        code: code,
      },
    ],
    loader: testLoader,
  });
  const method = testClass.getMethod('test0()V') as Method;
  // #endregion

  // #region exception classes
  const Throwable = testLoader.createClass({
    className: 'java/lang/Throwable',
    loader: testLoader,
    flags: CLASS_FLAGS.ACC_PUBLIC,
  });
  const NullPointerException = testLoader.createClass({
    className: 'java/lang/NullPointerException',
    superClass: Throwable,
    loader: testLoader,
    flags: CLASS_FLAGS.ACC_PUBLIC,
  });
  const ArithmeticException = testLoader.createClass({
    className: 'java/lang/ArithmeticException',
    superClass: Throwable,
    loader: testLoader,
    flags: CLASS_FLAGS.ACC_PUBLIC,
  });
  const IllegalAccessError = testLoader.createClass({
    className: 'java/lang/IllegalAccessError',
    superClass: Throwable,
    loader: testLoader,
    flags: CLASS_FLAGS.ACC_PUBLIC,
  });
  testLoader.createClass({
    className: 'java/lang/NegativeArraySizeException',
    loader: testLoader,
    flags: CLASS_FLAGS.ACC_PUBLIC,
  });

  //   #endregion

  const tPool = new TestThreadPool(() => {});
  const jvm = new TestJVM(testSystem, testLoader, jni);
  const thread = new TestThread(threadClass, jvm, tPool);

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
