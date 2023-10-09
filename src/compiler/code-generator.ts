import { OPCODE } from "../ClassFile/constants/instructions";
import { ExceptionHandler, AttributeInfo } from "../ClassFile/types/attributes";
import { BaseNode } from "../ast/types/ast";
import { MethodInvocation, Literal, Block } from "../ast/types/blocks-and-statements";
import { MethodDeclaration } from "../ast/types/classes";
import { ConstantPoolManager } from "./constant-pool-manager";
import { SymbolTable, SymbolType } from "./symbol-table"

const codeGenerators: { [type: string]: (node: BaseNode, cg: CodeGenerator) => number } = {
  Block: (node: BaseNode, cg: CodeGenerator) => {
    const n = node as Block;
    let maxStack = 0;
    n.blockStatements.forEach(x => {
      maxStack = Math.max(maxStack, codeGenerators[x.kind](x, cg));
    })
    return maxStack;
  },

  MethodInvocation: (node: BaseNode, cg: CodeGenerator) => {
    const n = node as MethodInvocation;
    let maxStack = 1;

    const { parentClassName: p1, typeDescriptor: t1 } = cg.symbolTable.query("out", SymbolType.CLASS);
    const { parentClassName: p2, typeDescriptor: t2 } = cg.symbolTable.query("println", SymbolType.CLASS);
    const out = cg.constantPoolManager.indexFieldrefInfo(p1 as string, "out", t1 as string);
    const println = cg.constantPoolManager.indexMethodrefInfo(p2 as string, "println", t2 as string);

    cg.code.push(OPCODE.GETSTATIC, 0, out);
    n.argumentList.forEach((x, i) => {
      maxStack = Math.max(maxStack, i + 1 + codeGenerators[x.kind](x, cg));
    })
    cg.code.push(OPCODE.INVOKEVIRTUAL, 0, println);
    return maxStack;
  },

  StringLiteral: (node: BaseNode, cg: CodeGenerator) => {
    const n = node as Literal;
    const strIdx = cg.constantPoolManager.indexStringInfo(n.value);
    cg.code.push(OPCODE.LDC, strIdx);
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
      this.symbolTable.insert(p.variableDeclaratorId, SymbolType.VARIABLE, {
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
