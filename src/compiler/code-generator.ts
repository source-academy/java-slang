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
  TernaryExpression
} from '../ast/types/blocks-and-statements'
import { MethodDeclaration, UnannType } from '../ast/types/classes'
import { ConstantPoolManager } from './constant-pool-manager'
import { ConstructNotSupportedError } from './error'
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

type CompileResult = {
  stackSize: number
  resultType: string
}
const EMPTY_TYPE: string = ''

function compile(node: Node, cg: CodeGenerator): CompileResult {
  if (!(node.kind in codeGenerators)) {
    throw new ConstructNotSupportedError(node.kind)
  }
  return codeGenerators[node.kind](node, cg)
}

const codeGenerators: { [type: string]: (node: Node, cg: CodeGenerator) => CompileResult } = {
  Block: (node: Node, cg: CodeGenerator) => {
    cg.symbolTable.extend()
    let maxStack = 0
    let resultType = ''
      ; (node as Block).blockStatements.forEach(x => {
        const { stackSize: stackSize, resultType: type } = compile(x, cg)
        maxStack = Math.max(maxStack, stackSize)
        resultType = type
      })
    cg.symbolTable.teardown()

    return { stackSize: maxStack, resultType }
  },

  LocalVariableDeclarationStatement: (node: Node, cg: CodeGenerator) => {
    const createIntLiteralNode = (int: number): Node => {
      return {
        kind: 'Literal',
        literalType: { kind: 'DecimalIntegerLiteral', value: int.toString() }
      }
    }
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
            cg.constantPoolManager.indexClassInfo(variableInfo.typeName.slice(0, -2))
          )
        }

        vi.forEach((val, i) => {
          cg.code.push(OPCODE.DUP)
          const size1 = compile(createIntLiteralNode(i), cg).stackSize
          const size2 = compile(val as Expression, cg).stackSize
          cg.code.push(arrayElemType in arrayStoreOp ? arrayStoreOp[arrayElemType] : OPCODE.AASTORE)
          maxStack = Math.max(maxStack, 2 + size1 + size2)
        })
        cg.code.push(OPCODE.ASTORE, curIdx)
      } else {
        maxStack = Math.max(maxStack, compile(vi, cg).stackSize)
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
    cg.addBranchInstr(OPCODE.GOTO, cg.loopLabels[cg.loopLabels.length - 1][1])
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
    const isNullLiteral = (node: Node) => {
      return node.kind === 'Literal' && node.literalType.kind === 'NullLiteral'
    }
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
          if (isNullLiteral(left)) {
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
      cg.addBranchInstr(onTrue ? OPCODE.IFNE : OPCODE.IFEQ, cg.labels[cg.labels.length - 1])
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

    const symbolInfos = cg.symbolTable.queryMethod('<init>')
    const methodInfos = symbolInfos[symbolInfos.length - 1] as MethodInfos
    for (let i = 0; i < methodInfos.length; i++) {
      const methodInfo = methodInfos[i]
      if (methodInfo.typeDescriptor.includes(argDescriptor)) {
        const method = cg.constantPoolManager.indexMethodrefInfo(
          methodInfo.parentClassName,
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
    const n = node as ExpressionStatement
    return compile(n.stmtExp, cg)
  },

  MethodInvocation: (node: Node, cg: CodeGenerator) => {
    const n = node as MethodInvocation
    let maxStack = 1
    let resultType = EMPTY_TYPE

    const symbolInfos = cg.symbolTable.queryMethod(n.identifier)
    for (let i = 0; i < symbolInfos.length - 1; i++) {
      if (i === 0) {
        const varInfo = symbolInfos[i] as VariableInfo
        if (varInfo.index !== undefined) {
          cg.code.push(OPCODE.ALOAD, varInfo.index)
          continue
        }
      }
      const fieldInfo = symbolInfos[i] as FieldInfo
      const field = cg.constantPoolManager.indexFieldrefInfo(
        fieldInfo.parentClassName,
        fieldInfo.name,
        fieldInfo.typeDescriptor
      )
      cg.code.push(
        fieldInfo.accessFlags & FIELD_FLAGS.ACC_STATIC ? OPCODE.GETSTATIC : OPCODE.GETFIELD,
        0,
        field
      )
    }

    const argTypes: Array<UnannType> = []
    n.argumentList.forEach((x, i) => {
      const argCompileResult = compile(x, cg)
      maxStack = Math.max(maxStack, i + 1 + argCompileResult.stackSize)
      argTypes.push(argCompileResult.resultType)
    })
    const argDescriptor = '(' + argTypes.join('') + ')'

    const methodInfos = symbolInfos[symbolInfos.length - 1] as MethodInfos
    for (let i = 0; i < methodInfos.length; i++) {
      const methodInfo = methodInfos[i]
      if (methodInfo.typeDescriptor.includes(argDescriptor)) {
        const method = cg.constantPoolManager.indexMethodrefInfo(
          methodInfo.parentClassName,
          methodInfo.name,
          methodInfo.typeDescriptor
        )
        cg.code.push(
          methodInfo.accessFlags & METHOD_FLAGS.ACC_STATIC
            ? OPCODE.INVOKESTATIC
            : OPCODE.INVOKEVIRTUAL,
          0,
          method
        )
        resultType = methodInfo.typeDescriptor.slice(argDescriptor.length)
        break
      }
    }

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
      maxStack = size1 + size2 + compile(right, cg).stackSize
      const arrayElemType = arrayType.slice(1)
      cg.code.push(arrayElemType in arrayStoreOp ? arrayStoreOp[arrayElemType] : OPCODE.AASTORE)
    } else if (
      lhs.kind === 'ExpressionName' &&
      !Array.isArray(cg.symbolTable.queryVariable(lhs.name))
    ) {
      const info = cg.symbolTable.queryVariable(lhs.name) as VariableInfo
      maxStack = 1 + compile(right, cg).stackSize
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
      } else {
        cg.code.push(OPCODE.ALOAD, 0)
      }
      maxStack = 1 + compile(right, cg).stackSize
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
    const { stackSize: size1, resultType: type } = compile(left, cg)
    const { stackSize: size2 } = compile(right, cg)

    switch (type) {
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
      stackSize: Math.max(size1, 1 + (['D', 'J'].includes(type) ? 1 : 0) + size2),
      resultType: type
    }
  },

  PrefixExpression: (node: Node, cg: CodeGenerator) => {
    const { operator: op, expression: expr } = node as PrefixExpression
    if (op === '++' || op === '--') {
      const { name: name } = expr as ExpressionName
      const info = cg.symbolTable.queryVariable(name)
      if (Array.isArray(info)) {
        return { stackSize: 1, resultType: EMPTY_TYPE } // TODO
      } else {
        cg.code.push(OPCODE.IINC, info.index, op === '++' ? 1 : -1)
        cg.code.push(OPCODE.ILOAD, info.index)
        return { stackSize: 1, resultType: info.typeDescriptor }
      }
    }

    const compileResult = compile(expr, cg)
    if (op === '-') {
      cg.code.push(OPCODE.INEG)
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
    const { operator: op, expression: expr } = node as PostfixExpression
    const { name: name } = expr as ExpressionName
    const info = cg.symbolTable.queryVariable(name)
    if (Array.isArray(info)) {
      return { stackSize: 1, resultType: EMPTY_TYPE } //TODO
    } else {
      cg.code.push(OPCODE.ILOAD, info.index)
      cg.code.push(OPCODE.IINC, info.index, op === '++' ? 1 : -1)
      return { stackSize: 1, resultType: info.typeDescriptor }
    }
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

    const info = cg.symbolTable.queryVariable(name)
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
      const fetchedFieldTypeDescriptor = (fieldInfos[fieldInfos.length - 1] as FieldInfo).typeDescriptor
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
  }
}

class CodeGenerator {
  symbolTable: SymbolTable
  constantPoolManager: ConstantPoolManager
  maxLocals: number = 0
  stackSize: number = 0
  labels: Label[] = []
  loopLabels: Label[][] = []
  code: number[] = []

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

  generateCode(methodNode: MethodDeclaration) {
    this.symbolTable.extend()
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
      this.code.push(
        OPCODE.ALOAD_0,
        OPCODE.INVOKESPECIAL,
        0,
        this.constantPoolManager.indexMethodrefInfo('java/lang/Object', '<init>', '()V')
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
  methodNode: MethodDeclaration
) {
  const codeGenerator = new CodeGenerator(symbolTable, constantPoolManager)
  return codeGenerator.generateCode(methodNode)
}
