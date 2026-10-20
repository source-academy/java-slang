/*
    Java library classes

    Injects library classes for use by programs run in the CSEC machine.
*/

function fnv1a(s: string) {
  const FNV_OFFSET_BASIS = 2166136261
  const FNV_PRIME = 16777619

  let hash = FNV_OFFSET_BASIS

  for (let i = 0; i < s.length; i++) {
    hash ^= s.charCodeAt(i)
    hash = Math.imul(hash, FNV_PRIME)
  }

  return hash >>> 0
}

// 31-bit Fibonacci LFSR. The state is kept non-negative, since a sign bit would be smeared in by
// the shift and the register would saturate to all ones.
export class LFSR {
  #state: number

  constructor(init: string) {
    this.#state = fnv1a(init) & 0x7fffffff || 1 // all-zero state is a fixed point
  }

  next() {
    const state = this.#state
    const bit = (state ^ (state >>> 1) ^ (state >>> 2) ^ (state >>> 3)) & 1
    this.#state = (state >>> 1) | (bit << 30)
    return this.#state
  }
}

export const libraryClasses = `
class Object {
  public native int hashCode();

  public native String toString();
}

class PrintStream {
  public static native void println(String s);
}
  
class System {
  public static PrintStream out = new PrintStream();
}
`

// Binary names of the library classes, as Class.getName() reports them; user classes are in the
// default package, so their binary name is their simple name.
export const libraryBinaryNames: { [className: string]: string } = {
  Object: 'java.lang.Object',
  PrintStream: 'java.io.PrintStream',
  System: 'java.lang.System'
}

// const disabled =`class PrintStream extends Object {
//   public native void println(String s);
// }

// class System extends Object {
//   public static PrintStream out = new PrintStream();
// }
// `
