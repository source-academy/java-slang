import { CONSTANT_TAG } from "../ClassFile/constants/constants";
import { ConstantInfo } from "../ClassFile/types/constants";
import {
  ConstantClassValue,
  ConstantFieldrefValue,
  ConstantMethodrefValue,
  ConstantNameAndTypeValue,
  ConstantStringValue,
  ConstantTypeValue,
  ConstantUtf8Value
} from "./constant-value-types";

type constantTask = {
  tag: CONSTANT_TAG,
  value: ConstantTypeValue,
};

export class ConstantPoolManager {
  private constantPool: Array<ConstantInfo>;
  private curIdx: number;
  private objectMap;
  private tasks: Array<constantTask>;

  constructor() {
    this.constantPool = [];
    this.curIdx = 1;
    this.objectMap = new Map();
    this.tasks = [];
  }

  getPool() {
    return this.constantPool;
  }

  indexUtf8Info(value: string) {
    return this.writeIfAbsent(CONSTANT_TAG.Utf8, {
      value: value
    });
  }

  indexClassInfo(className: string) {
    return this.writeIfAbsent(CONSTANT_TAG.Class, {
      name: { value: className }
    });
  }

  indexStringInfo(string: string) {
    return this.writeIfAbsent(CONSTANT_TAG.String, {
      string: { value: string }
    });
  }

  indexFieldrefInfo(className: string, fieldName: string, descriptor: string) {
    return this.writeIfAbsent(CONSTANT_TAG.Fieldref, {
      class: {
        name: { value: className, }
      },
      nameAndType: {
        name: { value: fieldName },
        descriptor: { value: descriptor },
      }
    });
  }

  indexMethodrefInfo(className: string, methodName: string, descriptor: string) {
    return this.writeIfAbsent(CONSTANT_TAG.Methodref, {
      class: {
        name: { value: className, }
      },
      nameAndType: {
        name: { value: methodName },
        descriptor: { value: descriptor },
      }
    });
  }

  indexNameAndTypeInfo(name: string, type: string) {
    return this.writeIfAbsent(CONSTANT_TAG.NameAndType, {
      name: { value: name },
      descriptor: { value: type }
    });
  }


  private addUtf8Info(value: ConstantUtf8Value) {
    return this.writeIfAbsent(CONSTANT_TAG.Utf8, value);
  }

  private addClassInfo(value: ConstantClassValue) {
    return this.writeIfAbsent(CONSTANT_TAG.Class, value);
  }

  private addNameAndTypeInfo(value: ConstantNameAndTypeValue) {
    return this.writeIfAbsent(CONSTANT_TAG.NameAndType, value);
  }

  private writeIfAbsent(tag: CONSTANT_TAG, value: ConstantTypeValue) {
    const task = {
      tag: tag,
      value: value,
    };
    const key = JSON.stringify(task);
    let pos = this.objectMap.get(key);
    if (pos !== undefined) {
      return pos;
    }

    pos = this.curIdx++;
    this.objectMap.set(key, pos);
    this.tasks.push(task);

    const isFirst = this.tasks.length === 1;
    if (isFirst) {
      while (this.tasks.length > 0) {
        this.execute(this.tasks[0]);
        this.tasks.shift();
      }
    }
    return pos;
  }

  private execute(task: constantTask) {
    const tag = task.tag;
    switch (tag) {
      case CONSTANT_TAG.Utf8:
        this.writeUtf8Info(task.value as ConstantUtf8Value);
        break;
      case CONSTANT_TAG.Class:
        this.writeClassInfo(task.value as ConstantClassValue);
        break;
      case CONSTANT_TAG.String:
        this.writeStringInfo(task.value as ConstantStringValue);
        break;
      case CONSTANT_TAG.Fieldref:
        this.writeFieldrefInfo(task.value as ConstantFieldrefValue);
        break;
      case CONSTANT_TAG.Methodref:
        this.writeMethodrefInfo(task.value as ConstantMethodrefValue);
        break;
      case CONSTANT_TAG.NameAndType:
        this.writeNameAndTypeInfo(task.value as ConstantNameAndTypeValue);
        break;
      default: ;
    }
  }

  private writeUtf8Info(val: ConstantUtf8Value) {
    this.constantPool.push({
      tag: CONSTANT_TAG.Utf8,
      length: val.value.length,
      value: val.value,
    });
  }

  private writeClassInfo(val: ConstantClassValue) {
    const nameIndex = this.addUtf8Info(val.name);
    this.constantPool.push({
      tag: CONSTANT_TAG.Class,
      nameIndex: nameIndex,
    });
  }

  private writeStringInfo(val: ConstantStringValue) {
    const stringIndex = this.addUtf8Info(val.string);
    this.constantPool.push({
      tag: CONSTANT_TAG.String,
      stringIndex: stringIndex,
    });
  }

  private writeNameAndTypeInfo(val: ConstantNameAndTypeValue) {
    const nameIndex = this.addUtf8Info(val.name);
    const descriptorIndex = this.addUtf8Info(val.descriptor);
    this.constantPool.push({
      tag: CONSTANT_TAG.NameAndType,
      nameIndex: nameIndex,
      descriptorIndex: descriptorIndex,
    });
  }

  private writeFieldrefInfo(val: ConstantFieldrefValue) {
    const classIndex = this.addClassInfo(val.class);
    const nameAndTypeIndex = this.addNameAndTypeInfo(val.nameAndType);
    this.constantPool.push({
      tag: CONSTANT_TAG.Fieldref,
      classIndex: classIndex,
      nameAndTypeIndex: nameAndTypeIndex,
    })
  }

  private writeMethodrefInfo(val: ConstantMethodrefValue) {
    const classIndex = this.addClassInfo(val.class);
    const nameAndTypeIndex = this.addNameAndTypeInfo(val.nameAndType);
    this.constantPool.push({
      tag: CONSTANT_TAG.Methodref,
      classIndex: classIndex,
      nameAndTypeIndex: nameAndTypeIndex,
    })
  }
}
