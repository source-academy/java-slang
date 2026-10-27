import { OPCODE } from '../ClassFile/constants/instructions'
import { ExceptionHandler, AttributeInfo } from '../ClassFile/types/attributes'
import { FIELD_FLAGS } from '../ClassFile/types/fields'
import { METHOD_FLAGS } from '../ClassFile/types/methods'
import { Node } from '../ast/types/ast'
import {
  MethodInvocation,
  Literal,
  Block,
  BinaryExpression,
  LocalVariableDeclarationStatement,
  ExpressionName,
  Assignment,
  IfStatement,
  WhileStatement,
  BasicForStatement,
  PostfixExpression,
  PrefixExpression,
  ReturnStatement,
  Expression,
  ArrayAccess,
  BinaryOperator,
  DoStatement,
  ClassInstanceCreationExpression,
  ExpressionStatement,
  TernaryExpression,
  LeftHandSide,
  CastExpression,
  SwitchStatement,
  SwitchCase,
  CaseLabel
} from '../ast/types/blocks-and-statements'
import { MethodDeclaration, UnannType } from '../ast/types/classes'
import { unannTypeToString } from '../types/ast/utils'
import { ConstantPoolManager } from './constant-pool-manager'
import {
  AmbiguousMethodCallError,
  ConstructNotSupportedError,
  NoMethodMatchingSignatureError,
  NonStaticReferenceInStaticContextError
} from './error'
import { FieldInfo, MethodInfos, SymbolInfo, SymbolTable, VariableInfo } from './symbol-table'

type Label = {
  offset: number
  pointedBy: number[]
}

const intBinaryOp: { [type: string]: OPCODE } = {
  '+': OPCODE.IADD,
  '-': OPCODE.ISUB,
  '*': OPCODE.IMUL,
  '/': OPCODE.IDIV,
  '%': OPCODE.IREM,
  '|': OPCODE.IOR,
  '&': OPCODE.IAND,
  '^': OPCODE.IXOR,
  '<<': OPCODE.ISHL,
  '>>': OPCODE.ISHR,
  '>>>': OPCODE.IUSHR
}

const longBinaryOp: { [type: string]: OPCODE } = {
  '+': OPCODE.LADD,
  '-': OPCODE.LSUB,
  '*': OPCODE.LMUL,
  '/': OPCODE.LDIV,
  '%': OPCODE.LREM,
  '|': OPCODE.LOR,
  '&': OPCODE.LAND,
  '^': OPCODE.LXOR,
  '<<': OPCODE.LSHL,
  '>>': OPCODE.LSHR,
  '>>>': OPCODE.LUSHR
}

const floatBinaryOp: { [type: string]: OPCODE } = {
  '+': OPCODE.FADD,
  '-': OPCODE.FSUB,
  '*': OPCODE.FMUL,
  '/': OPCODE.FDIV,
  '%': OPCODE.FREM
}

const doubleBinaryOp: { [type: string]: OPCODE } = {
  '+': OPCODE.DADD,
  '-': OPCODE.DSUB,
  '*': OPCODE.DMUL,
  '/': OPCODE.DDIV,
  '%': OPCODE.DREM
}

const logicalOp: { [type: string]: OPCODE } = {
  '==': OPCODE.IF_ICMPEQ,
  '!=': OPCODE.IF_ICMPNE,
  '<': OPCODE.IF_ICMPLT,
  '<=': OPCODE.IF_ICMPLE,
  '>': OPCODE.IF_ICMPGT,
  '>=': OPCODE.IF_ICMPGE
}

const reverseLogicalOp: { [type: string]: OPCODE } = {
  '==': OPCODE.IF_ICMPNE,
  '!=': OPCODE.IF_ICMPEQ,
  '<': OPCODE.IF_ICMPGE,
  '<=': OPCODE.IF_ICMPGT,
  '>': OPCODE.IF_ICMPLE,
  '>=': OPCODE.IF_ICMPLT
}

const returnOp: { [type: string]: OPCODE } = {
  B: OPCODE.IRETURN,
  C: OPCODE.IRETURN,
  D: OPCODE.DRETURN,
  F: OPCODE.FRETURN,
  I: OPCODE.IRETURN,
  J: OPCODE.LRETURN,
  S: OPCODE.IRETURN,
  Z: OPCODE.IRETURN
}

const arrayLoadOp: { [type: string]: OPCODE } = {
  B: OPCODE.BALOAD,
  C: OPCODE.CALOAD,
  D: OPCODE.DALOAD,
  F: OPCODE.FALOAD,
  I: OPCODE.IALOAD,
  J: OPCODE.LALOAD,
  S: OPCODE.SALOAD,
  Z: OPCODE.BALOAD
}

const arrayStoreOp: { [type: string]: OPCODE } = {
  B: OPCODE.BASTORE,
  C: OPCODE.CASTORE,
  D: OPCODE.DASTORE,
  F: OPCODE.FASTORE,
  I: OPCODE.IASTORE,
  J: OPCODE.LASTORE,
  S: OPCODE.SASTORE,
  Z: OPCODE.BASTORE
}

const arrayTypeCode: { [type: string]: number } = {
  Z: 4,
  C: 5,
  F: 6,
  D: 7,
  B: 8,
  S: 9,
  I: 10,
  J: 11
}

const normalLoadOp: { [type: string]: OPCODE } = {
  B: OPCODE.ILOAD,
  C: OPCODE.ILOAD,
  D: OPCODE.DLOAD,
  F: OPCODE.FLOAD,
  I: OPCODE.ILOAD,
  J: OPCODE.LLOAD,
  S: OPCODE.ILOAD,
  Z: OPCODE.ILOAD
}

const normalStoreOp: { [type: string]: OPCODE } = {
  B: OPCODE.ISTORE,
  C: OPCODE.ISTORE,
  D: OPCODE.DSTORE,
  F: OPCODE.FSTORE,
  I: OPCODE.ISTORE,
  J: OPCODE.LSTORE,
  S: OPCODE.ISTORE,
  Z: OPCODE.ISTORE
}

// Opcodes for widening primitive conversions. byte/short/char are represented as int on the
// operand stack, so their conversions are keyed (and emitted) as int conversions.
const typeConversionsImplicit: { [key: string]: OPCODE } = {
  'I->F': OPCODE.I2F,
  'I->D': OPCODE.I2D,
  'I->J': OPCODE.I2L,
  'F->D': OPCODE.F2D,
  'J->F': OPCODE.L2F,
  'J->D': OPCODE.L2D
}

// JLS 5.1.2: legal widening primitive conversions.
const WIDENING_TARGETS: { [from: string]: string[] } = {
  B: ['S', 'I', 'J', 'F', 'D'],
  S: ['I', 'J', 'F', 'D'],
  C: ['I', 'J', 'F', 'D'],
  I: ['J', 'F', 'D'],
  J: ['F', 'D'],
  F: ['D']
}

const PRIMITIVE_NAMES: { [descriptor: string]: string } = {
  B: 'byte',
  S: 'short',
  C: 'char',
  I: 'int',
  J: 'long',
  F: 'float',
  D: 'double'
}

const INT_LIKE_TYPES = ['B', 'S', 'C', 'I']
const NUMERIC_TYPES = ['B', 'S', 'C', 'I', 'J', 'F', 'D']
const isIntLike = (t: string) => INT_LIKE_TYPES.includes(t)
const isNumeric = (t: string) => NUMERIC_TYPES.includes(t)
const isWide = (t: string) => t === 'J' || t === 'D'
const slotsOf = (t: string) => (isWide(t) ? 2 : 1)

function isWideningPrimitive(from: string, to: string): boolean {
  return WIDENING_TARGETS[from]?.includes(to) ?? false
}

function wideningOpcode(from: string, to: string): OPCODE | undefined {
  return typeConversionsImplicit[`${isIntLike(from) ? 'I' : from}->${to}`]
}

// JLS 5.6.2: binary numeric promotion.
function binaryPromotion(left: string, right: string): string {
  if (left === 'D' || right === 'D') return 'D'
  if (left === 'F' || right === 'F') return 'F'
  if (left === 'J' || right === 'J') return 'J'
  return 'I'
}

const INT_RANGES: { [descriptor: string]: [number, number] } = {
  B: [-128, 127],
  S: [-32768, 32767],
  C: [0, 65535]
}

/**
 * Evaluates a constant expression of type byte, short, char or int (JLS 15.29), returning
 * `undefined` if the expression is not such a constant.
 */
function evaluateIntConstant(node: Node): number | undefined {
  switch (node.kind) {
    case 'Literal': {
      const { kind, value } = node.literalType
      if (kind === 'CharacterLiteral') return value.charCodeAt(0)
      if (kind === 'DecimalIntegerLiteral' || kind === 'HexIntegerLiteral') {
        if (/[lL]$/.test(value)) return undefined
        const n = parseInt(value)
        return Number.isNaN(n) ? undefined : n | 0
      }
      return undefined
    }
    case 'PrefixExpression': {
      const v = evaluateIntConstant(node.expression)
      if (v === undefined) return undefined
      switch (node.operator) {
        case '+':
          return v
        case '-':
          return -v | 0
        case '~':
          return ~v
      }
      return undefined
    }
    case 'BinaryExpression': {
      const l = evaluateIntConstant(node.left)
      const r = evaluateIntConstant(node.right)
      if (l === undefined || r === undefined) return undefined
      switch (node.operator) {
        case '+':
          return (l + r) | 0
        case '-':
          return (l - r) | 0
        case '*':
          return Math.imul(l, r)
        case '/':
          return r === 0 ? undefined : Math.trunc(l / r) | 0
        case '%':
          return r === 0 ? undefined : l % r | 0
        case '&':
          return l & r
        case '|':
          return l | r
        case '^':
          return l ^ r
        case '<<':
          return l << (r & 31)
        case '>>':
          return l >> (r & 31)
        case '>>>':
          return (l >>> (r & 31)) | 0
      }
      return undefined
    }
    case 'CastExpression': {
      if (!node.isPrimitiveCast) return undefined
      const v = evaluateIntConstant(node.expression)
      if (v === undefined) return undefined
      switch (node.castType) {
        case 'int':
          return v
        case 'byte':
          return (v << 24) >> 24
        case 'short':
          return (v << 16) >> 16
        case 'char':
          return v & 0xffff
      }
      return undefined
    }
  }
  return undefined
}

/**
 * JLS 5.2: an int-typed constant expression may be assigned to a byte, short or char
 * variable if its value is representable in that type.
 */
function isNarrowableConstant(node: Node | undefined, toType: string): boolean {
  if (!node || !(toType in INT_RANGES)) return false
  const value = evaluateIntConstant(node)
  if (value === undefined) return false
  const [min, max] = INT_RANGES[toType]
  return value >= min && value <= max
}

type CompileResult = {
  stackSize: number
  resultType: string
}
const EMPTY_TYPE: string = ''

function areClassTypesCompatible(fromType: string, toType: string, cg: CodeGenerator): boolean {
  const cleanFrom = fromType.replace(/^L|;$/g, '')
  const cleanTo = toType.replace(/^L|;$/g, '')
  if (cleanFrom === cleanTo) return true

  try {
    let current = cg.symbolTable.queryClass(cleanFrom)
    while (current.parentClassName) {
      const parentClean = current.parentClassName
      if (parentClean === cleanTo) return true
      current = cg.symbolTable.queryClass(parentClean)
    }
  } catch (e) {
    return false
  }
  return false
}

// Primitive descriptor -> its wrapper class' internal name.
const PRIMITIVE_WRAPPERS: { [primitive: string]: string } = {
  Z: 'java/lang/Boolean',
  B: 'java/lang/Byte',
  S: 'java/lang/Short',
  C: 'java/lang/Character',
  I: 'java/lang/Integer',
  J: 'java/lang/Long',
  F: 'java/lang/Float',
  D: 'java/lang/Double'
}

// Primitive descriptor -> the wrapper accessor that unboxes it.
const WRAPPER_UNBOX_METHODS: { [primitive: string]: string } = {
  Z: 'booleanValue',
  B: 'byteValue',
  S: 'shortValue',
  C: 'charValue',
  I: 'intValue',
  J: 'longValue',
  F: 'floatValue',
  D: 'doubleValue'
}

// Wrapper class descriptor -> the primitive it unboxes to.
const WRAPPER_DESCRIPTOR_TO_PRIMITIVE: { [descriptor: string]: string } = {
  'Ljava/lang/Boolean;': 'Z',
  'Ljava/lang/Byte;': 'B',
  'Ljava/lang/Short;': 'S',
  'Ljava/lang/Character;': 'C',
  'Ljava/lang/Integer;': 'I',
  'Ljava/lang/Long;': 'J',
  'Ljava/lang/Float;': 'F',
  'Ljava/lang/Double;': 'D'
}

/**
 * If `type` is a wrapper class descriptor, emits the unbox call (assuming the
 * wrapper reference is on top of the stack) and returns the primitive
 * descriptor. Otherwise returns `type` unchanged and emits nothing.
 */
function unboxIfWrapper(type: string, cg: CodeGenerator): string {
  const primitive = WRAPPER_DESCRIPTOR_TO_PRIMITIVE[type]
  if (!primitive) return type
  const methodRef = cg.constantPoolManager.indexMethodrefInfo(
    type.replace(/^L|;$/g, ''),
    WRAPPER_UNBOX_METHODS[primitive],
    `()${primitive}`
  )
  cg.code.push(OPCODE.INVOKEVIRTUAL, 0, methodRef)
  return primitive
}

/**
 * Emits an autobox (`Wrapper.valueOf`) or unbox (`wrapper.xxxValue()`) call when
 * converting between a primitive and its exact wrapper class. Returns the net
 * operand-stack size change, or `null` if this is not a boxing conversion.
 */
function tryBoxingConversion(fromType: string, toType: string, cg: CodeGenerator): number | null {
  const isWide = (primitive: string) => primitive === 'J' || primitive === 'D'

  // primitive -> wrapper
  const boxTarget = PRIMITIVE_WRAPPERS[fromType]
  if (boxTarget && toType.replace(/^L|;$/g, '') === boxTarget) {
    const methodRef = cg.constantPoolManager.indexMethodrefInfo(
      boxTarget,
      'valueOf',
      `(${fromType})L${boxTarget};`
    )
    cg.code.push(OPCODE.INVOKESTATIC, 0, methodRef)
    return isWide(fromType) ? -1 : 0
  }

  // wrapper -> primitive
  const unboxSource = PRIMITIVE_WRAPPERS[toType]
  if (unboxSource && fromType.replace(/^L|;$/g, '') === unboxSource) {
    const methodRef = cg.constantPoolManager.indexMethodrefInfo(
      unboxSource,
      WRAPPER_UNBOX_METHODS[toType],
      `()${toType}`
    )
    cg.code.push(OPCODE.INVOKEVIRTUAL, 0, methodRef)
    return isWide(toType) ? 1 : 0
  }

  return null
}

/**
 * Emits the code converting the value on top of the operand stack from `fromType` to `toType`
 * in an assignment context (JLS 5.2) and returns the net change in operand stack slots.
 * This covers identity, widening primitive and reference conversions, boxing/unboxing
 * (optionally followed by widening) and narrowing of int constant expressions. `node` is the
 * expression that produced the value, which is needed to recognise such constants; omit it for
 * contexts where constant narrowing is not allowed (e.g. method invocation).
 */
function handleImplicitTypeConversion(
  fromType: string,
  toType: string,
  cg: CodeGenerator,
  node?: Node
): number {
  if (fromType === toType || toType.replace(/^L|;$/g, '') === 'java/lang/String') {
    return 0
  }

  if (fromType.startsWith('L') || toType.startsWith('L')) {
    if (areClassTypesCompatible(fromType, toType, cg) || fromType === '') {
      return 0
    }
    const boxingStackChange = tryBoxingConversion(fromType, toType, cg)
    if (boxingStackChange !== null) {
      return boxingStackChange
    }

    // int constant narrowed to byte/short/char, then boxed (e.g. `Byte b = 1;`)
    const wrappedPrimitive = WRAPPER_DESCRIPTOR_TO_PRIMITIVE[toType]
    if (
      wrappedPrimitive &&
      isIntLike(fromType) &&
      isNarrowableConstant(node, wrappedPrimitive) &&
      tryBoxingConversion(wrappedPrimitive, toType, cg) !== null
    ) {
      return 0
    }

    // unboxing followed by widening (e.g. `long l = integerObject;`)
    const unboxedPrimitive = WRAPPER_DESCRIPTOR_TO_PRIMITIVE[fromType]
    if (unboxedPrimitive && isWideningPrimitive(unboxedPrimitive, toType)) {
      unboxIfWrapper(fromType, cg)
      const widening = wideningOpcode(unboxedPrimitive, toType)
      if (widening !== undefined) cg.code.push(widening)
      return slotsOf(toType) - 1
    }

    // boxing followed by widening reference conversion (e.g. `Object o = 5;`, `Number n = 1;`)
    const boxClass = PRIMITIVE_WRAPPERS[fromType]
    if (boxClass) {
      const boxDescriptor = `L${boxClass};`
      const isNumberWrapper = !['Z', 'C'].includes(fromType)
      if (
        toType === 'Ljava/lang/Object;' ||
        (toType === 'Ljava/lang/Number;' && isNumberWrapper) ||
        areClassTypesCompatible(boxDescriptor, toType, cg)
      ) {
        return tryBoxingConversion(fromType, boxDescriptor, cg) as number
      }
    }
    throw new Error(`Unsupported class type conversion: ${fromType} -> ${toType}`)
  }

  if (isWideningPrimitive(fromType, toType)) {
    const opcode = wideningOpcode(fromType, toType)
    if (opcode !== undefined) cg.code.push(opcode)
    return slotsOf(toType) - slotsOf(fromType)
  }

  if (isIntLike(fromType) && isNarrowableConstant(node, toType)) {
    return 0
  }

  throw new Error(`Unsupported implicit type conversion: ${fromType}->${toType}`)
}

function generateStringConversion(valueType: string, cg: CodeGenerator): void {
  const stringClass = 'java/lang/String'

  // Map primitive types to `String.valueOf()` method descriptors
  const valueOfDescriptors: { [key: string]: string } = {
    I: '(I)Ljava/lang/String;', // int
    J: '(J)Ljava/lang/String;', // long
    F: '(F)Ljava/lang/String;', // float
    D: '(D)Ljava/lang/String;', // double
    Z: '(Z)Ljava/lang/String;', // boolean
    B: '(I)Ljava/lang/String;', // byte (promoted to int)
    S: '(I)Ljava/lang/String;', // short (promoted to int)
    C: '(C)Ljava/lang/String;' // char
  }

  const isReference = valueType.startsWith('L') || valueType.startsWith('[')
  const descriptor = isReference
    ? '(Ljava/lang/Object;)Ljava/lang/String;'
    : valueOfDescriptors[valueType]
  if (!descriptor) {
    throw new Error(`Unsupported primitive type for String conversion: ${valueType}`)
  }

  const methodIndex = cg.constantPoolManager.indexMethodrefInfo(stringClass, 'valueOf', descriptor)

  cg.code.push(OPCODE.INVOKESTATIC, 0, methodIndex)
}

function hashCode(str: string): number {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    hash = hash * 31 + str.charCodeAt(i) // Simulate Java's overflow behavior
  }
  return hash
}

// function generateBooleanConversion(type: string, cg: CodeGenerator): number {
//   let stackChange = 0; // Tracks changes to the stack size
//
//   switch (type) {
//     case 'I': // int
//     case 'B': // byte
//     case 'S': // short
//     case 'C': // char
//       // For integer-like types, compare with zero
//       cg.code.push(OPCODE.ICONST_0); // Push 0
//       stackChange += 1; // `ICONST_0` pushes a value onto the stack
//       cg.code.push(OPCODE.IF_ICMPNE); // Compare and branch
//       stackChange -= 2; // `IF_ICMPNE` consumes two values from the stack
//       break;
//
//     case 'J': // long
//       // For long, compare with zero
//       cg.code.push(OPCODE.LCONST_0); // Push 0L
//       stackChange += 2; // `LCONST_0` pushes two values onto the stack (long takes 2 slots)
//       cg.code.push(OPCODE.LCMP); // Compare top two longs
//       stackChange -= 4; // `LCMP` consumes four values (two long operands) and pushes one result
//       cg.code.push(OPCODE.IFNE); // If not equal, branch
//       stackChange -= 1; // `IFNE` consumes one value (the comparison result)
//       break;
//
//     case 'F': // float
//       // For float, compare with zero
//       cg.code.push(OPCODE.FCONST_0); // Push 0.0f
//       stackChange += 1; // `FCONST_0` pushes a value onto the stack
//       cg.code.push(OPCODE.FCMPL); // Compare top two floats
//       stackChange -= 2; // `FCMPL` consumes two values (float operands) and pushes one result
//       cg.code.push(OPCODE.IFNE); // If not equal, branch
//       stackChange -= 1; // `IFNE` consumes one value (the comparison result)
//       break;
//
//     case 'D': // double
//       // For double, compare with zero
//       cg.code.push(OPCODE.DCONST_0); // Push 0.0d
//       stackChange += 2; // `DCONST_0` pushes two values onto the stack (double takes 2 slots)
//       cg.code.push(OPCODE.DCMPL); // Compare top two doubles
//       stackChange -= 4; // `DCMPL` consumes four values (two double operands) and pushes one result
//       cg.code.push(OPCODE.IFNE); // If not equal, branch
//       stackChange -= 1; // `IFNE` consumes one value (the comparison result)
//       break;
//
//     case 'Z': // boolean
//       // Already a boolean, no conversion needed
//       break;
//
//     default:
//       throw new Error(`Cannot convert type ${type} to boolean.`);
//   }
//
//   return stackChange; // Return the net change in stack size
// }

function getExpressionType(node: Node, cg: CodeGenerator): string {
  if (!(node.kind in codeGenerators)) {
    throw new ConstructNotSupportedError(node.kind)
  }
  const originalCode = [...cg.code] // Preserve the original code state
  const originalLabelCount = cg.labels.length
  const resultType = codeGenerators[node.kind](node, cg).resultType
  cg.code = originalCode // Restore the original code state
  cg.labels.length = originalLabelCount // Drop labels pointing into the discarded code
  return resultType
}

function isSubtype(fromType: string, toType: string, cg: CodeGenerator): boolean {
  return (
    fromType === toType ||
    isWideningPrimitive(fromType, toType) ||
    areClassTypesCompatible(fromType, toType, cg)
  )
}

/**
 * JLS 15.12.2.3 / 5.3: whether a value of `fromType` can be passed for a `toType` parameter in a
 * "loose" invocation, which additionally allows boxing and unboxing (each followed by widening).
 */
function isLooselyInvocable(fromType: string, toType: string, cg: CodeGenerator): boolean {
  if (isSubtype(fromType, toType, cg)) return true
  const boxClass = PRIMITIVE_WRAPPERS[fromType]
  if (boxClass) {
    return (
      toType === `L${boxClass};` ||
      toType === 'Ljava/lang/Object;' ||
      (toType === 'Ljava/lang/Number;' && !['Z', 'C'].includes(fromType)) ||
      areClassTypesCompatible(`L${boxClass};`, toType, cg)
    )
  }
  const unboxed = WRAPPER_DESCRIPTOR_TO_PRIMITIVE[fromType]
  return unboxed !== undefined && (unboxed === toType || isWideningPrimitive(unboxed, toType))
}

const isNullLiteral = (node: Node) => {
  return node.kind === 'Literal' && node.literalType.kind === 'NullLiteral'
}

const createIntLiteralNode = (int: number): Literal => {
  return {
    kind: 'Literal',
    literalType: { kind: 'DecimalIntegerLiteral', value: int.toString() }
  }
}

const compareJumpOp: { [op: string]: OPCODE } = {
  '==': OPCODE.IFEQ,
  '!=': OPCODE.IFNE,
  '<': OPCODE.IFLT,
  '<=': OPCODE.IFLE,
  '>': OPCODE.IFGT,
  '>=': OPCODE.IFGE
}

const negatedComparison: { [op: string]: string } = {
  '==': '!=',
  '!=': '==',
  '<': '>=',
  '<=': '>',
  '>': '<=',
  '>=': '<'
}

/**
 * Compiles the comparison `left op right` as a conditional jump to `targetLabel`, taken when the
 * comparison evaluates to `jumpIfTrue`. Operands are promoted per JLS 5.6.2 (so long, float and
 * double operands are compared with the matching *CMP instruction).
 */
function compileComparison(
  left: Node,
  right: Node,
  op: string,
  jumpIfTrue: boolean,
  targetLabel: Label,
  cg: CodeGenerator
): CompileResult {
  const boolType = cg.symbolTable.generateFieldDescriptor('boolean')
  const nullCheck = (jumpIfNull: boolean) =>
    cg.addBranchInstr(jumpIfNull ? OPCODE.IFNULL : OPCODE.IFNONNULL, targetLabel)

  if (isNullLiteral(left) && isNullLiteral(right)) {
    if (jumpIfTrue === (op === '==')) {
      cg.addBranchInstr(OPCODE.GOTO, targetLabel)
    }
    return { stackSize: 1, resultType: boolType }
  }
  if (isNullLiteral(left) || isNullLiteral(right)) {
    // the non-null operand is the one pushed onto the stack
    const l = compile(isNullLiteral(left) ? right : left, cg)
    nullCheck(jumpIfTrue === (op === '=='))
    return { stackSize: l.stackSize, resultType: boolType }
  }

  const l = compile(left, cg)
  const leftType = unboxIfWrapper(l.resultType, cg)
  const insertConversionIndex = cg.code.length
  cg.code.push(OPCODE.NOP)
  const r = compile(right, cg)
  const rightType = unboxIfWrapper(r.resultType, cg)

  const effectiveOp = jumpIfTrue ? op : negatedComparison[op]
  let stackSize: number
  if (isNumeric(leftType) && isNumeric(rightType)) {
    const promoted = binaryPromotion(leftType, rightType)
    const leftConversion = wideningOpcode(leftType, promoted)
    if (leftConversion !== undefined) cg.code[insertConversionIndex] = leftConversion
    const rightConversion = wideningOpcode(rightType, promoted)
    if (rightConversion !== undefined) cg.code.push(rightConversion)
    const slots = slotsOf(promoted)
    stackSize = Math.max(l.stackSize, slots + Math.max(r.stackSize, slots))

    if (promoted === 'I') {
      cg.addBranchInstr(jumpIfTrue ? logicalOp[op] : reverseLogicalOp[op], targetLabel)
    } else {
      // For NaN operands every comparison but != must be false: pick the *CMP variant that
      // yields a value for which the (possibly negated) jump is not taken.
      const nanResultsInGreater = op === '<' || op === '<='
      const cmp = {
        J: OPCODE.LCMP,
        F: nanResultsInGreater ? OPCODE.FCMPG : OPCODE.FCMPL,
        D: nanResultsInGreater ? OPCODE.DCMPG : OPCODE.DCMPL
      }[promoted] as OPCODE
      cg.code.push(cmp)
      cg.addBranchInstr(compareJumpOp[effectiveOp], targetLabel)
    }
  } else {
    stackSize = Math.max(l.stackSize, slotsOf(leftType) + r.stackSize)
    const isReference = (t: string) => t.startsWith('L') || t.startsWith('[')
    if (isReference(leftType) && isReference(rightType)) {
      cg.addBranchInstr(effectiveOp === '==' ? OPCODE.IF_ACMPEQ : OPCODE.IF_ACMPNE, targetLabel)
    } else {
      cg.addBranchInstr(jumpIfTrue ? logicalOp[op] : reverseLogicalOp[op], targetLabel)
    }
  }
  return { stackSize, resultType: boolType }
}

function compile(node: Node, cg: CodeGenerator): CompileResult {
  if (!(node.kind in codeGenerators)) {
    throw new ConstructNotSupportedError(node.kind)
  }
  return codeGenerators[node.kind](node, cg)
}

const codeGenerators: { [type: string]: (node: Node, cg: CodeGenerator) => CompileResult } = {
  Block: (node: Node, cg: CodeGenerator) => {
    cg.symbolTable.extend()
    const block = node as Block
    let maxStack = 0
    let resultType = EMPTY_TYPE
    block.blockStatements.forEach(x => {
      const { stackSize: stackSize, resultType: type } = compile(x, cg)
      maxStack = Math.max(maxStack, stackSize)
      resultType = type
    })
    cg.symbolTable.teardown()

    return { stackSize: maxStack, resultType }
  },

  LocalVariableDeclarationStatement: (node: Node, cg: CodeGenerator) => {
    let maxStack = 0
    const { variableDeclaratorList: lst, localVariableType: type } =
      node as LocalVariableDeclarationStatement
    lst.forEach(v => {
      const { variableDeclaratorId: identifier, variableInitializer: vi } = v
      const curIdx = cg.maxLocals
      const variableInfo = {
        name: identifier,
        accessFlags: 0,
        index: curIdx,
        typeName: type + (v.dims ?? ''),
        typeDescriptor: cg.symbolTable.generateFieldDescriptor(type + (v.dims ?? ''))
      }
      cg.symbolTable.insertVariableInfo(variableInfo)
      if (['D', 'J'].includes(variableInfo.typeDescriptor)) {
        cg.maxLocals += 2
      } else {
        cg.maxLocals++
      }
      if (!vi) {
        return
      }
      if (Array.isArray(vi)) {
        maxStack = compile(createIntLiteralNode(vi.length), cg).stackSize
        const arrayElemType = variableInfo.typeDescriptor.slice(1)
        if (arrayElemType in arrayTypeCode) {
          cg.code.push(OPCODE.NEWARRAY, arrayTypeCode[arrayElemType])
        } else {
          cg.code.push(
            OPCODE.ANEWARRAY,
            0,
            cg.constantPoolManager.indexClassInfo(
              cg.symbolTable.queryClass(variableInfo.typeName.slice(0, -2)).name
            )
          )
        }

        vi.forEach((val, i) => {
          cg.code.push(OPCODE.DUP)
          const size1 = compile(createIntLiteralNode(i), cg).stackSize
          const { stackSize: size2, resultType } = compile(val as Expression, cg)
          const stackSizeChange = handleImplicitTypeConversion(
            resultType,
            arrayElemType,
            cg,
            val as Expression
          )
          cg.code.push(arrayElemType in arrayStoreOp ? arrayStoreOp[arrayElemType] : OPCODE.AASTORE)
          maxStack = Math.max(maxStack, 2 + size1 + size2 + stackSizeChange)
        })
        cg.code.push(OPCODE.ASTORE, curIdx)
      } else {
        const { stackSize: initializerStackSize, resultType: initializerType } = compile(vi, cg)
        const stackSizeChange = handleImplicitTypeConversion(
          initializerType,
          variableInfo.typeDescriptor,
          cg,
          vi
        )
        maxStack = Math.max(maxStack, initializerStackSize + stackSizeChange)
        cg.code.push(
          variableInfo.typeDescriptor in normalStoreOp
            ? normalStoreOp[variableInfo.typeDescriptor]
            : OPCODE.ASTORE,
          curIdx
        )
      }
    })
    return { stackSize: maxStack, resultType: EMPTY_TYPE }
  },

  ReturnStatement: (node: Node, cg: CodeGenerator) => {
    const { exp: expr } = node as ReturnStatement

    if (expr) {
      let { stackSize: stackSize, resultType: resultType } = compile(expr, cg)
      const declared = cg.currentMethodReturnType
      const isPrimitive = (t: string) => t.length === 1
      if (
        declared &&
        declared !== resultType &&
        (isPrimitive(declared) ||
          isPrimitive(resultType) ||
          resultType in WRAPPER_DESCRIPTOR_TO_PRIMITIVE ||
          declared in WRAPPER_DESCRIPTOR_TO_PRIMITIVE)
      ) {
        // Return statements are an assignment context: widen/box/unbox to the declared type
        const change = handleImplicitTypeConversion(resultType, declared, cg, expr)
        stackSize = Math.max(stackSize, stackSize + change, slotsOf(declared))
        resultType = declared
      }
      if (cg.finallyBlockStack.length > 0) {
        const tempIndex = cg.maxLocals
        cg.maxLocals += ['J', 'D'].includes(resultType) ? 2 : 1
        cg.code.push(
          resultType in normalStoreOp ? normalStoreOp[resultType] : OPCODE.ASTORE,
          tempIndex
        )

        for (let i = cg.finallyBlockStack.length - 1; i >= 0; i--) {
          const finallyBlock = cg.finallyBlockStack[i] as any
          finallyBlock.blockStatements.forEach((stmt: any) => compile(stmt, cg))
        }

        cg.code.push(
          resultType in normalLoadOp ? normalLoadOp[resultType] : OPCODE.ALOAD,
          tempIndex
        )
      }
      cg.code.push(resultType in returnOp ? returnOp[resultType] : OPCODE.ARETURN)
      return { stackSize, resultType }
    }

    for (let i = cg.finallyBlockStack.length - 1; i >= 0; i--) {
      const finallyBlock = cg.finallyBlockStack[i] as any
      finallyBlock.blockStatements.forEach((stmt: any) => compile(stmt, cg))
    }

    cg.code.push(OPCODE.RETURN)
    return { stackSize: 0, resultType: cg.symbolTable.generateFieldDescriptor('void') }
  },

  BreakStatement: (node: Node, cg: CodeGenerator) => {
    // Emit finally blocks from innermost to outermost before breaking
    for (let i = cg.finallyBlockStack.length - 1; i >= 0; i--) {
      const finallyBlock = cg.finallyBlockStack[i] as any
      finallyBlock.blockStatements.forEach((stmt: any) => {
        compile(stmt, cg)
      })
    }

    if (cg.loopLabels.length > 0) {
      // If inside a loop, break jumps to the end of the loop
      cg.addBranchInstr(OPCODE.GOTO, cg.loopLabels[cg.loopLabels.length - 1][1])
    } else if (cg.switchLabels.length > 0) {
      // If inside a switch, break jumps to the switch's end label
      cg.addBranchInstr(OPCODE.GOTO, cg.switchLabels[cg.switchLabels.length - 1])
    } else {
      throw new Error('Break statement not inside a loop or switch statement')
    }
    return { stackSize: 0, resultType: EMPTY_TYPE }
  },

  ContinueStatement: (node: Node, cg: CodeGenerator) => {
    // Emit finally blocks from innermost to outermost before continuing
    for (let i = cg.finallyBlockStack.length - 1; i >= 0; i--) {
      const finallyBlock = cg.finallyBlockStack[i] as any
      finallyBlock.blockStatements.forEach((stmt: any) => {
        compile(stmt, cg)
      })
    }

    cg.addBranchInstr(OPCODE.GOTO, cg.loopLabels[cg.loopLabels.length - 1][0])
    return { stackSize: 0, resultType: EMPTY_TYPE }
  },

  BasicForStatement: (node: Node, cg: CodeGenerator) => {
    cg.symbolTable.extend()
    let maxStack = 0
    const { forInit, condition, forUpdate, body: body } = node as BasicForStatement

    if (forInit instanceof Array) {
      forInit.forEach(e => (maxStack = Math.max(maxStack, compile(e, cg).stackSize)))
    } else {
      maxStack = Math.max(maxStack, compile(forInit, cg).stackSize)
    }

    const startLabel = cg.generateNewLabel()
    const continueLabel = cg.generateNewLabel()
    const endLabel = cg.generateNewLabel()
    cg.loopLabels.push([continueLabel, endLabel])

    startLabel.offset = cg.code.length

    if (condition) {
      maxStack = Math.max(maxStack, codeGenerators['LogicalExpression'](condition, cg).stackSize)
    }
    maxStack = Math.max(maxStack, compile(body, cg).stackSize)
    continueLabel.offset = cg.code.length
    forUpdate.forEach(e => {
      maxStack = Math.max(maxStack, compile(e, cg).stackSize)
    })

    cg.addBranchInstr(OPCODE.GOTO, startLabel)
    endLabel.offset = cg.code.length

    cg.loopLabels.pop()
    cg.symbolTable.teardown()
    return { stackSize: maxStack, resultType: EMPTY_TYPE }
  },

  DoStatement: (node: Node, cg: CodeGenerator) => {
    let maxStack = 0
    const { condition: condition, body: body } = node as DoStatement

    const startLabel = cg.generateNewLabel()
    const continueLabel = cg.generateNewLabel()
    const endLabel = cg.generateNewLabel()
    cg.loopLabels.push([continueLabel, endLabel])

    startLabel.offset = cg.code.length
    maxStack = Math.max(maxStack, compile(body, cg).stackSize)
    continueLabel.offset = cg.code.length
    maxStack = Math.max(maxStack, codeGenerators['LogicalExpression'](condition, cg).stackSize)
    cg.addBranchInstr(OPCODE.GOTO, startLabel)
    endLabel.offset = cg.code.length

    cg.loopLabels.pop()
    return { stackSize: maxStack, resultType: EMPTY_TYPE }
  },

  WhileStatement: (node: Node, cg: CodeGenerator) => {
    let maxStack = 0
    const { condition, body } = node as WhileStatement

    const startLabel = cg.generateNewLabel()
    const endLabel = cg.generateNewLabel()
    cg.loopLabels.push([startLabel, endLabel])
    startLabel.offset = cg.code.length

    maxStack = Math.max(maxStack, codeGenerators['LogicalExpression'](condition, cg).stackSize)
    maxStack = Math.max(maxStack, compile(body, cg).stackSize)

    cg.addBranchInstr(OPCODE.GOTO, startLabel)
    cg.loopLabels.pop()
    endLabel.offset = cg.code.length
    return { stackSize: maxStack, resultType: EMPTY_TYPE }
  },

  IfStatement: (node: Node, cg: CodeGenerator) => {
    let maxStack = 0
    const {
      condition: condition,
      consequent: consequent,
      alternate: alternate
    } = node as IfStatement

    const elseLabel = cg.generateNewLabel()
    maxStack = Math.max(maxStack, codeGenerators['LogicalExpression'](condition, cg).stackSize)
    const conRes = compile(consequent, cg)
    const conSize = conRes.stackSize
    let resType = conRes.resultType
    maxStack = Math.max(maxStack, conSize)

    const endLabel = cg.generateNewLabel()
    if (alternate) {
      cg.addBranchInstr(OPCODE.GOTO, endLabel)
    }

    elseLabel.offset = cg.code.length
    if (alternate) {
      const { stackSize: altSize, resultType: altType } = compile(alternate, cg)
      maxStack = Math.max(maxStack, altSize)
      if (altType === EMPTY_TYPE) {
        resType = EMPTY_TYPE
      }
      endLabel.offset = cg.code.length
    }

    return { stackSize: maxStack, resultType: resType }
  },

  TryStatement: (node: Node, cg: CodeGenerator) => {
    let maxStack = 0
    const { block, catches } = node as any
    const finallyNode: any = (node as any).finally

    const hasCatches = catches && catches.catchClauses && catches.catchClauses.length > 0

    if (!hasCatches && !finallyNode) {
      return { stackSize: compile(block, cg).stackSize, resultType: EMPTY_TYPE }
    }

    if (hasCatches || finallyNode) {
      maxStack = Math.max(maxStack, 1)
    }

    const localExceptionTable: Array<{
      startPc: number
      endPc: number
      handlerLabel: Label
      catchType: number
    }> = []

    // Push finally block onto stack so return/break/continue can access it
    if (finallyNode) {
      cg.finallyBlockStack.push(finallyNode.block)
    }

    try {
      // mark start of protected region
      const tryStart = cg.generateNewLabel()
      tryStart.offset = cg.code.length

      // compile try block
      maxStack = Math.max(maxStack, compile(block, cg).stackSize)

      // end of protected region (first instruction after try block)
      const tryEnd = cg.generateNewLabel()
      tryEnd.offset = cg.code.length

      const catchAllLabel = finallyNode ? cg.generateNewLabel() : null

      // For normal path: run finally block if it exists
      if (finallyNode) {
        finallyNode.block.blockStatements.forEach((stmt: any) => {
          const { stackSize } = compile(stmt, cg)
          maxStack = Math.max(maxStack, stackSize)
        })
      }

      // jump over handlers when try completes normally
      const afterHandlers = cg.generateNewLabel()
      cg.addBranchInstr(OPCODE.GOTO, afterHandlers)

      // For each catch clause, emit a handler and an exception table entry
      if (hasCatches) {
        for (const catchClause of catches.catchClauses) {
          const handlerLabel = cg.generateNewLabel()
          handlerLabel.offset = cg.code.length

          // determine catch type index (constant pool)
          const catchTypeNode = catchClause.catchFormalParameter.catchType
          const catchTypeName = unannTypeToString(catchTypeNode.unannClassType)
          let catchClassName = 'java/lang/Throwable'
          try {
            catchClassName = cg.symbolTable.queryClass(catchTypeName).name
          } catch (e) {
            catchClassName = catchTypeName.includes('/')
              ? catchTypeName
              : catchTypeName.replace(/\./g, '/')
          }
          const catchTypeIndex = cg.constantPoolManager.indexClassInfo(catchClassName)

          // add exception table entry (startPc, endPc, handlerPc, catchType)
          localExceptionTable.push({
            startPc: tryStart.offset,
            endPc: tryEnd.offset,
            handlerLabel: handlerLabel,
            catchType: catchTypeIndex
          })

          // create scope for catch variable
          cg.symbolTable.extend()
          const varName = catchClause.catchFormalParameter.variableDeclaratorId
          const varTypeStr = unannTypeToString(catchTypeNode.unannClassType)
          const varInfo = {
            name: varName,
            accessFlags: 0,
            index: cg.maxLocals,
            typeName: varTypeStr,
            typeDescriptor: cg.symbolTable.generateFieldDescriptor(varTypeStr)
          }
          cg.symbolTable.insertVariableInfo(varInfo)
          if (['J', 'D'].includes(varInfo.typeDescriptor)) {
            cg.maxLocals += 2
          } else {
            cg.maxLocals++
          }

          // at handler entry, the exception object is on the stack; store it into the local
          cg.code.push(OPCODE.ASTORE, varInfo.index)

          const catchStartOffset = cg.code.length

          // compile catch block statements
          const catchBlock = catchClause.block
          catchBlock.blockStatements.forEach((stmt: any) => {
            const { stackSize } = compile(stmt, cg)
            maxStack = Math.max(maxStack, stackSize)
          })

          const catchEndOffset = cg.code.length

          // teardown catch scope
          cg.symbolTable.teardown()

          // If finally exists, add catch-all entry for this catch block
          if (finallyNode && catchAllLabel && catchStartOffset < catchEndOffset) {
            localExceptionTable.push({
              startPc: catchStartOffset,
              endPc: catchEndOffset,
              handlerLabel: catchAllLabel,
              catchType: 0
            })
          }

          // For caught path: run finally block if it exists
          if (finallyNode) {
            finallyNode.block.blockStatements.forEach((stmt: any) => {
              const { stackSize } = compile(stmt, cg)
              maxStack = Math.max(maxStack, stackSize)
            })
          }

          // after handler, jump to afterHandlers
          cg.addBranchInstr(OPCODE.GOTO, afterHandlers)
        }
      }

      // If finally exists, add catch-all entry for the try block after all specific catch handlers.
      // This ensures the catch clauses are matched before the generic finally rethrow path.
      if (finallyNode && catchAllLabel) {
        localExceptionTable.push({
          startPc: tryStart.offset,
          endPc: tryEnd.offset,
          handlerLabel: catchAllLabel,
          catchType: 0
        })
      }

      // If finally exists, add a catch-all handler that runs finally then rethrows
      if (finallyNode && catchAllLabel) {
        catchAllLabel.offset = cg.code.length

        // allocate temp local to store exception
        const tempIndex = cg.maxLocals
        cg.maxLocals += 1
        cg.code.push(OPCODE.ASTORE, tempIndex)

        // compile finally block inside catch-all
        finallyNode.block.blockStatements.forEach((stmt: any) => {
          const { stackSize } = compile(stmt, cg)
          maxStack = Math.max(maxStack, stackSize)
        })

        // reload exception and rethrow
        cg.code.push(OPCODE.ALOAD, tempIndex, OPCODE.ATHROW)
      }

      // place after-handlers label
      afterHandlers.offset = cg.code.length

      // Now that all labels are resolved, push to cg.exceptionTable
      localExceptionTable.forEach(entry => {
        cg.exceptionTable.push({
          startPc: entry.startPc,
          endPc: entry.endPc,
          handlerPc: entry.handlerLabel.offset,
          catchType: entry.catchType
        })
      })

      return { stackSize: maxStack, resultType: EMPTY_TYPE }
    } finally {
      // Pop finally block from stack when exiting
      if (finallyNode) {
        cg.finallyBlockStack.pop()
      }
    }
  },

  TernaryExpression: (node: Node, cg: CodeGenerator) => {
    let maxStack = 0
    const {
      condition: condition,
      consequent: consequent,
      alternate: alternate
    } = node as TernaryExpression

    const elseLabel = cg.generateNewLabel()
    maxStack = Math.max(maxStack, codeGenerators['LogicalExpression'](condition, cg).stackSize)

    // JLS 15.25: numeric operands are promoted to a common type, except that an int constant
    // fitting in a byte/short/char operand keeps that narrower type.
    const conType = getExpressionType(consequent, cg)
    const altType = getExpressionType(alternate, cg)
    let resType = conType
    if (conType !== altType && isNumeric(conType) && isNumeric(altType)) {
      if ((conType === 'B' && altType === 'S') || (conType === 'S' && altType === 'B')) {
        resType = 'S'
      } else if (
        ['B', 'S', 'C'].includes(conType) &&
        altType === 'I' &&
        isNarrowableConstant(alternate, conType)
      ) {
        resType = conType
      } else if (
        ['B', 'S', 'C'].includes(altType) &&
        conType === 'I' &&
        isNarrowableConstant(consequent, altType)
      ) {
        resType = altType
      } else {
        resType = binaryPromotion(conType, altType)
      }
    }
    const convertible = isNumeric(resType) && isNumeric(conType) && isNumeric(altType)

    const conRes = compile(consequent, cg)
    const conSize = conRes.stackSize
    const conChange = convertible
      ? handleImplicitTypeConversion(conType, resType, cg, consequent)
      : 0
    maxStack = Math.max(maxStack, conSize, conSize + conChange, slotsOf(resType))

    const endLabel = cg.generateNewLabel()
    cg.addBranchInstr(OPCODE.GOTO, endLabel)

    elseLabel.offset = cg.code.length
    const { stackSize: altSize } = compile(alternate, cg)
    const altChange = convertible
      ? handleImplicitTypeConversion(altType, resType, cg, alternate)
      : 0
    maxStack = Math.max(maxStack, altSize, altSize + altChange)
    endLabel.offset = cg.code.length

    return { stackSize: maxStack, resultType: resType }
  },

  LogicalExpression: (node: Node, cg: CodeGenerator) => {
    const f = (node: Node, targetLabel: Label, onTrue: boolean): CompileResult => {
      if (node.kind === 'Literal') {
        const {
          literalType: { kind: kind, value: value }
        } = node
        const boolValue = value === 'true'
        if (kind === 'BooleanLiteral') {
          if (onTrue === boolValue) {
            cg.addBranchInstr(OPCODE.GOTO, targetLabel)
          }
          return { stackSize: 0, resultType: cg.symbolTable.generateFieldDescriptor('boolean') }
        } else {
          if (onTrue === (parseInt(value) !== 0)) {
            cg.addBranchInstr(OPCODE.GOTO, targetLabel)
          }
          return { stackSize: 0, resultType: cg.symbolTable.generateFieldDescriptor('boolean') }
        }
      }

      if (node.kind === 'PrefixExpression') {
        const { expression: expr } = node
        return f(expr, targetLabel, !onTrue)
      }

      if (node.kind === 'BinaryExpression') {
        const { left: left, right: right, operator: op } = node
        let l: CompileResult = { stackSize: 0, resultType: EMPTY_TYPE }
        let r: CompileResult = { stackSize: 0, resultType: EMPTY_TYPE }
        if (op === '&&') {
          if (onTrue) {
            const falseLabel = cg.generateNewLabel()
            l = f(left, falseLabel, false)
            r = f(right, targetLabel, true)
            falseLabel.offset = cg.code.length
          } else {
            l = f(left, targetLabel, false)
            r = f(right, targetLabel, false)
          }
          return {
            stackSize: Math.max(
              l.stackSize,
              1 + (['D', 'J'].includes(l.resultType) ? 1 : 0) + r.stackSize
            ),
            resultType: cg.symbolTable.generateFieldDescriptor('boolean')
          }
        } else if (op === '||') {
          if (onTrue) {
            l = f(left, targetLabel, true)
            r = f(right, targetLabel, true)
          } else {
            const falseLabel = cg.generateNewLabel()
            l = f(left, falseLabel, true)
            r = f(right, targetLabel, false)
            falseLabel.offset = cg.code.length
          }
          return {
            stackSize: Math.max(
              l.stackSize,
              1 + (['D', 'J'].includes(l.resultType) ? 1 : 0) + r.stackSize
            ),
            resultType: cg.symbolTable.generateFieldDescriptor('boolean')
          }
        } else if (op in reverseLogicalOp) {
          return compileComparison(left, right, op, onTrue, targetLabel, cg)
        }
      }

      const res = compile(node, cg)
      cg.addBranchInstr(onTrue ? OPCODE.IFNE : OPCODE.IFEQ, targetLabel)
      return res
    }
    return f(node, cg.labels[cg.labels.length - 1], false)
  },

  CastExpression: (node: Node, cg: CodeGenerator) => {
    const { castType: ct, expression: expr, isPrimitiveCast: b } = node as CastExpression
    if (b) {
      const res = compile(expr, cg)
      let { stackSize: size, resultType } = res

      // Casting a wrapper to a primitive unboxes it first (then widens, if needed); casting an
      // Object to a primitive casts it to the primitive's wrapper class and unboxes that.
      if (resultType in WRAPPER_DESCRIPTOR_TO_PRIMITIVE) {
        resultType = unboxIfWrapper(resultType, cg)
        size = Math.max(size, slotsOf(resultType))
      } else if (resultType === 'Ljava/lang/Object;') {
        const target =
          ct === 'boolean' ? 'Z' : Object.keys(PRIMITIVE_NAMES).find(k => PRIMITIVE_NAMES[k] === ct)
        if (target) {
          const wrapper = `L${PRIMITIVE_WRAPPERS[target]};`
          cg.code.push(
            OPCODE.CHECKCAST,
            0,
            cg.constantPoolManager.indexClassInfo(PRIMITIVE_WRAPPERS[target])
          )
          resultType = unboxIfWrapper(wrapper, cg)
          size = Math.max(size, slotsOf(resultType))
        }
      }

      if ((ct === 'boolean') !== (resultType === 'Z') && resultType !== EMPTY_TYPE) {
        throw new Error(`Cannot cast ${resultType} to ${ct}`)
      }
      if (resultType.startsWith('L') || resultType.startsWith('[')) {
        throw new Error(`Cannot cast ${resultType} to ${ct}`)
      }
      if (ct === 'boolean') {
        return { stackSize: size, resultType: 'Z' }
      }

      // byte, short, char and int all live on the operand stack as an int
      const rt = ['B', 'S', 'C'].includes(resultType) ? 'I' : resultType
      const convert = (opcodes: { [from: string]: OPCODE }) => {
        if (rt in opcodes) cg.code.push(opcodes[rt])
      }
      switch (ct) {
        case 'double':
          convert({ F: OPCODE.F2D, J: OPCODE.L2D, I: OPCODE.I2D })
          return { stackSize: Math.max(size, 2), resultType: 'D' }
        case 'float':
          convert({ D: OPCODE.D2F, J: OPCODE.L2F, I: OPCODE.I2F })
          return { stackSize: Math.max(size, 1), resultType: 'F' }
        case 'long':
          convert({ D: OPCODE.D2L, F: OPCODE.F2L, I: OPCODE.I2L })
          return { stackSize: Math.max(size, 2), resultType: 'J' }
        case 'int':
        case 'byte':
        case 'short':
        case 'char': {
          convert({ D: OPCODE.D2I, F: OPCODE.F2I, J: OPCODE.L2I })
          // narrowing from floating point/long to byte, short or char goes via int
          if (ct === 'byte') cg.code.push(OPCODE.I2B)
          else if (ct === 'short') cg.code.push(OPCODE.I2S)
          else if (ct === 'char') cg.code.push(OPCODE.I2C)
          const resultType = { int: 'I', byte: 'B', short: 'S', char: 'C' }[ct]
          return { stackSize: Math.max(size, 1), resultType }
        }
      }
      throw new Error(`Unsupported cast to ${ct}`)
    }

    // Reference cast (JLS 5.5): the result has the cast type
    const res = compile(expr, cg)
    const target = cg.symbolTable.generateFieldDescriptor(ct)
    if (res.resultType.length === 1) {
      // primitive operand: boxing, followed by widening reference conversion if needed
      if (target === 'Ljava/lang/String;') {
        throw new Error(`Cannot cast ${res.resultType} to ${ct}`)
      }
      const change = handleImplicitTypeConversion(res.resultType, target, cg)
      return {
        stackSize: Math.max(res.stackSize, res.stackSize + change, 1),
        resultType: target
      }
    }
    // Upcasts (and identity casts) are always safe, so only downcasts need a runtime check
    if (
      res.resultType !== target &&
      target !== 'Ljava/lang/Object;' &&
      !areClassTypesCompatible(res.resultType, target, cg)
    ) {
      const className = target.startsWith('[') ? target : target.slice(1, -1)
      cg.code.push(OPCODE.CHECKCAST, 0, cg.constantPoolManager.indexClassInfo(className))
    }
    return { stackSize: res.stackSize, resultType: target }
  },

  ClassInstanceCreationExpression: (node: Node, cg: CodeGenerator) => {
    const { identifier: id, argumentList: argLst } = node as ClassInstanceCreationExpression
    let maxStack = 2

    cg.code.push(OPCODE.NEW, 0, cg.constantPoolManager.indexClassInfo(id), OPCODE.DUP)

    const methodInfos = cg.symbolTable.queryMethod('<init>') as MethodInfos
    const parseParams = (descriptor: string) =>
      descriptor
        .slice(1, descriptor.indexOf(')'))
        .match(/(\[+[BCDFIJSZ])|(\[+L[^;]+;)|[BCDFIJSZ]|L[^;]+;/g) || []

    // Pick the constructor applicable to the argument types (JLS 15.12.2: identity or widening
    // conversions only), preferring an exact match and then the most specific one.
    const argTypes = argLst.map(x => getExpressionType(x, cg))
    let applicable: MethodInfos = []
    for (const isApplicable of [isSubtype, isLooselyInvocable]) {
      applicable = methodInfos.filter(m => {
        if (m.className !== id) return false
        const params = parseParams(m.typeDescriptor)
        return (
          params.length === argTypes.length &&
          params.every((p, i) => isApplicable(argTypes[i], p, cg))
        )
      })
      if (applicable.length > 0) break
    }
    const isExact = (m: (typeof applicable)[number]) =>
      parseParams(m.typeDescriptor).every((p, i) => argTypes[i] === p)
    const isMoreSpecific = (m: (typeof applicable)[number], other: (typeof applicable)[number]) => {
      const mp = parseParams(m.typeDescriptor)
      const op = parseParams(other.typeDescriptor)
      return mp.every((p, i) => p === op[i] || isSubtype(p, op[i], cg))
    }
    const chosen =
      applicable.find(isExact) ?? applicable.find(m => applicable.every(o => isMoreSpecific(m, o)))

    if (chosen) {
      const params = parseParams(chosen.typeDescriptor)
      argLst.forEach((x, i) => {
        const argCompileResult = compile(x, cg)
        const conv = handleImplicitTypeConversion(argCompileResult.resultType, params[i], cg)
        maxStack = Math.max(
          maxStack,
          i + 2 + argCompileResult.stackSize,
          i + 2 + slotsOf(params[i]) + conv
        )
      })
      const method = cg.constantPoolManager.indexMethodrefInfo(
        chosen.className,
        chosen.name,
        chosen.typeDescriptor
      )
      cg.code.push(OPCODE.INVOKESPECIAL, 0, method)
      return { stackSize: maxStack, resultType: id }
    }

    // No applicable constructor found: fall back to matching the raw argument descriptor.
    const rawArgTypes: Array<UnannType> = []
    argLst.forEach((x, i) => {
      const argCompileResult = compile(x, cg)
      maxStack = Math.max(maxStack, i + 2 + argCompileResult.stackSize)
      rawArgTypes.push(argCompileResult.resultType)
    })
    const argDescriptor = '(' + rawArgTypes.join('') + ')'
    for (let i = 0; i < methodInfos.length; i++) {
      const methodInfo = methodInfos[i]
      if (methodInfo.typeDescriptor.includes(argDescriptor) && methodInfo.className == id) {
        const method = cg.constantPoolManager.indexMethodrefInfo(
          methodInfo.className,
          methodInfo.name,
          methodInfo.typeDescriptor
        )
        cg.code.push(OPCODE.INVOKESPECIAL, 0, method)
        break
      }
    }

    return { stackSize: maxStack, resultType: id }
  },

  ArrayAccess: (node: Node, cg: CodeGenerator) => {
    const n = node as ArrayAccess
    const { stackSize: size1, resultType: arrayType } = compile(n.primary, cg)
    const arrayElemType = arrayType.slice(1)
    const size2 = compile(n.expression, cg).stackSize
    cg.code.push(arrayElemType in arrayLoadOp ? arrayLoadOp[arrayElemType] : OPCODE.AALOAD)

    return { stackSize: size1 + size2, resultType: arrayElemType }
  },

  ExpressionStatement: (node: Node, cg: CodeGenerator) => {
    const { stmtExp } = node as ExpressionStatement
    if (stmtExp.kind === 'PrefixExpression' || stmtExp.kind === 'PostfixExpression') {
      return codeGenerators['IncrementDecrementExpression'](stmtExp, cg)
    }
    return compile(stmtExp, cg)
  },

  MethodInvocation: (node: Node, cg: CodeGenerator) => {
    const n = node as MethodInvocation
    let maxStack = 1
    let resultType = EMPTY_TYPE
    let candidateMethods: MethodInfos = []
    let unqualifiedCall = false

    // --- Handle super. calls ---
    if (n.identifier.startsWith('super.')) {
      candidateMethods = cg.symbolTable.queryMethod(n.identifier.slice(6)) as MethodInfos
      candidateMethods = candidateMethods.filter(
        method => method.className == cg.symbolTable.queryClass(cg.currentClass).parentClassName
      )
      cg.code.push(OPCODE.ALOAD, 0)
    }
    // --- Handle qualified calls (e.g. System.out.println or p.show) ---
    else if (n.identifier.includes('.')) {
      const lastDot = n.identifier.lastIndexOf('.')
      const receiverStr = n.identifier.slice(0, lastDot)

      if (receiverStr === 'this') {
        candidateMethods = cg.symbolTable.queryMethod(n.identifier.slice(5)) as MethodInfos
        candidateMethods = candidateMethods.filter(method => method.className == cg.currentClass)
        cg.code.push(OPCODE.ALOAD, 0)
      } else {
        const recvRes = compile({ kind: 'ExpressionName', name: receiverStr }, cg)
        maxStack = Math.max(maxStack, recvRes.stackSize)
        candidateMethods = cg.symbolTable.queryMethod(n.identifier).pop() as MethodInfos
      }
    }
    // --- Handle unqualified calls ---
    else {
      candidateMethods = cg.symbolTable.queryMethod(n.identifier) as MethodInfos
      unqualifiedCall = true
    }

    // Filter candidate methods by matching the argument list.
    const argDescs = n.argumentList.map(arg => getExpressionType(arg, cg))
    let methodMatches: MethodInfos = []

    // JLS 15.12.2: first look for methods applicable without boxing/unboxing (strict), and only
    // if there are none, allow boxing/unboxing (loose).
    for (const isApplicable of [isSubtype, isLooselyInvocable]) {
      methodMatches = candidateMethods.filter(m => {
        const fullDesc = m.typeDescriptor // e.g., "(Ljava/lang/String;C)V"
        const paramPart = fullDesc.slice(1, fullDesc.indexOf(')'))
        const params = paramPart.match(/(\[+[BCDFIJSZ])|(\[+L[^;]+;)|[BCDFIJSZ]|L[^;]+;/g) || []
        return (
          params.length === argDescs.length &&
          params.every((param, i) => isApplicable(argDescs[i], param, cg))
        )
      })
      if (methodMatches.length > 0) break
    }
    if (methodMatches.length === 0) {
      throw new NoMethodMatchingSignatureError(n.identifier + argDescs.join(','))
    }

    // Overload resolution (simple: choose first, or refine if needed)
    let selectedMethod = methodMatches[0]
    if (methodMatches.length > 1) {
      for (let i = 1; i < methodMatches.length; i++) {
        const currParams =
          selectedMethod.typeDescriptor
            .slice(1, selectedMethod.typeDescriptor.indexOf(')'))
            .match(/(\[+[BCDFIJSZ])|(\[+L[^;]+;)|[BCDFIJSZ]|L[^;]+;/g) || []
        const candParams =
          methodMatches[i].typeDescriptor
            .slice(1, methodMatches[i].typeDescriptor.indexOf(')'))
            .match(/(\[+[BCDFIJSZ])|(\[+L[^;]+;)|[BCDFIJSZ]|L[^;]+;/g) || []
        if (
          candParams
            .map((p, idx) => isSubtype(p, currParams[idx], cg))
            .reduce((a, b) => a && b, true)
        ) {
          selectedMethod = methodMatches[i]
        } else if (
          !currParams
            .map((p, idx) => isSubtype(p, candParams[idx], cg))
            .reduce((a, b) => a && b, true)
        ) {
          throw new AmbiguousMethodCallError(n.identifier + argDescs.join(','))
        }
      }
    }

    if (unqualifiedCall && !(selectedMethod.accessFlags & FIELD_FLAGS.ACC_STATIC)) {
      if (cg.currentMethodIsStatic) {
        throw new NonStaticReferenceInStaticContextError('method', selectedMethod.name)
      }
      cg.code.push(OPCODE.ALOAD, 0)
    }

    // Compile each argument.
    const fullDescriptor = selectedMethod.typeDescriptor
    const paramPart = fullDescriptor.slice(1, fullDescriptor.indexOf(')'))
    const params = paramPart.match(/(\[+[BCDFIJSZ])|(\[+L[^;]+;)|[BCDFIJSZ]|L[^;]+;/g) || []
    n.argumentList.forEach((arg, i) => {
      const argRes = compile(arg, cg)
      const conv = handleImplicitTypeConversion(argRes.resultType, params[i] || '', cg)
      maxStack = Math.max(maxStack, i + 1 + argRes.stackSize + conv)
    })

    // Emit the method call.
    const methodRef = cg.constantPoolManager.indexMethodrefInfo(
      selectedMethod.className,
      selectedMethod.name,
      selectedMethod.typeDescriptor
    )
    if (n.identifier.startsWith('super.')) {
      cg.code.push(OPCODE.INVOKESPECIAL, 0, methodRef)
    } else {
      const isStatic = (selectedMethod.accessFlags & METHOD_FLAGS.ACC_STATIC) !== 0
      cg.code.push(isStatic ? OPCODE.INVOKESTATIC : OPCODE.INVOKEVIRTUAL, 0, methodRef)
    }
    resultType = selectedMethod.typeDescriptor.slice(selectedMethod.typeDescriptor.indexOf(')') + 1)
    return { stackSize: maxStack, resultType: resultType }
  },

  Assignment: (node: Node, cg: CodeGenerator) => {
    const { left: left, operator: op, right: right } = node as Assignment

    if (op !== '=') {
      const subExpr: BinaryExpression = {
        kind: 'BinaryExpression',
        left: left,
        right: right,
        operator: op.slice(0, op.length - 1) as BinaryOperator
      }
      // JLS 15.26.2: `E1 op= E2` is `E1 = (T) ((E1) op (E2))`, where T is the type of E1.
      const lhsType = getExpressionType(left, cg)
      const newAssignmentNode: Assignment = {
        kind: 'Assignment',
        left: left,
        operator: '=',
        right:
          lhsType in PRIMITIVE_NAMES
            ? {
                kind: 'CastExpression',
                castType: PRIMITIVE_NAMES[lhsType],
                expression: subExpr,
                isPrimitiveCast: true
              }
            : subExpr
      }
      return compile(newAssignmentNode, cg)
    }

    let maxStack = 0
    const lhs: Node = left

    if (lhs.kind === 'ArrayAccess') {
      const { stackSize: size1, resultType: arrayType } = compile(lhs.primary, cg)
      const size2 = compile(lhs.expression, cg).stackSize
      const { stackSize: rhsSize, resultType: rhsType } = compile(right, cg)

      const arrayElemType = arrayType.slice(1)
      const stackSizeChange = handleImplicitTypeConversion(rhsType, arrayElemType, cg, right)
      maxStack = Math.max(maxStack, size1 + size2 + rhsSize + stackSizeChange)
      cg.code.push(arrayElemType in arrayStoreOp ? arrayStoreOp[arrayElemType] : OPCODE.AASTORE)
    } else if (
      lhs.kind === 'ExpressionName' &&
      !Array.isArray(cg.symbolTable.queryVariable(lhs.name))
    ) {
      const info = cg.symbolTable.queryVariable(lhs.name) as VariableInfo
      const { stackSize: rhsSize, resultType: rhsType } = compile(right, cg)
      const stackSizeChange = handleImplicitTypeConversion(rhsType, info.typeDescriptor, cg, right)
      maxStack = Math.max(maxStack, 1 + rhsSize + stackSizeChange)
      cg.code.push(
        info.typeDescriptor in normalStoreOp ? normalStoreOp[info.typeDescriptor] : OPCODE.ASTORE,
        info.index
      )
    } else {
      const infos = cg.symbolTable.queryVariable(lhs.name) as Array<SymbolInfo>
      const fieldInfo = infos[infos.length - 1] as FieldInfo
      const field = cg.constantPoolManager.indexFieldrefInfo(
        fieldInfo.parentClassName,
        fieldInfo.name,
        fieldInfo.typeDescriptor
      )

      const varIndex = (infos[0] as VariableInfo).index
      if (varIndex !== undefined) {
        cg.code.push(OPCODE.ALOAD, varIndex)
        maxStack += 1
      } else if (lhs.name.startsWith('this.')) {
        // load "this"
        cg.code.push(OPCODE.ALOAD, 0)
        maxStack += 1
      }

      const { stackSize: rhsSize, resultType: rhsType } = compile(right, cg)
      const stackSizeChange = handleImplicitTypeConversion(
        rhsType,
        fieldInfo.typeDescriptor,
        cg,
        right
      )

      maxStack = Math.max(maxStack, maxStack + rhsSize + stackSizeChange)
      cg.code.push(
        fieldInfo.accessFlags & FIELD_FLAGS.ACC_STATIC ? OPCODE.PUTSTATIC : OPCODE.PUTFIELD,
        0,
        field
      )
    }

    return { stackSize: maxStack, resultType: EMPTY_TYPE }
  },

  BinaryExpression: (node: Node, cg: CodeGenerator) => {
    const { left: left, right: right, operator: op } = node as BinaryExpression
    if (op === '&&' || op === '||') {
      // LogicalExpression jumps to the most recently created label when the condition is false
      const falseLabel = cg.generateNewLabel()
      const res = codeGenerators['LogicalExpression'](node, cg)
      const endLabel = cg.generateNewLabel()
      cg.code.push(OPCODE.ICONST_1)
      cg.addBranchInstr(OPCODE.GOTO, endLabel)
      falseLabel.offset = cg.code.length
      cg.code.push(OPCODE.ICONST_0)
      endLabel.offset = cg.code.length
      return { stackSize: Math.max(res.stackSize, 1), resultType: res.resultType }
    }
    if (op in reverseLogicalOp) {
      const falseLabel = cg.generateNewLabel()
      const endLabel = cg.generateNewLabel()
      const res = compileComparison(left, right, op, false, falseLabel, cg)
      cg.code.push(OPCODE.ICONST_1)
      cg.addBranchInstr(OPCODE.GOTO, endLabel)
      falseLabel.offset = cg.code.length
      cg.code.push(OPCODE.ICONST_0)
      endLabel.offset = cg.code.length
      return res
    }

    const leftCompiled = compile(left, cg)
    // Unbox a wrapper operand to its primitive before arithmetic / comparison.
    const leftType = unboxIfWrapper(leftCompiled.resultType, cg)
    const isString = (type: string) => type === 'Ljava/lang/String;'

    if (op === '+' && (isString(leftType) || isString(getExpressionType(right, cg)))) {
      // String concatenation: each operand is converted to a String as soon as it is on the stack
      if (!isString(leftType)) {
        generateStringConversion(leftType, cg)
      }
      const rightCompiled = compile(right, cg)
      const rightType = unboxIfWrapper(rightCompiled.resultType, cg)
      if (!isString(rightType)) {
        generateStringConversion(rightType, cg)
      }

      // Invoke `String.concat` for concatenation
      const concatMethodIndex = cg.constantPoolManager.indexMethodrefInfo(
        'java/lang/String',
        'concat',
        '(Ljava/lang/String;)Ljava/lang/String;'
      )
      cg.code.push(OPCODE.INVOKEVIRTUAL, 0, concatMethodIndex)

      return {
        stackSize: Math.max(leftCompiled.stackSize, 1 + rightCompiled.stackSize),
        resultType: 'Ljava/lang/String;'
      }
    }

    const insertConversionIndex = cg.code.length
    cg.code.push(OPCODE.NOP)
    const rightCompiled = compile(right, cg)
    const rightType = unboxIfWrapper(rightCompiled.resultType, cg)

    let finalType = leftType
    let size1 = Math.max(leftCompiled.stackSize, slotsOf(leftType))
    let size2 = Math.max(rightCompiled.stackSize, slotsOf(rightType))

    if (isNumeric(leftType) && isNumeric(rightType)) {
      const isShift = op === '<<' || op === '>>' || op === '>>>'
      // Shift operands are promoted separately (JLS 5.6.1); the result has the left type.
      const promoted = isShift
        ? binaryPromotion(leftType, 'I')
        : binaryPromotion(leftType, rightType)
      const leftConversion = wideningOpcode(leftType, promoted)
      if (leftConversion !== undefined) cg.code[insertConversionIndex] = leftConversion
      if (isShift) {
        // the shift distance is always an int on the stack
        if (rightType === 'J') cg.code.push(OPCODE.L2I)
        size2 = Math.max(rightCompiled.stackSize, 1)
      } else {
        const rightConversion = wideningOpcode(rightType, promoted)
        if (rightConversion !== undefined) cg.code.push(rightConversion)
        size2 = Math.max(rightCompiled.stackSize, slotsOf(promoted))
      }
      size1 = Math.max(leftCompiled.stackSize, slotsOf(promoted))
      finalType = promoted
    }

    // Perform the operation
    switch (finalType) {
      case 'D':
        cg.code.push(doubleBinaryOp[op])
        break
      case 'F':
        cg.code.push(floatBinaryOp[op])
        break
      case 'I':
      case 'Z':
        cg.code.push(intBinaryOp[op])
        break
      case 'J':
        cg.code.push(longBinaryOp[op])
        break
    }

    return {
      stackSize: Math.max(size1, slotsOf(finalType) + size2),
      resultType: finalType
    }
  },

  IncrementDecrementExpression: (node: Node, cg: CodeGenerator) => {
    // handle cases of ++x, x++, x--, --x that do not add object to operand stack
    if (node.kind === 'PrefixExpression' || node.kind === 'PostfixExpression') {
      const assignment: Assignment = {
        kind: 'Assignment',
        left: node.expression as LeftHandSide,
        operator: node.operator === '++' ? '+=' : '-=',
        right: createIntLiteralNode(1)
      }
      return compile(assignment, cg)
    }
    return { stackSize: 0, resultType: EMPTY_TYPE }
  },

  PrefixExpression: (node: Node, cg: CodeGenerator) => {
    const { operator: op, expression: expr } = node as PrefixExpression
    if (op === '++' || op === '--') {
      // increment/decrement then load
      const res = codeGenerators['IncrementDecrementExpression'](node, cg)
      const loadRes = compile(expr, cg)
      res.stackSize = Math.max(res.stackSize, loadRes.stackSize)
      res.resultType = loadRes.resultType
      return res
    }

    const compileResult = compile(expr, cg)
    // Unary numeric promotion (JLS 5.6.1): byte, short and char operands become int.
    if (
      (op === '-' || op === '+' || op === '~') &&
      ['B', 'S', 'C'].includes(compileResult.resultType)
    ) {
      compileResult.resultType = 'I'
    }
    if (op === '-') {
      const negationOpcodes: { [type: string]: OPCODE } = {
        I: OPCODE.INEG, // Integer negation
        J: OPCODE.LNEG, // Long negation
        F: OPCODE.FNEG, // Float negation
        D: OPCODE.DNEG // Double negation
      }

      if (compileResult.resultType in negationOpcodes) {
        cg.code.push(negationOpcodes[compileResult.resultType])
      } else {
        throw new Error(`Unary '-' not supported for type: ${compileResult.resultType}`)
      }
    } else if (op === '~') {
      if (compileResult.resultType === 'J') {
        cg.code.push(OPCODE.LCONST_1, OPCODE.LNEG, OPCODE.LXOR)
        compileResult.stackSize = Math.max(compileResult.stackSize, 4)
      } else {
        cg.code.push(OPCODE.ICONST_M1, OPCODE.IXOR)
        compileResult.stackSize = Math.max(compileResult.stackSize, 2)
      }
    } else if (op === '!') {
      const elseLabel = cg.generateNewLabel()
      const endLabel = cg.generateNewLabel()
      cg.addBranchInstr(OPCODE.IFEQ, elseLabel)
      cg.code.push(OPCODE.ICONST_0)
      cg.addBranchInstr(OPCODE.GOTO, endLabel)
      elseLabel.offset = cg.code.length
      cg.code.push(OPCODE.ICONST_1)
      endLabel.offset = cg.code.length
    }
    return compileResult
  },

  PostfixExpression: (node: Node, cg: CodeGenerator) => {
    const { expression: expr } = node as PostfixExpression
    // load then increment/decrement
    const loadRes = compile(expr, cg)
    const res = codeGenerators['IncrementDecrementExpression'](node, cg)
    res.stackSize += loadRes.stackSize
    res.resultType = loadRes.resultType
    return res
  },

  ExpressionName: (node: Node, cg: CodeGenerator) => {
    const { name: name } = node as ExpressionName
    if (name.endsWith('.length')) {
      // check if getting array length
      const arrayName = name.slice(0, name.lastIndexOf('.length'))
      const info = cg.symbolTable.queryVariable(arrayName)
      if (
        (Array.isArray(info) &&
          (info[info.length - 1] as FieldInfo).typeDescriptor.includes('[')) ||
        (info as VariableInfo).typeDescriptor.includes('[')
      ) {
        compile(
          {
            kind: 'ExpressionName',
            name: arrayName
          },
          cg
        )
        cg.code.push(OPCODE.ARRAYLENGTH)
        return { stackSize: 1, resultType: cg.symbolTable.generateFieldDescriptor('int') }
      }
    }

    let info: VariableInfo | SymbolInfo[]
    try {
      info = cg.symbolTable.queryVariable(name)
    } catch (e) {
      return { stackSize: 1, resultType: 'Ljava/lang/Class;' }
    }
    if (Array.isArray(info)) {
      const fieldInfos = info
      for (let i = 0; i < fieldInfos.length; i++) {
        if (i === 0) {
          const varInfo = fieldInfos[i] as VariableInfo
          if (varInfo.index !== undefined) {
            cg.code.push(OPCODE.ALOAD, varInfo.index)
            continue
          }
        }
        const fieldInfo = fieldInfos[i] as FieldInfo
        const field = cg.constantPoolManager.indexFieldrefInfo(
          fieldInfo.parentClassName,
          fieldInfo.name,
          fieldInfo.typeDescriptor
        )
        if (i === 0 && !(fieldInfo.accessFlags & FIELD_FLAGS.ACC_STATIC)) {
          if (cg.currentMethodIsStatic) {
            throw new NonStaticReferenceInStaticContextError('field', fieldInfo.name)
          }
          // load "this"
          cg.code.push(OPCODE.ALOAD, 0)
        }
        cg.code.push(
          fieldInfo.accessFlags & FIELD_FLAGS.ACC_STATIC ? OPCODE.GETSTATIC : OPCODE.GETFIELD,
          0,
          field
        )
      }
      const fetchedFieldTypeDescriptor = (fieldInfos[fieldInfos.length - 1] as FieldInfo)
        .typeDescriptor
      return {
        stackSize: 1 + (['D', 'J'].includes(fetchedFieldTypeDescriptor) ? 1 : 0),
        resultType: fetchedFieldTypeDescriptor
      }
    } else {
      cg.code.push(
        info.typeDescriptor in normalLoadOp ? normalLoadOp[info.typeDescriptor] : OPCODE.ALOAD,
        info.index
      )
      if (info.typeDescriptor === 'D' || info.typeDescriptor === 'J') {
        return { stackSize: 2, resultType: info.typeDescriptor }
      } else {
        return { stackSize: 1, resultType: info.typeDescriptor }
      }
    }
  },

  Literal: (node: Node, cg: CodeGenerator) => {
    const { kind, value } = (node as Literal).literalType
    switch (kind) {
      case 'CharacterLiteral': {
        cg.code.push(OPCODE.BIPUSH, value.charCodeAt(0))
        return { stackSize: 1, resultType: cg.symbolTable.generateFieldDescriptor('char') }
      }
      case 'StringLiteral': {
        const strIdx = cg.constantPoolManager.indexStringInfo(value.slice(1, value.length - 1))
        cg.code.push(OPCODE.LDC, strIdx)
        return { stackSize: 1, resultType: cg.symbolTable.generateFieldDescriptor('String') }
      }
      case 'HexIntegerLiteral':
      case 'DecimalIntegerLiteral': {
        if (value.endsWith('l') || value.endsWith('L')) {
          const n = BigInt(value.slice(0, -1))
          const idx = cg.constantPoolManager.indexLongInfo(n)
          cg.code.push(OPCODE.LDC2_W, 0, idx)
          return { stackSize: 2, resultType: cg.symbolTable.generateFieldDescriptor('long') }
        }
        const n = parseInt(value)
        if (-128 <= n && n < 128) {
          cg.code.push(OPCODE.BIPUSH, n)
        } else if (-32768 <= n && n < 32768) {
          cg.code.push(OPCODE.SIPUSH, n >> 8, n & 0xff)
        } else {
          const idx = cg.constantPoolManager.indexIntegerInfo(n)
          cg.code.push(OPCODE.LDC, idx)
        }
        return { stackSize: 1, resultType: cg.symbolTable.generateFieldDescriptor('int') }
      }
      case 'DecimalFloatingPointLiteral': {
        const d = parseFloat(value)
        if (value.endsWith('f') || value.endsWith('F')) {
          const idx = cg.constantPoolManager.indexFloatInfo(d)
          cg.code.push(OPCODE.LDC, idx)
          return { stackSize: 1, resultType: cg.symbolTable.generateFieldDescriptor('float') }
        }
        const idx = cg.constantPoolManager.indexDoubleInfo(d)
        cg.code.push(OPCODE.LDC2_W, 0, idx)
        return { stackSize: 2, resultType: cg.symbolTable.generateFieldDescriptor('double') }
      }
      case 'BooleanLiteral': {
        cg.code.push(value === 'true' ? OPCODE.ICONST_1 : OPCODE.ICONST_0)
        return { stackSize: 1, resultType: cg.symbolTable.generateFieldDescriptor('boolean') }
      }
      case 'NullLiteral': {
        cg.code.push(OPCODE.ACONST_NULL)
        return { stackSize: 1, resultType: EMPTY_TYPE }
      }
    }

    return { stackSize: 1, resultType: EMPTY_TYPE }
  },

  SwitchStatement: (node: Node, cg: CodeGenerator) => {
    const { expression, cases } = node as SwitchStatement

    // Compile the switch expression
    const { stackSize: exprStackSize, resultType } = compile(expression, cg)
    let maxStack = exprStackSize

    // If the expression is an enum type, invoke ordinal() to convert to int and then continue
    let _resultType = resultType
    let enumTypeName: string | null = null
    if (_resultType && _resultType.startsWith('L') && _resultType !== 'Ljava/lang/String;') {
      const clean = _resultType.replace(/^L|;$/g, '')
      try {
        const classInfo = cg.symbolTable.queryClass(clean)
        if (classInfo.isEnum) {
          // ordinal() is inherited from java.lang.Enum; invokevirtual on the
          // enum class dispatches to it.
          cg.code.push(
            OPCODE.INVOKEVIRTUAL,
            0,
            cg.constantPoolManager.indexMethodrefInfo(clean, 'ordinal', '()I')
          )
          _resultType = 'I'
          enumTypeName = clean
          maxStack = Math.max(maxStack, exprStackSize + 1)
        }
      } catch (e) {
        // ignore: not a known class
      }
    }

    const caseLabels: Label[] = cases.map(() => cg.generateNewLabel())
    const defaultLabel = cg.generateNewLabel()
    const endLabel = cg.generateNewLabel()

    // Track the switch statement's end label
    cg.switchLabels.push(endLabel)

    if (['I', 'B', 'S', 'C'].includes(_resultType)) {
      const caseValues: number[] = []
      const caseLabelMap: Map<number, Label> = new Map()
      let hasDefault = false
      const positionOffset = cg.code.length

      cases.forEach((caseGroup, index) => {
        caseGroup.labels.forEach(label => {
          if (label.kind === 'CaseLabel') {
            const value =
              label.expression.kind === 'ExpressionName' && enumTypeName
                ? (() => {
                    const fields = cg.symbolTable.queryField(
                      `${enumTypeName}.${label.expression.name}`
                    )
                    const field = fields[fields.length - 1] as FieldInfo
                    if (field.parentClassName !== enumTypeName || field.ordinal === undefined)
                      throw new Error(`Invalid enum switch label: ${label.expression.name}`)
                    return field.ordinal
                  })()
                : label.expression.kind === 'ExpressionName'
                  ? (() => {
                      throw new Error(
                        `Identifier case labels are only supported for enum switch selectors: ${label.expression.name}`
                      )
                    })()
                  : parseInt((label.expression as Literal).literalType.value)
            caseValues.push(value)
            caseLabelMap.set(value, caseLabels[index])
          } else if (label.kind === 'DefaultLabel') {
            caseLabels[index] = defaultLabel
            hasDefault = true
          }
        })
      })

      const [minValue, maxValue] = [Math.min(...caseValues), Math.max(...caseValues)]
      const useTableSwitch = maxValue - minValue < caseValues.length * 2
      const caseLabelIndex: number[] = []
      let indexTracker = cg.code.length

      if (useTableSwitch) {
        cg.code.push(OPCODE.TABLESWITCH)
        indexTracker++

        // Ensure 4-byte alignment for TABLESWITCH
        while (cg.code.length % 4 !== 0) {
          cg.code.push(0) // Padding bytes (JVM requires alignment)
          indexTracker++
        }

        // Add default branch (reserve 4 bytes for default label offset)
        cg.code.push(0, 0, 0, 0)
        caseLabelIndex.push(indexTracker)
        indexTracker += 4

        // Push low and high values (min and max case values)
        cg.code.push(
          minValue >> 24,
          (minValue >> 16) & 0xff,
          (minValue >> 8) & 0xff,
          minValue & 0xff
        )
        cg.code.push(
          maxValue >> 24,
          (maxValue >> 16) & 0xff,
          (maxValue >> 8) & 0xff,
          maxValue & 0xff
        )
        indexTracker += 8

        // Generate branch table (reserve 4 bytes per entry and record start indices)
        for (let i = minValue; i <= maxValue; i++) {
          // push the 4-byte placeholder for the branch target
          cg.code.push(0, 0, 0, 0)
          caseLabelIndex.push(indexTracker)
          indexTracker += 4
        }
      } else {
        cg.code.push(OPCODE.LOOKUPSWITCH)
        indexTracker++

        // Ensure 4-byte alignment for LOOKUPSWITCH
        while (cg.code.length % 4 !== 0) {
          cg.code.push(0)
          indexTracker++
        }

        // Add default branch (reserve 4 bytes for default label offset)
        cg.code.push(0, 0, 0, 0)
        caseLabelIndex.push(indexTracker)
        indexTracker += 4

        // Push the number of case-value pairs
        cg.code.push(
          (caseValues.length >> 24) & 0xff,
          (caseValues.length >> 16) & 0xff,
          (caseValues.length >> 8) & 0xff,
          caseValues.length & 0xff
        )
        indexTracker += 4

        // Generate lookup table (pairs of case values and corresponding labels)
        caseValues.forEach((value, index) => {
          // push 4-byte key
          cg.code.push(
            (value >> 24) & 0xff,
            (value >> 16) & 0xff,
            (value >> 8) & 0xff,
            value & 0xff
          )
          // reserve 4 bytes for the branch target
          cg.code.push(0, 0, 0, 0)
          // label offset starts after the 4-byte key
          caseLabelIndex.push(indexTracker + 4)
          indexTracker += 8
        })
      }

      // **Process case bodies with proper fallthrough handling**
      let previousCase: SwitchCase | null = null

      const nonDefaultCases = cases.filter(caseGroup =>
        caseGroup.labels.some(label => label.kind === 'CaseLabel')
      )

      nonDefaultCases.forEach((caseGroup, index) => {
        caseLabels[index].offset = cg.code.length

        // Ensure statements array is always defined
        caseGroup.statements = caseGroup.statements || []

        // If previous case had no statements, merge labels (fallthrough)
        if (previousCase && (previousCase.statements?.length ?? 0) === 0) {
          previousCase.labels.push(...caseGroup.labels)
        }

        // Compile case statements
        caseGroup.statements.forEach(statement => {
          const { stackSize } = compile(statement, cg)
          maxStack = Math.max(maxStack, stackSize)
        })

        previousCase = caseGroup
      })

      // **Process default case**
      defaultLabel.offset = cg.code.length
      if (hasDefault) {
        const defaultCase = cases.find(caseGroup =>
          caseGroup.labels.some(label => label.kind === 'DefaultLabel')
        )
        if (defaultCase) {
          defaultCase.statements = defaultCase.statements || []
          defaultCase.statements.forEach(statement => {
            const { stackSize } = compile(statement, cg)
            maxStack = Math.max(maxStack, stackSize)
          })
        }
      }

      // Patch switch target offsets (write full 4-byte signed offsets, big-endian)
      // Patch default target
      {
        const idx = caseLabelIndex[0]
        const defOff = defaultLabel.offset - positionOffset
        cg.code[idx] = (defOff >> 24) & 0xff
        cg.code[idx + 1] = (defOff >> 16) & 0xff
        cg.code[idx + 2] = (defOff >> 8) & 0xff
        cg.code[idx + 3] = defOff & 0xff
      }

      if (useTableSwitch) {
        const range = maxValue - minValue + 1
        for (let j = 0; j < range; j++) {
          const idx = caseLabelIndex[1 + j]
          const lbl = caseLabelMap.get(minValue + j) || defaultLabel
          const off = lbl.offset - positionOffset
          cg.code[idx] = (off >> 24) & 0xff
          cg.code[idx + 1] = (off >> 16) & 0xff
          cg.code[idx + 2] = (off >> 8) & 0xff
          cg.code[idx + 3] = off & 0xff
        }
      } else {
        for (let k = 0; k < caseValues.length; k++) {
          const idx = caseLabelIndex[1 + k]
          const lbl = caseLabelMap.get(caseValues[k]) || defaultLabel
          const off = lbl.offset - positionOffset
          cg.code[idx] = (off >> 24) & 0xff
          cg.code[idx + 1] = (off >> 16) & 0xff
          cg.code[idx + 2] = (off >> 8) & 0xff
          cg.code[idx + 3] = off & 0xff
        }
      }

      endLabel.offset = cg.code.length
    } else if (_resultType === 'Ljava/lang/String;') {
      // **String Switch Handling**
      const hashCaseMap: Map<number, Label> = new Map()

      // Compute and store hashCode()
      cg.code.push(
        OPCODE.INVOKEVIRTUAL,
        0,
        cg.constantPoolManager.indexMethodrefInfo('java/lang/String', 'hashCode', '()I')
      )

      // Create lookup table for hashCodes
      cases.forEach((caseGroup, index) => {
        caseGroup.labels.forEach(label => {
          if (label.kind === 'CaseLabel') {
            const caseValue = (label.expression as Literal).literalType.value
            const hashCodeValue = hashCode(caseValue.slice(1, caseValue.length - 1))
            if (!hashCaseMap.has(hashCodeValue)) {
              hashCaseMap.set(hashCodeValue, caseLabels[index])
            }
          } else if (label.kind === 'DefaultLabel') {
            caseLabels[index] = defaultLabel
          }
        })
      })

      const caseLabelIndex: number[] = []
      let indexTracker = cg.code.length
      const positionOffset = cg.code.length

      // **LOOKUPSWITCH Implementation**
      cg.code.push(OPCODE.LOOKUPSWITCH)
      indexTracker++

      // Ensure 4-byte alignment
      while (cg.code.length % 4 !== 0) {
        cg.code.push(0)
        indexTracker++
      }

      // Default jump target (reserve 4 bytes)
      cg.code.push(0, 0, 0, 0)
      caseLabelIndex.push(indexTracker)
      indexTracker += 4

      // Number of case-value pairs
      cg.code.push(
        (hashCaseMap.size >> 24) & 0xff,
        (hashCaseMap.size >> 16) & 0xff,
        (hashCaseMap.size >> 8) & 0xff,
        hashCaseMap.size & 0xff
      )
      indexTracker += 4

      // Populate LOOKUPSWITCH
      const hashLabels: Label[] = []
      hashCaseMap.forEach((label, hashCode) => {
        cg.code.push(
          (hashCode >> 24) & 0xff,
          (hashCode >> 16) & 0xff,
          (hashCode >> 8) & 0xff,
          hashCode & 0xff
        )
        // reserve 4 bytes for the branch target
        cg.code.push(0, 0, 0, 0)
        // label offset starts after the 4-byte key
        caseLabelIndex.push(indexTracker + 4)
        hashLabels.push(label)
        indexTracker += 8
      })

      // **Case Handling**
      let previousCase: SwitchCase | null = null

      cases
        .filter(caseGroup => caseGroup.labels.some(label => label.kind === 'CaseLabel'))
        .forEach((caseGroup, index) => {
          caseLabels[index].offset = cg.code.length

          // Ensure statements exist
          caseGroup.statements = caseGroup.statements || []

          // Handle fallthrough
          if (previousCase && (previousCase.statements?.length ?? 0) === 0) {
            previousCase.labels.push(...caseGroup.labels)
          }

          // **String Comparison for Collisions**
          const caseValue = caseGroup.labels.find(
            (label): label is CaseLabel => label.kind === 'CaseLabel'
          )
          if (caseValue) {
            // TODO: check for actual String equality instead of just rely on hashCode equality
            //  (see the commented out code below)

            // const caseStr = (caseValue.expression as Literal).literalType.value;
            // const caseStrIndex = cg.constantPoolManager.indexStringInfo(caseStr);

            // cg.code.push(OPCODE.LDC, caseStrIndex);
            // cg.code.push(
            //   OPCODE.INVOKEVIRTUAL,
            //   0,
            //   cg.constantPoolManager.indexMethodrefInfo("java/lang/String", "equals", "(Ljava/lang/Object;)Z")
            // );
            //
            const caseEndLabel = cg.generateNewLabel()
            // cg.addBranchInstr(OPCODE.IFEQ, caseEndLabel);

            // Compile case statements
            caseGroup.statements.forEach(statement => {
              const { stackSize } = compile(statement, cg)
              maxStack = Math.max(maxStack, stackSize)
            })

            caseEndLabel.offset = cg.code.length
          }

          previousCase = caseGroup
        })

      // **Default Case Handling**
      defaultLabel.offset = cg.code.length
      const defaultCase = cases.find(caseGroup =>
        caseGroup.labels.some(label => label.kind === 'DefaultLabel')
      )

      if (defaultCase) {
        defaultCase.statements = defaultCase.statements || []
        defaultCase.statements.forEach(statement => {
          const { stackSize } = compile(statement, cg)
          maxStack = Math.max(maxStack, stackSize)
        })
      }

      // Patch default target
      {
        const idx = caseLabelIndex[0]
        const defOff = defaultLabel.offset - positionOffset
        cg.code[idx] = (defOff >> 24) & 0xff
        cg.code[idx + 1] = (defOff >> 16) & 0xff
        cg.code[idx + 2] = (defOff >> 8) & 0xff
        cg.code[idx + 3] = defOff & 0xff
      }

      // Patch hash-case entries in insertion order
      for (let k = 0; k < hashLabels.length; k++) {
        const idx = caseLabelIndex[1 + k]
        const off = hashLabels[k].offset - positionOffset
        cg.code[idx] = (off >> 24) & 0xff
        cg.code[idx + 1] = (off >> 16) & 0xff
        cg.code[idx + 2] = (off >> 8) & 0xff
        cg.code[idx + 3] = off & 0xff
      }

      endLabel.offset = cg.code.length
    } else {
      throw new Error(
        `Switch statements only support byte, short, int, char, String, or enum types. Found: ${_resultType}`
      )
    }

    cg.switchLabels.pop()

    return { stackSize: maxStack, resultType: EMPTY_TYPE }
  }
}

class CodeGenerator {
  symbolTable: SymbolTable
  constantPoolManager: ConstantPoolManager
  maxLocals: number = 0
  stackSize: number = 0
  exceptionTable: Array<ExceptionHandler> = []
  labels: Label[] = []
  loopLabels: Label[][] = []
  switchLabels: Label[] = []
  finallyBlockStack: Node[] = []
  code: number[] = []
  currentClass: string
  currentMethodIsStatic: boolean = false
  currentMethodReturnType: string = ''

  constructor(symbolTable: SymbolTable, constantPoolManager: ConstantPoolManager) {
    this.symbolTable = symbolTable
    this.constantPoolManager = constantPoolManager
  }

  generateNewLabel(): Label {
    const label = {
      offset: 0,
      pointedBy: []
    }
    this.labels.push(label)
    return label
  }

  addBranchInstr(opcode: OPCODE, label: Label) {
    label.pointedBy.push(this.code.length)
    this.code.push(opcode, 0, 0)
  }

  resolveLabels() {
    for (const label of this.labels) {
      label.pointedBy.forEach(idx => {
        const offset = label.offset - idx
        this.code[idx + 1] = offset >> 8
        this.code[idx + 2] = offset & 0xff
      })
    }
  }

  generateCode(currentClass: string, methodNode: MethodDeclaration) {
    this.symbolTable.extend()
    this.currentClass = currentClass
    this.currentMethodIsStatic = methodNode.methodModifier.includes('static')
    this.currentMethodReturnType = ''
    const returnType = methodNode.methodHeader.result
    if (returnType && returnType !== 'void') {
      try {
        this.currentMethodReturnType = this.symbolTable.generateFieldDescriptor(returnType)
      } catch (e) {
        // leave unknown return types unconverted
      }
    }
    this.exceptionTable = []
    if (!this.currentMethodIsStatic) {
      this.maxLocals++
    }

    methodNode.methodHeader.formalParameterList.forEach(p => {
      const paramInfo = {
        name: p.identifier,
        accessFlags: 0,
        index: this.maxLocals,
        typeName: p.unannType,
        typeDescriptor: this.symbolTable.generateFieldDescriptor(p.unannType)
      }
      this.symbolTable.insertVariableInfo(paramInfo)
      if (['D', 'J'].includes(paramInfo.typeDescriptor)) {
        this.maxLocals += 2
      } else {
        this.maxLocals++
      }
    })

    if (methodNode.methodHeader.identifier === '<init>') {
      this.stackSize = Math.max(this.stackSize, 1)
      const parentClass =
        this.symbolTable.queryClass(currentClass).parentClassName || 'java/lang/Object'
      this.code.push(
        OPCODE.ALOAD_0,
        OPCODE.INVOKESPECIAL,
        0,
        this.constantPoolManager.indexMethodrefInfo(parentClass, '<init>', '()V')
      )
    }

    this.stackSize = Math.max(this.stackSize, compile(methodNode.methodBody, this).stackSize)
    if (methodNode.methodHeader.result === 'void') {
      this.code.push(OPCODE.RETURN)
    }
    this.resolveLabels()

    const attributes: Array<AttributeInfo> = []
    const codeBuf = new Uint8Array(this.code).buffer
    const dataView = new DataView(codeBuf)
    this.code.forEach((x, i) => dataView.setUint8(i, x))

    const attributeLength =
      12 +
      this.code.length +
      8 * this.exceptionTable.length +
      attributes.map(attr => attr.attributeLength + 6).reduce((acc, val) => acc + val, 0)
    this.symbolTable.teardown()

    return {
      attributeNameIndex: this.constantPoolManager.indexUtf8Info('Code'),
      attributeLength: attributeLength,
      maxStack: this.stackSize,
      maxLocals: this.maxLocals,
      codeLength: this.code.length,
      code: dataView,
      exceptionTableLength: this.exceptionTable.length,
      exceptionTable: this.exceptionTable,
      attributesCount: attributes.length,
      attributes: attributes
    }
  }
}

export function generateCode(
  symbolTable: SymbolTable,
  constantPoolManager: ConstantPoolManager,
  currentClass: string,
  methodNode: MethodDeclaration
) {
  const codeGenerator = new CodeGenerator(symbolTable, constantPoolManager)
  return codeGenerator.generateCode(currentClass, methodNode)
}
