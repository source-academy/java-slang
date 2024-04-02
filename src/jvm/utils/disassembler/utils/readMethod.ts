import { AttributeInfo } from "../../../../ClassFile/types/attributes";
import {
  ConstantInfo,
  ConstantUtf8Info,
} from "../../../../ClassFile/types/constants";
import { MethodInfo } from "../../../../ClassFile/types/methods";
import { readAttribute } from "./readAttributes";

export function readMethod(
  constPool: Array<ConstantInfo>,
  view: DataView,
  offset: number
): { result: MethodInfo; offset: number } {
  const accessFlags = view.getUint16(offset);
  offset += 2;
  const nameIndex = view.getUint16(offset);
  offset += 2;
  const descriptorIndex = view.getUint16(offset);
  offset += 2;
  const attributesCount = view.getUint16(offset);
  offset += 2;

  const attributes = [];

  for (let i = 0; i < attributesCount; i += 1) {
    const { result, offset: resultOffset } = readAttribute(
      constPool,
      view,
      offset
    );

    attributes.push(result as unknown as AttributeInfo);
    offset = resultOffset;
  }

  return {
    result: {
      accessFlags,
      attributes,
      nameIndex: nameIndex,
      descriptorIndex: descriptorIndex,
      attributesCount: attributesCount,
    },
    offset,
  };
}

export function getMethodName(
  method: MethodInfo,
  constPool: Array<ConstantInfo>
): string {
  return (
    (constPool[method.nameIndex] as ConstantUtf8Info).value +
    (constPool[method.descriptorIndex] as ConstantUtf8Info).value
  );
}
