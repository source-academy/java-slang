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
import { ConstantPoolManager } from './constant-pool-manager'
import {
  AmbiguousMethodCallError,
  ConstructNotSupportedError,
  NoMethodMatchingSignatureError
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

const typeConversions: { [key: string]: OPCODE } = {
  'I->F': OPCODE.I2F,
  'I->D': OPCODE.I2D,
  'I->J': OPCODE.I2L,
  'I->B': OPCODE.I2B,
  'I->C': OPCODE.I2C,
  'I->S': OPCODE.I2S,
  'F->D': OPCODE.F2D,
  'F->I': OPCODE.F2I,
  'F->J': OPCODE.F2L,
  'D->F': OPCODE.D2F,
  'D->I': OPCODE.D2I,
  'D->J': OPCODE.D2L,
  'J->I': OPCODE.L2I,
  'J->F': OPCODE.L2F,
  'J->D': OPCODE.L2D
}

const typeConversionsImplicit: { [key: string]: OPCODE } = {
  'I->F': OPCODE.I2F,
  'I->D': OPCODE.I2D,
  'I->J': OPCODE.I2L,
  'F->D': OPCODE.F2D,
  'J->F': OPCODE.L2F,
  'J->D': OPCODE.L2D
}

type CompileResult = {
  stackSize: number
  resultType: string
}
const EMPTY_TYPE: string = ''

function areClassTypesCompatible(fromType: string, toType: string, cg: CodeGenerator): boolean {
  const cleanFrom = fromType.replace(/^L|;$/g, '')
  const cleanTo = toType.replace(/^L|;$/g, '')
  if (cleanFrom === cleanTo) return true;

  try {
    let current = cg.symbolTable.queryClass(cleanFrom);
    while (current.parentClassName) {
      const parentClean = current.parentClassName;
      if (parentClean === cleanTo) return true;
      current = cg.symbolTable.queryClass(parentClean);
    }
  } catch (e) {
    return false;
  }
  return false;
}

function handleImplicitTypeConversion(fromType: string, toType: string, cg: CodeGenerator): number {
  if (fromType === toType || toType.replace(/^L|;$/g, '') === 'java/lang/String') {
    return 0
  }

  if (fromType.startsWith('L') || toType.startsWith('L')) {
    if (areClassTypesCompatible(fromType, toType, cg) || fromType === '') {
      return 0
    }
    throw new Error(`Unsupported class type conversion: ${fromType} -> ${toType}`)
  }

  const conversionKey = `${fromType}->${toType}`
  if (conversionKey in typeConversionsImplicit) {
    cg.code.push(typeConversionsImplicit[conversionKey])
    if (!(fromType in ['J', 'D']) && toType in ['J', 'D']) {
      return 1
    } else if (!(toType in ['J', 'D']) && fromType in ['J', 'D']) {
      return -1
    } else {
      return 0
    }
  } else {
    throw new Error(`Unsupported implicit type conversion: ${conversionKey}`)
  }
}

function handleExplicitTypeConversion(fromType: string, toType: string, cg: CodeGenerator) {
  if (fromType === toType) {
    return
  }
  const conversionKey = `${fromType}->${toType}`
  if (conversionKey in typeConversions) {
    cg.code.push(typeConversions[conversionKey])
  } else {
    throw new Error(`Unsupported explicit type conversion: ${conversionKey}`)
  }
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
    B: '(B)Ljava/lang/String;', // byte
    S: '(S)Ljava/lang/String;', // short
    C: '(C)Ljava/lang/String;' // char
  }

  const descriptor = valueOfDescriptors[valueType]
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
  const resultType = codeGenerators[node.kind](node, cg).resultType
  cg.code = originalCode // Restore the original code state
  return resultType
}

function isSubtype(fromType: string, toType: string, cg: CodeGenerator): boolean {
  return (
    fromType === toType ||
    typeConversionsImplicit[`${fromType}->${toType}`] !== undefined ||
    areClassTypesCompatible(fromType, toType, cg)
  )
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
          const stackSizeChange = handleImplicitTypeConversion(resultType, arrayElemType, cg)
          cg.code.push(arrayElemType in arrayStoreOp ? arrayStoreOp[arrayElemType] : OPCODE.AASTORE)
          maxStack = Math.max(maxStack, 2 + size1 + size2 + stackSizeChange)
        })
        cg.code.push(OPCODE.ASTORE, curIdx)
      } else {
        const { stackSize: initializerStackSize, resultType: initializerType } = compile(vi, cg)
        const stackSizeChange = handleImplicitTypeConversion(
          initializerType,
          variableInfo.typeDescriptor,
          cg
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
      const { stackSize: stackSize, resultType: resultType } = compile(expr, cg)
      cg.code.push(resultType in returnOp ? returnOp[resultType] : OPCODE.ARETURN)
      return { stackSize, resultType }
    }

    cg.code.push(OPCODE.RETURN)
    return { stackSize: 0, resultType: cg.symbolTable.generateFieldDescriptor('void') }
  },

  BreakStatement: (node: Node, cg: CodeGenerator) => {
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

  TernaryExpression: (node: Node, cg: CodeGenerator) => {
    let maxStack = 0
    const {
      condition: condition,
      consequent: consequent,
      alternate: alternate
    } = node as TernaryExpression

    const elseLabel = cg.generateNewLabel()
    maxStack = Math.max(maxStack, codeGenerators['LogicalExpression'](condition, cg).stackSize)
    const conRes = compile(consequent, cg)
    const conSize = conRes.stackSize
    const resType = conRes.resultType
    maxStack = Math.max(maxStack, conSize)

    const endLabel = cg.generateNewLabel()
    cg.addBranchInstr(OPCODE.GOTO, endLabel)

    elseLabel.offset = cg.code.length
    const { stackSize: altSize } = compile(alternate, cg)
    maxStack = Math.max(maxStack, altSize)
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
          if (isNullLiteral(left) && isNullLiteral(right)) {
            if (onTrue === (op === '==')) {
              cg.addBranchInstr(OPCODE.GOTO, targetLabel)
            }
            return { stackSize: 1, resultType: cg.symbolTable.generateFieldDescriptor('boolean') }
          } else if (isNullLiteral(left)) {
            // still use l to represent the first argument pushed onto stack
            l = compile(right, cg)
            cg.addBranchInstr(
              onTrue !== (op === '!=') ? OPCODE.IFNULL : OPCODE.IFNONNULL,
              targetLabel
            )
          } else if (isNullLiteral(right)) {
            l = compile(left, cg)
            cg.addBranchInstr(
              onTrue !== (op === '!=') ? OPCODE.IFNULL : OPCODE.IFNONNULL,
              targetLabel
            )
          } else {
            l = compile(left, cg)
            r = compile(right, cg)
            cg.addBranchInstr(onTrue ? logicalOp[op] : reverseLogicalOp[op], targetLabel)
          }
          return {
            stackSize: Math.max(
              l.stackSize,
              1 + (['D', 'J'].includes(l.resultType) ? 1 : 0) + r.stackSize
            ),
            resultType: cg.symbolTable.generateFieldDescriptor('boolean')
          }
        }
      }

      const res = compile(node, cg)
      cg.addBranchInstr(onTrue ? OPCODE.IFNE : OPCODE.IFEQ, targetLabel)
      return res
    }
    return f(node, cg.labels[cg.labels.length - 1], false)
  },

  ClassInstanceCreationExpression: (node: Node, cg: CodeGenerator) => {
    const { identifier: id, argumentList: argLst } = node as ClassInstanceCreationExpression
    let maxStack = 2

    cg.code.push(OPCODE.NEW, 0, cg.constantPoolManager.indexClassInfo(id), OPCODE.DUP)

    const argTypes: Array<UnannType> = []
    argLst.forEach((x, i) => {
      const argCompileResult = compile(x, cg)
      maxStack = Math.max(maxStack, i + 2 + argCompileResult.stackSize)
      argTypes.push(argCompileResult.resultType)
    })
    const argDescriptor = '(' + argTypes.join('') + ')'

    const methodInfos = cg.symbolTable.queryMethod('<init>') as MethodInfos
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
      candidateMethods.filter(method =>
        method.className == cg.symbolTable.queryClass(cg.currentClass).parentClassName)
      cg.code.push(OPCODE.ALOAD, 0);
    }
    // --- Handle qualified calls (e.g. System.out.println or p.show) ---
    else if (n.identifier.includes('.')) {
      const lastDot = n.identifier.lastIndexOf('.');
      const receiverStr = n.identifier.slice(0, lastDot);

      if (receiverStr === 'this') {
        candidateMethods = cg.symbolTable.queryMethod(n.identifier.slice(5)) as MethodInfos
        console.debug(candidateMethods)
        candidateMethods.filter(method =>
          method.className == cg.currentClass)
        cg.code.push(OPCODE.ALOAD, 0);
      } else {
        const recvRes = compile({ kind: 'ExpressionName', name: receiverStr }, cg);
        maxStack = Math.max(maxStack, recvRes.stackSize);
        candidateMethods = cg.symbolTable.queryMethod(n.identifier).pop() as MethodInfos
      }
    }
    // --- Handle unqualified calls ---
    else {
      candidateMethods = cg.symbolTable.queryMethod(n.identifier) as MethodInfos
      unqualifiedCall = true;
    }

    // Filter candidate methods by matching the argument list.
    const argDescs = n.argumentList.map(arg => getExpressionType(arg, cg))
    const methodMatches: MethodInfos = []

    for (let i = 0; i < candidateMethods.length; i++) {
      const m = candidateMethods[i]
      const fullDesc = m.typeDescriptor // e.g., "(Ljava/lang/String;C)V"
      const paramPart = fullDesc.slice(1, fullDesc.indexOf(')'))
      const params = paramPart.match(/(\[+[BCDFIJSZ])|(\[+L[^;]+;)|[BCDFIJSZ]|L[^;]+;/g) || []
      if (params.length !== argDescs.length) continue
      let match = true
      for (let i = 0; i < params.length; i++) {
        const argType = argDescs[i]
        // Allow B/S to match int.
        if ((argType === 'B' || argType === 'S') && params[i] === 'I') continue
        if (!isSubtype(argType, params[i], cg)) {
          match = false
          break
        }
      }
      if (match) methodMatches.push(m)
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
          candParams.map((p, idx) => isSubtype(p, currParams[idx], cg)).reduce((a, b) => a && b, true)
        ) {
          selectedMethod = methodMatches[i]
        } else if (
          !currParams.map((p, idx) => isSubtype(p, candParams[idx], cg)).reduce((a, b) => a && b, true)
        ) {
          throw new AmbiguousMethodCallError(n.identifier + argDescs.join(','))
        }
      }
    }

    if (unqualifiedCall && !(selectedMethod.accessFlags & FIELD_FLAGS.ACC_STATIC)) {
      cg.code.push(OPCODE.ALOAD, 0)
    }

    // Compile each argument.
    const fullDescriptor = selectedMethod.typeDescriptor
    const paramPart = fullDescriptor.slice(1, fullDescriptor.indexOf(')'))
    const params = paramPart.match(/(\[+[BCDFIJSZ])|(\[+L[^;]+;)|[BCDFIJSZ]|L[^;]+;/g) || []
    n.argumentList.forEach((arg, i) => {
      const argRes = compile(arg, cg)
      let argType = argRes.resultType
      if (argType === 'B' || argType === 'S') argType = 'I'
      const conv = handleImplicitTypeConversion(argType, params[i] || '', cg)
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
      const newAssignmentNode: Assignment = {
        kind: 'Assignment',
        left: left,
        operator: '=',
        right: subExpr
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
      const stackSizeChange = handleImplicitTypeConversion(rhsType, arrayElemType, cg)
      maxStack = Math.max(maxStack, size1 + size2 + rhsSize + stackSizeChange)
      cg.code.push(arrayElemType in arrayStoreOp ? arrayStoreOp[arrayElemType] : OPCODE.AASTORE)
    } else if (
      lhs.kind === 'ExpressionName' &&
      !Array.isArray(cg.symbolTable.queryVariable(lhs.name))
    ) {
      const info = cg.symbolTable.queryVariable(lhs.name) as VariableInfo
      const { stackSize: rhsSize, resultType: rhsType } = compile(right, cg)
      const stackSizeChange = handleImplicitTypeConversion(rhsType, info.typeDescriptor, cg)
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
      const stackSizeChange = handleImplicitTypeConversion(rhsType, fieldInfo.typeDescriptor, cg)

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
    if (op in reverseLogicalOp) {
      let l: CompileResult = { stackSize: 0, resultType: EMPTY_TYPE }
      let r: CompileResult = { stackSize: 0, resultType: EMPTY_TYPE }
      const targetLabel = cg.generateNewLabel()
      if (isNullLiteral(left) && isNullLiteral(right)) {
        cg.code.push(op === '==' ? OPCODE.ICONST_1 : OPCODE.ICONST_0)
        return { stackSize: 1, resultType: cg.symbolTable.generateFieldDescriptor('boolean') }
      } else if (isNullLiteral(left)) {
        // still use l to represent the first argument pushed onto stack
        l = compile(right, cg)
        cg.addBranchInstr(op === '!=' ? OPCODE.IFNULL : OPCODE.IFNONNULL, targetLabel)
      } else if (isNullLiteral(right)) {
        l = compile(left, cg)
        cg.addBranchInstr(op === '!=' ? OPCODE.IFNULL : OPCODE.IFNONNULL, targetLabel)
      } else {
        l = compile(left, cg)
        r = compile(right, cg)
        cg.addBranchInstr(reverseLogicalOp[op], targetLabel)
      }
      cg.code.push(OPCODE.ICONST_1)
      targetLabel.offset = cg.code.length
      cg.code.push(OPCODE.ICONST_0)
      return {
        stackSize: Math.max(
          l.stackSize,
          1 + (['D', 'J'].includes(l.resultType) ? 1 : 0) + r.stackSize
        ),
        resultType: cg.symbolTable.generateFieldDescriptor('boolean')
      }
    }

    const { stackSize: size1, resultType: leftType } = compile(left, cg)
    const insertConversionIndex = cg.code.length
    cg.code.push(OPCODE.NOP)
    const { stackSize: size2, resultType: rightType } = compile(right, cg)

    if (op === '+' && (leftType === 'Ljava/lang/String;' || rightType === 'Ljava/lang/String;')) {
      if (leftType !== 'Ljava/lang/String;') {
        generateStringConversion(leftType, cg)
      }

      if (rightType !== 'Ljava/lang/String;') {
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
        stackSize: Math.max(size1 + 1, size2 + 1), // Max stack size plus one for the concatenation
        resultType: 'Ljava/lang/String;'
      }
    }

    let finalType = leftType

    if (leftType !== rightType) {
      const conversionKeyLeft = `${leftType}->${rightType}`
      const conversionKeyRight = `${rightType}->${leftType}`

      if (['D', 'F'].includes(leftType) || ['D', 'F'].includes(rightType)) {
        // Promote both to double if one is double, or to float otherwise
        if (leftType !== 'D' && rightType === 'D') {
          cg.code.fill(
            typeConversionsImplicit[conversionKeyLeft],
            insertConversionIndex,
            insertConversionIndex + 1
          )
          finalType = 'D'
        } else if (leftType === 'D' && rightType !== 'D') {
          cg.code.push(typeConversionsImplicit[conversionKeyRight])
          finalType = 'D'
        } else if (leftType !== 'F' && rightType === 'F') {
          // handleImplicitTypeConversion(leftType, 'F', cg);
          cg.code.fill(
            typeConversionsImplicit[conversionKeyLeft],
            insertConversionIndex,
            insertConversionIndex + 1
          )
          finalType = 'F'
        } else if (leftType === 'F' && rightType !== 'F') {
          cg.code.push(typeConversionsImplicit[conversionKeyRight])
          finalType = 'F'
        }
      } else if (['J'].includes(leftType) || ['J'].includes(rightType)) {
        // Promote both to long if one is long
        if (leftType !== 'J' && rightType === 'J') {
          cg.code.fill(
            typeConversionsImplicit[conversionKeyLeft],
            insertConversionIndex,
            insertConversionIndex + 1
          )
        } else if (leftType === 'J' && rightType !== 'J') {
          cg.code.push(typeConversionsImplicit[conversionKeyRight])
        }
        finalType = 'J'
      } else {
        // Promote both to int as the common type for smaller types like byte, short, char
        if (leftType !== 'I') {
          cg.code.fill(
            typeConversionsImplicit[conversionKeyLeft],
            insertConversionIndex,
            insertConversionIndex + 1
          )
        }
        if (rightType !== 'I') {
          cg.code.push(typeConversionsImplicit[conversionKeyRight])
        }
        finalType = 'I'
      }
    }

    // Perform the operation
    switch (finalType) {
      case 'B':
        cg.code.push(intBinaryOp[op], OPCODE.I2B)
        break
      case 'D':
        cg.code.push(doubleBinaryOp[op])
        break
      case 'F':
        cg.code.push(floatBinaryOp[op])
        break
      case 'I':
        cg.code.push(intBinaryOp[op])
        break
      case 'J':
        cg.code.push(longBinaryOp[op])
        break
      case 'S':
        cg.code.push(intBinaryOp[op], OPCODE.I2S)
        break
    }

    return {
      stackSize: Math.max(size1, 1 + (['D', 'J'].includes(finalType) ? 1 : 0) + size2),
      resultType: finalType
    }
  },

  IncrementDecrementExpression: (node: Node, cg: CodeGenerator) => {
    // handle cases of ++x, x++, x--, --x that do not add object to operand stack
    if (node.kind === 'PrefixExpression' || node.kind === 'PostfixExpression') {
      const assignment: Assignment = {
        kind: 'Assignment',
        left: node.expression as LeftHandSide,
        operator: '=',
        right: {
          kind: 'BinaryExpression',
          left: node.expression,
          operator: node.operator === '++' ? '+' : '-',
          right: createIntLiteralNode(1)
        }
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
      cg.code.push(OPCODE.ICONST_M1, OPCODE.IXOR)
      compileResult.stackSize = Math.max(compileResult.stackSize, 2)
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
      return { stackSize: 1, resultType: 'Ljava/lang/Class;' };
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

  CastExpression: (node: Node, cg: CodeGenerator) => {
    const { expression, type } = node as CastExpression // CastExpression node structure
    const { stackSize, resultType } = compile(expression, cg)

    if ((type == 'byte' || type == 'short') && resultType != 'I') {
      handleExplicitTypeConversion(resultType, 'I', cg)
      handleExplicitTypeConversion('I', cg.symbolTable.generateFieldDescriptor(type), cg)
    } else if (resultType == 'C') {
      if (type == 'int') {
        return {
          stackSize,
          resultType: cg.symbolTable.generateFieldDescriptor('int')
        }
      } else {
        throw new Error(`Unsupported class type conversion: 
          ${'C'} -> ${cg.symbolTable.generateFieldDescriptor(type)}`)
      }
    } else if (type == 'char') {
      if (resultType == 'I') {
        handleExplicitTypeConversion('I', 'C', cg)
      } else {
        throw new Error(`Unsupported class type conversion: 
          ${resultType} -> ${cg.symbolTable.generateFieldDescriptor(type)}`)
      }
    } else {
      handleExplicitTypeConversion(resultType, cg.symbolTable.generateFieldDescriptor(type), cg)
    }

    return {
      stackSize,
      resultType: cg.symbolTable.generateFieldDescriptor(type)
    }
  },

  SwitchStatement: (node: Node, cg: CodeGenerator) => {
    const { expression, cases } = node as SwitchStatement

    // Compile the switch expression
    const { stackSize: exprStackSize, resultType } = compile(expression, cg)
    let maxStack = exprStackSize

    const caseLabels: Label[] = cases.map(() => cg.generateNewLabel())
    const defaultLabel = cg.generateNewLabel()
    const endLabel = cg.generateNewLabel()

    // Track the switch statement's end label
    cg.switchLabels.push(endLabel)

    if (['I', 'B', 'S', 'C'].includes(resultType)) {
      const caseValues: number[] = []
      const caseLabelMap: Map<number, Label> = new Map()
      let hasDefault = false
      const positionOffset = cg.code.length

      cases.forEach((caseGroup, index) => {
        caseGroup.labels.forEach(label => {
          if (label.kind === 'CaseLabel') {
            const value = parseInt((label.expression as Literal).literalType.value)
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

        // Add default branch (jump to default label)
        cg.code.push(0, 0, 0, defaultLabel.offset)
        caseLabelIndex.push(indexTracker + 3)
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

        // Generate branch table (map each value to a case label)
        for (let i = minValue; i <= maxValue; i++) {
          const caseIndex = caseValues.indexOf(i)
          cg.code.push(
            0,
            0,
            0,
            caseIndex !== -1 ? caseLabels[caseIndex].offset : defaultLabel.offset
          )
          caseLabelIndex.push(indexTracker + 3)
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

        // Add default branch (jump to default label)
        cg.code.push(0, 0, 0, defaultLabel.offset)
        caseLabelIndex.push(indexTracker + 3)
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
          cg.code.push(value >> 24, (value >> 16) & 0xff, (value >> 8) & 0xff, value & 0xff)
          cg.code.push(0, 0, 0, caseLabels[index].offset)
          caseLabelIndex.push(indexTracker + 7)
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

      cg.code[caseLabelIndex[0]] = caseLabels[caseLabels.length - 1].offset - positionOffset

      for (let i = 1; i < caseLabelIndex.length; i++) {
        cg.code[caseLabelIndex[i]] = caseLabels[i - 1].offset - positionOffset
      }

      endLabel.offset = cg.code.length
    } else if (resultType === 'Ljava/lang/String;') {
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

      // Default jump target
      cg.code.push(0, 0, 0, defaultLabel.offset)
      caseLabelIndex.push(indexTracker + 3)
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
      hashCaseMap.forEach((label, hashCode) => {
        cg.code.push(
          hashCode >> 24,
          (hashCode >> 16) & 0xff,
          (hashCode >> 8) & 0xff,
          hashCode & 0xff
        )
        cg.code.push(0, 0, 0, label.offset)
        caseLabelIndex.push(indexTracker + 7)
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

      cg.code[caseLabelIndex[0]] = caseLabels[caseLabels.length - 1].offset - positionOffset

      for (let i = 1; i < caseLabelIndex.length; i++) {
        cg.code[caseLabelIndex[i]] = caseLabels[i - 1].offset - positionOffset
      }

      endLabel.offset = cg.code.length
    } else {
      throw new Error(
        `Switch statements only support byte, short, int, char, or String types. Found: ${resultType}`
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
  labels: Label[] = []
  loopLabels: Label[][] = []
  switchLabels: Label[] = []
  code: number[] = []
  currentClass: string

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
    if (!methodNode.methodModifier.includes('static')) {
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

    const exceptionTable: Array<ExceptionHandler> = []
    const attributes: Array<AttributeInfo> = []
    const codeBuf = new Uint8Array(this.code).buffer
    const dataView = new DataView(codeBuf)
    this.code.forEach((x, i) => dataView.setUint8(i, x))

    const attributeLength =
      12 +
      this.code.length +
      8 * exceptionTable.length +
      attributes.map(attr => attr.attributeLength + 6).reduce((acc, val) => acc + val, 0)
    this.symbolTable.teardown()

    return {
      attributeNameIndex: this.constantPoolManager.indexUtf8Info('Code'),
      attributeLength: attributeLength,
      maxStack: this.stackSize,
      maxLocals: this.maxLocals,
      codeLength: this.code.length,
      code: dataView,
      exceptionTableLength: exceptionTable.length,
      exceptionTable: exceptionTable,
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
