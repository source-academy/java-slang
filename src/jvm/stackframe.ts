import { OPCODE } from "../ClassFile/constants/instructions";
import { JNI } from "./jni";
import Thread from "./thread";
import { Code } from "./types/class/Attributes";
import { ClassData, ReferenceClassData } from "./types/class/ClassData";
import { Method } from "./types/class/Method";
import { JvmObject } from "./types/reference/Object";
import { j2jsString } from "./utils";

import * as comparisons from "./instructions/comparisons";
import * as constants from "./instructions/constants";
import * as control from "./instructions/control";
import * as conversions from "./instructions/conversions";
import * as extended from "./instructions/extended";
import * as loads from "./instructions/loads";
import * as math from "./instructions/math";
import * as reserved from "./instructions/reserved";
import * as references from "./instructions/references";
import * as stack from "./instructions/stack";
import * as stores from "./instructions/stores";
import { ResultType } from "./types/Result";

const overwrites: {
  [cls: string]: {
    [methodSig: string]: (thread: Thread, locals: any[]) => boolean;
  };
} = {
  "java/lang/System": {
    "loadLibrary(Ljava/lang/String;)V": (thread: Thread, locals: any[]) => {
      const lib = j2jsString(locals[0]);

      // We have already loaded these libraries (DLLs).
      switch (lib) {
        case "zip":
        case "net":
        case "nio":
        case "awt":
        case "fontmanager":
        case "management":
          thread.returnStackFrame();
          return true;
        default:
          throw new Error("loadLibrary not supported");
      }
    },
  },
  "java/lang/ref/Reference": {
    "<clinit>()V": (thread: Thread, locals: any[]) => {
      thread.returnStackFrame();
      return true;
    },
  },
  "java/nio/charset/Charset$3": {
    "run()Ljava/lang/Object;": (thread: Thread, locals: any[]) => {
      thread.returnStackFrame();
      return true;
    },
  },
};

const checkOverwritten = (thread: Thread, method: Method) => {
  const overwritten =
    overwrites[method.getClass().getName()]?.[
      method.getName() + method.getDescriptor()
    ];
  if (overwritten) {
    overwritten(thread, thread.peekStackFrame().locals);
    return true;
  }
  return false;
};

const runInstruction = (thread: Thread, method: Method) => {
  const opcode = (method._getCode() as Code).code.getUint8(thread.getPC());

  switch (opcode) {
    case OPCODE.NOP:
      constants.runNop(thread);
      break;
    case OPCODE.ACONST_NULL:
      constants.runAconstNull(thread);
      break;
    case OPCODE.ICONST_M1:
      constants.runIconstM1(thread);
      break;
    case OPCODE.ICONST_0:
      constants.runIconst0(thread);
      break;
    case OPCODE.ICONST_1:
      constants.runIconst1(thread);
      break;
    case OPCODE.ICONST_2:
      constants.runIconst2(thread);
      break;
    case OPCODE.ICONST_3:
      constants.runIconst3(thread);
      break;
    case OPCODE.ICONST_4:
      constants.runIconst4(thread);
      break;
    case OPCODE.ICONST_5:
      constants.runIconst5(thread);
      break;
    case OPCODE.LCONST_0:
      constants.runLconst0(thread);
      break;
    case OPCODE.LCONST_1:
      constants.runLconst1(thread);
      break;
    case OPCODE.FCONST_0:
      constants.runFconst0(thread);
      break;
    case OPCODE.FCONST_1:
      constants.runFconst1(thread);
      break;
    case OPCODE.FCONST_2:
      constants.runFconst2(thread);
      break;
    case OPCODE.DCONST_0:
      constants.runDconst0(thread);
      break;
    case OPCODE.DCONST_1:
      constants.runDconst1(thread);
      break;
    case OPCODE.BIPUSH:
      constants.runBipush(thread);
      break;
    case OPCODE.SIPUSH:
      constants.runSipush(thread);
      break;
    case OPCODE.LDC:
      constants.runLdc(thread);
      break;
    case OPCODE.LDC_W:
      constants.runLdcW(thread);
      break;
    case OPCODE.LDC2_W:
      constants.runLdc2W(thread);
      break;
    case OPCODE.ILOAD:
      loads.runIload(thread);
      break;
    case OPCODE.LLOAD:
      loads.runLload(thread);
      break;
    case OPCODE.FLOAD:
      loads.runFload(thread);
      break;
    case OPCODE.DLOAD:
      loads.runDload(thread);
      break;
    case OPCODE.ALOAD:
      loads.runAload(thread);
      break;
    case OPCODE.ILOAD_0:
      loads.runIload0(thread);
      break;
    case OPCODE.ILOAD_1:
      loads.runIload1(thread);
      break;
    case OPCODE.ILOAD_2:
      loads.runIload2(thread);
      break;
    case OPCODE.ILOAD_3:
      loads.runIload3(thread);
      break;
    case OPCODE.LLOAD_0:
      loads.runLload0(thread);
      break;
    case OPCODE.LLOAD_1:
      loads.runLload1(thread);
      break;
    case OPCODE.LLOAD_2:
      loads.runLload2(thread);
      break;
    case OPCODE.LLOAD_3:
      loads.runLload3(thread);
      break;
    case OPCODE.FLOAD_0:
      loads.runFload0(thread);
      break;
    case OPCODE.FLOAD_1:
      loads.runFload1(thread);
      break;
    case OPCODE.FLOAD_2:
      loads.runFload2(thread);
      break;
    case OPCODE.FLOAD_3:
      loads.runFload3(thread);
      break;
    case OPCODE.DLOAD_0:
      loads.runDload0(thread);
      break;
    case OPCODE.DLOAD_1:
      loads.runDload1(thread);
      break;
    case OPCODE.DLOAD_2:
      loads.runDload2(thread);
      break;
    case OPCODE.DLOAD_3:
      loads.runDload3(thread);
      break;
    case OPCODE.ALOAD_0:
      loads.runAload0(thread);
      break;
    case OPCODE.ALOAD_1:
      loads.runAload1(thread);
      break;
    case OPCODE.ALOAD_2:
      loads.runAload2(thread);
      break;
    case OPCODE.ALOAD_3:
      loads.runAload3(thread);
      break;
    case OPCODE.IALOAD:
      loads.runIaload(thread);
      break;
    case OPCODE.LALOAD:
      loads.runLaload(thread);
      break;
    case OPCODE.FALOAD:
      loads.runFaload(thread);
      break;
    case OPCODE.DALOAD:
      loads.runDaload(thread);
      break;
    case OPCODE.AALOAD:
      loads.runAaload(thread);
      break;
    case OPCODE.BALOAD:
      loads.runBaload(thread);
      break;
    case OPCODE.CALOAD:
      loads.runCaload(thread);
      break;
    case OPCODE.SALOAD:
      loads.runSaload(thread);
      break;
    case OPCODE.ISTORE:
      stores.runIstore(thread);
      break;
    case OPCODE.LSTORE:
      stores.runLstore(thread);
      break;
    case OPCODE.FSTORE:
      stores.runFstore(thread);
      break;
    case OPCODE.DSTORE:
      stores.runDstore(thread);
      break;
    case OPCODE.ASTORE:
      stores.runAstore(thread);
      break;
    case OPCODE.ISTORE_0:
      stores.runIstore0(thread);
      break;
    case OPCODE.ISTORE_1:
      stores.runIstore1(thread);
      break;
    case OPCODE.ISTORE_2:
      stores.runIstore2(thread);
      break;
    case OPCODE.ISTORE_3:
      stores.runIstore3(thread);
      break;
    case OPCODE.LSTORE_0:
      stores.runLstore0(thread);
      break;
    case OPCODE.LSTORE_1:
      stores.runLstore1(thread);
      break;
    case OPCODE.LSTORE_2:
      stores.runLstore2(thread);
      break;
    case OPCODE.LSTORE_3:
      stores.runLstore3(thread);
      break;
    case OPCODE.FSTORE_0:
      stores.runFstore0(thread);
      break;
    case OPCODE.FSTORE_1:
      stores.runFstore1(thread);
      break;
    case OPCODE.FSTORE_2:
      stores.runFstore2(thread);
      break;
    case OPCODE.FSTORE_3:
      stores.runFstore3(thread);
      break;
    case OPCODE.DSTORE_0:
      stores.runDstore0(thread);
      break;
    case OPCODE.DSTORE_1:
      stores.runDstore1(thread);
      break;
    case OPCODE.DSTORE_2:
      stores.runDstore2(thread);
      break;
    case OPCODE.DSTORE_3:
      stores.runDstore3(thread);
      break;
    case OPCODE.ASTORE_0:
      stores.runAstore0(thread);
      break;
    case OPCODE.ASTORE_1:
      stores.runAstore1(thread);
      break;
    case OPCODE.ASTORE_2:
      stores.runAstore2(thread);
      break;
    case OPCODE.ASTORE_3:
      stores.runAstore3(thread);
      break;
    case OPCODE.IASTORE:
      stores.runIastore(thread);
      break;
    case OPCODE.LASTORE:
      stores.runLastore(thread);
      break;
    case OPCODE.FASTORE:
      stores.runFastore(thread);
      break;
    case OPCODE.DASTORE:
      stores.runDastore(thread);
      break;
    case OPCODE.AASTORE:
      stores.runAastore(thread);
      break;
    case OPCODE.BASTORE:
      stores.runBastore(thread);
      break;
    case OPCODE.CASTORE:
      stores.runCastore(thread);
      break;
    case OPCODE.SASTORE:
      stores.runSastore(thread);
      break;
    case OPCODE.POP:
      stack.runPop(thread);
      break;
    case OPCODE.POP2:
      stack.runPop2(thread);
      break;
    case OPCODE.DUP:
      stack.runDup(thread);
      break;
    case OPCODE.DUP_X1:
      stack.runDupX1(thread);
      break;
    case OPCODE.DUP_X2:
      stack.runDupX2(thread);
      break;
    case OPCODE.DUP2:
      stack.runDup2(thread);
      break;
    case OPCODE.DUP2:
      stack.runDup2(thread);
      break;
    case OPCODE.DUP2_X1:
      stack.runDup2X1(thread);
      break;
    case OPCODE.DUP2_X2:
      stack.runDup2X2(thread);
      break;
    case OPCODE.SWAP:
      stack.runSwap(thread);
      break;
    case OPCODE.IADD:
      math.runIadd(thread);
      break;
    case OPCODE.LADD:
      math.runLadd(thread);
      break;
    case OPCODE.FADD:
      math.runFadd(thread);
      break;
    case OPCODE.DADD:
      math.runDadd(thread);
      break;
    case OPCODE.ISUB:
      math.runIsub(thread);
      break;
    case OPCODE.LSUB:
      math.runLsub(thread);
      break;
    case OPCODE.FSUB:
      math.runFsub(thread);
      break;
    case OPCODE.DSUB:
      math.runDsub(thread);
      break;
    case OPCODE.IMUL:
      math.runImul(thread);
      break;
    case OPCODE.LMUL:
      math.runLmul(thread);
      break;
    case OPCODE.FMUL:
      math.runFmul(thread);
      break;
    case OPCODE.DMUL:
      math.runDmul(thread);
      break;
    case OPCODE.IDIV:
      math.runIdiv(thread);
      break;
    case OPCODE.LDIV:
      math.runLdiv(thread);
      break;
    case OPCODE.FDIV:
      math.runFdiv(thread);
      break;
    case OPCODE.DDIV:
      math.runDdiv(thread);
      break;
    case OPCODE.IREM:
      math.runIrem(thread);
      break;
    case OPCODE.LREM:
      math.runLrem(thread);
      break;
    case OPCODE.FREM:
      math.runFrem(thread);
      break;
    case OPCODE.DREM:
      math.runDrem(thread);
      break;
    case OPCODE.INEG:
      math.runIneg(thread);
      break;
    case OPCODE.LNEG:
      math.runLneg(thread);
      break;
    case OPCODE.FNEG:
      math.runFneg(thread);
      break;
    case OPCODE.DNEG:
      math.runDneg(thread);
      break;
    case OPCODE.ISHL:
      math.runIshl(thread);
      break;
    case OPCODE.LSHL:
      math.runLshl(thread);
      break;
    case OPCODE.ISHR:
      math.runIshr(thread);
      break;
    case OPCODE.LSHR:
      math.runLshr(thread);
      break;
    case OPCODE.IUSHR:
      math.runIushr(thread);
      break;
    case OPCODE.LUSHR:
      math.runLushr(thread);
      break;
    case OPCODE.IAND:
      math.runIand(thread);
      break;
    case OPCODE.LAND:
      math.runLand(thread);
      break;
    case OPCODE.IOR:
      math.runIor(thread);
      break;
    case OPCODE.LOR:
      math.runLor(thread);
      break;
    case OPCODE.IXOR:
      math.runIxor(thread);
      break;
    case OPCODE.LXOR:
      math.runLxor(thread);
      break;
    case OPCODE.IINC:
      math.runIinc(thread);
      break;
    case OPCODE.I2L:
      conversions.runI2l(thread);
      break;
    case OPCODE.I2F:
      conversions.runI2f(thread);
      break;
    case OPCODE.I2D:
      conversions.runI2d(thread);
      break;
    case OPCODE.L2I:
      conversions.runL2i(thread);
      break;
    case OPCODE.L2F:
      conversions.runL2f(thread);
      break;
    case OPCODE.L2D:
      conversions.runL2d(thread);
      break;
    case OPCODE.F2I:
      conversions.runF2i(thread);
      break;
    case OPCODE.F2L:
      conversions.runF2l(thread);
      break;
    case OPCODE.F2D:
      conversions.runF2d(thread);
      break;
    case OPCODE.D2I:
      conversions.runD2i(thread);
      break;
    case OPCODE.D2L:
      conversions.runD2l(thread);
      break;
    case OPCODE.D2F:
      conversions.runD2f(thread);
      break;
    case OPCODE.I2B:
      conversions.runI2b(thread);
      break;
    case OPCODE.I2C:
      conversions.runI2c(thread);
      break;
    case OPCODE.I2S:
      conversions.runI2s(thread);
      break;
    case OPCODE.LCMP:
      comparisons.runLcmp(thread);
      break;
    case OPCODE.FCMPL:
      comparisons.runFcmpl(thread);
      break;
    case OPCODE.FCMPG:
      comparisons.runFcmpg(thread);
      break;
    case OPCODE.DCMPL:
      comparisons.runDcmpl(thread);
      break;
    case OPCODE.DCMPG:
      comparisons.runDcmpg(thread);
      break;
    case OPCODE.IFEQ:
      comparisons.runIfeq(thread);
      break;
    case OPCODE.IFNE:
      comparisons.runIfne(thread);
      break;
    case OPCODE.IFLT:
      comparisons.runIflt(thread);
      break;
    case OPCODE.IFGE:
      comparisons.runIfge(thread);
      break;
    case OPCODE.IFGT:
      comparisons.runIfgt(thread);
      break;
    case OPCODE.IFLE:
      comparisons.runIfle(thread);
      break;
    case OPCODE.IF_ICMPEQ:
      comparisons.runIfIcmpeq(thread);
      break;
    case OPCODE.IF_ICMPNE:
      comparisons.runIfIcmpne(thread);
      break;
    case OPCODE.IF_ICMPLT:
      comparisons.runIfIcmplt(thread);
      break;
    case OPCODE.IF_ICMPGE:
      comparisons.runIfIcmpge(thread);
      break;
    case OPCODE.IF_ICMPGT:
      comparisons.runIfIcmpgt(thread);
      break;
    case OPCODE.IF_ICMPLE:
      comparisons.runIfIcmple(thread);
      break;
    case OPCODE.IF_ACMPEQ:
      comparisons.runIfAcmpeq(thread);
      break;
    case OPCODE.IF_ACMPNE:
      comparisons.runIfAcmpne(thread);
      break;
    case OPCODE.GOTO:
      control.runGoto(thread);
      break;
    case OPCODE.JSR:
      control.runJsr(thread);
      break;
    case OPCODE.RET:
      control.runRet(thread);
      break;
    case OPCODE.TABLESWITCH:
      control.runTableswitch(thread);
      break;
    case OPCODE.LOOKUPSWITCH:
      control.runLookupswitch(thread);
      break;
    case OPCODE.IRETURN:
      control.runIreturn(thread);
      break;
    case OPCODE.LRETURN:
      control.runLreturn(thread);
      break;
    case OPCODE.FRETURN:
      control.runFreturn(thread);
      break;
    case OPCODE.DRETURN:
      control.runDreturn(thread);
      break;
    case OPCODE.ARETURN:
      control.runAreturn(thread);
      break;
    case OPCODE.RETURN:
      control.runReturn(thread);
      break;
    case OPCODE.GETSTATIC:
      references.runGetstatic(thread);
      break;
    case OPCODE.PUTSTATIC:
      references.runPutstatic(thread);
      break;
    case OPCODE.GETFIELD:
      references.runGetfield(thread);
      break;
    case OPCODE.PUTFIELD:
      references.runPutfield(thread);
      break;
    case OPCODE.INVOKEVIRTUAL:
      references.runInvokevirtual(thread);
      break;
    case OPCODE.INVOKESPECIAL:
      references.runInvokespecial(thread);
      break;
    case OPCODE.INVOKESTATIC:
      references.runInvokestatic(thread);
      break;
    case OPCODE.INVOKEINTERFACE:
      references.runInvokeinterface(thread);
      break;
    case OPCODE.INVOKEDYNAMIC:
      references.runInvokedynamic(thread);
      break;
    case OPCODE.NEW:
      references.runNew(thread);
      break;
    case OPCODE.NEWARRAY:
      references.runNewarray(thread);
      break;
    case OPCODE.ANEWARRAY:
      references.runAnewarray(thread);
      break;
    case OPCODE.ARRAYLENGTH:
      references.runArraylength(thread);
      break;
    case OPCODE.ATHROW:
      references.runAthrow(thread);
      break;
    case OPCODE.CHECKCAST:
      references.runCheckcast(thread);
      break;
    case OPCODE.INSTANCEOF:
      references.runInstanceof(thread);
      break;
    case OPCODE.MONITORENTER:
      references.runMonitorenter(thread);
      break;
    case OPCODE.MONITOREXIT:
      references.runMonitorexit(thread);
      break;
    case OPCODE.WIDE:
      extended.runWide(thread);
      break;
    case OPCODE.MULTIANEWARRAY:
      extended.runMultianewarray(thread);
      break;
    case OPCODE.IFNULL:
      extended.runIfnull(thread);
      break;
    case OPCODE.IFNONNULL:
      extended.runIfnonnull(thread);
      break;
    case OPCODE.GOTO_W:
      extended.runGotoW(thread);
      break;
    case OPCODE.JSR_W:
      extended.runJsrW(thread);
      break;
    case OPCODE.BREAKPOINT:
      reserved.runBreakpoint(thread);
      break;
    case OPCODE.IMPDEP1:
      reserved.runImpdep1(thread);
      break;
    case OPCODE.IMPDEP2:
      reserved.runImpdep2(thread);
      break;
    default:
      throw new Error(`runInstruction: Unknown opcode ${opcode} received!`);
  }
};

export abstract class StackFrame {
  public operandStack: any[];
  public maxStack: number;
  public class: ClassData;
  public method: Method;
  public pc: number;
  public locals: any[];
  protected returnOffset: number;

  constructor(
    cls: ClassData,
    method: Method,
    pc: number,
    locals: any[],
    returnOffset: number = 0
  ) {
    this.operandStack = [];
    this.maxStack = method.getMaxStack();
    this.class = cls;
    this.method = method;
    this.pc = pc;
    this.locals = locals;
    this.returnOffset = returnOffset;
  }

  /**
   * Behaviour when a method returns. Stackframe is already popped.
   * Responsible for pushing return value to operand stack of stackframe below it.
   */
  public onReturn(thread: Thread, retn: any) {
    if (retn !== undefined) {
      const popResult = thread.pushStack(retn);
      if (!popResult) {
        return;
      }
    }
    thread.offsetPc(this.returnOffset);
  }

  /**
   * Behaviour when a method returns with a 64 bit value. Stackframe is already popped.
   * Responsible for pushing return value to operand stack of stackframe below it.
   */
  public onReturn64(thread: Thread, retn: any) {
    const popResult = thread.pushStack64(retn);
    if (!popResult) {
      return;
    }
    thread.offsetPc(this.returnOffset);
  }

  /**
   * Runs stackframe for a single quantum.
   */
  abstract run(thread: Thread): void;

  /**
   * Called when the frame is popped due to an uncaught exception.
   * Does not prevent exception from being thrown in stackframe below it.
   */
  onError(thread: Thread, err: JvmObject) {}

  checkNative(): this is NativeStackFrame {
    return false;
  }
}

export class JavaStackFrame extends StackFrame {
  run(thread: Thread): void {
    if (checkOverwritten(thread, this.method)) {
      return;
    }

    runInstruction(thread, this.method);
  }
}

/**
 * Used for internal methods, does not push return value to stack.
 */
export class InternalStackFrame extends JavaStackFrame {
  private callback: (ret: any, err?: any) => void;
  constructor(
    cls: ClassData,
    method: Method,
    pc: number,
    locals: any[],
    callback: (ret: any, err?: any) => void
  ) {
    super(cls, method, pc, locals);
    this.callback = callback;
  }

  public onReturn(thread: Thread, retn: any) {
    this.callback(retn);
  }

  public onReturn64(thread: Thread, retn: any) {
    this.callback(retn);
  }

  onError(thread: Thread, err: JvmObject): void {
    this.callback(undefined, err);
  }
}

export class NativeStackFrame extends StackFrame {
  private jni: JNI;
  constructor(
    cls: ReferenceClassData,
    method: Method,
    pc: number,
    locals: any[],
    returnOffset: number,
    jni: JNI
  ) {
    super(cls, method, pc, locals, returnOffset);
    this.jni = jni;
  }

  run(thread: Thread): void {
    const methodRes = this.jni.getNativeMethod(
      thread,
      this.class.getName(),
      this.method.getName() + this.method.getDescriptor()
    );

    if (methodRes.status === ResultType.DEFER) {
      return;
    }

    if (methodRes.status === ResultType.ERROR) {
      thread.throwNewException(methodRes.exceptionCls, methodRes.msg);
      return;
    }

    methodRes.result(thread, this.locals);
  }

  checkNative(): this is NativeStackFrame {
    return true;
  }
}
