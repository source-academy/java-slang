import { ClassRef, MethodRef } from "../ConstantRef";

export interface StackFrame {
  operandStack: any[];
  class: ClassRef;
  method: MethodRef;
  pc: number;
  locals: any[];
}
