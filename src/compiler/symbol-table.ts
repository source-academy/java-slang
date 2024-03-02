import { UnannType } from "../ast/types/classes";
import { ImportDeclaration } from "../ast/types/packages-and-modules";
import { generateClassAccessFlags, generateFieldAccessFlags, generateMethodAccessFlags } from "./compiler-utils";
import { InvalidMethodCallError, SymbolNotFoundError, SymbolRedeclarationError } from "./error";

export const typeMap = new Map([
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

export type SymbolInfo = ClassInfo | FieldInfo | MethodInfos | VariableInfo;

export interface ClassInfo {
  name: string,
  accessFlags: number,
  parentClassName?: string,
};

export interface FieldInfo {
  name: string,
  accessFlags: number,
  parentClassName: string,
  typeName: string,
  typeDescriptor: string,
};

export type MethodInfos = Array<MethodInfo>;

export interface MethodInfo {
  name: string,
  accessFlags: number,
  parentClassName: string,
  typeDescriptor: string,
};

export interface VariableInfo {
  name: string,
  accessFlags: number,
  index: number,
  typeName: string,
  typeDescriptor: string,
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
  private curClassIdx: number;
  private importedPackages: Array<string>;
  private importedClassMap: Map<string, string>;

  constructor() {
    this.tables = [this.getNewTable()];
    this.curTable = this.tables[0];
    this.curIdx = 0;
    this.importedPackages = [];
    this.importedClassMap = new Map();
    this.setup();
  }

  private setup() {
    this.importedPackages.push("java/lang/");
    this.insertClassInfo({
      name: "java/lang/String",
      accessFlags: generateClassAccessFlags(["public", "final"])
    });
    this.returnToRoot();
    this.insertClassInfo({
      name: "java/io/PrintStream",
      accessFlags: generateClassAccessFlags(["public", "final"])
    });
    this.insertMethodInfo({
      name: "println",
      accessFlags: generateMethodAccessFlags(["public"]),
      parentClassName: "java/io/PrintStream",
      typeDescriptor: this.generateMethodDescriptor(["java/lang/String"], "void")
    });
    this.insertMethodInfo({
      name: "println",
      accessFlags: generateMethodAccessFlags(["public"]),
      parentClassName: "java/io/PrintStream",
      typeDescriptor: this.generateMethodDescriptor(["int"], "void")
    });
    this.insertMethodInfo({
      name: "println",
      accessFlags: generateMethodAccessFlags(["public"]),
      parentClassName: "java/io/PrintStream",
      typeDescriptor: this.generateMethodDescriptor(["long"], "void")
    });
    this.insertMethodInfo({
      name: "println",
      accessFlags: generateMethodAccessFlags(["public"]),
      parentClassName: "java/io/PrintStream",
      typeDescriptor: this.generateMethodDescriptor(["float"], "void")
    });
    this.insertMethodInfo({
      name: "println",
      accessFlags: generateMethodAccessFlags(["public"]),
      parentClassName: "java/io/PrintStream",
      typeDescriptor: this.generateMethodDescriptor(["double"], "void")
    });
    this.returnToRoot();
    this.insertClassInfo({
      name: "java/lang/System",
      accessFlags: generateClassAccessFlags(["public", "final"])
    });
    this.insertFieldInfo({
      name: "out",
      accessFlags: generateFieldAccessFlags(["static"]),
      parentClassName: "java/lang/System",
      typeName: "java/io/PrintStream",
      typeDescriptor: this.generateFieldDescriptor("java/io/PrintStream")
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

  handleImports(imports: Array<ImportDeclaration>) {
    imports.forEach(i => {
      const id = i.identifier;
      if (id.endsWith('*')) {
        this.importedPackages.push(id.slice(0, id.length - 1).replaceAll('.', '/'));
      } else {
        const typeName = id.slice(id.lastIndexOf('.') + 1);
        this.importedClassMap.set(typeName, id.replaceAll('.', '/'));
      }
    });
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

  insertMethodInfo(info: MethodInfo) {
    const key = generateSymbol(info.name, SymbolType.METHOD);

    if (!this.curTable.has(key)) {
      const symbolNode: SymbolNode = {
        info: [info],
        children: this.getNewTable()
      };
      this.curTable.set(key, symbolNode);
      return;
    }

    const symbolNode = this.curTable.get(key)!;
    const methodInfos = symbolNode.info as MethodInfos;
    for (let i = 0; i < methodInfos.length; i++) {
      if (methodInfos[i].typeDescriptor === info.typeDescriptor) {
        throw new SymbolRedeclarationError(info.name);
      }
    }
    methodInfos.push(info);
  }

  insertClassInfo(info: ClassInfo) {
    const key = generateSymbol(info.name, SymbolType.CLASS);

    if (this.curTable.has(key)) {
      throw new SymbolRedeclarationError(info.name);
    }

    const symbolNode: SymbolNode = {
      info: info,
      children: this.getNewTable()
    };
    this.curTable.set(key, symbolNode);

    this.tables[++this.curIdx] = symbolNode.children;
    this.curTable = this.tables[this.curIdx];
    this.curClassIdx = this.curIdx;
  }

  insertFieldInfo(info: FieldInfo) {
    const key = generateSymbol(info.name, SymbolType.FIELD);

    if (this.curTable.has(key)) {
      throw new SymbolRedeclarationError(info.name);
    }

    const symbolNode: SymbolNode = {
      info: info,
      children: this.getNewTable()
    };
    this.curTable.set(key, symbolNode);
  }

  insertVariableInfo(info: VariableInfo) {
    const key = generateSymbol(info.name, SymbolType.VARIABLE);

    for (let i = this.curIdx; i > this.curClassIdx; i++) {
      if (this.tables[i].has(key)) {
        throw new SymbolRedeclarationError(info.name);
      }
    }

    const symbolNode: SymbolNode = {
      info: info,
      children: this.getNewTable()
    };
    this.curTable.set(key, symbolNode);
  }

  queryField(name: string): Array<SymbolInfo> {
    let curTable = this.getNewTable();
    const symbolInfos: Array<SymbolInfo> = [];

    const tokens = name.split('.');
    const len = tokens.length;
    for (let i = 0; i < len; i++) {
      const token = tokens[i];
      if (i === 0) {
        const key = generateSymbol(this.resolveTypename(token), SymbolType.CLASS);
        curTable = this.tables[0].get(key)!.children;
      } else if (i < len - 1) {
        const key = generateSymbol(token, SymbolType.FIELD);
        const node = curTable.get(key);
        if (node === undefined) {
          throw new InvalidMethodCallError(name);
        }
        symbolInfos.push(node.info);
        const type = generateSymbol((node.info as FieldInfo).typeName, SymbolType.CLASS);
        curTable = this.tables[0].get(type)!.children;
      } else {
        const key = generateSymbol(token, SymbolType.FIELD);
        const node = curTable.get(key);
        if (node === undefined) {
          throw new InvalidMethodCallError(name);
        }
        symbolInfos.push(node.info);
      }
    }

    return symbolInfos;
  }

  queryVariable(name: string): VariableInfo | Array<SymbolInfo> {
    if (name.includes('.')) {
      return this.queryField(name);
    }

    const key1 = generateSymbol(name, SymbolType.VARIABLE);
    const key2 = generateSymbol(name, SymbolType.FIELD);

    for (let i = this.curIdx; i >= 0; i--) {
      const table = this.tables[i];
      if (table.has(key1)) {
        return (table.get(key1) as SymbolNode).info as VariableInfo;
      }
      if (table.has(key2)) {
        return [(table.get(key2) as SymbolNode).info as FieldInfo];
      }
    }

    throw new SymbolNotFoundError(name);
  }

  queryMethod(name: string): Array<SymbolInfo> {
    const key = generateSymbol(name, SymbolType.VARIABLE);
    for (let i = this.curIdx; i > this.curClassIdx; i--) {
      if (this.tables[i].has(key)) {
        throw new InvalidMethodCallError(name);
      }
    }

    const symbolInfos: Array<SymbolInfo> = [];
    const tokens = name.split('.');
    const len = tokens.length;
    if (len === 1) {
      const key = generateSymbol(name, SymbolType.METHOD);
      const table = this.tables[this.curClassIdx];
      if (table.has(key)) {
        symbolInfos.push(table.get(key)!.info);
        return symbolInfos;
      }
      throw new InvalidMethodCallError(name);
    }

    let curTable: Table = this.getNewTable();
    for (let i = 0; i < len; i++) {
      const token = tokens[i];
      if (i === 0) {
        const key = generateSymbol(this.resolveTypename(token), SymbolType.CLASS);
        curTable = this.tables[0].get(key)!.children;
      } else if (i < len - 1) {
        const key = generateSymbol(token, SymbolType.FIELD);
        const node = curTable.get(key);
        if (node === undefined) {
          throw new InvalidMethodCallError(name);
        }
        symbolInfos.push(node.info);
        const type = generateSymbol((node.info as FieldInfo).typeName, SymbolType.CLASS);
        curTable = this.tables[0].get(type)!.children;
      } else {
        const key = generateSymbol(token, SymbolType.METHOD);
        const node = curTable.get(key);
        if (node === undefined) {
          throw new InvalidMethodCallError(name);
        }
        symbolInfos.push(node.info);
      }
    }

    return symbolInfos;
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

  private resolveTypename(name: string): string {
    let key = generateSymbol(name, SymbolType.CLASS);
    for (let i = this.curIdx; i >= 0; i--) {
      const table = this.tables[i];
      if (table.has(key)) {
        return name;
      }
    }

    if (this.importedClassMap.has(name)) {
      return this.importedClassMap.get(name)!;
    }

    let p: string;
    for (p of this.importedPackages) {
      const fullName = p + name;
      const key = generateSymbol(fullName, SymbolType.CLASS);
      if (this.tables[0].has(key)) {
        return fullName;
      }
    }

    throw new SymbolNotFoundError(name);
  }
}