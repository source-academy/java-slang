import { ClassRef, MethodRef } from "../ConstantRef";

export interface StackFrame {
  operandStack: any[];
  maxStack: number;
  class: ClassRef;
  method: MethodRef;
  pc: number;
  locals: any[];
}
