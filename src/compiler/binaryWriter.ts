import { CONSTANT_TAG } from "../ClassFile/constants/constants";
import { ClassFile } from "../ClassFile/types";
import { AttributeType, CodeAttribute, ExceptionHandler } from "../ClassFile/types/attributes";
import {
  ConstantClassInfo,
  ConstantFieldrefInfo,
  ConstantIntegerInfo,
  ConstantNameAndTypeInfo,
  ConstantStringInfo,
  ConstantType,
  ConstantUtf8Info
} from "../ClassFile/types/constants";
import { FieldType } from "../ClassFile/types/fields";
import { MethodType } from "../ClassFile/types/methods";

const u1 = 1;
const u2 = 2;
const u4 = 4;

export class BinaryWriter {
  private byteArray: Array<number>;
  private constantPool: Array<ConstantType>;

  constructor() {
    this.byteArray = [];
    this.constantPool = [];
  }

  toBinary(classFile: ClassFile) {
    this.byteArray = [];
    this.constantPool = classFile.constantPool;

    this.write(classFile.magic, u4);
    this.write(classFile.minorVersion, u2);
    this.write(classFile.majorVersion, u2);
    this.write(classFile.constantPoolCount, u2);
    classFile.constantPool.forEach(c => this.writeConstant(c));
    this.write(classFile.accessFlags, u2);
    this.write(classFile.thisClass, u2);
    this.write(classFile.superClass, u2);
    this.write(classFile.interfacesCount, u2);
    classFile.interfaces.forEach(i => this.writeInterface(i));
    this.write(classFile.fieldsCount, u2);
    classFile.fields.forEach(f => this.writeField(f));
    this.write(classFile.methodsCount, u2);
    classFile.methods.forEach(m => this.writeMethod(m));
    this.write(classFile.attributesCount, u2);
    classFile.attributes.forEach(a => this.writeAttribute(a));

    const binary = new Uint8Array(this.byteArray);
    return binary;
  }


  private write(value: number, numOfBytes: number = u1) {
    const bytes = [];
    for (let i = 0; i < numOfBytes; i++) {
      bytes.push(value & 0xff);
      value >>>= 8;
    }
    bytes.reverse().forEach(b => this.byteArray.push(b));
  }

  private writeBytes(bytes: Array<number>) {
    this.byteArray.push(...bytes);
  }

  private writeDataView(bytes: DataView) {
    for (let i = 0; i < bytes.buffer.byteLength; i++) {
      this.write(bytes.getUint8(i));
    }
  }

  private writeString(str: string) {
    const bytes = Array.from(Buffer.from(str, "utf8"));
    this.writeBytes(bytes);
  }

  private writeConstant(constant: ConstantType) {
    this.write(constant.tag);
    switch (constant.tag) {
      case CONSTANT_TAG.Utf8:
        this.write((constant as ConstantUtf8Info).length, u2);
        this.writeString((constant as ConstantUtf8Info).value);
        break;
      case CONSTANT_TAG.Integer:
      case CONSTANT_TAG.Float:
        this.write((constant as ConstantIntegerInfo).value, u4);
      case CONSTANT_TAG.Class:
        this.write((constant as ConstantClassInfo).nameIndex, u2);
        break;
      case CONSTANT_TAG.String:
        this.write((constant as ConstantStringInfo).stringIndex, u2);
        break;
      case CONSTANT_TAG.Fieldref:
      case CONSTANT_TAG.Methodref:
      case CONSTANT_TAG.InterfaceMethodref:
        this.write((constant as ConstantFieldrefInfo).classIndex, u2);
        this.write((constant as ConstantFieldrefInfo).nameAndTypeIndex, u2);
        break;
      case CONSTANT_TAG.NameAndType:
        this.write((constant as ConstantNameAndTypeInfo).nameIndex, u2);
        this.write((constant as ConstantNameAndTypeInfo).descriptorIndex, u2);
        break;
      default: ;
    }
  }

  private writeInterface(iface: string) {
    iface;
  }

  private writeField(field: FieldType) {
    field;
  }

  private writeMethod(method: MethodType) {
    this.write(method.accessFlags, u2);
    this.write(method.nameIndex, u2);
    this.write(method.descriptorIndex, u2);
    this.write(method.attributesCount, u2);
    method.attributes.forEach(attribute => this.writeAttribute(attribute));
  }

  private writeAttribute(attribute: AttributeType) {
    this.write(attribute.attributeNameIndex, u2);
    this.write(attribute.attributeLength, u4);
    const attr = this.constantPool[attribute.attributeNameIndex - 1] as ConstantUtf8Info;
    switch (attr.value) {
      case "Code":
        this.writeCodeAttribute(attribute as CodeAttribute);
        break;
      default: ;
    }
  }

  private writeCodeAttribute(attribute: CodeAttribute) {
    this.write(attribute.maxStack, u2);
    this.write(attribute.maxLocals, u2);
    this.write(attribute.codeLength, u4);
    this.writeDataView(attribute.code);
    this.write(attribute.exceptionTableLength, u2);
    attribute.exceptionTable.forEach(e => this.writeException(e));
    this.write(attribute.attributesCount, u2);
    attribute.attributes.forEach(a => this.writeAttribute(a));
  }

  private writeException(e: ExceptionHandler) {
    e;
  }
}