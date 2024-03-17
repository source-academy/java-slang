import { OPCODE } from "../ClassFile/constants/instructions";
import { JNI } from "./jni";
import Thread from "./thread";
import { ResultType } from "./types/Result";
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

  let result;
  switch (opcode) {
    case OPCODE.NOP:
      result = constants.runNop(thread);
      break;
    case OPCODE.ACONST_NULL:
      result = constants.runAconstNull(thread);
      break;
    case OPCODE.ICONST_M1:
      result = constants.runIconstM1(thread);
      break;
    case OPCODE.ICONST_0:
      result = constants.runIconst0(thread);
      break;
    case OPCODE.ICONST_1:
      result = constants.runIconst1(thread);
      break;
    case OPCODE.ICONST_2:
      result = constants.runIconst2(thread);
      break;
    case OPCODE.ICONST_3:
      result = constants.runIconst3(thread);
      break;
    case OPCODE.ICONST_4:
      result = constants.runIconst4(thread);
      break;
    case OPCODE.ICONST_5:
      result = constants.runIconst5(thread);
      break;
    case OPCODE.LCONST_0:
      result = constants.runLconst0(thread);
      break;
    case OPCODE.LCONST_1:
      result = constants.runLconst1(thread);
      break;
    case OPCODE.FCONST_0:
      result = constants.runFconst0(thread);
      break;
    case OPCODE.FCONST_1:
      result = constants.runFconst1(thread);
      break;
    case OPCODE.FCONST_2:
      result = constants.runFconst2(thread);
      break;
    case OPCODE.DCONST_0:
      result = constants.runDconst0(thread);
      break;
    case OPCODE.DCONST_1:
      result = constants.runDconst1(thread);
      break;
    case OPCODE.BIPUSH:
      result = constants.runBipush(thread);
      break;
    case OPCODE.SIPUSH:
      result = constants.runSipush(thread);
      break;
    case OPCODE.LDC:
      result = constants.runLdc(thread);
      break;
    case OPCODE.LDC_W:
      result = constants.runLdcW(thread);
      break;
    case OPCODE.LDC2_W:
      result = constants.runLdc2W(thread);
      break;
    case OPCODE.ILOAD:
      result = loads.runIload(thread);
      break;
    case OPCODE.LLOAD:
      result = loads.runLload(thread);
      break;
    case OPCODE.FLOAD:
      result = loads.runFload(thread);
      break;
    case OPCODE.DLOAD:
      result = loads.runDload(thread);
      break;
    case OPCODE.ALOAD:
      result = loads.runAload(thread);
      break;
    case OPCODE.ILOAD_0:
      result = loads.runIload0(thread);
      break;
    case OPCODE.ILOAD_1:
      result = loads.runIload1(thread);
      break;
    case OPCODE.ILOAD_2:
      result = loads.runIload2(thread);
      break;
    case OPCODE.ILOAD_3:
      result = loads.runIload3(thread);
      break;
    case OPCODE.LLOAD_0:
      result = loads.runLload0(thread);
      break;
    case OPCODE.LLOAD_1:
      result = loads.runLload1(thread);
      break;
    case OPCODE.LLOAD_2:
      result = loads.runLload2(thread);
      break;
    case OPCODE.LLOAD_3:
      result = loads.runLload3(thread);
      break;
    case OPCODE.FLOAD_0:
      result = loads.runFload0(thread);
      break;
    case OPCODE.FLOAD_1:
      result = loads.runFload1(thread);
      break;
    case OPCODE.FLOAD_2:
      result = loads.runFload2(thread);
      break;
    case OPCODE.FLOAD_3:
      result = loads.runFload3(thread);
      break;
    case OPCODE.DLOAD_0:
      result = loads.runDload0(thread);
      break;
    case OPCODE.DLOAD_1:
      result = loads.runDload1(thread);
      break;
    case OPCODE.DLOAD_2:
      result = loads.runDload2(thread);
      break;
    case OPCODE.DLOAD_3:
      result = loads.runDload3(thread);
      break;
    case OPCODE.ALOAD_0:
      result = loads.runAload0(thread);
      break;
    case OPCODE.ALOAD_1:
      result = loads.runAload1(thread);
      break;
    case OPCODE.ALOAD_2:
      result = loads.runAload2(thread);
      break;
    case OPCODE.ALOAD_3:
      result = loads.runAload3(thread);
      break;
    case OPCODE.IALOAD:
      result = loads.runIaload(thread);
      break;
    case OPCODE.LALOAD:
      result = loads.runLaload(thread);
      break;
    case OPCODE.FALOAD:
      result = loads.runFaload(thread);
      break;
    case OPCODE.DALOAD:
      result = loads.runDaload(thread);
      break;
    case OPCODE.AALOAD:
      result = loads.runAaload(thread);
      break;
    case OPCODE.BALOAD:
      result = loads.runBaload(thread);
      break;
    case OPCODE.CALOAD:
      result = loads.runCaload(thread);
      break;
    case OPCODE.SALOAD:
      result = loads.runSaload(thread);
      break;
    case OPCODE.ISTORE:
      result = stores.runIstore(thread);
      break;
    case OPCODE.LSTORE:
      result = stores.runLstore(thread);
      break;
    case OPCODE.FSTORE:
      result = stores.runFstore(thread);
      break;
    case OPCODE.DSTORE:
      result = stores.runDstore(thread);
      break;
    case OPCODE.ASTORE:
      result = stores.runAstore(thread);
      break;
    case OPCODE.ISTORE_0:
      result = stores.runIstore0(thread);
      break;
    case OPCODE.ISTORE_1:
      result = stores.runIstore1(thread);
      break;
    case OPCODE.ISTORE_2:
      result = stores.runIstore2(thread);
      break;
    case OPCODE.ISTORE_3:
      result = stores.runIstore3(thread);
      break;
    case OPCODE.LSTORE_0:
      result = stores.runLstore0(thread);
      break;
    case OPCODE.LSTORE_1:
      result = stores.runLstore1(thread);
      break;
    case OPCODE.LSTORE_2:
      result = stores.runLstore2(thread);
      break;
    case OPCODE.LSTORE_3:
      result = stores.runLstore3(thread);
      break;
    case OPCODE.FSTORE_0:
      result = stores.runFstore0(thread);
      break;
    case OPCODE.FSTORE_1:
      result = stores.runFstore1(thread);
      break;
    case OPCODE.FSTORE_2:
      result = stores.runFstore2(thread);
      break;
    case OPCODE.FSTORE_3:
      result = stores.runFstore3(thread);
      break;
    case OPCODE.DSTORE_0:
      result = stores.runDstore0(thread);
      break;
    case OPCODE.DSTORE_1:
      result = stores.runDstore1(thread);
      break;
    case OPCODE.DSTORE_2:
      result = stores.runDstore2(thread);
      break;
    case OPCODE.DSTORE_3:
      result = stores.runDstore3(thread);
      break;
    case OPCODE.ASTORE_0:
      result = stores.runAstore0(thread);
      break;
    case OPCODE.ASTORE_1:
      result = stores.runAstore1(thread);
      break;
    case OPCODE.ASTORE_2:
      result = stores.runAstore2(thread);
      break;
    case OPCODE.ASTORE_3:
      result = stores.runAstore3(thread);
      break;
    case OPCODE.IASTORE:
      result = stores.runIastore(thread);
      break;
    case OPCODE.LASTORE:
      result = stores.runLastore(thread);
      break;
    case OPCODE.FASTORE:
      result = stores.runFastore(thread);
      break;
    case OPCODE.DASTORE:
      result = stores.runDastore(thread);
      break;
    case OPCODE.AASTORE:
      result = stores.runAastore(thread);
      break;
    case OPCODE.BASTORE:
      result = stores.runBastore(thread);
      break;
    case OPCODE.CASTORE:
      result = stores.runCastore(thread);
      break;
    case OPCODE.SASTORE:
      result = stores.runSastore(thread);
      break;
    case OPCODE.POP:
      result = stack.runPop(thread);
      break;
    case OPCODE.POP2:
      result = stack.runPop2(thread);
      break;
    case OPCODE.DUP:
      result = stack.runDup(thread);
      break;
    case OPCODE.DUP_X1:
      result = stack.runDupX1(thread);
      break;
    case OPCODE.DUP_X2:
      result = stack.runDupX2(thread);
      break;
    case OPCODE.DUP2:
      result = stack.runDup2(thread);
      break;
    case OPCODE.DUP2:
      result = stack.runDup2(thread);
      break;
    case OPCODE.DUP2_X1:
      result = stack.runDup2X1(thread);
      break;
    case OPCODE.DUP2_X2:
      result = stack.runDup2X2(thread);
      break;
    case OPCODE.SWAP:
      result = stack.runSwap(thread);
      break;
    case OPCODE.IADD:
      result = math.runIadd(thread);
      break;
    case OPCODE.LADD:
      result = math.runLadd(thread);
      break;
    case OPCODE.FADD:
      result = math.runFadd(thread);
      break;
    case OPCODE.DADD:
      result = math.runDadd(thread);
      break;
    case OPCODE.ISUB:
      result = math.runIsub(thread);
      break;
    case OPCODE.LSUB:
      result = math.runLsub(thread);
      break;
    case OPCODE.FSUB:
      result = math.runFsub(thread);
      break;
    case OPCODE.DSUB:
      result = math.runDsub(thread);
      break;
    case OPCODE.IMUL:
      result = math.runImul(thread);
      break;
    case OPCODE.LMUL:
      result = math.runLmul(thread);
      break;
    case OPCODE.FMUL:
      result = math.runFmul(thread);
      break;
    case OPCODE.DMUL:
      result = math.runDmul(thread);
      break;
    case OPCODE.IDIV:
      result = math.runIdiv(thread);
      break;
    case OPCODE.LDIV:
      result = math.runLdiv(thread);
      break;
    case OPCODE.FDIV:
      result = math.runFdiv(thread);
      break;
    case OPCODE.DDIV:
      result = math.runDdiv(thread);
      break;
    case OPCODE.IREM:
      result = math.runIrem(thread);
      break;
    case OPCODE.LREM:
      result = math.runLrem(thread);
      break;
    case OPCODE.FREM:
      result = math.runFrem(thread);
      break;
    case OPCODE.DREM:
      result = math.runDrem(thread);
      break;
    case OPCODE.INEG:
      result = math.runIneg(thread);
      break;
    case OPCODE.LNEG:
      result = math.runLneg(thread);
      break;
    case OPCODE.FNEG:
      result = math.runFneg(thread);
      break;
    case OPCODE.DNEG:
      result = math.runDneg(thread);
      break;
    case OPCODE.ISHL:
      result = math.runIshl(thread);
      break;
    case OPCODE.LSHL:
      result = math.runLshl(thread);
      break;
    case OPCODE.ISHR:
      result = math.runIshr(thread);
      break;
    case OPCODE.LSHR:
      result = math.runLshr(thread);
      break;
    case OPCODE.IUSHR:
      result = math.runIushr(thread);
      break;
    case OPCODE.LUSHR:
      result = math.runLushr(thread);
      break;
    case OPCODE.IAND:
      result = math.runIand(thread);
      break;
    case OPCODE.LAND:
      result = math.runLand(thread);
      break;
    case OPCODE.IOR:
      result = math.runIor(thread);
      break;
    case OPCODE.LOR:
      result = math.runLor(thread);
      break;
    case OPCODE.IXOR:
      result = math.runIxor(thread);
      break;
    case OPCODE.LXOR:
      result = math.runLxor(thread);
      break;
    case OPCODE.IINC:
      result = math.runIinc(thread);
      break;
    case OPCODE.I2L:
      result = conversions.runI2l(thread);
      break;
    case OPCODE.I2F:
      result = conversions.runI2f(thread);
      break;
    case OPCODE.I2D:
      result = conversions.runI2d(thread);
      break;
    case OPCODE.L2I:
      result = conversions.runL2i(thread);
      break;
    case OPCODE.L2F:
      result = conversions.runL2f(thread);
      break;
    case OPCODE.L2D:
      result = conversions.runL2d(thread);
      break;
    case OPCODE.F2I:
      result = conversions.runF2i(thread);
      break;
    case OPCODE.F2L:
      result = conversions.runF2l(thread);
      break;
    case OPCODE.F2D:
      result = conversions.runF2d(thread);
      break;
    case OPCODE.D2I:
      result = conversions.runD2i(thread);
      break;
    case OPCODE.D2L:
      result = conversions.runD2l(thread);
      break;
    case OPCODE.D2F:
      result = conversions.runD2f(thread);
      break;
    case OPCODE.I2B:
      result = conversions.runI2b(thread);
      break;
    case OPCODE.I2C:
      result = conversions.runI2c(thread);
      break;
    case OPCODE.I2S:
      result = conversions.runI2s(thread);
      break;
    case OPCODE.LCMP:
      result = comparisons.runLcmp(thread);
      break;
    case OPCODE.FCMPL:
      result = comparisons.runFcmpl(thread);
      break;
    case OPCODE.FCMPG:
      result = comparisons.runFcmpg(thread);
      break;
    case OPCODE.DCMPL:
      result = comparisons.runDcmpl(thread);
      break;
    case OPCODE.DCMPG:
      result = comparisons.runDcmpg(thread);
      break;
    case OPCODE.IFEQ:
      result = comparisons.runIfeq(thread);
      break;
    case OPCODE.IFNE:
      result = comparisons.runIfne(thread);
      break;
    case OPCODE.IFLT:
      result = comparisons.runIflt(thread);
      break;
    case OPCODE.IFGE:
      result = comparisons.runIfge(thread);
      break;
    case OPCODE.IFGT:
      result = comparisons.runIfgt(thread);
      break;
    case OPCODE.IFLE:
      result = comparisons.runIfle(thread);
      break;
    case OPCODE.IF_ICMPEQ:
      result = comparisons.runIfIcmpeq(thread);
      break;
    case OPCODE.IF_ICMPNE:
      result = comparisons.runIfIcmpne(thread);
      break;
    case OPCODE.IF_ICMPLT:
      result = comparisons.runIfIcmplt(thread);
      break;
    case OPCODE.IF_ICMPGE:
      result = comparisons.runIfIcmpge(thread);
      break;
    case OPCODE.IF_ICMPGT:
      result = comparisons.runIfIcmpgt(thread);
      break;
    case OPCODE.IF_ICMPLE:
      result = comparisons.runIfIcmple(thread);
      break;
    case OPCODE.IF_ACMPEQ:
      result = comparisons.runIfAcmpeq(thread);
      break;
    case OPCODE.IF_ACMPNE:
      result = comparisons.runIfAcmpne(thread);
      break;
    case OPCODE.GOTO:
      result = control.runGoto(thread);
      break;
    case OPCODE.JSR:
      result = control.runJsr(thread);
      break;
    case OPCODE.RET:
      result = control.runRet(thread);
      break;
    case OPCODE.TABLESWITCH:
      result = control.runTableswitch(thread);
      break;
    case OPCODE.LOOKUPSWITCH:
      result = control.runLookupswitch(thread);
      break;
    case OPCODE.IRETURN:
      result = control.runIreturn(thread);
      break;
    case OPCODE.LRETURN:
      result = control.runLreturn(thread);
      break;
    case OPCODE.FRETURN:
      result = control.runFreturn(thread);
      break;
    case OPCODE.DRETURN:
      result = control.runDreturn(thread);
      break;
    case OPCODE.ARETURN:
      result = control.runAreturn(thread);
      break;
    case OPCODE.RETURN:
      result = control.runReturn(thread);
      break;
    case OPCODE.GETSTATIC:
      result = references.runGetstatic(thread);
      break;
    case OPCODE.PUTSTATIC:
      result = references.runPutstatic(thread);
      break;
    case OPCODE.GETFIELD:
      result = references.runGetfield(thread);
      break;
    case OPCODE.PUTFIELD:
      result = references.runPutfield(thread);
      break;
    case OPCODE.INVOKEVIRTUAL:
      result = references.runInvokevirtual(thread);
      break;
    case OPCODE.INVOKESPECIAL:
      result = references.runInvokespecial(thread);
      break;
    case OPCODE.INVOKESTATIC:
      result = references.runInvokestatic(thread);
      break;
    case OPCODE.INVOKEINTERFACE:
      result = references.runInvokeinterface(thread);
      break;
    case OPCODE.INVOKEDYNAMIC:
      result = references.runInvokedynamic(thread);
      break;
    case OPCODE.NEW:
      result = references.runNew(thread);
      break;
    case OPCODE.NEWARRAY:
      result = references.runNewarray(thread);
      break;
    case OPCODE.ANEWARRAY:
      result = references.runAnewarray(thread);
      break;
    case OPCODE.ARRAYLENGTH:
      result = references.runArraylength(thread);
      break;
    case OPCODE.ATHROW:
      result = references.runAthrow(thread);
      break;
    case OPCODE.CHECKCAST:
      result = references.runCheckcast(thread);
      break;
    case OPCODE.INSTANCEOF:
      result = references.runInstanceof(thread);
      break;
    case OPCODE.MONITORENTER:
      result = references.runMonitorenter(thread);
      break;
    case OPCODE.MONITOREXIT:
      result = references.runMonitorexit(thread);
      break;
    case OPCODE.WIDE:
      result = extended.runWide(thread);
      break;
    case OPCODE.MULTIANEWARRAY:
      result = extended.runMultianewarray(thread);
      break;
    case OPCODE.IFNULL:
      result = extended.runIfnull(thread);
      break;
    case OPCODE.IFNONNULL:
      result = extended.runIfnonnull(thread);
      break;
    case OPCODE.GOTO_W:
      result = extended.runGotoW(thread);
      break;
    case OPCODE.JSR_W:
      result = extended.runJsrW(thread);
      break;
    case OPCODE.BREAKPOINT:
      result = reserved.runBreakpoint(thread);
      break;
    case OPCODE.IMPDEP1:
      result = reserved.runImpdep1(thread);
      break;
    case OPCODE.IMPDEP2:
      result = reserved.runImpdep2(thread);
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
