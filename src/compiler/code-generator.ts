import { OPCODE } from "../ClassFile/constants/instructions";
import { ExceptionHandler, AttributeInfo } from "../ClassFile/types/attributes";
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
} from "../ast/types/blocks-and-statements";
import { MethodDeclaration } from "../ast/types/classes";
import { ConstantPoolManager } from "./constant-pool-manager";
import { ConstructNotSupportedError } from "./error";
import { SymbolTable, SymbolType, VariableInfo } from "./symbol-table"

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

function compile(node: Node, cg: CodeGenerator): number {
  if (!(node.kind in codeGenerators)) {
    throw new ConstructNotSupportedError(node.kind);
  }
  return codeGenerators[node.kind](node, cg);
}

const codeGenerators: { [type: string]: (node: Node, cg: CodeGenerator) => number } = {
  Block: (node: Node, cg: CodeGenerator) => {
    let maxStack = 0;
    (node as Block).blockStatements.forEach(x => {
      maxStack = Math.max(maxStack, compile(x, cg));
    })
    return maxStack;
  },

  LocalVariableDeclarationStatement: (node: Node, cg: CodeGenerator) => {
    let maxStack = 0;
    const { variableDeclaratorList: lst } = node as LocalVariableDeclarationStatement;
    lst.forEach(v => {
      const { variableDeclaratorId: identifier, variableInitializer: vi } = v;
      const curIdx = cg.maxLocals++;
      cg.symbolTable.insert(identifier, SymbolType.VARIABLE, { index: curIdx });
      if (vi) {
        maxStack = Math.max(maxStack, compile(vi, cg));
        cg.code.push(OPCODE.ISTORE, curIdx);
      }
    });
    return maxStack;
  },

  BasicForStatement: (node: Node, cg: CodeGenerator) => {
    let maxStack = 0;
    const { forInit, condition, forUpdate, body: originalBody } = node as BasicForStatement;

    if (forInit instanceof Array) {
      forInit.forEach(e => maxStack = Math.max(maxStack, compile(e, cg)));
    } else {
      maxStack = Math.max(maxStack, compile(forInit, cg));
    }

    const whileNode: WhileStatement = {
      kind: "WhileStatement",
      condition: condition,
      body: {
        kind: "Block",
        blockStatements: [originalBody, ...forUpdate],
      }
    };
    maxStack = Math.max(maxStack, compile(whileNode, cg));

    return maxStack;
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

    maxStack = Math.max(maxStack, codeGenerators["LogicalExpression"](condition, cg));
    maxStack = Math.max(maxStack, compile(body, cg));

    cg.addBranchInstr(OPCODE.GOTO, startLabel);
    endLabel.offset = cg.code.length;
    return maxStack;
  },

  IfStatement: (node: Node, cg: CodeGenerator) => {
    let maxStack = 0;
    const { condition: condition, consequent: consequent, alternate: alternate } = node as IfStatement;

    const elseLabel = cg.generateNewLabel();
    maxStack = Math.max(maxStack, codeGenerators["LogicalExpression"](condition, cg));
    maxStack = Math.max(maxStack, compile(consequent, cg));

    const endLabel = cg.generateNewLabel();
    if (alternate) {
      cg.addBranchInstr(OPCODE.GOTO, endLabel);
    }

    elseLabel.offset = cg.code.length;
    if (alternate) {
      maxStack = Math.max(maxStack, compile(alternate, cg));
      endLabel.offset = cg.code.length;
    }

    return maxStack;
  },

  LogicalExpression: (node: Node, cg: CodeGenerator) => {
    const f = (node: Node, targetLabel: Label, onTrue: boolean): number => {
      if (node.kind === "Literal") {
        const { literalType: { kind: kind, value: value } } = node as Literal;
        const boolValue = value === "true";
        if (kind === "BooleanLiteral" && onTrue === boolValue) {
          cg.addBranchInstr(OPCODE.GOTO, targetLabel);
          return 0;
        }
      }

      if (node.kind === "PrefixExpression") {
        const { expression: expr } = node as PrefixExpression;
        return f(expr, targetLabel, !onTrue);
      }

      if (node.kind === "BinaryExpression") {
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
          return Math.max(lsize, 1 + rsize);
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
          return Math.max(lsize, 1 + rsize);
        } else if (op in reverseLogicalOp) {
          lsize = f(left, targetLabel, onTrue);
          rsize = f(right, targetLabel, onTrue);
          cg.addBranchInstr(onTrue ? opToOpcode[op] : reverseLogicalOp[op], targetLabel);
          return Math.max(lsize, 1 + rsize);
        }
      }

      return compile(node, cg);
    }
    return f(node, cg.labels[cg.labels.length - 1], false);
  },

  MethodInvocation: (node: Node, cg: CodeGenerator) => {
    const n = node as MethodInvocation;
    let maxStack = 1;

    const out = cg.constantPoolManager.indexFieldrefInfo(
      "java/lang/System", "out", "Ljava/io/PrintStream;");
    const descriptor =
      n.argumentList[0].kind === "Literal"
        && (n.argumentList[0] as Literal).literalType.kind === "StringLiteral" ?
        "(Ljava/lang/String;)V" : "(I)V";
    const println = cg.constantPoolManager.indexMethodrefInfo("java/io/PrintStream", "println", descriptor);

    cg.code.push(OPCODE.GETSTATIC, 0, out);
    n.argumentList.forEach((x, i) => {
      maxStack = Math.max(maxStack, i + 1 + compile(x, cg));
    })
    cg.code.push(OPCODE.INVOKEVIRTUAL, 0, println);
    return maxStack;
  },

  Assignment: (node: Node, cg: CodeGenerator) => {
    const { left: left, operator: op, right: right } = node as Assignment;
    let maxStack = op === "=" ? 0 : compile(left, cg);
    compile(right, cg);
    if (op !== "=") {
      cg.code.push(opToOpcode[op.substring(0, op.length - 1)]);
    }
    const { index: idx } = cg.symbolTable.query(left.name, SymbolType.VARIABLE) as VariableInfo;
    cg.code.push(OPCODE.ISTORE, idx as number);
    return maxStack;
  },

  BinaryExpression: (node: Node, cg: CodeGenerator) => {
    const { left: left, right: right, operator: op } = node as BinaryExpression;
    const lsize = compile(left, cg);
    const rsize = compile(right, cg);
    cg.code.push(opToOpcode[op]);
    return Math.max(lsize, 1 + rsize);
  },

  PrefixExpression: (node: Node, cg: CodeGenerator) => {
    const { operator: op, expression: expr } = node as PostfixExpression;
    if (op === "++" || op === "--") {
      const { name: name } = expr as ExpressionName;
      const { index: idx } = cg.symbolTable.query(name, SymbolType.VARIABLE) as VariableInfo;
      cg.code.push(OPCODE.IINC, idx as number, op === "++" ? 1 : -1);
      cg.code.push(OPCODE.ILOAD, idx as number);
      return 1;
    }

    let maxStack = compile(expr, cg);
    if (op === "-") {
      cg.code.push(OPCODE.INEG);
    } else if (op === "~") {
      cg.code.push(OPCODE.ICONST_M1, OPCODE.IXOR);
      maxStack = Math.max(maxStack, 2);
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
    return maxStack;
  },

  PostfixExpression: (node: Node, cg: CodeGenerator) => {
    const { operator: op, expression: expr } = node as PostfixExpression;
    const { name: name } = expr as ExpressionName;
    const { index: idx } = cg.symbolTable.query(name, SymbolType.VARIABLE) as VariableInfo;
    cg.code.push(OPCODE.ILOAD, idx as number);
    cg.code.push(OPCODE.IINC, idx as number, op === "++" ? 1 : -1);
    return 1;
  },

  ExpressionName: (node: Node, cg: CodeGenerator) => {
    const { name: name } = node as ExpressionName;
    const { index: idx } = cg.symbolTable.query(name, SymbolType.VARIABLE) as VariableInfo;
    cg.code.push(OPCODE.ILOAD, idx as number);
    return 1;
  },

  Literal: (node: Node, cg: CodeGenerator) => {
    const { kind, value } = (node as Literal).literalType;
    switch (kind) {
      case "StringLiteral": {
        const strIdx = cg.constantPoolManager.indexStringInfo(value);
        cg.code.push(OPCODE.LDC, strIdx);
        return 1;
      }
      case "DecimalIntegerLiteral": {
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

    return 1;
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
      this.symbolTable.insert(p.identifier, SymbolType.VARIABLE, {
        index: this.maxLocals
      });
      this.maxLocals++;
    });

    const { methodBody } = methodNode;
    const maxStack = Math.max(this.maxLocals, compile(methodBody, this));
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
