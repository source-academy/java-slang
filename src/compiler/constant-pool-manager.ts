import { CONSTANT_TAG } from "../ClassFile/constants/constants";
import { ConstantType } from "../ClassFile/types/constants";
import {
  ConstantClassValue,
  ConstantMethodrefValue,
  ConstantNameAndTypeValue,
  ConstantTypeValue,
  ConstantUtf8Value
} from "./constant-value-types";

type constantTask = {
  tag: CONSTANT_TAG,
  value: ConstantTypeValue,
};

export class ConstantPoolManager {
  private constantPool: Array<ConstantType>;
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

  addUtf8Info(value: ConstantUtf8Value) {
    return this.writeIfAbsent(CONSTANT_TAG.Utf8, value);
  }

  addClassInfo(value: ConstantClassValue) {
    return this.writeIfAbsent(CONSTANT_TAG.Class, value);
  }

  addNameAndTypeInfo(value: ConstantNameAndTypeValue) {
    return this.writeIfAbsent(CONSTANT_TAG.NameAndType, value);
  }

  addMethodrefInfo(value: ConstantMethodrefValue) {
    return this.writeIfAbsent(CONSTANT_TAG.Methodref, value);
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

  private writeNameAndTypeInfo(val: ConstantNameAndTypeValue) {
    const nameIndex = this.addUtf8Info(val.name);
    const descriptorIndex = this.addUtf8Info(val.descriptor);
    this.constantPool.push({
      tag: CONSTANT_TAG.NameAndType,
      nameIndex: nameIndex,
      descriptorIndex: descriptorIndex,
    });
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
