import Monitor from "../../monitor";
import Thread from "../../thread";
import { Result, ResultType } from "../Result";
import { ClassData, ReferenceClassData } from "../class/ClassData";
import { Field } from "../class/Field";

export class JvmObject {
  public initStatus = false;

  protected cls: ClassData;
  protected fields: {
    [key: string]: Field;
  };
  protected nativeFields: {
    [key: string]: any;
  } = {};
  private monitor?: Monitor;
  private fieldArr: { name: string; ref: Field }[];
  private static maxId = 0;
  private id;

  constructor(cls: ClassData) {
    this.cls = cls;
    this.fields = {};
    this.fieldArr = [];
    this.id = JvmObject.maxId++;

    Object.entries(cls.getInstanceFields()).forEach(
      ([fieldName, fieldRef], index) => {
        this.fields[fieldName] = fieldRef.cloneField();
        this.fieldArr[index] = { name: fieldName, ref: this.fields[fieldName] };
      }
    );
  }

  setInitialized() {
    this.initStatus = true;
  }

  getInitialized() {
    return this.initStatus;
  }

  initialize(thread: Thread, ...rest: any[]): Result<JvmObject> {
    if (this.initStatus) {
      return { status: ResultType.SUCCESS, result: this };
    }

    const initMethod = this.cls.getMethod('<init>()V');
    if (!initMethod) {
      this.initStatus = true;
      return { status: ResultType.SUCCESS, result: this };
    }

    thread._invokeInternal(
      this.cls as ReferenceClassData,
      initMethod,
      0,
      [this],
      (ret, err) => {
        if (!err) {
          this.initStatus = true;
        }
      }
    );
    return { status: ResultType.DEFER };
  }

  getClass() {
    return this.cls;
  }

  getMonitor() {
    if (!this.monitor) {
      this.monitor = new Monitor();
    }
    return this.monitor;
  }

  getField(fieldRef: Field): JvmObject | number | bigint | null {
    const fieldName = fieldRef.getName();
    const fieldDesc = fieldRef.getFieldDesc();
    const fieldClass = fieldRef.getClass().getName();
    return this._getField(fieldName, fieldDesc, fieldClass);
  }

  _getField(
    fieldName: string,
    fieldDesc: string,
    fieldClass: string
  ): JvmObject | number | bigint | null {
    const key = `${fieldClass}.${fieldName}${fieldDesc}`;

    if (key in this.fields) {
      return this.fields[key].getValue();
    }

    throw new Error(`Invalid field`);
  }

  putField(fieldRef: Field, value: JvmObject | number | bigint | null) {
    const fieldName = fieldRef.getName();
    const fieldDesc = fieldRef.getFieldDesc();
    const fieldClass = fieldRef.getClass().getName();
    this._putField(fieldName, fieldDesc, fieldClass, value);
  }

  _putField(
    fieldName: string,
    fieldDesc: string,
    fieldClass: string,
    value: JvmObject | number | bigint | null
  ) {
    const key = `${fieldClass}.${fieldName}${fieldDesc}`;

    if (key in this.fields) {
      this.fields[key].putValue(value);
      return;
    }
    throw new Error(`Invalid field`);
  }

  getNativeField(name: string) {
    return this.nativeFields[name];
  }

  putNativeField(name: string, value: any) {
    this.nativeFields[name] = value;
  }

  getFieldFromVMIndex(index: number): Field {
    const res = this.fieldArr.filter(f => {
      const slot = f.ref.getSlot();
      return slot === index;
    });

    if (res.length > 1) {
      // will this happen?
      throw new Error('Multiple matching slots. Need to check classname');
    }

    if (res.length === 0) {
      throw new Error('Invalid slot');
    }

    return res[0].ref;
  }

  clone(): JvmObject {
    const clone = this.cls.instantiate();

    for (const [key, field] of Object.entries(this.fields)) {
      clone.fields[key].putValue(field.getValue());
    }

    for (const [key, value] of Object.entries(this.nativeFields)) {
      clone.nativeFields[key] = value;
    }

    clone.initStatus = this.initStatus;

    return clone;
  }

  hashCode(): number {
    return this.id;
  }
}

export enum JavaType {
  byte = 'B',
  char = 'C',
  double = 'D',
  float = 'F',
  int = 'I',
  long = 'J',
  short = 'S',
  boolean = 'Z',
  reference = 'L',
  array = '[',
  void = 'V',
}
