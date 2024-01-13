import { UnannType } from "../ast/types/classes";
import { generateClassAccessFlags, generateFieldAccessFlags, generateMethodAccessFlags } from "./compiler-utils";
import { SymbolNotFoundError, SymbolRedeclarationError } from "./error";

const typeMap = new Map([
  ['byte', 'B'],
  ['char', 'C'],
  ['double', 'D'],
  ['float', 'F'],
  ['int', 'I'],
  ['long', 'J'],
  ['short', 'S'],
  ['boolean', 'Z'],
  ['void', 'V'],
]);

type Symbol = string;
type Table = Map<Symbol, SymbolNode>;

export type SymbolNode = {
  info: SymbolInfo,
  children: Table
};

export enum SymbolType {
  CLASS,
  FIELD,
  METHOD,
  VARIABLE,
}

export type SymbolInfo = ClassInfo | FieldInfo | MethodInfo | VariableInfo;

export interface ClassInfo {
  accessFlags: number,
  parentClassName?: string,
};

export interface FieldInfo {
  accessFlags: number,
  parentClassName?: string,
  typeDescriptor: string,
};

export interface MethodInfo {
  accessFlags: number,
  parentClassName?: string,
  typeDescriptor: string,
};

export interface VariableInfo {
  index: number
};

function generateSymbol(name: string, type: SymbolType) {
  const symbol = {
    name: name,
    type: type
  };
  return JSON.stringify(symbol);
}

export class SymbolTable {
  private tables: Array<Table>;
  private curTable: Table;
  private curIdx: number;

  constructor() {
    this.tables = [this.getNewTable()];
    this.curTable = this.tables[0];
    this.curIdx = 0;
    this.setup();
  }

  private setup() {
    this.insert("java/lang/String", SymbolType.CLASS, {
      accessFlags: generateClassAccessFlags(["public", "final"])
    });
    this.returnToRoot();
    this.insert("java/lang/System", SymbolType.CLASS, {
      accessFlags: generateClassAccessFlags(["public", "final"])
    });
    this.insert("out", SymbolType.FIELD, {
      accessFlags: generateFieldAccessFlags(["static"]),
      parentClassName: "java/lang/System",
      typeDescriptor: this.generateFieldDescriptor("java/io/PrintStream")
    });
    this.returnToRoot();
    this.insert("java/io/PrintStream", SymbolType.CLASS, {
      accessFlags: generateClassAccessFlags(["public", "final"])
    });
    this.insert("println", SymbolType.METHOD, {
      accessFlags: generateMethodAccessFlags(["public"]),
      parentClassName: "java/io/PrintStream",
      typeDescriptor: this.generateMethodDescriptor(["java/lang/String"], "void")
    });
    this.returnToRoot();
  }

  private getNewTable() {
    return new Map<Symbol, SymbolNode>();
  }

  private returnToRoot() {
    this.tables = [this.tables[0]];
    this.curTable = this.tables[0];
    this.curIdx = 0;
  }

  extend() {
    const table = this.getNewTable();
    this.tables.push(table);
    this.curTable = table;
    this.curIdx++;
  }

  teardown() {
    this.tables.pop();
    this.curIdx--;
    this.curTable = this.tables[this.curIdx];
  }

  insert(name: string, type: SymbolType, info: SymbolInfo) {
    const key = generateSymbol(name, type);

    if (this.curTable.has(key)) {
      throw new SymbolRedeclarationError(name);
    }

    const symbolNode: SymbolNode = {
      info: info,
      children: this.getNewTable()
    };
    this.curTable.set(key, symbolNode);

    if (type === SymbolType.CLASS) {
      this.tables[++this.curIdx] = symbolNode.children;
      this.curTable = this.tables[this.curIdx];
    }
  }

  query(name: string, type: SymbolType): SymbolInfo {
    const key = generateSymbol(name, type);

    for (let i = this.curIdx; i >= 0; i--) {
      const table = this.tables[i];
      if (table.has(key)) {
        return (table.get(key) as SymbolNode).info;
      }
    }

    throw new SymbolNotFoundError(name);
  }

  generateFieldDescriptor(typeName: UnannType) {
    let dim = 0;
    let last = typeName.length;
    for (let i = typeName.length - 1; i >= 0; i--) {
      if (typeName[i] === '[') {
        dim++;
        last = i;
      }
    }

    typeName = typeName.slice(0, last);
    return "[".repeat(dim) +
      (typeMap.has(typeName) ? typeMap.get(typeName) : 'L' + this.resolveTypename(typeName) + ';');
  }

  generateMethodDescriptor(paramsType: Array<UnannType>, result: string) {
    const paramsDescriptor = paramsType.map(t => this.generateFieldDescriptor(t)).join(",");
    const resultDescriptor = this.generateFieldDescriptor(result);

    return '(' + paramsDescriptor + ')' + resultDescriptor;
  }

  resolveTypename(name: string): string {
    let key = generateSymbol(name, SymbolType.CLASS);
    for (let i = this.curIdx; i >= 0; i--) {
      const table = this.tables[i];
      if (table.has(key)) {
        return name;
      }
    }

    const fullName = "java/lang/" + name;
    key = generateSymbol(fullName, SymbolType.CLASS);
    for (let i = this.curIdx; i >= 0; i--) {
      const table = this.tables[i];
      if (table.has(key)) {
        return fullName;
      }
    }

    return "null";
  }
}