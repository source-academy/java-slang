import { PREDEF_ATTRIBUTE } from "../../../../ClassFile/constants/attributes";
import {
  CodeAttribute,
  ExceptionHandler,
  AttributeInfo,
  SignatureAttribute,
} from "../../../../ClassFile/types/attributes";
import {
  ConstantInfo,
  ConstantUtf8Info,
} from "../../../../ClassFile/types/constants";

export function readAttribute(
  constPool: Array<ConstantInfo>,
  view: DataView,
  offset: number
): { result: { [key: string]: any }; offset: number } {
  const attributeNameIndex = view.getUint16(offset);
  offset += 2;
  const constantAttributeName: ConstantUtf8Info = constPool[
    attributeNameIndex
  ] as ConstantUtf8Info;

  // @ts-ignore
  const Attrib: number = PREDEF_ATTRIBUTE[constantAttributeName.value];
  const attributeLength = view.getUint32(offset);
  offset += 4;

  switch (Attrib) {
    case PREDEF_ATTRIBUTE.ConstantValue:
      return readAttributeConstantValue(
        constPool,
        attributeNameIndex,
        attributeLength,
        view,
        offset
      );
    case PREDEF_ATTRIBUTE.Code:
      return readCodeAttribute(
        constPool,
        attributeNameIndex,
        attributeLength,
        view,
        offset
      );
    case PREDEF_ATTRIBUTE.StackMapTable:
      return readAttributeStackMapTable(
        constPool,
        attributeNameIndex,
        attributeLength,
        view,
        offset
      );
    case PREDEF_ATTRIBUTE.Exceptions:
      return readAttributeExceptions(
        constPool,
        attributeNameIndex,
        attributeLength,
        view,
        offset
      );
    case PREDEF_ATTRIBUTE.InnerClasses:
      return readAttributeInnerClasses(
        constPool,
        attributeNameIndex,
        attributeLength,
        view,
        offset
      );
    case PREDEF_ATTRIBUTE.EnclosingMethod:
      return readAttributeEnclosingMethod(
        constPool,
        attributeNameIndex,
        attributeLength,
        view,
        offset
      );
    case PREDEF_ATTRIBUTE.Synthetic:
      return readAttributeSynthetic(
        constPool,
        attributeNameIndex,
        attributeLength,
        view,
        offset
      );
    case PREDEF_ATTRIBUTE.Signature:
      return readAttributeSignature(
        constPool,
        attributeNameIndex,
        attributeLength,
        view,
        offset
      );
    case PREDEF_ATTRIBUTE.SourceFile:
      return readAttributeSourceFile(
        constPool,
        attributeNameIndex,
        attributeLength,
        view,
        offset
      );
    case PREDEF_ATTRIBUTE.SourceDebugExtension:
      return readAttributeSourceDebugExtension(
        constPool,
        attributeNameIndex,
        attributeLength,
        view,
        offset
      );
    case PREDEF_ATTRIBUTE.LineNumberTable:
      return readAttributeLineNumberTable(
        constPool,
        attributeNameIndex,
        attributeLength,
        view,
        offset
      );
    case PREDEF_ATTRIBUTE.LocalVariableTable:
      return readAttributeLocalVariableTable(
        constPool,
        attributeNameIndex,
        attributeLength,
        view,
        offset
      );
    case PREDEF_ATTRIBUTE.LocalVariableTypeTable:
      return readAttributeLocalVariableTypeTable(
        constPool,
        attributeNameIndex,
        attributeLength,
        view,
        offset
      );
    case PREDEF_ATTRIBUTE.Deprecated:
      return readAttributeDeprecated(
        constPool,
        attributeNameIndex,
        attributeLength,
        view,
        offset
      );
    case PREDEF_ATTRIBUTE.RuntimeVisibleAnnotations:
      return readAttributeRuntimeVisibleAnnotations(
        constPool,
        attributeNameIndex,
        attributeLength,
        view,
        offset
      );
    case PREDEF_ATTRIBUTE.RuntimeInvisibleAnnotations:
      return readAttributeRuntimeInvisibleAnnotations(
        constPool,
        attributeNameIndex,
        attributeLength,
        view,
        offset
      );
    case PREDEF_ATTRIBUTE.RuntimeVisibleParameterAnnotations:
      return readAttributeRuntimeVisibleParameterAnnotations(
        constPool,
        attributeNameIndex,
        attributeLength,
        view,
        offset
      );
    case PREDEF_ATTRIBUTE.RuntimeInvisibleParameterAnnotations:
      return readAttributeRuntimeInvisibleParameterAnnotations(
        constPool,
        attributeNameIndex,
        attributeLength,
        view,
        offset
      );
    case PREDEF_ATTRIBUTE.AnnotationDefault:
      return readAttributeAnnotationDefault(
        constPool,
        attributeNameIndex,
        attributeLength,
        view,
        offset
      );
    case PREDEF_ATTRIBUTE.BootstrapMethods:
      return readAttributeBootstrapMethods(
        constPool,
        attributeNameIndex,
        attributeLength,
        view,
        offset
      );
    default:
      return readAttributeGeneric(
        constPool,
        attributeNameIndex,
        attributeLength,
        view,
        offset
      );
  }
}

function readAttributeConstantValue(
  constantPool: Array<ConstantInfo>,
  attributeNameIndex: number,
  attributeLength: number,
  view: DataView,
  offset: number
) {
  const constantvalueIndex = view.getUint16(offset);
  offset += 2;

  return {
    result: {
      attributeNameIndex,
      constantvalueIndex,
    },
    offset,
  };
}

function readCodeAttribute(
  constantPool: Array<ConstantInfo>,
  attributeNameIndex: number,
  attributeLength: number,
  view: DataView,
  offset: number
): {
  result: CodeAttribute;
  offset: number;
} {
  const maxStack = view.getUint16(offset);
  offset += 2;
  const maxLocals = view.getUint16(offset);
  offset += 2;
  const codeLength = view.getUint32(offset); // size in bytes
  offset += 4;

  if (codeLength <= 0 || codeLength >= 65536) {
    throw new Error("Class format error: Code attribute invalid length");
  }

  const code = new DataView(view.buffer, offset, codeLength);
  offset += codeLength;

  const exceptionTableLength = view.getUint16(offset);
  offset += 2;

  const exceptionTable: ExceptionHandler[] = [];
  for (let i = 0; i < exceptionTableLength; i++) {
    const startPc = view.getUint16(offset);
    offset += 2;
    const endPc = view.getUint16(offset);
    offset += 2;
    const handlerPc = view.getUint16(offset);
    offset += 2;
    const catchType = view.getUint16(offset);
    offset += 2;
    exceptionTable.push({ startPc, endPc, handlerPc, catchType });
  }

  const attributesCount = view.getUint16(offset);
  offset += 2;

  const attributes: AttributeInfo[] = [];
  for (let i = 0; i < attributesCount; i++) {
    const { result, offset: resultOffset } = readAttribute(
      constantPool,
      view,
      offset
    );
    attributes.push(result as unknown as AttributeInfo);
    offset = resultOffset;
  }

  return {
    result: {
      attributeNameIndex,
      maxStack,
      maxLocals,
      code,
      exceptionTable,
      attributes,
      attributeLength: attributeLength,
      codeLength: codeLength,
      exceptionTableLength: exceptionTableLength,
      attributesCount: attributesCount,
    },
    offset,
  };
}
function readAttributeStackMapTable(
  constantPool: Array<ConstantInfo>,
  attributeNameIndex: number,
  attributeLength: number,
  view: DataView,
  offset: number
) {
  console.warn("readAttributeStackMapTable is not implemented!");
  const info = [];

  for (let i = 0; i < attributeLength; i += 1) {
    info.push(view.getUint8(offset));
    offset += 1;
  }

  return {
    result: {
      attributeNameIndex,
      info,
    },
    offset,
  };
}

function readAttributeExceptions(
  constantPool: Array<ConstantInfo>,
  attributeNameIndex: number,
  attributeLength: number,
  view: DataView,
  offset: number
) {
  console.warn("readAttributeExceptions is not implemented!");
  const info = [];

  for (let i = 0; i < attributeLength; i += 1) {
    info.push(view.getUint8(offset));
    offset += 1;
  }

  return {
    result: {
      attributeNameIndex,
      info,
    },
    offset,
  };
}

function readAttributeInnerClasses(
  constantPool: Array<ConstantInfo>,
  attributeNameIndex: number,
  attributeLength: number,
  view: DataView,
  offset: number
) {
  console.warn("readAttributeInnerClasses is not implemented!");
  const info = [];

  for (let i = 0; i < attributeLength; i += 1) {
    info.push(view.getUint8(offset));
    offset += 1;
  }

  return {
    result: {
      attributeNameIndex,
      info,
    },
    offset,
  };
}

function readAttributeEnclosingMethod(
  constantPool: Array<ConstantInfo>,
  attributeNameIndex: number,
  attributeLength: number,
  view: DataView,
  offset: number
) {
  console.warn("readAttributeEnclosingMethod is not implemented!");
  const info = [];

  for (let i = 0; i < attributeLength; i += 1) {
    info.push(view.getUint8(offset));
    offset += 1;
  }

  return {
    result: {
      attributeNameIndex,
      info,
    },
    offset,
  };
}

function readAttributeSynthetic(
  constantPool: Array<ConstantInfo>,
  attributeNameIndex: number,
  attributeLength: number,
  view: DataView,
  offset: number
) {
  console.warn("readAttributeSynthetic is not implemented!");
  const info = [];

  for (let i = 0; i < attributeLength; i += 1) {
    info.push(view.getUint8(offset));
    offset += 1;
  }

  return {
    result: {
      attributeNameIndex,
      info,
    },
    offset,
  };
}
function readAttributeSignature(
  constantPool: Array<ConstantInfo>,
  attributeNameIndex: number,
  attributeLength: number,
  view: DataView,
  offset: number
): { result: SignatureAttribute; offset: number } {
  const signatureIndex = view.getUint16(offset);
  offset += 2;
  return {
    result: {
      attributeLength,
      attributeNameIndex,
      signatureIndex,
    },
    offset,
  };
}

function readAttributeSourceFile(
  constantPool: Array<ConstantInfo>,
  attributeNameIndex: number,
  attributeLength: number,
  view: DataView,
  offset: number
) {
  console.warn("readAttributeSourceFile is not implemented!");
  const info = [];

  for (let i = 0; i < attributeLength; i += 1) {
    info.push(view.getUint8(offset));
    offset += 1;
  }

  return {
    result: {
      attributeNameIndex,
      info,
    },
    offset,
  };
}

function readAttributeSourceDebugExtension(
  constantPool: Array<ConstantInfo>,
  attributeNameIndex: number,
  attributeLength: number,
  view: DataView,
  offset: number
) {
  console.warn("readAttributeSourceDebugExtension is not implemented!");
  const info = [];

  for (let i = 0; i < attributeLength; i += 1) {
    info.push(view.getUint8(offset));
    offset += 1;
  }

  return {
    result: {
      attributeNameIndex,
      info,
    },
    offset,
  };
}
function readAttributeLineNumberTable(
  constantPool: Array<ConstantInfo>,
  attributeNameIndex: number,
  attributeLength: number,
  view: DataView,
  offset: number
) {
  const lineNumberTableLength = view.getUint16(offset);
  offset += 2;

  const lineNumberTable = [];
  for (let i = 0; i < lineNumberTableLength; i++) {
    const startPc = view.getUint16(offset);
    offset += 2;
    const lineNumber = view.getUint16(offset);
    offset += 2;
    lineNumberTable.push({
      startPc,
      lineNumber,
    });
  }

  return {
    result: {
      attributeNameIndex,
      lineNumberTableLength,
      lineNumberTable,
    },
    offset,
  };
}

function readAttributeLocalVariableTable(
  constantPool: Array<ConstantInfo>,
  attributeNameIndex: number,
  attributeLength: number,
  view: DataView,
  offset: number
) {
  console.warn("readAttributeLocalVariableTable is not implemented!");
  const info = [];

  for (let i = 0; i < attributeLength; i += 1) {
    info.push(view.getUint8(offset));
    offset += 1;
  }

  return {
    result: {
      attributeNameIndex,
      info,
    },
    offset,
  };
}

function readAttributeLocalVariableTypeTable(
  constantPool: Array<ConstantInfo>,
  attributeNameIndex: number,
  attributeLength: number,
  view: DataView,
  offset: number
) {
  console.warn("readAttributeLocalVariableTypeTable is not implemented!");
  const info = [];

  for (let i = 0; i < attributeLength; i += 1) {
    info.push(view.getUint8(offset));
    offset += 1;
  }

  return {
    result: {
      attributeNameIndex,
      info,
    },
    offset,
  };
}

function readAttributeDeprecated(
  constantPool: Array<ConstantInfo>,
  attributeNameIndex: number,
  attributeLength: number,
  view: DataView,
  offset: number
) {
  console.warn("readAttributeDeprecated is not implemented!");
  const info = [];

  for (let i = 0; i < attributeLength; i += 1) {
    info.push(view.getUint8(offset));
    offset += 1;
  }

  return {
    result: {
      attributeNameIndex,
      info,
    },
    offset,
  };
}

function readAttributeRuntimeVisibleAnnotations(
  constantPool: Array<ConstantInfo>,
  attributeNameIndex: number,
  attributeLength: number,
  view: DataView,
  offset: number
) {
  console.warn("readAttributeRuntimeVisibleAnnotations is not implemented!");
  const info = [];

  for (let i = 0; i < attributeLength; i += 1) {
    info.push(view.getUint8(offset));
    offset += 1;
  }

  return {
    result: {
      attributeNameIndex,
      info,
    },
    offset,
  };
}

function readAttributeRuntimeInvisibleAnnotations(
  constantPool: Array<ConstantInfo>,
  attributeNameIndex: number,
  attributeLength: number,
  view: DataView,
  offset: number
) {
  console.warn("readAttributeRuntimeInvisibleAnnotations is not implemented!");
  const info = [];

  for (let i = 0; i < attributeLength; i += 1) {
    info.push(view.getUint8(offset));
    offset += 1;
  }

  return {
    result: {
      attributeNameIndex,
      info,
    },
    offset,
  };
}

function readAttributeRuntimeVisibleParameterAnnotations(
  constantPool: Array<ConstantInfo>,
  attributeNameIndex: number,
  attributeLength: number,
  view: DataView,
  offset: number
) {
  console.warn(
    "readAttributeRuntimeVisibleParameterAnnotations is not implemented!"
  );
  const info = [];

  for (let i = 0; i < attributeLength; i += 1) {
    info.push(view.getUint8(offset));
    offset += 1;
  }

  return {
    result: {
      attributeNameIndex,
      info,
    },
    offset,
  };
}

function readAttributeRuntimeInvisibleParameterAnnotations(
  constantPool: Array<ConstantInfo>,
  attributeNameIndex: number,
  attributeLength: number,
  view: DataView,
  offset: number
) {
  console.warn(
    "readAttributeRuntimeInvisibleParameterAnnotations is not implemented!"
  );
  const info = [];

  for (let i = 0; i < attributeLength; i += 1) {
    info.push(view.getUint8(offset));
    offset += 1;
  }

  return {
    result: {
      attributeNameIndex,
      info,
    },
    offset,
  };
}

function readAttributeAnnotationDefault(
  constantPool: Array<ConstantInfo>,
  attributeNameIndex: number,
  attributeLength: number,
  view: DataView,
  offset: number
) {
  console.warn("readAttributeAnnotationDefault is not implemented!");
  const info = [];

  for (let i = 0; i < attributeLength; i += 1) {
    info.push(view.getUint8(offset));
    offset += 1;
  }

  return {
    result: {
      attributeNameIndex,
      info,
    },
    offset,
  };
}
function readAttributeBootstrapMethods(
  constantPool: Array<ConstantInfo>,
  attributeNameIndex: number,
  attributeLength: number,
  view: DataView,
  offset: number
) {
  const numBootstrapMethods = view.getUint16(offset);
  offset += 2;

  const bootstrapMethods = [];

  for (let i = 0; i < numBootstrapMethods; i += 1) {
    const bootstrapMethodRef = view.getUint16(offset);
    offset += 2;
    const numBootstrapArguments = view.getUint16(offset);
    offset += 2;
    const bootstrapArguments = [];

    for (let j = 0; j < numBootstrapArguments; j += 1) {
      bootstrapArguments.push(view.getUint16(offset));
      offset += 2;
    }
    bootstrapMethods.push({
      bootstrapMethodRef,
      bootstrapArguments,
    });
  }

  return {
    result: {
      attributeNameIndex,
      attributeLength,
      numBootstrapMethods,
      bootstrapMethods,
    },
    offset,
  };
}

// Non predefined attribute, ignored.
function readAttributeGeneric(
  constantPool: Array<ConstantInfo>,
  attributeNameIndex: number,
  attributeLength: number,
  view: DataView,
  offset: number
) {
  const info = [];

  for (let i = 0; i < attributeLength; i += 1) {
    info.push(view.getUint8(offset));
    offset += 1;
  }

  return {
    result: {
      attributeNameIndex,
      info,
    },
    offset,
  };
}
