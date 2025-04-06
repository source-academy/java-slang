import { UnannType } from '../ast/types/classes'
import { ImportDeclaration } from '../ast/types/packages-and-modules'
import {
  generateClassAccessFlags,
  generateFieldAccessFlags,
  generateMethodAccessFlags
} from './compiler-utils'
import {
  InvalidMethodCallError,
  SymbolCannotBeResolvedError,
  SymbolNotFoundError,
  SymbolRedeclarationError
} from './error'
import { libraries } from './import/libs'

export const typeMap = new Map([
  ['byte', 'B'],
  ['char', 'C'],
  ['double', 'D'],
  ['float', 'F'],
  ['int', 'I'],
  ['long', 'J'],
  ['short', 'S'],
  ['boolean', 'Z'],
  ['void', 'V']
])

type Symbol = string
type Table = Map<Symbol, SymbolNode>

export type SymbolNode = {
  info: SymbolInfo
  children: Table
}

export enum SymbolType {
  CLASS,
  FIELD,
  METHOD,
  VARIABLE
}

export type SymbolInfo = ClassInfo | FieldInfo | MethodInfos | VariableInfo

export interface ClassInfo {
  name: string
  accessFlags: number
  parentClassName?: string
}

export interface FieldInfo {
  name: string
  accessFlags: number
  parentClassName: string
  typeName: string
  typeDescriptor: string
}

export type MethodInfos = Array<MethodInfo>

export interface MethodInfo {
  name: string
  accessFlags: number
  parentClassName: string
  typeDescriptor: string
  className: string
}

export interface VariableInfo {
  name: string
  accessFlags: number
  index: number
  typeName: string
  typeDescriptor: string
}

function generateSymbol(name: string, type: SymbolType) {
  const symbol = {
    name: name,
    type: type
  }
  return JSON.stringify(symbol)
}

export class SymbolTable {
  private tables: Array<Table>
  private curTable: Table
  private curIdx: number
  private curClassIdx: number
  private importedPackages: Array<string>
  private importedClassMap: Map<string, string>

  constructor() {
    this.tables = [this.getNewTable()]
    this.curTable = this.tables[0]
    this.curIdx = 0
    this.importedPackages = []
    this.importedClassMap = new Map()
  }

  private setup() {
    libraries.forEach(p => {
      if (this.importedPackages.findIndex(e => e == p.packageName + '/') == -1)
        this.importedPackages.push(p.packageName + '/')
      p.classes.forEach(c => {
        this.insertClassInfo(
          {
            name: c.className,
            accessFlags: generateClassAccessFlags(c.accessFlags)
          })
        c.fields.forEach(f =>
          this.insertFieldInfo({
            name: f.fieldName,
            accessFlags: generateFieldAccessFlags(f.accessFlags),
            parentClassName: c.className,
            typeName: f.typeName,
            typeDescriptor: this.generateFieldDescriptor(f.typeName)
          })
        )
        c.methods.forEach(m =>
          this.insertMethodInfo({
            name: m.methodName,
            accessFlags: generateMethodAccessFlags(m.accessFlags),
            parentClassName: c.className,
            typeDescriptor: this.generateMethodDescriptor(m.argsTypeName, m.returnTypeName),
            className: c.className
          })
        )
        this.returnToRoot()
      })
    })
  }

  private getNewTable() {
    return new Map<Symbol, SymbolNode>()
  }

  public returnToRoot() {
    this.tables = [this.tables[0]]
    this.curTable = this.tables[0]
    this.curIdx = 0
  }

  handleImports(imports: Array<ImportDeclaration>) {
    if (imports.length === 0) {
      imports.push({ isStatic: false, identifier: 'java.lang.*' })
    }

    imports.forEach(i => {
      const id = i.identifier
      if (id.endsWith('*')) {
        this.importedPackages.push(id.slice(0, id.length - 1).replaceAll('.', '/'))
      } else {
        const typeName = id.slice(id.lastIndexOf('.') + 1)
        this.importedClassMap.set(typeName, id.replaceAll('.', '/'))
      }
    })

    this.setup()
  }

  extend() {
    const table = this.getNewTable()
    this.tables.push(table)
    this.curTable = table
    this.curIdx++
  }

  teardown() {
    this.tables.pop()
    this.curIdx--
    this.curTable = this.tables[this.curIdx]
  }

  insertClassInfo(info: ClassInfo) {
    const key = generateSymbol(info.name, SymbolType.CLASS)

    if (this.curTable.has(key)) {
      throw new SymbolRedeclarationError(info.name)
    }

    const symbolNode: SymbolNode = {
      info: info,
      children: this.getNewTable()
    }
    this.curTable.set(key, symbolNode)

    this.tables[++this.curIdx] = symbolNode.children
    this.curTable = this.tables[this.curIdx]
    this.curClassIdx = this.curIdx
  }

  insertFieldInfo(info: FieldInfo) {
    const key = generateSymbol(info.name, SymbolType.FIELD)

    this.curTable = this.tables[this.curIdx]
    if (this.curTable.has(key)) {
      throw new SymbolRedeclarationError(info.name)
    }

    const symbolNode: SymbolNode = {
      info: info,
      children: this.getNewTable()
    }
    this.curTable.set(key, symbolNode)
  }

  insertMethodInfo(info: MethodInfo) {
    const key = generateSymbol(info.name, SymbolType.METHOD)

    this.curTable = this.tables[this.curIdx]
    if (!this.curTable.has(key)) {
      const symbolNode: SymbolNode = {
        info: [info],
        children: this.getNewTable()
      }
      this.curTable.set(key, symbolNode)
      return
    }

    const symbolNode = this.curTable.get(key)!
    const methodInfos = symbolNode.info as MethodInfos
    for (let i = 0; i < methodInfos.length; i++) {
      if (methodInfos[i].typeDescriptor === info.typeDescriptor) {
        throw new SymbolRedeclarationError(info.name)
      }
    }
    methodInfos.push(info)
  }

  insertVariableInfo(info: VariableInfo) {
    const key = generateSymbol(info.name, SymbolType.VARIABLE)

    for (let i = this.curIdx; i >= this.curClassIdx; i--) {
      if (this.tables[i].has(key)) {
        throw new SymbolRedeclarationError(info.name)
      }
    }

    const symbolNode: SymbolNode = {
      info: info,
      children: this.getNewTable()
    }
    this.curTable = this.tables[this.curIdx]
    this.curTable.set(key, symbolNode)
  }

  queryClass(name: string): ClassInfo {
    const root = this.tables[0]

    let key = generateSymbol(name, SymbolType.CLASS)
    if (root.has(key)) {
      return root.get(key)!.info as ClassInfo
    }

    if (this.importedClassMap.has(name)) {
      const fullName = this.importedClassMap.get(name)!
      key = generateSymbol(fullName, SymbolType.CLASS)
      if (root.has(key)) {
        return root.get(key)!.info as ClassInfo
      }
    }

    let p: string
    for (p of this.importedPackages) {
      const fullName = p + name
      key = generateSymbol(fullName, SymbolType.CLASS)
      if (root.has(key)) {
        return root.get(key)!.info as ClassInfo
      }
    }

    throw new SymbolNotFoundError(name)
  }

  private getClassTable(name: string): Table {
    let key = generateSymbol(name, SymbolType.CLASS)
    for (let i = this.curIdx; i >= 0; i--) {
      const table = this.tables[i]
      if (table.has(key)) {
        return table.get(key)!.children
      }
    }

    const root = this.tables[0]
    if (this.importedClassMap.has(name)) {
      const fullName = this.importedClassMap.get(name)!
      key = generateSymbol(fullName, SymbolType.CLASS)
      if (root.has(key)) {
        return root.get(key)!.children
      }
    }

    let p: string
    for (p of this.importedPackages) {
      const fullName = p + name
      key = generateSymbol(fullName, SymbolType.CLASS)
      if (root.has(key)) {
        return root.get(key)!.children
      }
    }

    throw new SymbolNotFoundError(name)
  }

  private querySymbol(name: string, symbolType: SymbolType): Array<SymbolInfo> {
    let curTable = this.getNewTable()
    const symbolInfos: Array<SymbolInfo> = []

    const tokens = name.split('.')
    const len = tokens.length
    tokens.forEach((token, i) => {
      if (i === 0) {
        const key1 = generateSymbol(token, SymbolType.VARIABLE)
        for (let i = this.curIdx; i >= this.curClassIdx; i--) {
          if (this.tables[i].has(key1)) {
            const node = this.tables[i].get(key1)!
            token = (node.info as VariableInfo).typeName
            symbolInfos.push(node.info)
            break
          }
        }

        if (token === 'this') {
          curTable = this.tables[this.curClassIdx]
        } else {
          curTable = this.getClassTable(token)
        }
      } else if (i < len - 1) {
        const key = generateSymbol(token, SymbolType.FIELD)
        const node = curTable.get(key)
        if (node === undefined) {
          throw new SymbolCannotBeResolvedError(token, name)
        }
        symbolInfos.push(node.info)

        const typeName = (node.info as FieldInfo).typeName
        curTable = this.getClassTable(typeName)
      } else {
        const key = generateSymbol(token, symbolType)
        const node = curTable.get(key)
        if (node === undefined) {
          throw new SymbolCannotBeResolvedError(token, name)
        }
        symbolInfos.push(node.info)
      }
    })

    return symbolInfos
  }

  queryField(name: string): Array<SymbolInfo> {
    return this.querySymbol(name, SymbolType.FIELD)
  }

  queryMethod(name: string): Array<SymbolInfo> {
    if (name.includes('.')) {
      return this.querySymbol(name, SymbolType.METHOD)
    }

    const key1 = generateSymbol(name, SymbolType.VARIABLE)
    for (let i = this.curIdx; i >= this.curClassIdx; i--) {
      if (this.tables[i].has(key1)) {
        throw new InvalidMethodCallError(name)
      }
    }

    const results: Array<SymbolInfo> = []
    const key2 = generateSymbol(name, SymbolType.METHOD)
    for (let i = this.curIdx; i > 0; i--) {
      const table = this.tables[i]
      if (table.has(key2)) {
        const methodInfos = table.get(key2)!.info as MethodInfos
        for (const methodInfo of methodInfos) {
          results.push(methodInfo)
        }
      }
    }

    if (results.length > 0) {
      return results
    }
    throw new InvalidMethodCallError(name)
  }

  queryVariable(name: string): VariableInfo | Array<SymbolInfo> {
    if (name.includes('.')) {
      return this.queryField(name)
    }

    const key1 = generateSymbol(name, SymbolType.VARIABLE)
    const key2 = generateSymbol(name, SymbolType.FIELD)

    for (let i = this.curIdx; i >= this.curClassIdx; i--) {
      const table = this.tables[i]
      if (table.has(key1)) {
        return (table.get(key1) as SymbolNode).info as VariableInfo
      }
      if (table.has(key2)) {
        return [(table.get(key2) as SymbolNode).info as FieldInfo]
      }
    }

    throw new SymbolNotFoundError(name)
  }

  generateFieldDescriptor(typeName: UnannType) {
    let dim = 0
    let last = typeName.length
    for (let i = typeName.length - 1; i >= 0; i--) {
      if (typeName[i] === '[') {
        dim++
        last = i
      }
    }

    typeName = typeName.slice(0, last)
    return (
      '['.repeat(dim) +
      (typeMap.has(typeName)
        ? typeMap.get(typeName)
        : 'L' + (typeName.includes('/') ? typeName : this.queryClass(typeName).name) + ';')
    )
  }

  generateMethodDescriptor(paramsType: Array<UnannType>, result: string) {
    const paramsDescriptor = paramsType.map(t => this.generateFieldDescriptor(t)).join('')
    const resultDescriptor = this.generateFieldDescriptor(result)

    return '(' + paramsDescriptor + ')' + resultDescriptor
  }
}
