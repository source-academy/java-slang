import {
  AttributeInfo,
  ConstantValueAttribute,
  CodeAttribute,
  ExceptionsAttribute,
  InnerClassesAttribute,
  EnclosingMethodAttribute,
  SignatureAttribute,
  SourceDebugExtensionAttribute,
  LineNumberTableAttribute,
  LocalVariableTableAttribute,
  LocalVariableTypeTableAttribute,
  BootstrapMethodsAttribute,
  StackMapTableAttribute,
  SourceFileAttribute,
  StackMapFrame,
} from "../../../ClassFile/types/attributes";
import { ConstantPool } from "../../constant-pool";
import {
  Constant,
  ConstantClass,
  ConstantDouble,
  ConstantFloat,
  ConstantInteger,
  ConstantLong,
  ConstantMethodHandle,
  ConstantMethodType,
  ConstantMethodref,
  ConstantString,
  ConstantUtf8,
} from "./Constants";

export interface IAttribute {
  name: string;
}

export const info2Attribute = (
  info: AttributeInfo,
  constantPool: ConstantPool
): IAttribute => {
  const name = (
    constantPool.get(info.attributeNameIndex) as ConstantUtf8
  ).get();

  switch (name) {
    case "ConstantValue":
      return {
        name,
        constantvalue: constantPool.get(
          (info as ConstantValueAttribute).constantvalueIndex
        ) as Constant,
      } as ConstantValue;
    case "Code":
      const code = info as CodeAttribute;
      const attr: { [attributeName: string]: IAttribute } = {};
      const exceptionTable = code.exceptionTable.map((handler) => {
        return {
          startPc: handler.startPc,
          endPc: handler.endPc,
          handlerPc: handler.handlerPc,
          catchType:
            handler.catchType === 0
              ? null
              : (constantPool.get(handler.catchType) as ConstantClass),
        };
      });
      code.attributes.forEach((element) => {
        attr[
          (constantPool.get(element.attributeNameIndex) as ConstantUtf8).get()
        ] = info2Attribute(element, constantPool);
      });
      return {
        name,
        maxStack: code.maxStack,
        maxLocals: code.maxLocals,
        codeLength: code.codeLength,
        code: code.code,
        exceptionTableLength: code.exceptionTableLength,
        exceptionTable: exceptionTable,
        attributes: attr,
      } as Code;
    case "Exceptions":
      return {
        name,
        attributeInfo: info,
      } as UnhandledAttribute;
      const exceptions: ConstantClass[] = [];
      (info as ExceptionsAttribute).exceptionIndexTable.forEach((index) => {
        exceptions.push(constantPool.get(index) as ConstantClass);
      });
      return {
        name,
        exceptionTable: exceptions,
      } as Exceptions;
    case "InnerClasses":
      return {
        name,
        attributeInfo: info,
      } as UnhandledAttribute;
      const innerclasses: {
        innerClass: ConstantClass;
        outerClass: ConstantClass | null;
        innerName: string | null;
        innerClassAccessFlags: number;
      }[] = [];
      (info as InnerClassesAttribute).classes.forEach((element) => {
        innerclasses.push({
          innerClass: constantPool.get(
            element.innerClassInfoIndex
          ) as ConstantClass,
          outerClass:
            element.outerClassInfoIndex === 0
              ? null
              : (constantPool.get(
                  element.outerClassInfoIndex
                ) as ConstantClass),
          innerName:
            element.innerNameIndex === 0
              ? null
              : (
                  constantPool.get(element.innerNameIndex) as ConstantUtf8
                ).get(),
          innerClassAccessFlags: element.innerClassAccessFlags,
        });
      });

      return {
        name,
        classes: innerclasses,
      } as InnerClasses;
    case "EnclosingMethod":
      return {
        name,
        attributeInfo: info,
      } as UnhandledAttribute;
      const cls = constantPool.get(
        (info as EnclosingMethodAttribute).classIndex
      ) as ConstantClass;
      const method = constantPool.get(
        (info as EnclosingMethodAttribute).methodIndex
      ) as ConstantMethodref;
      return {
        name,
        class: cls,
        method: method,
      } as EnclosingMethod;
    case "Signature":
      const signature = (
        constantPool.get(
          (info as SignatureAttribute).signatureIndex
        ) as ConstantUtf8
      ).get();
      return {
        name,
        signature,
      } as Signature;
    case "SourceDebugExtension":
      return {
        name,
        attributeInfo: info,
      } as UnhandledAttribute;
      return {
        name,
        debugExtension: (info as SourceDebugExtensionAttribute).debugExtension,
      } as SourceDebugExtension;
    case "LineNumberTable":
      return {
        name,
        lineNumberTable: (info as LineNumberTableAttribute).lineNumberTable,
      } as LineNumberTable;
    case "LocalVariableTable":
      return {
        name,
        attributeInfo: info,
      } as UnhandledAttribute;
      const localVarTable: Array<{
        startPc: number;
        length: number;
        name: string;
        descriptor: string;
        index: number;
      }> = [];
      (info as LocalVariableTableAttribute).localVariableTable.forEach(
        (element) => {
          localVarTable.push({
            startPc: element.startPc,
            length: element.length,
            name: (constantPool.get(element.nameIndex) as ConstantUtf8).get(),
            descriptor: (
              constantPool.get(element.descriptorIndex) as ConstantUtf8
            ).get(),
            index: element.index,
          });
        }
      );
      return {
        name,
        localVariableTable: localVarTable,
      } as LocalVariableTable;
    case "LocalVariableTypeTable":
      return {
        name,
        attributeInfo: info,
      } as UnhandledAttribute;
      const localVarTypeTable: Array<{
        startPc: number;
        length: number;
        name: string;
        signature: string;
        index: number;
      }> = [];
      (info as LocalVariableTypeTableAttribute).localVariableTypeTable.forEach(
        (element) => {
          localVarTypeTable.push({
            startPc: element.startPc,
            length: element.length,
            name: (constantPool.get(element.nameIndex) as ConstantUtf8).get(),
            signature: (
              constantPool.get(element.signatureIndex) as ConstantUtf8
            ).get(),
            index: element.index,
          });
        }
      );

      return {
        name,
        localVariableTypeTable: localVarTypeTable,
      } as LocalVariableTypeTable;
    case "Deprecated":
      return {
        name,
      };
    case "BootstrapMethods":
      const bootstrapMethods: Array<BootstrapMethod> = [];
      (info as BootstrapMethodsAttribute).bootstrapMethods.forEach(
        (element) => {
          const bootstrapArguments: Array<
            | ConstantString
            | ConstantClass
            | ConstantInteger
            | ConstantLong
            | ConstantFloat
            | ConstantDouble
            | ConstantMethodHandle
            | ConstantMethodType
          > = [];
          element.bootstrapArguments.forEach((arg) => {
            bootstrapArguments.push(constantPool.get(arg) as any);
          });
          bootstrapMethods.push({
            bootstrapMethodRef: constantPool.get(
              element.bootstrapMethodRef
            ) as ConstantMethodHandle,
            bootstrapArguments,
          });
        }
      );

      return {
        name,
        bootstrapMethods,
      } as BootstrapMethods;
    case "StackMapTable":
      return {
        name,
        attributeInfo: info,
      } as UnhandledAttribute;
      return {
        name,
        entries: (info as StackMapTableAttribute).entries,
      } as StackMapTable;
    case "SourceFile":
      return {
        name,
        attributeInfo: info,
      } as UnhandledAttribute;
      return {
        name,
        sourceFile: constantPool.get(
          (info as SourceFileAttribute).sourcefileIndex
        ) as ConstantUtf8,
      } as SourceFile;
    case "Synthetic":
      return {
        name,
        attributeInfo: info,
      } as UnhandledAttribute;
      return {
        name,
      } as Synthetic;
    case "Deprecated":
      return {
        name,
        attributeInfo: info,
      } as UnhandledAttribute;
      return {
        name,
      } as Deprecated;
    default:
      return {
        name,
        attributeInfo: info,
      } as UnhandledAttribute;
  }
};

export interface ConstantValue extends IAttribute {
  constantvalue:
    | ConstantString
    | ConstantInteger
    | ConstantFloat
    | ConstantLong
    | ConstantDouble
    | ConstantMethodHandle
    | ConstantMethodType
    | ConstantClass;
}

export interface Code extends IAttribute {
  maxStack: number;
  maxLocals: number;
  codeLength: number;
  code: DataView;
  exceptionTableLength: number;
  exceptionTable: Array<{
    startPc: number;
    endPc: number;
    handlerPc: number;
    catchType: ConstantClass | null;
  }>;
  attributes: {
    [attributeName: string]: IAttribute;
  };
}

export interface Exceptions extends IAttribute {
  exceptionTable: Array<ConstantClass>;
}

export interface InnerClasses extends IAttribute {
  classes: Array<{
    innerClass: ConstantClass;
    outerClass: ConstantClass | null;
    innerName: string;
    innerClassAccessFlags: number;
  }>;
}

export interface EnclosingMethod extends IAttribute {
  class: ConstantClass;
  method: ConstantMethodref | null;
}

export interface Signature extends IAttribute {
  signature: string;
}

export interface BootstrapMethods extends IAttribute {
  bootstrapMethods: Array<BootstrapMethod>;
}

export interface BootstrapMethod {
  bootstrapMethodRef: ConstantMethodHandle;
  bootstrapArguments: Array<
    | ConstantString
    | ConstantClass
    | ConstantInteger
    | ConstantLong
    | ConstantFloat
    | ConstantDouble
    | ConstantMethodHandle
    | ConstantMethodType
  >;
}

export interface StackMapTable extends IAttribute {
  entries: Array<StackMapFrame>;
}

export interface LineNumberTable extends IAttribute {
  lineNumberTable: Array<{
    startPc: number;
    lineNumber: number;
  }>;
}

export interface SourceFile extends IAttribute {
  sourceFile: ConstantUtf8;
}

export interface LocalVariableTable extends IAttribute {
  localVariableTable: Array<{
    startPc: number;
    length: number;
    name: string;
    descriptor: string;
    index: number;
  }>;
}

export interface LocalVariableTypeTable extends IAttribute {
  localVariableTypeTable: Array<{
    startPc: number;
    length: number;
    name: string;
    signature: string;
    index: number;
  }>;
}

export interface Deprecated extends IAttribute {}

export interface SourceDebugExtension extends IAttribute {
  debugExtension: any[];
}

export interface Synthetic extends IAttribute {}

export interface UnhandledAttribute extends IAttribute {
  attributeInfo: AttributeInfo;
}

export interface NestHost extends IAttribute {
  hostClass: ConstantClass;
}

export interface NestMembers extends IAttribute {
  classes: Array<ConstantClass>;
}
