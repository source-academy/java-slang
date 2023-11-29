import Thread from './thread';
import * as math from './instructions/math';
import { OPCODE } from '../ClassFile/constants/instructions';
import { CodeAttribute } from '../ClassFile/types/attributes';
import { ClassData } from './types/class/ClassData';
import { Method } from './types/class/Method';
import { JvmObject } from './types/reference/Object';
import { j2jsString } from './utils';

const overrides: {
  [cls: string]: {
    [methodSig: string]: (thread: Thread, locals: any[]) => boolean;
  };
} = {
  'java/lang/System': {
    'loadLibrary(Ljava/lang/String;)V': (thread: Thread, locals: any[]) => {
      const lib = j2jsString(locals[0]);

      // We have already loaded these libraries (DLLs).
      switch (lib) {
        case 'zip':
        case 'net':
        case 'nio':
        case 'awt':
        case 'fontmanager':
        case 'management':
          thread.returnStackFrame();
          return true;
        default:
          throw new Error('loadLibrary not supported');
      }
    },
  },
};

const checkOverride = (thread: Thread, method: Method) => {
  const override =
    overrides[method.getClass().getClassname()]?.[
      method.getName() + method.getDescriptor()
    ];
  if (override) {
    override(thread, thread.peekStackFrame().locals);
    return true;
  }
  return false;
};

const runInstruction = (thread: Thread, method: Method) => {
  const opcode = (method._getCode() as unknown as CodeAttribute).code.getUint8(
    thread.getPC()
  );

  switch (opcode) {
    case OPCODE.NOP:
      break;
    case OPCODE.ACONST_NULL:
      break;
    case OPCODE.ICONST_M1:
      break;
    case OPCODE.ICONST_0:
      break;
    case OPCODE.ICONST_1:
      break;
    case OPCODE.ICONST_2:
      break;
    case OPCODE.ICONST_3:
      break;
    case OPCODE.ICONST_4:
      break;
    case OPCODE.ICONST_5:
      break;
    case OPCODE.LCONST_0:
      break;
    case OPCODE.LCONST_1:
      break;
    case OPCODE.FCONST_0:
      break;
    case OPCODE.FCONST_1:
      break;
    case OPCODE.FCONST_2:
      break;
    case OPCODE.DCONST_0:
      break;
    case OPCODE.DCONST_1:
      break;
    case OPCODE.BIPUSH:
      break;
    case OPCODE.SIPUSH:
      break;
    case OPCODE.LDC:
      break;
    case OPCODE.LDC_W:
      break;
    case OPCODE.LDC2_W:
      break;
    case OPCODE.ILOAD:
      break;
    case OPCODE.LLOAD:
      break;
    case OPCODE.FLOAD:
      break;
    case OPCODE.DLOAD:
      break;
    case OPCODE.ALOAD:
      break;
    case OPCODE.ILOAD_0:
      break;
    case OPCODE.ILOAD_1:
      break;
    case OPCODE.ILOAD_2:
      break;
    case OPCODE.ILOAD_3:
      break;
    case OPCODE.LLOAD_0:
      break;
    case OPCODE.LLOAD_1:
      break;
    case OPCODE.LLOAD_2:
      break;
    case OPCODE.LLOAD_3:
      break;
    case OPCODE.FLOAD_0:
      break;
    case OPCODE.FLOAD_1:
      break;
    case OPCODE.FLOAD_2:
      break;
    case OPCODE.FLOAD_3:
      break;
    case OPCODE.DLOAD_0:
      break;
    case OPCODE.DLOAD_1:
      break;
    case OPCODE.DLOAD_2:
      break;
    case OPCODE.DLOAD_3:
      break;
    case OPCODE.ALOAD_0:
      break;
    case OPCODE.ALOAD_1:
      break;
    case OPCODE.ALOAD_2:
      break;
    case OPCODE.ALOAD_3:
      break;
    case OPCODE.IALOAD:
      break;
    case OPCODE.LALOAD:
      break;
    case OPCODE.FALOAD:
      break;
    case OPCODE.DALOAD:
      break;
    case OPCODE.AALOAD:
      break;
    case OPCODE.BALOAD:
      break;
    case OPCODE.CALOAD:
      break;
    case OPCODE.SALOAD:
      break;
    case OPCODE.ISTORE:
      break;
    case OPCODE.LSTORE:
      break;
    case OPCODE.FSTORE:
      break;
    case OPCODE.DSTORE:
      break;
    case OPCODE.ASTORE:
      break;
    case OPCODE.ISTORE_0:
      break;
    case OPCODE.ISTORE_1:
      break;
    case OPCODE.ISTORE_2:
      break;
    case OPCODE.ISTORE_3:
      break;
    case OPCODE.LSTORE_0:
      break;
    case OPCODE.LSTORE_1:
      break;
    case OPCODE.LSTORE_2:
      break;
    case OPCODE.LSTORE_3:
      break;
    case OPCODE.FSTORE_0:
      break;
    case OPCODE.FSTORE_1:
      break;
    case OPCODE.FSTORE_2:
      break;
    case OPCODE.FSTORE_3:
      break;
    case OPCODE.DSTORE_0:
      break;
    case OPCODE.DSTORE_1:
      break;
    case OPCODE.DSTORE_2:
      break;
    case OPCODE.DSTORE_3:
      break;
    case OPCODE.ASTORE_0:
      break;
    case OPCODE.ASTORE_1:
      break;
    case OPCODE.ASTORE_2:
      break;
    case OPCODE.ASTORE_3:
      break;
    case OPCODE.IASTORE:
      break;
    case OPCODE.LASTORE:
      break;
    case OPCODE.FASTORE:
      break;
    case OPCODE.DASTORE:
      break;
    case OPCODE.AASTORE:
      break;
    case OPCODE.BASTORE:
      break;
    case OPCODE.CASTORE:
      break;
    case OPCODE.SASTORE:
      break;
    case OPCODE.POP:
      break;
    case OPCODE.POP2:
      break;
    case OPCODE.DUP:
      break;
    case OPCODE.DUP_X1:
      break;
    case OPCODE.DUP_X2:
      break;
    case OPCODE.DUP2:
      break;
    case OPCODE.DUP2:
      break;
    case OPCODE.DUP2_X1:
      break;
    case OPCODE.DUP2_X2:
      break;
    case OPCODE.SWAP:
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
      break;
    case OPCODE.I2F:
      break;
    case OPCODE.I2D:
      break;
    case OPCODE.L2I:
      break;
    case OPCODE.L2F:
      break;
    case OPCODE.L2D:
      break;
    case OPCODE.F2I:
      break;
    case OPCODE.F2L:
      break;
    case OPCODE.F2D:
      break;
    case OPCODE.D2I:
      break;
    case OPCODE.D2L:
      break;
    case OPCODE.D2F:
      break;
    case OPCODE.I2B:
      break;
    case OPCODE.I2C:
      break;
    case OPCODE.I2S:
      break;
    case OPCODE.LCMP:
      break;
    case OPCODE.FCMPL:
      break;
    case OPCODE.FCMPG:
      break;
    case OPCODE.DCMPL:
      break;
    case OPCODE.DCMPG:
      break;
    case OPCODE.IFEQ:
      break;
    case OPCODE.IFNE:
      break;
    case OPCODE.IFLT:
      break;
    case OPCODE.IFGE:
      break;
    case OPCODE.IFGT:
      break;
    case OPCODE.IFLE:
      break;
    case OPCODE.IF_ICMPEQ:
      break;
    case OPCODE.IF_ICMPNE:
      break;
    case OPCODE.IF_ICMPLT:
      break;
    case OPCODE.IF_ICMPGE:
      break;
    case OPCODE.IF_ICMPGT:
      break;
    case OPCODE.IF_ICMPLE:
      break;
    case OPCODE.IF_ACMPEQ:
      break;
    case OPCODE.IF_ACMPNE:
      break;
    case OPCODE.GOTO:
      break;
    case OPCODE.JSR:
      break;
    case OPCODE.RET:
      break;
    case OPCODE.TABLESWITCH:
      break;
    case OPCODE.LOOKUPSWITCH:
      break;
    case OPCODE.IRETURN:
      break;
    case OPCODE.LRETURN:
      break;
    case OPCODE.FRETURN:
      break;
    case OPCODE.DRETURN:
      break;
    case OPCODE.ARETURN:
      break;
    case OPCODE.RETURN:
      break;
    case OPCODE.GETSTATIC:
      break;
    case OPCODE.PUTSTATIC:
      break;
    case OPCODE.GETFIELD:
      break;
    case OPCODE.PUTFIELD:
      break;
    case OPCODE.INVOKEVIRTUAL:
      break;
    case OPCODE.INVOKESPECIAL:
      break;
    case OPCODE.INVOKESTATIC:
      break;
    case OPCODE.INVOKEINTERFACE:
      break;
    case OPCODE.INVOKEDYNAMIC:
      break;
    case OPCODE.NEW:
      break;
    case OPCODE.NEWARRAY:
      break;
    case OPCODE.ANEWARRAY:
      break;
    case OPCODE.ARRAYLENGTH:
      break;
    case OPCODE.ATHROW:
      break;
    case OPCODE.CHECKCAST:
      break;
    case OPCODE.INSTANCEOF:
      break;
    case OPCODE.MONITORENTER:
      break;
    case OPCODE.MONITOREXIT:
      break;
    case OPCODE.WIDE:
      break;
    case OPCODE.MULTIANEWARRAY:
      break;
    case OPCODE.IFNULL:
      break;
    case OPCODE.IFNONNULL:
      break;
    case OPCODE.GOTO_W:
      break;
    case OPCODE.JSR_W:
      break;
    case OPCODE.BREAKPOINT:
      break;
    case OPCODE.IMPDEP1:
      break;
    case OPCODE.IMPDEP2:
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

  constructor(cls: ClassData, method: Method, pc: number, locals: any[]) {
    this.operandStack = [];
    this.maxStack = method.getMaxStack();
    this.class = cls;
    this.method = method;
    this.pc = pc;
    this.locals = locals;
  }

  /**
   * Behaviour when a method returns.
   * Responsible for pushing return value to operand stack of stackframe below it.
   */
  abstract onReturn(thread: Thread, retn: any): void;

  /**
   * Behaviour when a method returns with a 64 bit value.
   * Responsible for pushing return value to operand stack of stackframe below it.
   */
  abstract onReturn64(thread: Thread, retn: any): void;

  /**
   * Runs stackframe for a single quantum.
   */
  abstract run(thread: Thread): void;

  /**
   * Called when the frame is popped due to an uncaught exception.
   * Does not prevent exception from being thrown in stackframe below it.
   */
  onError(thread: Thread, err: JvmObject) {}
}

export class JavaStackFrame extends StackFrame {
  public onReturn(thread: Thread, retn: any) {
    if (retn !== undefined) {
      thread.pushStack(retn);
    }
  }

  public onReturn64(thread: Thread, retn: any) {
    thread.pushStack64(retn);
  }

  run(thread: Thread): void {
    if (checkOverride(thread, this.method)) {
      return;
    }
    runInstruction(thread, this.method);
  }
}

/**
 * Used for internal methods, does not push return value to stack.
 */
export class InternalStackFrame extends StackFrame {
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
    this.callback(null, err);
  }

  run(thread: Thread): void {
    if (checkOverride(thread, this.method)) {
      return;
    }
    runInstruction(thread, this.method);
  }
}

export class NativeStackFrame extends StackFrame {
  private nativeMethod: (thread: Thread, locals: any[]) => void;
  constructor(
    cls: ClassData,
    method: Method,
    pc: number,
    locals: any[],
    nativeMethod: (thread: Thread, locals: any[]) => void
  ) {
    super(cls, method, pc, locals);
    this.nativeMethod = nativeMethod;
  }

  run(thread: Thread): void {
    this.nativeMethod(thread, this.locals);
  }

  public onReturn(thread: Thread, retn: any) {
    if (retn !== undefined) {
      thread.pushStack(retn);
    }
  }

  public onReturn64(thread: Thread, retn: any) {
    if (retn !== undefined) {
      thread.pushStack64(retn);
    }
  }
}
