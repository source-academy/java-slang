import { ClassRef, MethodRef } from "../../ConstantRef";

export interface InstructionPointer {
  className: string;
  methodName: string;
  pc: number;
}

export interface StackFrame {
  operandStack: any[];
  class: ClassRef;
  method: MethodRef;
  pc: number;
  locals: any[];
}
