import { SymbolNotFoundError, SymbolRedeclarationError } from "./error";

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
  accessControl: number,
  parentClassName: string,
};

export interface FieldInfo {
  accessControl: number,
  parentClassName: string,
};

export interface MethodInfo {
  typeDescriptor: string
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
  }

  private getNewTable() {
    return new Map<Symbol, SymbolNode>();
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

    this.curTable.set(key, {
      info: info,
      children: this.getNewTable()
    });
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
}