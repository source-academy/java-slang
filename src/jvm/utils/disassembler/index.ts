import { ClassFile } from "../../../ClassFile/types";
import { AttributeInfo } from "../../../ClassFile/types/attributes";
import { ConstantUtf8Info } from "../../../ClassFile/types/constants";
import { readAttribute } from "./utils/readAttributes";
import { readConstants } from "./utils/readConstants";
import { readField } from "./utils/readField";
import { readMethod } from "./utils/readMethod";

export default function parseBin(view: DataView) {
  let offset = 0;

  const cls: ClassFile = {
    magic: 0,
    minorVersion: 0,
    majorVersion: 0,
    constantPool: [],
    accessFlags: 0,
    thisClass: 0,
    superClass: 0,
    interfaces: [],
    fields: [],
    methods: [],
    attributes: [],
    constantPoolCount: 0,
    interfacesCount: 0,
    fieldsCount: 0,
    methodsCount: 0,
    attributesCount: 0,
  };

  cls.magic = view.getUint32(offset);
  offset += 4;

  cls.minorVersion = view.getUint16(offset);
  offset += 2;

  cls.majorVersion = view.getUint16(offset);
  offset += 2;

  const constantPoolCount = view.getUint16(offset);
  offset += 2;

  ({ result: cls.constantPool, offset } = readConstants(
    view,
    offset,
    constantPoolCount
  ));

  cls.accessFlags = view.getUint16(offset);
  offset += 2;

  cls.thisClass = view.getUint16(offset);
  offset += 2;

  cls.superClass = view.getUint16(offset);
  offset += 2;

  const interfacesCount = view.getUint16(offset);
  offset += 2;
  cls.interfaces = [];
  for (let i = 0; i < interfacesCount; i += 1) {
    const interfaceIdx = view.getUint16(offset);
    cls.interfaces.push(interfaceIdx);
    offset += 2;
  }

  const fieldsCount = view.getUint16(offset);
  offset += 2;

  cls.fields = [];
  for (let i = 0; i < fieldsCount; i += 1) {
    const { result, offset: resultOffset } = readField(
      cls.constantPool,
      view,
      offset
    );
    const fieldName = cls.constantPool[result.nameIndex] as ConstantUtf8Info;
    const fieldDesc = cls.constantPool[
      result.descriptorIndex
    ] as ConstantUtf8Info;
    cls.fields.push(result);
    offset = resultOffset;
  }

  const methodsCount = view.getUint16(offset);
  offset += 2;

  cls.methods = [];
  for (let i = 0; i < methodsCount; i += 1) {
    const { result, offset: resultOffset } = readMethod(
      cls.constantPool,
      view,
      offset
    );

    cls.methods.push(result);
    offset = resultOffset;
  }

  const attributesCount = view.getUint16(offset);
  offset += 2;

  cls.attributes = [];
  for (let i = 0; i < attributesCount; i += 1) {
    const { result, offset: resultOffset } = readAttribute(
      cls.constantPool,
      view,
      offset
    );
    cls.attributes.push(result as unknown as AttributeInfo);
    offset = resultOffset;
  }

  return cls;
}

/**
 * Converts a NodeJS Buffer to an ArrayBuffer
 *
 * @param buffer nodejs buffer
 * @returns ArrayBuffer equivalent
 */
export function a2ab(buffer: Buffer) {
  return buffer.buffer.slice(
    buffer.byteOffset,
    buffer.byteOffset + buffer.byteLength
  );
}
