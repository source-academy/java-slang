export type Symbol = {
  name: string,
  type: SymbolType
};

export enum SymbolType {
  CLASS,
  VARIABLE
}

export interface SymbolInfo {
  index?: number,
  parentClassName?: string,
  typeDescriptor?: string
};

type Table = Map<string, SymbolInfo>;

export class SymbolTable {
  private tables: Array<Table>;
  private curTable: Table;
  private curIdx: number;

  constructor() {
    this.tables = [this.getNewTable()];
    this.curTable = this.tables[0];
    this.curIdx = 0;
  }

  private getNewTable() {
    return new Map<string, SymbolInfo>();
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
    const symbol: Symbol = {
      name: name,
      type: type
    };
    const key = JSON.stringify(symbol);

    if (this.curTable.has(key)) {
      throw new Error("Same symbol already exists in the table");
    }

    this.curTable.set(key, info);
  }

  query(name: string, type: SymbolType): SymbolInfo {
    const symbol: Symbol = {
      name: name,
      type: type
    };
    const key = JSON.stringify(symbol);

    for (let i = this.curIdx; i >= 0; i--) {
      const table = this.tables[i];
      if (table.has(key)) {
        return table.get(key) as SymbolInfo;
      }
    }

    throw new Error("Symbol " + name + " with type " + type + " is undefined");
  }
}