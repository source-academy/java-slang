export interface AttributeType {
  [key: string]: any;
}

export interface AttributeConstantValue {
  attributeNameIndex: number;
  constantvalueIndex: number;
}

export interface ExceptionType {
  startPc: number;
  endPc: number;
  handlerPc: number;
  catchType: number;
}

export interface AttributeCode {
  attributeNameIndex: number;
  maxStack: number;
  maxLocals: number;
  code: DataView;
  exceptionTable: Array<ExceptionType>;
  attributes: Array<AttributeType>;
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

export interface sameFrame {
  frameType: number /* 0-63 */;
}

export interface sameLocals1StackItemFrame {
  frameType: number /* 64-127 */;
  stack: Array<VerificationTypeInfo>;
}

export interface sameLocals1StackItemFrameExtended {
  frameType: number /* 247 */;
  offsetDelta: number;
  stack: Array<VerificationTypeInfo>;
}

export interface chopFrame {
  frameType: number /* 248-250 */;
  offsetDelta: number;
}

export interface sameFrameExtended {
  frameType: number /* 251 */;
  offsetDelta: number;
}

export interface appendFrame {
  frameType: number /* 252-254 */;
  offsetDelta: number;
  stack: Array<VerificationTypeInfo>;
}

export interface fullFrame {
  frameType: number /* 255 */;
  offsetDelta: number;
  locals: Array<VerificationTypeInfo>;
  stack: Array<VerificationTypeInfo>;
}

export type stackMapFrame =
  | sameFrame
  | sameLocals1StackItemFrame
  | sameLocals1StackItemFrameExtended
  | chopFrame
  | sameFrameExtended
  | appendFrame
  | fullFrame;

export interface AttributeStackMapTable {
  attributeNameIndex: number;
  entries: Array<stackMapFrame>;
}

export interface AttributeExceptions {
  attributeNameIndex: number;
  exceptionIndexTable: Array<number>;
}

export interface AttributeInnerClasses {
  attributeNameIndex: number;
  classes: Array<{
    innerClassInfoIndex: number;
    outerClassInfoIndex: number;
    innerNameIndex: number;
    innerClassAccessFlags: number;
  }>;
}

export interface AttributeEnclosingMethod {
  attributeNameIndex: number;
  classIndex: number;
  methodIndex: number;
}

export interface AttributeSynthetic {
  attributeNameIndex: number;
}

export interface AttributeSignature {
  attributeNameIndex: number;
  signatureIndex: number;
}

export interface AttributeSourceFile {
  attributeNameIndex: number;
  sourcefileIndex: number;
}

export interface AttributeSourceDebugExtension {
  attributeNameIndex: number;
  debugExtension: Array<number>;
}

export interface AttributeLineNumberTable {
  attributeNameIndex: number;
  lineNumberTableLength: number;
  lineNumberTable: Array<{
    startPc: number;
    lineNumber: number;
  }>;
}

export interface AttributeLocalVariableTable {
  attributeNameIndex: number;
  localVariableTableLength: number;
  localVariableTable: Array<{
    startPc: number;
    length: number;
    nameIndex: number;
    descriptorIndex: number;
    index: number;
  }>;
}

export interface AttributeLocalVariableTypeTable {
  attributeNameIndex: number;
  localVariableTypeTableLength: number;
  localVariableTypeTable: Array<{
    startPc: number;
    length: number;
    nameIndex: number;
    signatureIndex: number;
    index: number;
  }>;
}

export interface AttributeDeprecated {
  attributeNameIndex: number;
}

export interface AnnotationType {
  typeIndex: number;
  numElementValuePairs: number;
  elementValuePairs: Array<{
    elementNameIndex: number;
    value: number;
  }>;
}

export interface AttributeBootstrapMethods {
  attributeNameIndex: number;
  numBootstrapMethods: number;
  bootstrapMethods: Array<BootstrapMethod>;
}

export interface BootstrapMethod {
  bootstrapMethodRef: number;
  numBootstrapArguments: number;
  bootstrapArguments: Array<number>;
}
