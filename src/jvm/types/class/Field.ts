import { FieldInfo, FIELD_FLAGS } from "../../../ClassFile/types/fields";
import { ConstantPool } from "../../constant-pool";
import Thread from "../../thread";
import { attrInfo2Interface, parseFieldDescriptor } from "../../utils";
import { ImmediateResult, Result, ResultType } from "../Result";
import { JvmObject, JavaType } from "../reference/Object";
import { IAttribute, ConstantValue, NestHost } from "./Attributes";
import { ClassData, ReferenceClassData } from "./ClassData";
import { ConstantUtf8 } from "./Constants";

export class Field {
  private cls: ReferenceClassData;
  private fieldName: string;
  private fieldDesc: string;
  private value: any;
  private accessFlags: number;
  private attributes: { [attributeName: string]: IAttribute } = {};

  private static reflectedClass: ReferenceClassData | null = null;
  private javaObject: JvmObject | null = null;
  private slot: number;

  constructor(
    cls: ReferenceClassData,
    fieldName: string,
    fieldDesc: string,
    accessFlags: number,
    attributes: { [attributeName: string]: IAttribute },
    slot: number
  ) {
    this.cls = cls;
    this.fieldName = fieldName;
    this.fieldDesc = fieldDesc;
    this.accessFlags = accessFlags;
    this.attributes = attributes;
    this.slot = slot;

    switch (fieldDesc) {
      case JavaType.byte:
      case JavaType.char:
      case JavaType.double:
      case JavaType.float:
      case JavaType.int:
      case JavaType.short:
      case JavaType.boolean:
        this.value = 0;
        break;
      case JavaType.long:
        this.value = BigInt(0);
        break;
      default:
        this.value = null;
        break;
    }

    if (this.checkStatic() && this.attributes["ConstantValue"]) {
      const constantValue = (
        this.attributes["ConstantValue"] as ConstantValue
      ).constantvalue.resolve(null as any, cls.getLoader()); // String resolution does not need thread
      if (constantValue.status !== ResultType.SUCCESS) {
        return;
      }

      this.value = constantValue.result;
      return;
    }
  }

  static fromFieldInfo(
    cls: ReferenceClassData,
    field: FieldInfo,
    slot: number,
    constantPool: ConstantPool
  ) {
    const fieldName = (cls.getConstant(field.nameIndex) as ConstantUtf8).get();
    const fieldDesc = (
      cls.getConstant(field.descriptorIndex) as ConstantUtf8
    ).get();

    return new Field(
      cls,
      fieldName,
      fieldDesc,
      field.accessFlags,
      attrInfo2Interface(field.attributes, constantPool),
      slot
    );
  }

  static checkField(obj: any): obj is Field {
    return obj.fieldName !== undefined;
  }

  getAccessFlags() {
    return this.accessFlags;
  }

  getSlot() {
    return this.slot;
  }

  getReflectedObject(thread: Thread): ImmediateResult<JvmObject> {
    if (this.javaObject) {
      return { status: ResultType.SUCCESS, result: this.javaObject };
    }

    if (!Field.reflectedClass) {
      const fRes = thread
        .getClass()
        .getLoader()
        .getClass("java/lang/reflect/Field");
      if (fRes.status === ResultType.ERROR) {
        return fRes;
      }
      Field.reflectedClass = fRes.result as ReferenceClassData;
    }

    const fieldClsName = parseFieldDescriptor(this.fieldDesc, 0);
    let ftRes: ImmediateResult<ClassData>;
    if (fieldClsName.referenceCls) {
      ftRes = this.cls.getLoader().getClass(fieldClsName.referenceCls);
    } else {
      ftRes = {
        status: ResultType.SUCCESS,
        result: this.cls.getLoader().getPrimitiveClass(fieldClsName.type),
      };
    }
    if (ftRes.status === ResultType.ERROR) {
      return ftRes;
    }
    const fieldType = (ftRes.result as ClassData).getJavaObject() as JvmObject;

    this.javaObject = Field.reflectedClass.instantiate();
    this.javaObject.initialize(thread);

    this.javaObject._putField(
      "clazz",
      "Ljava/lang/Class;",
      "java/lang/reflect/Field",
      this.cls.getJavaObject()
    );
    this.javaObject._putField(
      "name",
      "Ljava/lang/String;",
      "java/lang/reflect/Field",
      thread.getJVM().getInternedString(this.fieldName)
    );
    this.javaObject._putField(
      "type",
      "Ljava/lang/Class;",
      "java/lang/reflect/Field",
      fieldType
    );
    this.javaObject._putField(
      "modifiers",
      "I",
      "java/lang/reflect/Field",
      this.accessFlags
    );
    this.javaObject._putField(
      "slot",
      "I",
      "java/lang/reflect/Field",
      this.slot
    );

    console.warn("getReflectedObject: not using signature, annotations");
    this.javaObject._putField(
      "signature",
      "Ljava/lang/String;",
      "java/lang/reflect/Field",
      null
    );
    this.javaObject._putField(
      "annotations",
      "[B",
      "java/lang/reflect/Field",
      null
    );

    this.javaObject.putNativeField("fieldRef", this);

    return { status: ResultType.SUCCESS, result: this.javaObject };
  }

  getValue() {
    return this.value;
  }

  getName() {
    return this.fieldName;
  }

  getFieldDesc() {
    return this.fieldDesc;
  }

  getClass() {
    return this.cls;
  }

  putValue(value: any) {
    if (value === undefined) {
      throw new Error("putValue: value is undefined");
    }
    this.value = value;
  }

  cloneField() {
    const field = new Field(
      this.cls,
      this.fieldName,
      this.fieldDesc,
      this.accessFlags,
      this.attributes,
      this.slot
    );
    return field;
  }

  /**
   * flags
   */
  checkPublic() {
    return (this.accessFlags & FIELD_FLAGS.ACC_PUBLIC) !== 0;
  }

  checkPrivate() {
    return (this.accessFlags & FIELD_FLAGS.ACC_PRIVATE) !== 0;
  }

  checkProtected() {
    return (
      (this.accessFlags & FIELD_FLAGS.ACC_PROTECTED) !== 0 ||
      (!this.checkPublic() && !this.checkPrivate())
    );
  }

  checkStatic() {
    return (this.accessFlags & FIELD_FLAGS.ACC_STATIC) !== 0;
  }

  checkFinal() {
    return (this.accessFlags & FIELD_FLAGS.ACC_FINAL) !== 0;
  }

  checkVolatile() {
    return (this.accessFlags & FIELD_FLAGS.ACC_VOLATILE) !== 0;
  }

  checkTransient() {
    return (this.accessFlags & FIELD_FLAGS.ACC_TRANSIENT) !== 0;
  }

  checkSynthetic() {
    return (this.accessFlags & FIELD_FLAGS.ACC_SYNTHETIC) !== 0;
  }

  checkEnum() {
    return (this.accessFlags & FIELD_FLAGS.ACC_ENUM) !== 0;
  }

  /**
   * Checks if the current method has access to the field
   * @param thread thread accessing the field
   * @param isStaticAccess true for getstatic/putstatic
   * @param isPut true for putstatic/putfield
   * @returns
   */
  checkAccess(
    thread: Thread,
    isStaticAccess: boolean = false,
    isPut: boolean = false
  ): Result<Field> {
    // logical xor
    if (isStaticAccess !== this.checkStatic()) {
      return {
        status: ResultType.ERROR,
        exceptionCls: "java/lang/IncompatibleClassChangeError",
        msg: "",
      };
    }

    const invokerClass = thread.getClass();
    const fieldClass = this.getClass();
    if (this.checkPrivate() && invokerClass !== fieldClass) {
      // nest mate test (se11)
      // There is currently a bug with lambdas invoking the private bytecode directly.
      // We add nest information so the invocation succeeds.
      // https://docs.oracle.com/javase/specs/jvms/se11/html/jvms-5.html#jvms-5.4.4
      const nestHostAttrD = fieldClass.getAttribute("NestHost") as NestHost;
      let nestHostD;
      if (!nestHostAttrD) {
        nestHostD = fieldClass;
      } else {
        const resolutionResult = nestHostAttrD.hostClass.resolve();
        if (resolutionResult.status === ResultType.ERROR) {
          return resolutionResult;
        }
        nestHostD = resolutionResult.result;
      }
      const nestHostArrC = invokerClass.getAttribute("NestHost") as NestHost;
      let nestHostC;
      if (!nestHostArrC) {
        nestHostC = invokerClass;
      } else {
        const resolutionResult = nestHostArrC.hostClass.resolve();
        if (resolutionResult.status === ResultType.ERROR) {
          return resolutionResult;
        }
        nestHostC = resolutionResult.result;
      }

      if (nestHostC !== nestHostD) {
        return {
          status: ResultType.ERROR,
          exceptionCls: "java/lang/IllegalAccessError",
          msg: "",
        };
      }
    }

    if (
      this.checkProtected() &&
      !invokerClass.checkCast(fieldClass) &&
      invokerClass.getPackageName() !== this.getClass().getPackageName()
    ) {
      return {
        status: ResultType.ERROR,
        exceptionCls: "java/lang/IllegalAccessError",
        msg: "",
      };
    }

    const invokerMethod = thread.getMethod();
    if (
      isPut &&
      this.checkFinal() &&
      (fieldClass !== invokerClass ||
        invokerMethod.getName() !== (isStaticAccess ? "<clinit>" : "<init>"))
    ) {
      return {
        status: ResultType.ERROR,
        exceptionCls: "java/lang/IllegalAccessError",
        msg: "",
      };
    }

    return { status: ResultType.SUCCESS, result: this };
  }
}
