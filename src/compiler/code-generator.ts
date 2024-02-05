import { OPCODE } from "../ClassFile/constants/instructions";
import { ExceptionHandler, AttributeInfo } from "../ClassFile/types/attributes";
import { FIELD_FLAGS } from "../ClassFile/types/fields";
import { METHOD_FLAGS } from "../ClassFile/types/methods";
import { Node } from "../ast/types/ast";
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
} from "../ast/types/blocks-and-statements";
import { MethodDeclaration, UnannType } from "../ast/types/classes";
import { ConstantPoolManager } from "./constant-pool-manager";
import { ConstructNotSupportedError } from "./error";
import { FieldInfo, MethodInfos, SymbolTable } from "./symbol-table"

type Label = {
  offset: number;
  pointedBy: number[];
};

const opToOpcode: { [type: string]: OPCODE } = {
  "+": OPCODE.IADD,
  "-": OPCODE.ISUB,
  "*": OPCODE.IMUL,
  "/": OPCODE.IDIV,
  "%": OPCODE.IREM,
  "|": OPCODE.IOR,
  "&": OPCODE.IAND,
  "^": OPCODE.IXOR,
  "<<": OPCODE.ISHL,
  ">>": OPCODE.ISHR,
  ">>>": OPCODE.IUSHR,

  "==": OPCODE.IF_ICMPEQ,
  "!=": OPCODE.IF_ICMPNE,
  "<": OPCODE.IF_ICMPLT,
  "<=": OPCODE.IF_ICMPLE,
  ">": OPCODE.IF_ICMPGT,
  ">=": OPCODE.IF_ICMPGE,
};

const reverseLogicalOp: { [type: string]: OPCODE } = {
  "==": OPCODE.IF_ICMPNE,
  "!=": OPCODE.IF_ICMPEQ,
  "<": OPCODE.IF_ICMPGE,
  "<=": OPCODE.IF_ICMPGT,
  ">": OPCODE.IF_ICMPLE,
  ">=": OPCODE.IF_ICMPLT,
};

type CompileResult = {
  stackSize: number,
  resultType: string
};
const EMPTY_TYPE: string = "";

function compile(node: Node, cg: CodeGenerator): CompileResult {
  if (!(node.kind in codeGenerators)) {
    throw new ConstructNotSupportedError(node.kind);
  }
  return codeGenerators[node.kind](node, cg);
}

const codeGenerators: { [type: string]: (node: Node, cg: CodeGenerator) => CompileResult } = {
  Block: (node: Node, cg: CodeGenerator) => {
    let maxStack = 0;
    let resultType = "";
    (node as Block).blockStatements.forEach(x => {
      const { stackSize: stackSize, resultType: type } = compile(x, cg);
      maxStack = Math.max(maxStack, stackSize);
      resultType = type;
    })
    return { stackSize: maxStack, resultType };
  },

  LocalVariableDeclarationStatement: (node: Node, cg: CodeGenerator) => {
    const createIntLiteralNode = (int: number): Node => {
      return {
        kind: "Literal",
        literalType: { kind: "DecimalIntegerLiteral", value: int.toString() },
      }
    }
    let maxStack = 0;
    const { variableDeclaratorList: lst, localVariableType: type } = node as LocalVariableDeclarationStatement;
    lst.forEach(v => {
      const { identifier: identifier, variableInitializer: vi } = v;
      const curIdx = cg.maxLocals++;
      cg.symbolTable.insertVariableInfo({
        name: identifier,
        typeDescriptor: cg.symbolTable.generateFieldDescriptor(type + v.dims),
        index: curIdx
      });
      if (!vi) {
        return;
      }
      if (Array.isArray(vi)) {
        maxStack = compile(createIntLiteralNode(vi.length), cg).stackSize;
        cg.code.push(OPCODE.NEWARRAY, 10);
        vi.forEach((val, i) => {
          cg.code.push(OPCODE.DUP);
          const size1 = compile(createIntLiteralNode(i), cg).stackSize;
          const size2 = compile(val as Expression, cg).stackSize;
          cg.code.push(OPCODE.IASTORE);
          maxStack = Math.max(maxStack, 1 + size1 + size2);
        });
        cg.code.push(OPCODE.ASTORE, curIdx);
      } else {
        maxStack = Math.max(maxStack, compile(vi, cg).stackSize);
        cg.code.push(OPCODE.ISTORE, curIdx);
      }
    });
    return { stackSize: maxStack, resultType: EMPTY_TYPE };
  },

  ReturnStatement: (node: Node, cg: CodeGenerator) => {
    const { expression: expr } = node as ReturnStatement;
    if (expr) {
      const { stackSize: stackSize, resultType: resultType } = compile(expr, cg);
      cg.code.push(OPCODE.IRETURN);
      return { stackSize, resultType };
    }

    cg.code.push(OPCODE.RETURN);
    return { stackSize: 0, resultType: cg.symbolTable.generateFieldDescriptor("void") };
  },

  BasicForStatement: (node: Node, cg: CodeGenerator) => {
    let maxStack = 0;
    const { forInit, condition, forUpdate, body: originalBody } = node as BasicForStatement;

    if (forInit instanceof Array) {
      forInit.forEach(e => maxStack = Math.max(maxStack, compile(e, cg).stackSize));
    } else {
      maxStack = Math.max(maxStack, compile(forInit, cg).stackSize);
    }

    const whileNode: WhileStatement = {
      kind: "WhileStatement",
      condition: condition,
      body: {
        kind: "Block",
        blockStatements: [originalBody, ...forUpdate],
      }
    };
    const compileResult = compile(whileNode, cg);
    compileResult.stackSize = Math.max(compileResult.stackSize, maxStack);

    return compileResult;
  },

  DoStatement: (node: Node, cg: CodeGenerator) => {
    const { body } = node as WhileStatement;
    compile(body, cg);

    node.kind = "WhileStatement";
    return compile(node, cg);
  },

  WhileStatement: (node: Node, cg: CodeGenerator) => {
    let maxStack = 0;
    const { condition, body } = node as WhileStatement;

    const startLabel = cg.generateNewLabel();
    startLabel.offset = cg.code.length;
    const endLabel = cg.generateNewLabel();

    maxStack = Math.max(maxStack, codeGenerators["LogicalExpression"](condition, cg).stackSize);
    maxStack = Math.max(maxStack, compile(body, cg).stackSize);

    cg.addBranchInstr(OPCODE.GOTO, startLabel);
    endLabel.offset = cg.code.length;
    return { stackSize: maxStack, resultType: EMPTY_TYPE };
  },

  IfStatement: (node: Node, cg: CodeGenerator) => {
    let maxStack = 0;
    const { condition: condition, consequent: consequent, alternate: alternate } = node as IfStatement;

    const elseLabel = cg.generateNewLabel();
    maxStack = Math.max(maxStack, codeGenerators["LogicalExpression"](condition, cg).stackSize);
    let { stackSize: conSize, resultType: resType } = compile(consequent, cg);
    maxStack = Math.max(maxStack, conSize);

    const endLabel = cg.generateNewLabel();
    if (alternate) {
      cg.addBranchInstr(OPCODE.GOTO, endLabel);
    }

    elseLabel.offset = cg.code.length;
    if (alternate) {
      const { stackSize: altSize, resultType: altType } = compile(alternate, cg);
      maxStack = Math.max(maxStack, altSize);
      if (altType === EMPTY_TYPE) {
        resType = EMPTY_TYPE;
      }
      endLabel.offset = cg.code.length;
    }

    return { stackSize: maxStack, resultType: resType };
  },

  LogicalExpression: (node: Node, cg: CodeGenerator) => {
    const f = (node: Node, targetLabel: Label, onTrue: boolean): CompileResult => {
      if (node.kind === "Literal") {
        const { literalType: { kind: kind, value: value } } = node as Literal;
        const boolValue = value === "true";
        if (kind === "BooleanLiteral" && onTrue === boolValue) {
          cg.addBranchInstr(OPCODE.GOTO, targetLabel);
          return { stackSize: 0, resultType: cg.symbolTable.generateFieldDescriptor("boolean") };
        }
      }

      if (node.kind === "PrefixExpression") {
        const { expression: expr } = node as PrefixExpression;
        return f(expr, targetLabel, !onTrue);
      }

      if (node.kind === "BinaryExpression") {
        const { left: left, right: right, operator: op } = node as BinaryExpression;
        let l: CompileResult;
        let r: CompileResult;
        if (op === "&&") {
          if (onTrue) {
            const falseLabel = cg.generateNewLabel();
            l = f(left, falseLabel, false);
            r = f(right, targetLabel, true);
            falseLabel.offset = cg.code.length;
          } else {
            l = f(left, targetLabel, false);
            r = f(right, targetLabel, false);
          }
          return { stackSize: Math.max(l.stackSize, 1 + r.stackSize), resultType: l.resultType };
        } else if (op === "||") {
          if (onTrue) {
            l = f(left, targetLabel, true);
            r = f(right, targetLabel, true);
          } else {
            const falseLabel = cg.generateNewLabel();
            l = f(left, falseLabel, true);
            r = f(right, targetLabel, false);
            falseLabel.offset = cg.code.length;
          }
          return { stackSize: Math.max(l.stackSize, 1 + r.stackSize), resultType: l.resultType };
        } else if (op in reverseLogicalOp) {
          l = f(left, targetLabel, onTrue);
          r = f(right, targetLabel, onTrue);
          cg.addBranchInstr(onTrue ? opToOpcode[op] : reverseLogicalOp[op], targetLabel);
          return { stackSize: Math.max(l.stackSize, 1 + r.stackSize), resultType: l.resultType };
        }
      }

      return compile(node, cg);
    }
    return f(node, cg.labels[cg.labels.length - 1], false);
  },

  ArrayAccess: (node: Node, cg: CodeGenerator) => {
    const n = node as ArrayAccess;
    const { stackSize: size1, resultType: type } = compile(n.primary, cg);
    const size2 = compile(n.expression, cg).stackSize;
    cg.code.push(OPCODE.IALOAD);

    return { stackSize: size1 + size2, resultType: type.slice(1) };
  },

  MethodInvocation: (node: Node, cg: CodeGenerator) => {
    const n = node as MethodInvocation;
    let maxStack = 1;
    let resultType = EMPTY_TYPE;

    const symbolInfos = cg.symbolTable.queryMethod(n.identifier);
    for (let i = 0; i < symbolInfos.length - 1; i++) {
      const fieldInfo = (symbolInfos[i] as FieldInfo);
      const field = cg.constantPoolManager.indexFieldrefInfo(fieldInfo.parentClassName, fieldInfo.name, fieldInfo.typeDescriptor);
      cg.code.push((fieldInfo.accessFlags & FIELD_FLAGS.ACC_STATIC) ? OPCODE.GETSTATIC : OPCODE.GETFIELD, 0, field);
    }

    const argTypes: Array<UnannType> = [];
    n.argumentList.forEach((x, i) => {
      const argCompileResult = compile(x, cg);
      maxStack = Math.max(maxStack, i + 1 + argCompileResult.stackSize);
      argTypes.push(argCompileResult.resultType);
    })
    const argDescriptor = '(' + argTypes.join(',') + ')';

    const methodInfos = symbolInfos[symbolInfos.length - 1] as MethodInfos;
    for (let i = 0; i < methodInfos.length; i++) {
      const methodInfo = methodInfos[i];
      if (methodInfo.typeDescriptor.includes(argDescriptor)) {
        const method = cg.constantPoolManager.indexMethodrefInfo(methodInfo.parentClassName, methodInfo.name, methodInfo.typeDescriptor);
        cg.code.push((methodInfo.accessFlags & METHOD_FLAGS.ACC_STATIC) ? OPCODE.INVOKESTATIC : OPCODE.INVOKEVIRTUAL, 0, method);
        resultType = methodInfo.typeDescriptor.slice(argDescriptor.length);
        break;
      }
    }

    return { stackSize: maxStack, resultType: resultType };
  },

  Assignment: (node: Node, cg: CodeGenerator) => {
    let maxStack = 0;
    const { left: left, operator: op, right: right } = node as Assignment;

    if (left.kind === "ArrayAccess") {
      const size1 = compile(left.primary, cg).stackSize;
      const size2 = compile(left.expression, cg).stackSize;
      maxStack = size1 + size2;
    }

    if (op !== "=") {
      maxStack += compile({
        kind: "BinaryExpression",
        left: left,
        right: right,
        operator: op.slice(0, op.length - 1) as BinaryOperator
      }, cg).stackSize;
    } else {
      maxStack += compile(right, cg).stackSize;
    }

    if (left.kind === "ExpressionName") {
      const { index: idx } = cg.symbolTable.queryVariable(left.name);
      cg.code.push(OPCODE.ISTORE, idx as number);
    } else {
      cg.code.push(OPCODE.IASTORE);
    }
    return { stackSize: maxStack, resultType: EMPTY_TYPE };
  },

  BinaryExpression: (node: Node, cg: CodeGenerator) => {
    const { left: left, right: right, operator: op } = node as BinaryExpression;
    const l = compile(left, cg);
    const r = compile(right, cg);
    cg.code.push(opToOpcode[op]);
    return { stackSize: Math.max(l.stackSize, 1 + r.stackSize), resultType: l.resultType };
  },

  PrefixExpression: (node: Node, cg: CodeGenerator) => {
    const { operator: op, expression: expr } = node as PostfixExpression;
    if (op === "++" || op === "--") {
      const { name: name } = expr as ExpressionName;
      const { index: idx, typeDescriptor: type } = cg.symbolTable.queryVariable(name);
      cg.code.push(OPCODE.IINC, idx as number, op === "++" ? 1 : -1);
      cg.code.push(OPCODE.ILOAD, idx as number);
      return { stackSize: 1, resultType: type };
    }

    let compileResult = compile(expr, cg);
    if (op === "-") {
      cg.code.push(OPCODE.INEG);
    } else if (op === "~") {
      cg.code.push(OPCODE.ICONST_M1, OPCODE.IXOR);
      compileResult.stackSize = Math.max(compileResult.stackSize, 2);
    } else if (op === "!") {
      const elseLabel = cg.generateNewLabel();
      const endLabel = cg.generateNewLabel();
      cg.addBranchInstr(OPCODE.IFEQ, elseLabel);
      cg.code.push(OPCODE.ICONST_0);
      cg.addBranchInstr(OPCODE.GOTO, endLabel);
      elseLabel.offset = cg.code.length;
      cg.code.push(OPCODE.ICONST_1);
      endLabel.offset = cg.code.length;
    }
    return compileResult;
  },

  PostfixExpression: (node: Node, cg: CodeGenerator) => {
    const { operator: op, expression: expr } = node as PostfixExpression;
    const { name: name } = expr as ExpressionName;
    const { index: idx, typeDescriptor: type } = cg.symbolTable.queryVariable(name);
    cg.code.push(OPCODE.ILOAD, idx as number);
    cg.code.push(OPCODE.IINC, idx as number, op === "++" ? 1 : -1);
    return { stackSize: 1, resultType: type };
  },

  ExpressionName: (node: Node, cg: CodeGenerator) => {
    const { name: name } = node as ExpressionName;
    const { index: idx, typeDescriptor: type } = cg.symbolTable.queryVariable(name);
    cg.code.push(type.includes('[') ? OPCODE.ALOAD : OPCODE.ILOAD, idx as number);
    return { stackSize: 1, resultType: type };
  },

  Literal: (node: Node, cg: CodeGenerator) => {
    const { kind, value } = (node as Literal).literalType;
    switch (kind) {
      case "StringLiteral": {
        const strIdx = cg.constantPoolManager.indexStringInfo(value);
        cg.code.push(OPCODE.LDC, strIdx);
        return { stackSize: 1, resultType: cg.symbolTable.generateFieldDescriptor("String") };
      }
      case "DecimalIntegerLiteral": {
        if (value.endsWith('l') || value.endsWith('L')) {
          const n = BigInt(value.slice(0, -1));
          const idx = cg.constantPoolManager.indexLongInfo(n);
          cg.code.push(OPCODE.LDC2_W, 0, idx);
          return { stackSize: 2, resultType: cg.symbolTable.generateFieldDescriptor("long") };
        }
        const n = parseInt(value);
        if (-128 <= n && n < 128) {
          cg.code.push(OPCODE.BIPUSH, n);
        } else if (-32768 <= n && n < 32768) {
          cg.code.push(OPCODE.SIPUSH, n >> 8, n & 0xff);
        } else {
          const idx = cg.constantPoolManager.indexIntegerInfo(n);
          cg.code.push(OPCODE.LDC, idx);
        }
        return { stackSize: 1, resultType: cg.symbolTable.generateFieldDescriptor("int") };
      }
      case "DecimalFloatingPointLiteral": {
        const d = parseFloat(value);
        if (value.endsWith('f') || value.endsWith('F')) {
          const idx = cg.constantPoolManager.indexFloatInfo(d);
          cg.code.push(OPCODE.LDC, idx);
          return { stackSize: 1, resultType: cg.symbolTable.generateFieldDescriptor("float") };
        }
        const idx = cg.constantPoolManager.indexDoubleInfo(d);
        cg.code.push(OPCODE.LDC2_W, 0, idx);
        return { stackSize: 2, resultType: cg.symbolTable.generateFieldDescriptor("double") };
      }
    }

    return { stackSize: 1, resultType: EMPTY_TYPE };
  },
}

class CodeGenerator {
  symbolTable: SymbolTable;
  constantPoolManager: ConstantPoolManager;
  maxLocals: number = 0;
  labels: Label[] = [];
  code: number[] = [];

  constructor(symbolTable: SymbolTable, constantPoolManager: ConstantPoolManager) {
    this.symbolTable = symbolTable;
    this.constantPoolManager = constantPoolManager;
  }

  generateNewLabel(): Label {
    const label = {
      offset: 0,
      pointedBy: [],
    };
    this.labels.push(label);
    return label;
  }

  addBranchInstr(opcode: OPCODE, label: Label) {
    label.pointedBy.push(this.code.length);
    this.code.push(opcode, 0, 0);
  }

  resolveLabels() {
    for (let label of this.labels) {
      label.pointedBy.forEach(idx => {
        const offset = label.offset - idx;
        this.code[idx + 1] = offset >> 8;
        this.code[idx + 2] = offset & 0xff;
      });
    }
  }

  generateCode(methodNode: MethodDeclaration) {
    this.symbolTable.extend();
    methodNode.methodHeader.formalParameterList.forEach(p => {
      this.symbolTable.insertVariableInfo({
        name: p.identifier,
        typeDescriptor: this.symbolTable.generateFieldDescriptor(p.unannType),
        index: this.maxLocals
      });
      this.maxLocals++;
    });

    const { methodBody } = methodNode;
    const { stackSize: stackSize } = compile(methodBody, this);
    if (methodNode.methodHeader.result === "void") {
      this.code.push(OPCODE.RETURN);
    }
    this.resolveLabels();

    const exceptionTable: Array<ExceptionHandler> = [];
    const attributes: Array<AttributeInfo> = [];
    const codeBuf = new Uint8Array(this.code).buffer;
    const dataView = new DataView(codeBuf);
    this.code.forEach((x, i) => dataView.setUint8(i, x));

    const attributeLength = 12 + this.code.length + 8 * exceptionTable.length +
      attributes.map(attr => attr.attributeLength + 6).reduce((acc, val) => acc + val, 0);
    this.symbolTable.teardown();

    return {
      attributeNameIndex: this.constantPoolManager.indexUtf8Info("Code"),
      attributeLength: attributeLength,
      maxStack: Math.max(this.maxLocals, stackSize),
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

export function generateCode(symbolTable: SymbolTable, constantPoolManager: ConstantPoolManager,
  methodNode: MethodDeclaration) {
  const codeGenerator = new CodeGenerator(symbolTable, constantPoolManager);
  return codeGenerator.generateCode(methodNode);
}
