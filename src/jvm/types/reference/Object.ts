import Thread from "../../thread";
import { Result } from "../../utils/Result";
import { ClassData } from "../class/ClassData";
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
      return { result: this };
    }
    
    // Should check for other init methods
    const initMethod = this.cls.getMethod('<init>()V');
    if (!initMethod) {
      this.initStatus = true;
      return { result: this };
    }

    thread._invokeInternal(this.cls, initMethod, 0, [this], (ret, err) => {
      if (!err) {
        this.initStatus = true;
      }
    });
    return { isDefer: true };
  }

  getClass() {
    return this.cls;
  }

  getField(fieldRef: Field): any {
    const fieldName = fieldRef.getName();
    const fieldDesc = fieldRef.getFieldDesc();
    const fieldClass = fieldRef.getClass().getClassname();
    return this._getField(fieldName, fieldDesc, fieldClass);
  }

  _getField(fieldName: string, fieldDesc: string, fieldClass: string): any {
    const key = `${fieldClass}.${fieldName}${fieldDesc}`;

    if (key in this.fields) {
      return this.fields[key].getValue();
    }

    throw new Error(`Invalid field`);
  }

  putField(fieldRef: Field, value: any) {
    const fieldName = fieldRef.getName();
    const fieldDesc = fieldRef.getFieldDesc();
    const fieldClass = fieldRef.getClass().getClassname();
    this._putField(fieldName, fieldDesc, fieldClass, value);
  }

  _putField(
    fieldName: string,
    fieldDesc: string,
    fieldClass: string,
    value: any
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
    throw new Error('Not implemented');
  }

  clone(): JvmObject {
    const clone = new JvmObject(this.cls);

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
