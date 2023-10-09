import { OPCODE } from "../ClassFile/constants/instructions";
import { ExceptionHandler, AttributeInfo } from "../ClassFile/types/attributes";
import { BaseNode } from "../ast/types/ast";
import {
  MethodInvocation,
  Literal,
  Block,
  BinaryExpression,
  LocalVariableDeclarationStatement,
  ExpressionName,
  Assignment
} from "../ast/types/blocks-and-statements";
import { MethodDeclaration } from "../ast/types/classes";
import { ConstantPoolManager } from "./constant-pool-manager";
import { SymbolTable, SymbolType } from "./symbol-table"

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
};

const codeGenerators: { [type: string]: (node: BaseNode, cg: CodeGenerator) => number } = {
  Block: (node: BaseNode, cg: CodeGenerator) => {
    const n = node as Block;
    let maxStack = 0;
    n.blockStatements.forEach(x => {
      maxStack = Math.max(maxStack, codeGenerators[x.kind](x, cg));
    })
    return maxStack;
  },

  LocalVariableDeclarationStatement: (node: BaseNode, cg: CodeGenerator) => {
    let maxStack = 0;
    const { variableDeclaratorList: lst } = node as LocalVariableDeclarationStatement;
    lst.forEach(v => {
      const { variableDeclaratorId: identifier, variableInitializer: vi } = v;
      const curIdx = cg.maxLocals++;
      cg.symbolTable.insert(identifier, SymbolType.VARIABLE, { index: curIdx });
      if (vi) {
        maxStack = Math.max(maxStack, codeGenerators[vi.kind](vi, cg));
        cg.code.push(OPCODE.ISTORE, curIdx);
      }
    });
    return maxStack;
  },

  MethodInvocation: (node: BaseNode, cg: CodeGenerator) => {
    const n = node as MethodInvocation;
    let maxStack = 1;

    const { parentClassName: p1, typeDescriptor: t1 } = cg.symbolTable.query("out", SymbolType.CLASS);
    const { parentClassName: p2, typeDescriptor: t2 } = cg.symbolTable.query("println", SymbolType.CLASS);
    const out = cg.constantPoolManager.indexFieldrefInfo(p1 as string, "out", t1 as string);
    const println = cg.constantPoolManager.indexMethodrefInfo(
      p2 as string, "println", n.argumentList[0].kind === "StringLiteral" ? t2 as string : "(I)V");

    cg.code.push(OPCODE.GETSTATIC, 0, out);
    n.argumentList.forEach((x, i) => {
      maxStack = Math.max(maxStack, i + 1 + codeGenerators[x.kind](x, cg));
    })
    cg.code.push(OPCODE.INVOKEVIRTUAL, 0, println);
    return maxStack;
  },

  Assignment: (node: BaseNode, cg: CodeGenerator) => {
    const { left: left, operator: op, right: right } = node as Assignment;
    let maxStack = op === "=" ? 0 : codeGenerators[left.kind](left, cg);
    codeGenerators[right.kind](right, cg);
    if (op !== "=") {
      cg.code.push(opToOpcode[op.substring(0, op.length - 1)]);
    }
    const { index: idx } = cg.symbolTable.query(left.name, SymbolType.VARIABLE);
    cg.code.push(OPCODE.ISTORE, idx as number);
    return maxStack;
  },

  BinaryExpression: (node: BaseNode, cg: CodeGenerator) => {
    const { left: left, right: right, operator: op } = node as BinaryExpression;
    const lsize = codeGenerators[left.kind](left, cg);
    const rsize = 1 + codeGenerators[right.kind](right, cg);
    cg.code.push(opToOpcode[op]);
    return Math.max(lsize, rsize);
  },

  ExpressionName: (node: BaseNode, cg: CodeGenerator) => {
    const { name: name } = node as ExpressionName;
    const { index: idx } = cg.symbolTable.query(name, SymbolType.VARIABLE);
    cg.code.push(OPCODE.ILOAD, idx as number);
    return 1;
  },

  StringLiteral: (node: BaseNode, cg: CodeGenerator) => {
    const n = node as Literal;
    const strIdx = cg.constantPoolManager.indexStringInfo(n.value);
    cg.code.push(OPCODE.LDC, strIdx);
    return 1;
  },

  IntegerLiteral: (node: BaseNode, cg: CodeGenerator) => {
    const { value: value } = node as Literal;
    const n = parseInt(value);
    if (-128 <= n && n < 128) {
      cg.code.push(OPCODE.BIPUSH, n);
    } else if (-32768 <= n && n < 32768) {
      cg.code.push(OPCODE.SIPUSH, n >> 8, n & 0xff);
    } else {
      const idx = cg.constantPoolManager.indexIntegerInfo(n);
      cg.code.push(OPCODE.LDC, idx);
    }
    return 1;
  }
}

class CodeGenerator {
  symbolTable: SymbolTable;
  constantPoolManager: ConstantPoolManager;
  maxLocals = 0;
  code: number[] = [];

  constructor(symbolTable: SymbolTable, constantPoolManager: ConstantPoolManager) {
    this.symbolTable = symbolTable;
    this.constantPoolManager = constantPoolManager;
  }

  generateCode(methodNode: MethodDeclaration) {
    this.symbolTable.extend();
    methodNode.methodHeader.formalParameterList.forEach(p => {
      this.symbolTable.insert(p.identifier, SymbolType.VARIABLE, {
        index: this.maxLocals
      });
      this.maxLocals++;
    });

    const { methodBody } = methodNode;
    const maxStack = Math.max(this.maxLocals, codeGenerators[methodBody.kind](methodBody, this));
    const exceptionTable: Array<ExceptionHandler> = [];
    const attributes: Array<AttributeInfo> = [];

    this.code.push(OPCODE.RETURN);
    const codeBuf = new Uint8Array(this.code).buffer;
    const dataView = new DataView(codeBuf);
    this.code.forEach((x, i) => dataView.setUint8(i, x));

    const attributeLength = 12 + this.code.length + 8 * exceptionTable.length +
      attributes.map(attr => attr.attributeLength + 6).reduce((acc, val) => acc + val, 0);
    this.symbolTable.teardown();

    return {
      attributeNameIndex: this.constantPoolManager.indexUtf8Info("Code"),
      attributeLength: attributeLength,
      maxStack: maxStack,
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
