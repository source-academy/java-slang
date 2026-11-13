/**
 * Ports of the fdlibm 5.3 routines that `java.lang.StrictMath` is specified to use, for the
 * functions where JavaScript's `Math` does not return exactly the same bits (`exp`, `cbrt`,
 * `cosh`, `tanh`, `pow`, `atan2`, `hypot`) or does not exist at all (`IEEEremainder`). Java
 * guarantees these results to the last bit, so a program printing e.g. `Math.pow(8.9, 10)` must
 * not differ from what the JVM prints.
 *
 * The remaining `StrictMath` natives (`sqrt`, `log`, `log10`, `sin`, `cos`, `tan`, `asin`,
 * `acos`, `atan`, `sinh`, `expm1`, `log1p`) give bit-identical results through `Math`, which was
 * checked against HotSpot's implementation.
 *
 * The code follows the C sources closely (same constants and operation order) because the last
 * bit depends on the exact sequence of floating point operations. "Words" are the high and low
 * 32 bits of an IEEE 754 double, as in the original `__HI`/`__LO` macros.
 *
 * fdlibm is Copyright (C) 1993 by Sun Microsystems, Inc. Permission to use, copy, modify, and
 * distribute this software is freely granted, provided that this notice is preserved.
 */

const view = new DataView(new ArrayBuffer(8))

/** High word of `x` as a signed 32-bit integer. */
const hi = (x: number): number => {
  view.setFloat64(0, x)
  return view.getInt32(0)
}

/** Low word of `x` as an unsigned 32-bit integer. */
const lo = (x: number): number => {
  view.setFloat64(0, x)
  return view.getUint32(4)
}

/** `x` with its high word replaced (the low word is kept). */
const withHi = (x: number, high: number): number => {
  view.setFloat64(0, x)
  view.setInt32(0, high)
  return view.getFloat64(0)
}

/** `x` with its low word replaced (the high word is kept). */
const withLo = (x: number, low: number): number => {
  view.setFloat64(0, x)
  view.setUint32(4, low >>> 0)
  return view.getFloat64(0)
}

/** The double whose high word is `high` and whose low word is 0. */
const fromHi = (high: number): number => withHi(0, high)

const huge = 1.0e300
const tiny = 1.0e-300
const one = 1.0
const zero = 0.0
const two = 2.0

/** fdlibm `scalbn`: `x * 2^n`, computed without intermediate overflow. */
export function scalbn(x: number, n: number): number {
  const two54 = 1.8014398509481984e16
  const twom54 = 5.551115123125783e-17
  let hx = hi(x)
  const lx = lo(x)
  let k = (hx & 0x7ff00000) >> 20
  if (k === 0) {
    if ((lx | (hx & 0x7fffffff)) === 0) return x // +-0
    x *= two54
    hx = hi(x)
    k = ((hx & 0x7ff00000) >> 20) - 54
    if (n < -50000) return tiny * x // underflow
  }
  if (k === 0x7ff) return x + x // NaN or Inf
  k = k + n
  if (k > 0x7fe) return huge * (hx < 0 ? -huge : huge) // overflow
  if (k > 0) return withHi(x, (hx & 0x800fffff) | (k << 20)) // normal result
  if (k <= -54) {
    if (n > 50000) return huge * (hx < 0 ? -huge : huge) // overflow
    return tiny * (hx < 0 ? -tiny : tiny) // underflow
  }
  k += 54 // subnormal result
  return withHi(x, (hx & 0x800fffff) | (k << 20)) * twom54
}

export function exp(x: number): number {
  const halF = [0.5, -0.5]
  const twom1000 = 9.3326361850321887899e-302 // 2^-1000
  const oThreshold = 7.09782712893383973096e2
  const uThreshold = -7.4513321910194110842e2
  const ln2HI = [6.9314718036912381649e-1, -6.9314718036912381649e-1]
  const ln2LO = [1.90821492927058770002e-10, -1.90821492927058770002e-10]
  const invln2 = 1.442695040888963387
  const P1 = 1.66666666666666019037e-1
  const P2 = -2.77777777770155933842e-3
  const P3 = 6.61375632143793436117e-5
  const P4 = -1.6533902205465251539e-6
  const P5 = 4.1381367970572384604e-8

  let hx = hi(x)
  const xsb = (hx >>> 31) & 1 // sign bit of x
  hx &= 0x7fffffff // high word of |x|

  // filter out non-finite argument
  if (hx >= 0x40862e42) {
    // |x| >= 709.78...
    if (hx >= 0x7ff00000) {
      if (((hx & 0xfffff) | lo(x)) !== 0) return x + x // NaN
      return xsb === 0 ? x : 0.0 // exp(+-inf) = {inf, 0}
    }
    if (x > oThreshold) return huge * huge // overflow
    if (x < uThreshold) return twom1000 * twom1000 // underflow
  }

  // argument reduction
  let hiPart = 0
  let loPart = 0
  let k = 0
  if (hx > 0x3fd62e42) {
    // |x| > 0.5 ln2
    if (hx < 0x3ff0a2b2) {
      // and |x| < 1.5 ln2
      hiPart = x - ln2HI[xsb]
      loPart = ln2LO[xsb]
      k = 1 - xsb - xsb
    } else {
      k = Math.trunc(invln2 * x + halF[xsb])
      const t = k
      hiPart = x - t * ln2HI[0] // t * ln2HI is exact here
      loPart = t * ln2LO[0]
    }
    x = hiPart - loPart
  } else if (hx < 0x3e300000) {
    // when |x| < 2**-28
    if (huge + x > one) return one + x // trigger inexact
  } else {
    k = 0
  }

  // x is now in primary range
  const t = x * x
  const c = x - t * (P1 + t * (P2 + t * (P3 + t * (P4 + t * P5))))
  if (k === 0) return one - ((x * c) / (c - 2.0) - x)
  let y = one - (loPart - (x * c) / (2.0 - c) - hiPart)
  if (k >= -1021) {
    y = withHi(y, (hi(y) + (k << 20)) | 0) // add k to y's exponent
    return y
  }
  y = withHi(y, (hi(y) + ((k + 1000) << 20)) | 0)
  return y * twom1000
}

export function cbrt(x: number): number {
  const B1 = 715094163 // (682 - 0.03306235651) * 2**20
  const B2 = 696219795 // (664 - 0.03306235651) * 2**20
  const C = 5.42857142857142815906e-1 // 19/35
  const D = -7.0530612244897961105e-1 // -864/1225
  const E = 1.41428571428571436819 // 99/70
  const F = 1.6071428571428572063 // 45/28
  const G = 3.57142857142857150787e-1 // 5/14

  let hx = hi(x)
  const sign = hx & 0x80000000 // sign of x, as a bit mask
  hx ^= sign
  hx = hx | 0
  if (hx >= 0x7ff00000) return x + x // cbrt(NaN, INF) is itself
  if ((hx | lo(x)) === 0) return x // cbrt(0) is itself

  x = withHi(x, hx) // x <- |x|
  // rough cbrt to 5 bits
  let t = 0.0
  if (hx < 0x00100000) {
    // subnormal number
    t = fromHi(0x43500000) // t = 2**54
    t *= x
    t = withHi(t, (Math.trunc(hi(t) / 3) + B2) | 0)
  } else {
    t = fromHi((Math.trunc(hx / 3) + B1) | 0)
  }

  // new cbrt to 23 bits, may be implemented in single precision
  let r = (t * t) / x
  let s = C + r * t
  t *= G + F / (s + E + D / s)

  // chopped to 20 bits and make it larger than cbrt(x)
  t = withLo(t, 0)
  t = withHi(t, (hi(t) + 0x00000001) | 0)

  // one step newton iteration to 53 bits with error less than 0.667 ulps
  s = t * t // t * t is exact
  r = x / s
  const w = t + t
  r = (r - t) / (w + r) // r - s is exact
  t = t + t * r

  // restore the sign bit
  return withHi(t, hi(t) | sign | 0)
}

export function cosh(x: number): number {
  const half = 0.5
  // high word of |x|
  const ix = hi(x) & 0x7fffffff

  // x is INF or NaN
  if (ix >= 0x7ff00000) return x * x

  // |x| in [0, 0.5*ln2]: 1 + expm1(|x|)^2 / (2*exp(|x|))
  if (ix < 0x3fd62e43) {
    const t = Math.expm1(Math.abs(x))
    const w = one + t
    if (ix < 0x3c800000) return w // cosh(tiny) = 1
    return one + (t * t) / (w + w)
  }

  // |x| in [0.5*ln2, 22]: (exp(|x|) + 1/exp(|x|)) / 2
  if (ix < 0x40360000) {
    const t = exp(Math.abs(x))
    return half * t + half / t
  }

  // |x| in [22, log(maxdouble)]: half * exp(|x|)
  if (ix < 0x40862e42) return half * exp(Math.abs(x))

  // |x| in [log(maxdouble), overflow threshold]
  const lx = lo(x)
  if (ix < 0x408633ce || (ix === 0x408633ce && lx <= 0x8fb9f87d)) {
    const w = exp(half * Math.abs(x))
    const t = half * w
    return t * w
  }

  // |x| > overflow threshold: cosh(x) overflows
  return huge * huge
}

export function tanh(x: number): number {
  const jx = hi(x)
  const ix = jx & 0x7fffffff

  // x is INF or NaN
  if (ix >= 0x7ff00000) {
    if (jx >= 0) return one / x + one // tanh(+-inf) = +-1
    return one / x - one // tanh(NaN) = NaN
  }

  let z: number
  if (ix < 0x40360000) {
    // |x| < 22
    if (ix < 0x3c800000) return x * (one + x) // |x| < 2**-55: tanh(small) = small
    if (ix >= 0x3ff00000) {
      // |x| >= 1
      const t = Math.expm1(two * Math.abs(x))
      z = one - two / (t + two)
    } else {
      const t = Math.expm1(-two * Math.abs(x))
      z = -t / (t + two)
    }
  } else {
    // |x| >= 22: return +-1
    z = one - tiny // raised inexact flag
  }
  return jx >= 0 ? z : -z
}

export function atan2(y: number, x: number): number {
  const piO4 = 7.85398163397448279e-1
  const piO2 = 1.570796326794896558
  const pi = 3.141592653589793116
  const piLo = 1.2246467991473531772e-16

  const hx = hi(x)
  const ix = hx & 0x7fffffff
  const lx = lo(x)
  const hy = hi(y)
  const iy = hy & 0x7fffffff
  const ly = lo(y)
  // x or y is NaN
  if (
    (ix | (((lx | -lx) >>> 31) & 1)) > 0x7ff00000 ||
    (iy | (((ly | -ly) >>> 31) & 1)) > 0x7ff00000
  ) {
    return x + y
  }
  if (((hx - 0x3ff00000) | lx) === 0) return Math.atan(y) // x = 1.0
  const m = ((hy >>> 31) & 1) | ((hx >>> 30) & 2) // 2*sign(x) + sign(y)

  // when y = 0
  if ((iy | ly) === 0) {
    switch (m) {
      case 0:
      case 1:
        return y // atan(+-0, +anything) = +-0
      case 2:
        return pi + tiny // atan(+0, -anything) = pi
      default:
        return -pi - tiny // atan(-0, -anything) = -pi
    }
  }
  // when x = 0
  if ((ix | lx) === 0) return hy < 0 ? -piO2 - tiny : piO2 + tiny

  // when x is INF
  if (ix === 0x7ff00000) {
    if (iy === 0x7ff00000) {
      switch (m) {
        case 0:
          return piO4 + tiny // atan(+INF, +INF)
        case 1:
          return -piO4 - tiny // atan(-INF, +INF)
        case 2:
          return 3.0 * piO4 + tiny // atan(+INF, -INF)
        default:
          return -3.0 * piO4 - tiny // atan(-INF, -INF)
      }
    }
    switch (m) {
      case 0:
        return zero // atan(+..., +INF)
      case 1:
        return -zero // atan(-..., +INF)
      case 2:
        return pi + tiny // atan(+..., -INF)
      default:
        return -pi - tiny // atan(-..., -INF)
    }
  }
  // when y is INF
  if (iy === 0x7ff00000) return hy < 0 ? -piO2 - tiny : piO2 + tiny

  // compute y/x
  const k = (iy - ix) >> 20
  let z: number
  if (k > 60) {
    z = piO2 + 0.5 * piLo // |y/x| > 2**60
  } else if (hx < 0 && k < -60) {
    z = 0.0 // |y|/x < -2**60
  } else {
    z = Math.atan(Math.abs(y / x)) // safe to do y/x
  }
  switch (m) {
    case 0:
      return z // atan(+, +)
    case 1:
      return withHi(z, hi(z) ^ 0x80000000) // atan(-, +)
    case 2:
      return pi - (z - piLo) // atan(+, -)
    default:
      return z - piLo - pi // atan(-, -)
  }
}

export function hypot(x: number, y: number): number {
  let ha = hi(x) & 0x7fffffff // high word of |x|
  let hb = hi(y) & 0x7fffffff // high word of |y|
  let a: number
  let b: number
  if (hb > ha) {
    a = y
    b = x
    const j = ha
    ha = hb
    hb = j
  } else {
    a = x
    b = y
  }
  a = withHi(a, ha) // a <- |a|
  b = withHi(b, hb) // b <- |b|
  if (ha - hb > 0x3c00000) return a + b // x/y > 2**60
  let k = 0
  if (ha > 0x5f300000) {
    // a > 2**500
    if (ha >= 0x7ff00000) {
      // Inf or NaN
      let w = a + b // for sNaN
      if (((ha & 0xfffff) | lo(a)) === 0) w = a
      if (((hb ^ 0x7ff00000) | lo(b)) === 0) w = b
      return w
    }
    // scale a and b by 2**-600
    ha -= 0x25800000
    hb -= 0x25800000
    k += 600
    a = withHi(a, ha)
    b = withHi(b, hb)
  }
  if (hb < 0x20b00000) {
    // b < 2**-500
    if (hb <= 0x000fffff) {
      // subnormal b or 0
      if ((hb | lo(b)) === 0) return a
      const t1 = fromHi(0x7fd00000) // t1 = 2^1022
      b *= t1
      a *= t1
      k -= 1022
    } else {
      // scale a and b by 2^600
      ha += 0x25800000 // a *= 2^600
      hb += 0x25800000 // b *= 2^600
      k -= 600
      a = withHi(a, ha)
      b = withHi(b, hb)
    }
  }
  // medium size a and b
  let w = a - b
  if (w > b) {
    const t1 = fromHi(ha)
    const t2 = a - t1
    w = Math.sqrt(t1 * t1 - (b * -b - t2 * (a + t1)))
  } else {
    a = a + a
    const y1 = fromHi(hb)
    const y2 = b - y1
    const t1 = fromHi(ha + 0x00100000)
    const t2 = a - t1
    w = Math.sqrt(t1 * y1 - (w * -w - (t1 * y2 + t2 * b)))
  }
  if (k !== 0) {
    const t1 = withHi(1.0, (hi(1.0) + (k << 20)) | 0)
    return t1 * w
  }
  return w
}

export function pow(x: number, y: number): number {
  const bp = [1.0, 1.5]
  const dpH = [0.0, 5.84962487220764160156e-1]
  const dpL = [0.0, 1.35003920212974897128e-8]
  const two53 = 9007199254740992.0
  // poly coefs for (3/2)*(log(x)-2s-2/3*s**3
  const L1 = 5.99999999999994648725e-1
  const L2 = 4.28571428578550184252e-1
  const L3 = 3.33333329818377432918e-1
  const L4 = 2.72728123808534006489e-1
  const L5 = 2.30660745775561754067e-1
  const L6 = 2.06975017800338417784e-1
  const P1 = 1.66666666666666019037e-1
  const P2 = -2.77777777770155933842e-3
  const P3 = 6.61375632143793436117e-5
  const P4 = -1.6533902205465251539e-6
  const P5 = 4.1381367970572384604e-8
  const lg2 = 6.93147180559945286227e-1
  const lg2H = 6.93147182464599609375e-1
  const lg2L = -1.90465429995776804525e-9
  const ovt = 8.0085662595372944372e-17 // -(1024 - log2(ovfl + .5ulp))
  const cp = 9.61796693925975554329e-1 // 2/(3ln2)
  const cpH = 9.61796700954437255859e-1 // (float)cp
  const cpL = -7.02846165095275826516e-9 // tail of cp_h
  const ivln2 = 1.442695040888963387 // 1/ln2
  const ivln2H = 1.44269502162933349609 // 24b 1/ln2
  const ivln2L = 1.92596299112661746887e-8 // 1/ln2 tail

  const hx = hi(x)
  const lx = lo(x)
  const hy = hi(y)
  const ly = lo(y)
  let ix = hx & 0x7fffffff
  let iy = hy & 0x7fffffff

  // y == zero: x**0 = 1
  if ((iy | ly) === 0) return one

  // +-NaN return x + y
  if (
    ix > 0x7ff00000 ||
    (ix === 0x7ff00000 && lx !== 0) ||
    iy > 0x7ff00000 ||
    (iy === 0x7ff00000 && ly !== 0)
  ) {
    return x + y
  }

  // determine if y is an odd int when x < 0
  // yisint = 0 ... y is not an integer
  // yisint = 1 ... y is an odd int
  // yisint = 2 ... y is an even int
  let yisint = 0
  if (hx < 0) {
    if (iy >= 0x43400000) {
      yisint = 2 // even integer y
    } else if (iy >= 0x3ff00000) {
      const k = (iy >> 20) - 0x3ff // exponent
      if (k > 20) {
        const j = ly >>> (52 - k)
        if ((j << (52 - k)) >>> 0 === ly) yisint = 2 - (j & 1)
      } else if (ly === 0) {
        const j = iy >> (20 - k)
        if (j << (20 - k) === iy) yisint = 2 - (j & 1)
      }
    }
  }

  // special value of y
  if (ly === 0) {
    if (iy === 0x7ff00000) {
      // y is +-inf
      if (((ix - 0x3ff00000) | lx) === 0) return y - y // inf**+-1 is NaN
      if (ix >= 0x3ff00000) return hy >= 0 ? y : zero // (|x|>1)**+-inf = inf,0
      return hy < 0 ? -y : zero // (|x|<1)**-,+inf = inf,0
    }
    if (iy === 0x3ff00000) {
      // y is +-1
      return hy < 0 ? one / x : x
    }
    if (hy === 0x40000000) return x * x // y is 2
    if (hy === 0x3fe00000) {
      // y is 0.5
      if (hx >= 0) return Math.sqrt(x) // x >= +0
    }
  }

  let ax = Math.abs(x)
  // special value of x
  if (lx === 0) {
    if (ix === 0x7ff00000 || ix === 0 || ix === 0x3ff00000) {
      let z = ax // x is +-0, +-inf, +-1
      if (hy < 0) z = one / z // z = (1/|x|)
      if (hx < 0) {
        if (((ix - 0x3ff00000) | yisint) === 0) {
          z = (z - z) / (z - z) // (-1)**non-int is NaN
        } else if (yisint === 1) {
          z = -z // (x<0)**odd = -(|x|**odd)
        }
      }
      return z
    }
  }

  let n = (hx >> 31) + 1
  // (x<0)**(non-int) is NaN
  if ((n | yisint) === 0) return (x - x) / (x - x)

  let s = one // s (sign of result -ve**odd) = -1 else = 1
  if ((n | (yisint - 1)) === 0) s = -one // (-ve)**(odd int)

  let t1: number
  let t2: number
  // |y| is huge
  if (iy > 0x41e00000) {
    // if |y| > 2**31
    if (iy > 0x43f00000) {
      // if |y| > 2**64, must o/uflow
      if (ix <= 0x3fefffff) return hy < 0 ? huge * huge : tiny * tiny
      if (ix >= 0x3ff00000) return hy > 0 ? huge * huge : tiny * tiny
    }
    // over/underflow if x is not close to one
    if (ix < 0x3fefffff) return hy < 0 ? s * huge * huge : s * tiny * tiny
    if (ix > 0x3ff00000) return hy > 0 ? s * huge * huge : s * tiny * tiny
    // now |1-x| is tiny <= 2**-20, suffice to compute log(x) by x-x^2/2+x^3/3-x^4/4
    const t = ax - one // t has 20 trailing zeros
    const w = t * t * (0.5 - t * (0.3333333333333333333333 - t * 0.25))
    const u = ivln2H * t // ivln2_h has 21 sig. bits
    const v = t * ivln2L - w * ivln2
    t1 = withLo(u + v, 0)
    t2 = v - (t1 - u)
  } else {
    n = 0
    // take care subnormal number
    if (ix < 0x00100000) {
      ax *= two53
      n -= 53
      ix = hi(ax)
    }
    n += (ix >> 20) - 0x3ff
    const j = ix & 0x000fffff
    // determine interval
    ix = j | 0x3ff00000 // normalize ix
    let k: number
    if (j <= 0x3988e) {
      k = 0 // |x| < sqrt(3/2)
    } else if (j < 0xbb67a) {
      k = 1 // |x| < sqrt(3)
    } else {
      k = 0
      n += 1
      ix -= 0x00100000
    }
    ax = withHi(ax, ix)

    // compute ss = s_h + s_l = (x-1)/(x+1) or (x-1.5)/(x+1.5)
    let u = ax - bp[k] // bp[0] = 1.0, bp[1] = 1.5
    let v = one / (ax + bp[k])
    const ss = u * v
    const sH = withLo(ss, 0)
    // t_h = ax + bp[k] High
    let tH = fromHi((((ix >> 1) | 0x20000000) + 0x00080000 + (k << 18)) | 0)
    let tL = ax - (tH - bp[k])
    const sL = v * (u - sH * tH - sH * tL)
    // compute log(ax)
    let s2 = ss * ss
    let r = s2 * s2 * (L1 + s2 * (L2 + s2 * (L3 + s2 * (L4 + s2 * (L5 + s2 * L6)))))
    r += sL * (sH + ss)
    s2 = sH * sH
    tH = withLo(3.0 + s2 + r, 0)
    tL = r - (tH - 3.0 - s2)
    // u + v = ss * (1 + ...)
    u = sH * tH
    v = sL * tH + tL * ss
    // 2/(3log2) * (ss + ...)
    const pH = withLo(u + v, 0)
    const pL = v - (pH - u)
    const zH = cpH * pH // cp_h + cp_l = 2/(3*log2)
    const zL = cpL * pH + pL * cp + dpL[k]
    // log2(ax) = (ss+..)*2/(3*log2) = n + dp_h + z_h + z_l
    const t = n
    t1 = withLo(zH + zL + dpH[k] + t, 0)
    t2 = zL - (t1 - t - dpH[k] - zH)
  }

  // split up y into y1+y2 and compute (y1+y2)*(t1+t2)
  const y1 = withLo(y, 0)
  let pL = (y - y1) * t1 + y * t2
  let pH = y1 * t1
  let z = pL + pH
  const j = hi(z)
  const i = lo(z)
  if (j >= 0x40900000) {
    // z >= 1024
    if (((j - 0x40900000) | i) !== 0) {
      return s * huge * huge // z > 1024: overflow
    }
    if (pL + ovt > z - pH) return s * huge * huge // overflow
  } else if ((j & 0x7fffffff) >= 0x4090cc00) {
    // z <= -1075
    if (((j - 0xc090cc00) | i) !== 0) {
      return s * tiny * tiny // z < -1075: underflow
    }
    if (pL <= z - pH) return s * tiny * tiny // underflow
  }

  // compute 2**(p_h+p_l)
  const absJ = j & 0x7fffffff
  let k = (absJ >> 20) - 0x3ff
  n = 0
  if (absJ > 0x3fe00000) {
    // if |z| > 0.5, set n = [z+0.5]
    n = (j + (0x00100000 >> (k + 1))) | 0
    k = ((n & 0x7fffffff) >> 20) - 0x3ff // new k for n
    const t = fromHi(n & ~(0x000fffff >> k))
    n = ((n & 0x000fffff) | 0x00100000) >> (20 - k)
    if (j < 0) n = -n
    pH -= t
  }
  let t = withLo(pL + pH, 0)
  const u = t * lg2H
  const v = (pL - (t - pH)) * lg2 + t * lg2L
  z = u + v
  const w = v - (z - u)
  t = z * z
  const t3 = z - t * (P1 + t * (P2 + t * (P3 + t * (P4 + t * P5))))
  const r = (z * t3) / (t3 - two) - (w + z * w)
  z = one - (r - z)
  const jz = hi(z) + (n << 20)
  if (jz >> 20 <= 0) {
    z = scalbn(z, n) // subnormal output
  } else {
    z = withHi(z, jz | 0)
  }
  return s * z
}

/** fdlibm `__ieee754_remainder`: `x - n*y` where `n` is `x/y` rounded to the nearest integer. */
export function ieeeRemainder(x: number, p: number): number {
  const hx = hi(x)
  const lx = lo(x)
  const hp = hi(p) & 0x7fffffff
  const lp = lo(p)
  const sx = hx & 0x80000000
  const hxAbs = hx & 0x7fffffff

  // purge off exception values
  if ((hp | lp) === 0) return NaN // p = 0
  if (hxAbs >= 0x7ff00000 || (hp >= 0x7ff00000 && ((hp - 0x7ff00000) | lp) !== 0)) {
    return NaN // x not finite, or p is NaN
  }
  if (hp <= 0x7fdfffff) x = x % (p + p) // now x < 2p
  if (((hxAbs - hp) | (lx - lp)) === 0) return zero * x
  x = Math.abs(x)
  p = Math.abs(p)
  if (hp < 0x00200000) {
    if (x + x > p) {
      x -= p
      if (x + x >= p) x -= p
    }
  } else {
    const pHalf = 0.5 * p
    if (x > pHalf) {
      x -= p
      if (x >= pHalf) x -= p
    }
  }
  return withHi(x, (hi(x) ^ sx) | 0)
}
