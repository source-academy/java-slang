import { ClassRef, MethodRef } from "../ConstantRef";
import { JavaReference } from "../dataTypes";
import { StackFrame } from "./types";


export default class NativeThread {
  private stack: StackFrame[];
  private stackPointer: number;
  private javaThis?: JavaReference;
  private cls: ClassRef;

  constructor(threadClass: ClassRef, javaThis: JavaReference) {
    this.cls = threadClass;
    this.javaThis = javaThis;
    this.stack = [];
    this.stackPointer = -1;
  }

  getCurrentInstruction(): any {
    throw new Error('Method not implemented.');
  }

  getPC(): number {
    return this.stack[this.stackPointer].pc;
  }

  offsetPc(pc: number) {
    this.stack[this.stackPointer].pc += pc;
  }

  setPc(pc: number) {
    this.stack[this.stackPointer].pc = pc;
  }

  getClassName(): string {
    return this.stack[this.stackPointer].class.getClassname();
  }

  getClass(): ClassRef {
    return this.stack[this.stackPointer].class;
  }

  getMethodName(): string {
    return this.stack[this.stackPointer].method.name;
  }

  getMethod(): MethodRef {
    return this.stack[this.stackPointer].method;
  }

  peekStackFrame() {
    return this.stack[this.stackPointer];
  }

  pushStack(value: any) {
    this.stack[this.stackPointer].operandStack.push(value);
  }

  pushStack64(value: any) {
    this.stack[this.stackPointer].operandStack.push(value);
    this.stack[this.stackPointer].operandStack.push(value);
  }

  popStack64() {
    if (this.stack?.[this.stackPointer]?.operandStack?.length <= 1) {
      this.throwNewException('java/lang/RuntimeException', 'Stack Underflow');
    }
    this.stack?.[this.stackPointer]?.operandStack?.pop();
    const value = this.stack?.[this.stackPointer]?.operandStack?.pop();
    if (value === undefined) {
      this.throwNewException('java/lang/RuntimeException', 'Stack Underflow');
    }
    return value;
  }

  popStack() {
    if (this.stack?.[this.stackPointer]?.operandStack?.length <= 0) {
      this.throwNewException('java/lang/RuntimeException', 'Stack Underflow');
    }
    const value = this.stack?.[this.stackPointer]?.operandStack?.pop();
    return value;
  }

  popStackFrame() {
    const sf = this.stack.pop();
    this.stackPointer -= 1;
  }

  pushStackFrame(frame: StackFrame) {
    this.stack.push(frame);
    this.stackPointer += 1;
  }

  storeLocal(index: number, value: any) {
    this.stack[this.stackPointer].locals[index] = value;
  }

  storeLocal64(index: number, value: any) {
    this.stack[this.stackPointer].locals[index] = value;
  }

  loadLocal(index: number): any {
    return this.stack[this.stackPointer].locals[index];
  }

  loadLocal64(index: number): any {
    return this.stack[this.stackPointer].locals[index];
  }

  throwNewException(className: string, msg: string) {
    throw new Error('Method not implemented.');
  }

  throwException(exception: any) {
    throw new Error('Method not implemented.');
  }
}
