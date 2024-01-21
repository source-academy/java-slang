import { OPCODE } from "../../../ClassFile/constants/instructions";
import { JavaStackFrame } from "../../stackframe";
import Thread from "../../thread";
import { setupTest } from "../test-utils";

let thread: Thread;
let code: DataView;

beforeEach(() => {
  const setup = setupTest();
  thread = setup.thread;
  code = setup.code;
  const testClass = setup.classes.testClass;
  const method = setup.method;
  thread.invokeStackFrame(new JavaStackFrame(testClass, method, 0, []));
});

describe("I2l", () => {
  test("I2L: int converts to bigInt", () => {
    thread.pushStack(1);
    code.setUint8(0, OPCODE.I2L);

    thread.runFor(1);
    const lastFrame = thread.peekStackFrame();
    expect(lastFrame.operandStack.length).toBe(2);
    expect(lastFrame.operandStack[0]).toBe(BigInt(1));
    expect(lastFrame.locals.length).toBe(0);
    expect(thread.getPC()).toBe(1);
  });
});

describe("I2f", () => {
  test("I2F: int converts to float", () => {
    thread.pushStack(1);
    code.setUint8(0, OPCODE.I2F);

    thread.runFor(1);
    const lastFrame = thread.peekStackFrame();
    expect(lastFrame.operandStack.length).toBe(1);
    expect(lastFrame.operandStack[0]).toBe(1.0);
    expect(lastFrame.locals.length).toBe(0);
    expect(thread.getPC()).toBe(1);
  });
});

describe("I2f", () => {
  test("I2D: int converts to double", () => {
    thread.pushStack(1);
    code.setUint8(0, OPCODE.I2D);

    thread.runFor(1);
    const lastFrame = thread.peekStackFrame();
    expect(lastFrame.operandStack.length).toBe(2);
    expect(lastFrame.operandStack[0]).toBe(1.0);
    expect(lastFrame.locals.length).toBe(0);
    expect(thread.getPC()).toBe(1);
  });
});

describe("I2b", () => {
  test("I2B: int converts to byte", () => {
    thread.pushStack(127);
    code.setUint8(0, OPCODE.I2B);

    thread.runFor(1);
    const lastFrame = thread.peekStackFrame();
    expect(lastFrame.operandStack.length).toBe(1);
    expect(lastFrame.operandStack[0]).toBe(127);
    expect(lastFrame.locals.length).toBe(0);
    expect(thread.getPC()).toBe(1);
  });

  test("I2B: int convert to byte sign lost", () => {
    thread.pushStack(255);
    code.setUint8(0, OPCODE.I2B);

    thread.runFor(1);
    const lastFrame = thread.peekStackFrame();
    expect(lastFrame.operandStack.length).toBe(1);
    expect(lastFrame.operandStack[0]).toBe(-1);
    expect(lastFrame.locals.length).toBe(0);
    expect(thread.getPC()).toBe(1);
  });
});

describe("I2c", () => {
  test("I2C: int converts to char", () => {
    thread.pushStack(0xffff);
    code.setUint8(0, OPCODE.I2C);

    thread.runFor(1);
    const lastFrame = thread.peekStackFrame();
    expect(lastFrame.operandStack.length).toBe(1);
    expect(lastFrame.operandStack[0]).toBe(0xffff);
    expect(lastFrame.locals.length).toBe(0);
    expect(thread.getPC()).toBe(1);
  });

  test("I2C: int convert to char truncates 4 LSB", () => {
    thread.pushStack(0x10000);
    code.setUint8(0, OPCODE.I2C);

    thread.runFor(1);
    const lastFrame = thread.peekStackFrame();
    expect(lastFrame.operandStack.length).toBe(1);
    expect(lastFrame.operandStack[0]).toBe(0);
    expect(lastFrame.locals.length).toBe(0);
    expect(thread.getPC()).toBe(1);
  });
});

describe("I2s", () => {
  test("I2S: max short int converts to short", () => {
    thread.pushStack(32767);
    code.setUint8(0, OPCODE.I2S);

    thread.runFor(1);
    const lastFrame = thread.peekStackFrame();
    expect(lastFrame.operandStack.length).toBe(1);
    expect(lastFrame.operandStack[0]).toBe(32767);
    expect(lastFrame.locals.length).toBe(0);
    expect(thread.getPC()).toBe(1);
  });

  test("I2S: min short int converts to short", () => {
    thread.pushStack(-32768);
    code.setUint8(0, OPCODE.I2S);

    thread.runFor(1);
    const lastFrame = thread.peekStackFrame();
    expect(lastFrame.operandStack.length).toBe(1);
    expect(lastFrame.operandStack[0]).toBe(-32768);
    expect(lastFrame.locals.length).toBe(0);
    expect(thread.getPC()).toBe(1);
  });

  test("I2S: int convert to short overflows", () => {
    thread.pushStack(0x12345678);
    code.setUint8(0, OPCODE.I2S);

    thread.runFor(1);
    const lastFrame = thread.peekStackFrame();
    expect(lastFrame.operandStack.length).toBe(1);
    expect(lastFrame.operandStack[0]).toBe(0x5678);
    expect(lastFrame.locals.length).toBe(0);
    expect(thread.getPC()).toBe(1);
  });
});

describe("L2i", () => {
  test("L2I: max int long converts to int", () => {
    thread.pushStack64(BigInt(2147483647));
    code.setUint8(0, OPCODE.L2I);

    thread.runFor(1);
    const lastFrame = thread.peekStackFrame();
    expect(lastFrame.operandStack.length).toBe(1);
    expect(lastFrame.operandStack[0]).toBe(2147483647);
    expect(lastFrame.locals.length).toBe(0);
    expect(thread.getPC()).toBe(1);
  });

  test("L2I: min int long converts to int", () => {
    thread.pushStack64(BigInt(-2147483648));
    code.setUint8(0, OPCODE.L2I);

    thread.runFor(1);
    const lastFrame = thread.peekStackFrame();
    expect(lastFrame.operandStack.length).toBe(1);
    expect(lastFrame.operandStack[0]).toBe(-2147483648);
    expect(lastFrame.locals.length).toBe(0);
    expect(thread.getPC()).toBe(1);
  });

  test("L2I: long convert to int overflows", () => {
    thread.pushStack64(BigInt(2147483648));
    code.setUint8(0, OPCODE.L2I);

    thread.runFor(1);
    const lastFrame = thread.peekStackFrame();
    expect(lastFrame.operandStack.length).toBe(1);
    expect(lastFrame.operandStack[0]).toBe(-2147483648);
    expect(lastFrame.locals.length).toBe(0);
    expect(thread.getPC()).toBe(1);
  });
});

describe("L2f", () => {
  test("L2F: long converts to float", () => {
    thread.pushStack64(BigInt(10));
    code.setUint8(0, OPCODE.L2F);

    thread.runFor(1);
    const lastFrame = thread.peekStackFrame();
    expect(lastFrame.operandStack.length).toBe(1);
    expect(lastFrame.operandStack[0]).toBe(10);
    expect(lastFrame.locals.length).toBe(0);
    expect(thread.getPC()).toBe(1);
  });

  test("L2F: long convert to float lose precision", () => {
    thread.pushStack64(BigInt("9223372036854775807"));
    code.setUint8(0, OPCODE.L2F);

    thread.runFor(1);
    const lastFrame = thread.peekStackFrame();
    expect(lastFrame.operandStack.length).toBe(1);
    expect(lastFrame.operandStack[0]).toBe(9223372036854775806);
    expect(lastFrame.locals.length).toBe(0);
    expect(thread.getPC()).toBe(1);
  });
});

describe("L2d", () => {
  test("L2D: long converts to double", () => {
    thread.pushStack64(BigInt(10));
    code.setUint8(0, OPCODE.L2D);

    thread.runFor(1);
    const lastFrame = thread.peekStackFrame();
    expect(lastFrame.operandStack.length).toBe(2);
    expect(lastFrame.operandStack[0]).toBe(10);
    expect(lastFrame.locals.length).toBe(0);
    expect(thread.getPC()).toBe(1);
  });

  test("L2D: long convert to double lose precision", () => {
    thread.pushStack64(BigInt("9223372036854775807"));
    code.setUint8(0, OPCODE.L2D);

    thread.runFor(1);
    const lastFrame = thread.peekStackFrame();
    expect(lastFrame.operandStack.length).toBe(2);
    expect(lastFrame.operandStack[0]).toBe(9223372036854775806);
    expect(lastFrame.locals.length).toBe(0);
    expect(thread.getPC()).toBe(1);
  });
});

describe("F2i", () => {
  test("F2I: float converts to int", () => {
    thread.pushStack(-20.5);
    code.setUint8(0, OPCODE.F2I);

    thread.runFor(1);
    const lastFrame = thread.peekStackFrame();
    expect(lastFrame.operandStack.length).toBe(1);
    expect(lastFrame.operandStack[0]).toBe(-20);
    expect(lastFrame.locals.length).toBe(0);
    expect(thread.getPC()).toBe(1);
  });

  test("F2I: float large number convert to int max", () => {
    thread.pushStack(9223372036854775806);
    code.setUint8(0, OPCODE.F2I);

    thread.runFor(1);
    const lastFrame = thread.peekStackFrame();
    expect(lastFrame.operandStack.length).toBe(1);
    expect(lastFrame.operandStack[0]).toBe(2147483647);
    expect(lastFrame.locals.length).toBe(0);
    expect(thread.getPC()).toBe(1);
  });

  test("F2I: float small number convert to int min", () => {
    thread.pushStack(-9223372036854775806);
    code.setUint8(0, OPCODE.F2I);

    thread.runFor(1);
    const lastFrame = thread.peekStackFrame();
    expect(lastFrame.operandStack.length).toBe(1);
    expect(lastFrame.operandStack[0]).toBe(-2147483648);
    expect(lastFrame.locals.length).toBe(0);
    expect(thread.getPC()).toBe(1);
  });

  test("F2I: float NaN convert to int 0", () => {
    thread.pushStack(NaN);
    code.setUint8(0, OPCODE.F2I);

    thread.runFor(1);
    const lastFrame = thread.peekStackFrame();
    expect(lastFrame.operandStack.length).toBe(1);
    expect(lastFrame.operandStack[0]).toBe(0);
    expect(lastFrame.locals.length).toBe(0);
    expect(thread.getPC()).toBe(1);
  });

  test("F2I: float infinity convert to int max", () => {
    thread.pushStack(Infinity);
    code.setUint8(0, OPCODE.F2I);

    thread.runFor(1);
    const lastFrame = thread.peekStackFrame();
    expect(lastFrame.operandStack.length).toBe(1);
    expect(lastFrame.operandStack[0]).toBe(2147483647);
    expect(lastFrame.locals.length).toBe(0);
    expect(thread.getPC()).toBe(1);
  });

  test("F2I: float -infinity convert to int min", () => {
    thread.pushStack(-Infinity);
    code.setUint8(0, OPCODE.F2I);

    thread.runFor(1);
    const lastFrame = thread.peekStackFrame();
    expect(lastFrame.operandStack.length).toBe(1);
    expect(lastFrame.operandStack[0]).toBe(-2147483648);
    expect(lastFrame.locals.length).toBe(0);
    expect(thread.getPC()).toBe(1);
  });
});

describe("F2l", () => {
  test("F2L: float converts to long", () => {
    thread.pushStack(-20.5);
    code.setUint8(0, OPCODE.F2L);

    thread.runFor(1);
    const lastFrame = thread.peekStackFrame();
    expect(lastFrame.operandStack.length).toBe(2);
    expect(lastFrame.operandStack[0]).toBe(BigInt(-20));
    expect(lastFrame.locals.length).toBe(0);
    expect(thread.getPC()).toBe(1);
  });

  test("F2L: float large number convert to long max", () => {
    thread.pushStack(9223372036854776000);
    code.setUint8(0, OPCODE.F2L);

    thread.runFor(1);
    const lastFrame = thread.peekStackFrame();
    expect(lastFrame.operandStack.length).toBe(2);
    expect(lastFrame.operandStack[0]).toBe(BigInt("9223372036854775807"));
    expect(lastFrame.locals.length).toBe(0);
    expect(thread.getPC()).toBe(1);
  });

  test("F2L: float small number convert to long min", () => {
    thread.pushStack(-9223372036854776000);
    code.setUint8(0, OPCODE.F2L);

    thread.runFor(1);
    const lastFrame = thread.peekStackFrame();
    expect(lastFrame.operandStack.length).toBe(2);
    expect(lastFrame.operandStack[0]).toBe(BigInt("-9223372036854775808"));
    expect(lastFrame.locals.length).toBe(0);
    expect(thread.getPC()).toBe(1);
  });

  test("F2L: float NaN convert to long 0", () => {
    thread.pushStack(NaN);
    code.setUint8(0, OPCODE.F2L);

    thread.runFor(1);
    const lastFrame = thread.peekStackFrame();
    expect(lastFrame.operandStack.length).toBe(2);
    expect(lastFrame.operandStack[0]).toBe(BigInt(0));
    expect(lastFrame.locals.length).toBe(0);
    expect(thread.getPC()).toBe(1);
  });

  test("F2L: float infinity convert to long max", () => {
    thread.pushStack(Infinity);
    code.setUint8(0, OPCODE.F2L);

    thread.runFor(1);
    const lastFrame = thread.peekStackFrame();
    expect(lastFrame.operandStack.length).toBe(2);
    expect(lastFrame.operandStack[0]).toBe(BigInt("9223372036854775807"));
    expect(lastFrame.locals.length).toBe(0);
    expect(thread.getPC()).toBe(1);
  });

  test("F2L: float -infinity convert to long min", () => {
    thread.pushStack(-Infinity);
    code.setUint8(0, OPCODE.F2L);

    thread.runFor(1);
    const lastFrame = thread.peekStackFrame();
    expect(lastFrame.operandStack.length).toBe(2);
    expect(lastFrame.operandStack[0]).toBe(BigInt("-9223372036854775808"));
    expect(lastFrame.locals.length).toBe(0);
    expect(thread.getPC()).toBe(1);
  });
});

describe("F2d", () => {
  test("F2D: float converts to double", () => {
    thread.pushStack(1.0);
    code.setUint8(0, OPCODE.F2D);

    thread.runFor(1);
    const lastFrame = thread.peekStackFrame();
    expect(lastFrame.operandStack.length).toBe(2);
    expect(lastFrame.operandStack[0]).toBe(1.0);
    expect(lastFrame.locals.length).toBe(0);
    expect(thread.getPC()).toBe(1);
  });
});

describe("D2i", () => {
  test("D2I: double converts to int", () => {
    thread.pushStack64(-20.5);
    code.setUint8(0, OPCODE.D2I);

    thread.runFor(1);
    const lastFrame = thread.peekStackFrame();
    expect(lastFrame.operandStack.length).toBe(1);
    expect(lastFrame.operandStack[0]).toBe(-20);
    expect(lastFrame.locals.length).toBe(0);
    expect(thread.getPC()).toBe(1);
  });

  test("D2I: double large number convert to int max", () => {
    thread.pushStack64(9223372036854775806);
    code.setUint8(0, OPCODE.D2I);

    thread.runFor(1);
    const lastFrame = thread.peekStackFrame();
    expect(lastFrame.operandStack.length).toBe(1);
    expect(lastFrame.operandStack[0]).toBe(2147483647);
    expect(lastFrame.locals.length).toBe(0);
    expect(thread.getPC()).toBe(1);
  });

  test("D2I: double small number convert to int min", () => {
    thread.pushStack64(-9223372036854775806);
    code.setUint8(0, OPCODE.D2I);

    thread.runFor(1);
    const lastFrame = thread.peekStackFrame();
    expect(lastFrame.operandStack.length).toBe(1);
    expect(lastFrame.operandStack[0]).toBe(-2147483648);
    expect(lastFrame.locals.length).toBe(0);
    expect(thread.getPC()).toBe(1);
  });

  test("D2I: double NaN convert to int 0", () => {
    thread.pushStack64(NaN);
    code.setUint8(0, OPCODE.D2I);

    thread.runFor(1);
    const lastFrame = thread.peekStackFrame();
    expect(lastFrame.operandStack.length).toBe(1);
    expect(lastFrame.operandStack[0]).toBe(0);
    expect(lastFrame.locals.length).toBe(0);
    expect(thread.getPC()).toBe(1);
  });

  test("D2I: double infinity convert to int max", () => {
    thread.pushStack64(Infinity);
    code.setUint8(0, OPCODE.D2I);

    thread.runFor(1);
    const lastFrame = thread.peekStackFrame();
    expect(lastFrame.operandStack.length).toBe(1);
    expect(lastFrame.operandStack[0]).toBe(2147483647);
    expect(lastFrame.locals.length).toBe(0);
    expect(thread.getPC()).toBe(1);
  });

  test("D2I: double -infinity convert to int min", () => {
    thread.pushStack64(-Infinity);
    code.setUint8(0, OPCODE.D2I);

    thread.runFor(1);
    const lastFrame = thread.peekStackFrame();
    expect(lastFrame.operandStack.length).toBe(1);
    expect(lastFrame.operandStack[0]).toBe(-2147483648);
    expect(lastFrame.locals.length).toBe(0);
    expect(thread.getPC()).toBe(1);
  });
});

describe("D2l", () => {
  test("D2L: double converts to long", () => {
    thread.pushStack64(-20.5);
    code.setUint8(0, OPCODE.D2L);

    thread.runFor(1);
    const lastFrame = thread.peekStackFrame();
    expect(lastFrame.operandStack.length).toBe(2);
    expect(lastFrame.operandStack[0]).toBe(BigInt(-20));
    expect(lastFrame.locals.length).toBe(0);
    expect(thread.getPC()).toBe(1);
  });

  test("D2L: double large number convert to long max", () => {
    thread.pushStack64(9223372036854776000);
    code.setUint8(0, OPCODE.D2L);

    thread.runFor(1);
    const lastFrame = thread.peekStackFrame();
    expect(lastFrame.operandStack.length).toBe(2);
    expect(lastFrame.operandStack[0]).toBe(BigInt("9223372036854775807"));
    expect(lastFrame.locals.length).toBe(0);
    expect(thread.getPC()).toBe(1);
  });

  test("D2L: double small number convert to long min", () => {
    thread.pushStack64(-9223372036854776000);
    code.setUint8(0, OPCODE.D2L);

    thread.runFor(1);
    const lastFrame = thread.peekStackFrame();
    expect(lastFrame.operandStack.length).toBe(2);
    expect(lastFrame.operandStack[0]).toBe(BigInt(-9223372036854775808));
    expect(lastFrame.locals.length).toBe(0);
    expect(thread.getPC()).toBe(1);
  });

  test("D2L: double NaN convert to long 0", () => {
    thread.pushStack64(NaN);
    code.setUint8(0, OPCODE.D2L);

    thread.runFor(1);
    const lastFrame = thread.peekStackFrame();
    expect(lastFrame.operandStack.length).toBe(2);
    expect(lastFrame.operandStack[0]).toBe(BigInt(0));
    expect(lastFrame.locals.length).toBe(0);
    expect(thread.getPC()).toBe(1);
  });

  test("D2L: double infinity convert to long max", () => {
    thread.pushStack64(Infinity);
    code.setUint8(0, OPCODE.D2L);

    thread.runFor(1);
    const lastFrame = thread.peekStackFrame();
    expect(lastFrame.operandStack.length).toBe(2);
    expect(lastFrame.operandStack[0]).toBe(BigInt("9223372036854775807"));
    expect(lastFrame.locals.length).toBe(0);
    expect(thread.getPC()).toBe(1);
  });

  test("D2L: double -infinity convert to long min", () => {
    thread.pushStack64(-Infinity);
    code.setUint8(0, OPCODE.D2L);

    thread.runFor(1);
    const lastFrame = thread.peekStackFrame();
    expect(lastFrame.operandStack.length).toBe(2);
    expect(lastFrame.operandStack[0]).toBe(BigInt("-9223372036854775808"));
    expect(lastFrame.locals.length).toBe(0);
    expect(thread.getPC()).toBe(1);
  });
});

describe("D2f", () => {
  test("D2F: float max double converts to float", () => {
    thread.pushStack64(3.4028235e38);
    code.setUint8(0, OPCODE.D2F);

    thread.runFor(1);
    const lastFrame = thread.peekStackFrame();
    expect(lastFrame.operandStack.length).toBe(1);
    expect(lastFrame.operandStack[0]).toBe(Math.fround(3.4028235e38));
    expect(lastFrame.locals.length).toBe(0);
    expect(thread.getPC()).toBe(1);
  });

  test("D2F: double convert to float capped at infinity", () => {
    thread.pushStack64(3.5e38);
    code.setUint8(0, OPCODE.D2F);

    thread.runFor(1);
    const lastFrame = thread.peekStackFrame();
    expect(lastFrame.operandStack.length).toBe(1);
    expect(lastFrame.operandStack[0]).toBe(Infinity);
    expect(lastFrame.locals.length).toBe(0);
    expect(thread.getPC()).toBe(1);
  });

  test("D2F: double convert to float capped at -infinity", () => {
    thread.pushStack64(-3.5e38);
    code.setUint8(0, OPCODE.D2F);

    thread.runFor(1);
    const lastFrame = thread.peekStackFrame();
    expect(lastFrame.operandStack.length).toBe(1);
    expect(lastFrame.operandStack[0]).toBe(-Infinity);
    expect(lastFrame.locals.length).toBe(0);
    expect(thread.getPC()).toBe(1);
  });

  test("D2F: double nan convert to float nan", () => {
    thread.pushStack64(NaN);
    code.setUint8(0, OPCODE.D2F);

    thread.runFor(1);
    const lastFrame = thread.peekStackFrame();
    expect(lastFrame.operandStack.length).toBe(1);
    expect(lastFrame.operandStack[0]).toBe(NaN);
    expect(lastFrame.locals.length).toBe(0);
    expect(thread.getPC()).toBe(1);
  });

  test("D2F: double Infinity convert to float Infinity", () => {
    thread.pushStack64(Infinity);
    code.setUint8(0, OPCODE.D2F);

    thread.runFor(1);
    const lastFrame = thread.peekStackFrame();
    expect(lastFrame.operandStack.length).toBe(1);
    expect(lastFrame.operandStack[0]).toBe(Infinity);
    expect(lastFrame.locals.length).toBe(0);
    expect(thread.getPC()).toBe(1);
  });

  test("D2F: double -Infinity convert to float -Infinity", () => {
    thread.pushStack64(-Infinity);
    code.setUint8(0, OPCODE.D2F);

    thread.runFor(1);
    const lastFrame = thread.peekStackFrame();
    expect(lastFrame.operandStack.length).toBe(1);
    expect(lastFrame.operandStack[0]).toBe(-Infinity);
    expect(lastFrame.locals.length).toBe(0);
    expect(thread.getPC()).toBe(1);
  });
});
