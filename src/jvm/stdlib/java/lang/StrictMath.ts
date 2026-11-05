import Thread from '../../../thread'
import * as fdlibm from '../../../utils/fdlibm'

/**
 * The `native` methods of `java.lang.StrictMath` (everything else in `Math` and `StrictMath` is
 * ordinary bytecode that ends up calling these). Java requires these to give the results of
 * fdlibm, to the last bit. JavaScript's `Math` is bit-identical to fdlibm for the functions
 * wrapped directly below (verified against HotSpot on thousands of inputs); the others are
 * ported from fdlibm in `utils/fdlibm.ts`.
 */
const unary = (fn: (x: number) => number) => (thread: Thread, locals: any[]) =>
  thread.returnStackFrame64(fn(locals[0]))

const binary = (fn: (x: number, y: number) => number) => (thread: Thread, locals: any[]) =>
  thread.returnStackFrame64(fn(locals[0], locals[1]))

export const functions = {
  'sin(D)D': unary(Math.sin),
  'cos(D)D': unary(Math.cos),
  'tan(D)D': unary(Math.tan),
  'asin(D)D': unary(Math.asin),
  'acos(D)D': unary(Math.acos),
  'atan(D)D': unary(Math.atan),
  'exp(D)D': unary(fdlibm.exp),
  'log(D)D': unary(Math.log),
  'log10(D)D': unary(Math.log10),
  'sqrt(D)D': unary(Math.sqrt),
  'cbrt(D)D': unary(fdlibm.cbrt),
  'IEEEremainder(DD)D': binary(fdlibm.ieeeRemainder),
  'atan2(DD)D': binary(fdlibm.atan2),
  'pow(DD)D': binary(fdlibm.pow),
  'sinh(D)D': unary(Math.sinh),
  'cosh(D)D': unary(fdlibm.cosh),
  'tanh(D)D': unary(fdlibm.tanh),
  'hypot(DD)D': binary(fdlibm.hypot),
  'expm1(D)D': unary(Math.expm1),
  'log1p(D)D': unary(Math.log1p)
}

export default functions
