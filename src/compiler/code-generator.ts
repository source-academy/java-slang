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
  Assignment,
  IfStatement
} from "../ast/types/blocks-and-statements";
import { MethodDeclaration } from "../ast/types/classes";
import { ConstantPoolManager } from "./constant-pool-manager";
import { SymbolTable, SymbolType } from "./symbol-table"

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

const codeGenerators: { [type: string]: (node: BaseNode, cg: CodeGenerator) => number } = {
  Block: (node: BaseNode, cg: CodeGenerator) => {
    let maxStack = 0;
    (node as Block).blockStatements.forEach(x => {
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

  IfStatement: (node: BaseNode, cg: CodeGenerator) => {
    let maxStack = 1;
    const { test: condition, consequent: consequent, alternate: alternate } = node as IfStatement;

    const elseLabel = cg.generateNewLabel();
    maxStack = Math.max(maxStack, codeGenerators["LogicalExpression"](condition, cg));
    maxStack = Math.max(maxStack, codeGenerators[consequent.kind](consequent, cg));

    const endLabel = cg.generateNewLabel();
    if (alternate) {
      cg.addBranchInstr(OPCODE.GOTO, endLabel);
    }

    elseLabel.offset = cg.code.length;
    if (alternate) {
      maxStack = Math.max(maxStack, codeGenerators[alternate.kind](alternate, cg));
      endLabel.offset = cg.code.length;
    }

    return maxStack;
  },

  LogicalExpression: (node: BaseNode, cg: CodeGenerator) => {
    const f = (node: BaseNode, targetLabel: Label, onTrue: boolean): number => {
      if (node.kind === "BooleanLiteral") {
        // TODO: implement handling of boolean literal
      }

      if (node.kind !== "BinaryExpression") {
        return codeGenerators[node.kind](node, cg);
      }

      const { left: left, right: right, operator: op } = node as BinaryExpression;
      let lsize = 0;
      let rsize = 0;
      if (op === "&&") {
        if (onTrue) {
          const falseLabel = cg.generateNewLabel();
          lsize = f(left, falseLabel, false);
          rsize = f(right, targetLabel, true);
          falseLabel.offset = cg.code.length;
        } else {
          lsize = f(left, targetLabel, false);
          rsize = f(right, targetLabel, false);
        }
      } else if (op === "||") {
        if (onTrue) {
          lsize = f(left, targetLabel, true);
          rsize = f(right, targetLabel, true);
        } else {
          const falseLabel = cg.generateNewLabel();
          lsize = f(left, falseLabel, true);
          rsize = f(right, targetLabel, false);
          falseLabel.offset = cg.code.length;
        }
      } else {
        lsize = f(left, targetLabel, onTrue);
        rsize = f(right, targetLabel, onTrue);
        cg.addBranchInstr(onTrue ? opToOpcode[op] : reverseLogicalOp[op], targetLabel);
      }
      return Math.max(lsize, 1 + rsize);
    }
    return f(node, cg.labels[cg.labels.length - 1], false);
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
    const rsize = codeGenerators[right.kind](right, cg);
    cg.code.push(opToOpcode[op]);
    return Math.max(lsize, 1 + rsize);
  },

  ExpressionName: (node: BaseNode, cg: CodeGenerator) => {
    const { name: name } = node as ExpressionName;
    const { index: idx } = cg.symbolTable.query(name, SymbolType.VARIABLE);
    cg.code.push(OPCODE.ILOAD, idx as number);
    return 1;
  },

  StringLiteral: (node: BaseNode, cg: CodeGenerator) => {
    const { value: value } = node as Literal;
    const strIdx = cg.constantPoolManager.indexStringInfo(value);
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
  maxLocals: number = 0;
  labels: Label[] = [];
  code: number[] = [];

  constructor(symbolTable: SymbolTable, constantPoolManager: ConstantPoolManager) {
    this.symbolTable = symbolTable;
    this.constantPoolManager = constantPoolManager;
  }

  generateNewLabel(): Label {
    const lable = {
      offset: 0,
      pointedBy: [],
    };
    this.labels.push(lable);
    return lable;
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
    this.resolveLabels();
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
