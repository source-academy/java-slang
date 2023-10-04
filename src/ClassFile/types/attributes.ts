export interface ConstantValueAttribute {
  attributeNameIndex: number;
  attributeLength: number;
  constantvalueIndex: number;
}

export interface ExceptionHandler {
  startPc: number;
  endPc: number;
  handlerPc: number;
  catchType: number;
}

export interface CodeAttribute {
  attributeNameIndex: number;
  attributeLength: number;
  maxStack: number;
  maxLocals: number;
  codeLength: number;
  code: DataView;
  exceptionTableLength: number;
  exceptionTable: Array<ExceptionHandler>;
  attributesCount: number;
  attributes: Array<AttributeInfo>;
}

export interface TopVariableInfo {
  tag: number /* 0 */;
}

export interface IntegerVariableInfo {
  tag: number /* 1 */;
}

export interface FloatVariableInfo {
  tag: number /* 2 */;
}

export interface DoubleVariableInfo {
  tag: number /* 2 */;
}

export interface LongVariableInfo {
  tag: number /* 4 */;
}

export interface NullVariableInfo {
  tag: number /* 5 */;
}

export interface UninitializedThisVariableInfo {
  tag: number /* 6 */;
}

export interface ObjectVariableInfo {
  tag: number /* 7 */;
  cpoolIndex: number;
}

export interface UninitializedVariableInfo {
  tag: number /* 8 */;
  offset: number;
}

export type VerificationTypeInfo =
  | TopVariableInfo
  | IntegerVariableInfo
  | FloatVariableInfo
  | LongVariableInfo
  | DoubleVariableInfo
  | NullVariableInfo
  | UninitializedThisVariableInfo
  | ObjectVariableInfo
  | UninitializedVariableInfo;

export interface SameFrame {
  frameType: number /* 0-63 */;
}

export interface SameLocals1StackItemFrame {
  frameType: number /* 64-127 */;
  stack: Array<VerificationTypeInfo>;
}

export interface SameLocals1StackItemFrameExtended {
  frameType: number /* 247 */;
  offsetDelta: number;
  stack: Array<VerificationTypeInfo>;
}

export interface ChopFrame {
  frameType: number /* 248-250 */;
  offsetDelta: number;
}

export interface SameFrameExtended {
  frameType: number /* 251 */;
  offsetDelta: number;
}

export interface AppendFrame {
  frameType: number /* 252-254 */;
  offsetDelta: number;
  stack: Array<VerificationTypeInfo>;
}

export interface FullFrame {
  frameType: number /* 255 */;
  offsetDelta: number;
  locals: Array<VerificationTypeInfo>;
  stack: Array<VerificationTypeInfo>;
}

export type StackMapFrame =
  | SameFrame
  | SameLocals1StackItemFrame
  | SameLocals1StackItemFrameExtended
  | ChopFrame
  | SameFrameExtended
  | AppendFrame
  | FullFrame;

export interface StackMapTableAttribute {
  attributeNameIndex: number;
  attributeLength: number;
  entries: Array<StackMapFrame>;
}

export interface ExceptionsAttribute {
  attributeNameIndex: number;
  attributeLength: number;
  exceptionIndexTable: Array<number>;
}

export interface InnerClassesAttribute {
  attributeNameIndex: number;
  attributeLength: number;
  classes: Array<{
    innerClassInfoIndex: number;
    outerClassInfoIndex: number;
    innerNameIndex: number;
    innerClassAccessFlags: number;
  }>;
}

export interface EnclosingMethodAttribute {
  attributeNameIndex: number;
  attributeLength: number;
  classIndex: number;
  methodIndex: number;
}

export interface SyntheticAttribute {
  attributeNameIndex: number;
  attributeLength: number;
}

export interface SignatureAttribute {
  attributeNameIndex: number;
  attributeLength: number;
  signatureIndex: number;
}

export interface SourceFileAttribute {
  attributeNameIndex: number;
  attributeLength: number;
  sourcefileIndex: number;
}

export interface SourceDebugExtensionAttribute {
  attributeNameIndex: number;
  attributeLength: number;
  debugExtension: Array<number>;
}

export interface LineNumberTableAttribute {
  attributeNameIndex: number;
  attributeLength: number;
  lineNumberTableLength: number;
  lineNumberTable: Array<{
    startPc: number;
    lineNumber: number;
  }>;
}

export interface LocalVariableTableAttribute {
  attributeNameIndex: number;
  attributeLength: number;
  localVariableTableLength: number;
  localVariableTable: Array<{
    startPc: number;
    length: number;
    nameIndex: number;
    descriptorIndex: number;
    index: number;
  }>;
}

export interface LocalVariableTypeTableAttribute {
  attributeNameIndex: number;
  attributeLength: number;
  localVariableTypeTableLength: number;
  localVariableTypeTable: Array<{
    startPc: number;
    length: number;
    nameIndex: number;
    signatureIndex: number;
    index: number;
  }>;
}

export interface DeprecatedAttribute {
  attributeNameIndex: number;
  attributeLength: number;
}

export interface AnnotationType {
  typeIndex: number;
  numElementValuePairs: number;
  elementValuePairs: Array<{
    elementNameIndex: number;
    value: number;
  }>;
}

export interface BootstrapMethodsAttribute {
  attributeNameIndex: number;
  attributeLength: number;
  numBootstrapMethods: number;
  bootstrapMethods: Array<BootstrapMethod>;
}

export interface BootstrapMethod {
  bootstrapMethodRef: number;
  numBootstrapArguments: number;
  bootstrapArguments: Array<number>;
}


export type AttributeInfo =
  | ConstantValueAttribute
  | CodeAttribute
  | StackMapTableAttribute
  | ExceptionsAttribute
  | InnerClassesAttribute
  | EnclosingMethodAttribute
  | SyntheticAttribute
  | SignatureAttribute
  | SourceFileAttribute
  | SourceDebugExtensionAttribute
  | LineNumberTableAttribute
  | LocalVariableTableAttribute
  | LocalVariableTypeTableAttribute
  | DeprecatedAttribute
  | BootstrapMethodsAttribute 
