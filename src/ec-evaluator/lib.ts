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
    hash *= FNV_PRIME
  }

  return hash
}

export class LFSR {
  #state: number

  constructor(init: string) {
    this.#state = fnv1a(init) | 0 // convert to 32-bit integer
  }

  next() {
    const state = this.#state
    const bit = (state ^ (state >> 1) ^ (state >> 2) ^ (state >> 3)) & 1
    this.#state = (state >> 1) | (bit << 30)
    return this.#state
  }
}

export const libraryClasses = `
class Object {
  public static native void display(int s);

  public native int hashCode();

  public native String toString();
}`

// const disabled = `class PrintStream extends Object {
//   public native void println(String s);
// }

// class System extends Object {
//   public static PrintStream out = new PrintStream();
// }
// `
