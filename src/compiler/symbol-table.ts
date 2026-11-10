import { UnannType } from '../ast/types/classes'
import { ImportDeclaration } from '../ast/types/packages-and-modules'
import { METHOD_FLAGS } from '../ClassFile/types/methods'
import {
  generateClassAccessFlags,
  generateFieldAccessFlags,
  generateMethodAccessFlags
} from './compiler-utils'
import {
  InvalidMethodCallError,
  OverrideFinalMethodError,
  SymbolCannotBeResolvedError,
  SymbolNotFoundError,
  SymbolRedeclarationError,
  UnresolvedImportError
} from './error'
import { generatedLibInfo } from './import/generated-lib-info'
import { knownClasses, knownPackages, libraries } from './import/libs'

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

export type Symbol = string
export type Table = Map<Symbol, SymbolNode>

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
  /** Internal names of the directly implemented interfaces (known for library classes only). */
  interfaces?: string[]
  isEnum?: boolean
}

export interface FieldInfo {
  name: string
  accessFlags: number
  parentClassName: string
  typeName: string
  typeDescriptor: string
  ordinal?: number
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

/**
 * Extracts the symbol-table `typeName` for a field from its JVM descriptor:
 * the internal class name for object types, or the raw descriptor for
 * primitives and arrays (which are not used as lookup keys).
 */
function descriptorToTypeName(descriptor: string): string {
  let d = descriptor
  while (d.startsWith('[')) d = d.slice(1)
  if (d.startsWith('L') && d.endsWith(';')) return d.slice(1, -1)
  return descriptor
}

export class SymbolTable {
  private tables: Array<Table>
  private curTable: Table
  private curIdx: number
  private curClassIdx: number
  private importedPackages: Array<string>
  private importedClassMap: Map<string, string>
  // Class-name keys that were ambiguous (shared by two unrelated
  // declarations - e.g. two different enclosing classes each with a nested
  // class of the same simple name) and have been evicted. Tracked
  // separately from the tables themselves so a later declaration can't
  // silently reclaim the bare name once it's known to be ambiguous.
  private poisonedClassKeys: Set<string>

  constructor() {
    this.tables = [this.getNewTable()]
    this.curTable = this.tables[0]
    this.curIdx = 0
    this.importedPackages = []
    this.importedClassMap = new Map()
    this.poisonedClassKeys = new Set()
  }

  private setup() {
    // The extracted class-file metadata is authoritative; it is registered
    // first so its full signatures win over the curated `lib-info.ts` stubs.
    this.setupGeneratedLibrary()

    libraries.forEach(p => {
      if (this.importedPackages.findIndex(e => e == p.packageName + '/') == -1)
        this.importedPackages.push(p.packageName + '/')
      p.classes.forEach(c => {
        if (this.tables[0].has(generateSymbol(c.className, SymbolType.CLASS))) {
          return
        }
        this.insertClassInfo({
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

  /**
   * Registers every standard-library class from the extracted class-file
   * metadata. Descriptors and access flags come straight from the `.class`
   * files, so no hand-written signatures are involved.
   */
  private setupGeneratedLibrary() {
    Object.values(generatedLibInfo).forEach(meta => {
      const classKey = generateSymbol(meta.name, SymbolType.CLASS)
      if (this.tables[0].has(classKey)) {
        return
      }

      this.insertClassInfo({
        name: meta.name,
        accessFlags: meta.accessFlags,
        parentClassName: meta.superClass ?? undefined,
        interfaces: meta.interfaces
      })
      meta.fields.forEach(f =>
        this.insertFieldInfo({
          name: f.name,
          accessFlags: f.accessFlags,
          parentClassName: meta.name,
          typeName: descriptorToTypeName(f.descriptor),
          typeDescriptor: f.descriptor
        })
      )
      meta.methods.forEach(m =>
        this.insertMethodInfo({
          name: m.name,
          accessFlags: m.accessFlags,
          parentClassName: meta.name,
          typeDescriptor: m.descriptor,
          className: meta.name
        })
      )
      this.returnToRoot()
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
        const packageName = id.slice(0, id.lastIndexOf('.')).replaceAll('.', '/')
        // `java.lang` is always in scope; any other on-demand import must name a
        // package that holds at least one recognised standard-library class.
        if (packageName !== 'java/lang' && !knownPackages.has(packageName)) {
          throw new UnresolvedImportError(id)
        }
        this.importedPackages.push(packageName + '/')
      } else {
        const className = id.replaceAll('.', '/')
        if (!knownClasses.has(className)) {
          throw new UnresolvedImportError(id)
        }
        const typeName = id.slice(id.lastIndexOf('.') + 1)
        this.importedClassMap.set(typeName, className)
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

  // A nested class is registered under both its simple name (so unqualified
  // source references like `Inner` resolve) and its qualified binary name
  // (so a `Ljava/lang/Outer$Inner;`-style descriptor can be resolved back to
  // its member table) - both keys share the same SymbolNode/children table.
  // Returns the class's own member table (the `children` scope), so a caller
  // compiling in two passes can register every class's signature up front
  // (pass 1) and later re-enter each class's scope to generate bytecode
  // (pass 2) via restoreClassScope, once every sibling is already visible.
  insertClassInfo(info: ClassInfo, lookupNames: Array<string> = [info.name]): Table {
    const names = [...new Set(lookupNames)]
    const symbolNode: SymbolNode = {
      info: info,
      children: this.getNewTable()
    }

    for (const name of names) {
      const key = generateSymbol(name, SymbolType.CLASS)
      const isPrimaryKey = name === info.name
      if (this.curTable.has(key) || this.poisonedClassKeys.has(key)) {
        if (isPrimaryKey) {
          // The qualified binary name is built from a unique nesting path,
          // so a collision here is a genuine redeclaration, not ambiguity.
          throw new SymbolRedeclarationError(info.name)
        }
        // A secondary alias (e.g. a nested class's bare simple name) shared
        // by two unrelated declarations is permanently ambiguous - evict it
        // rather than letting whichever registered first silently win every
        // future unqualified lookup. Each declaration stays fully reachable
        // by its own unique qualified binary name; only the bare alias is
        // lost, for both the earlier and any later registrant.
        this.curTable.delete(key)
        this.poisonedClassKeys.add(key)
        continue
      }
      this.curTable.set(key, symbolNode)
    }

    this.tables[++this.curIdx] = symbolNode.children
    this.curTable = this.tables[this.curIdx]
    this.curClassIdx = this.curIdx
    return symbolNode.children
  }

  // Re-enters a class's own member scope (previously returned by
  // insertClassInfo) so its method bodies can be compiled in a later pass,
  // after every class's signature has already been registered. This always
  // appends a fresh slot rather than rewinding to the scope's original
  // index, so classes registered afterwards (whose tables occupy higher
  // indices) remain reachable via getClassTable's scan from the new curIdx.
  restoreClassScope(classScope: Table): void {
    this.tables[++this.curIdx] = classScope
    this.curTable = classScope
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

    for (let i = this.curClassIdx - 1; i > 0; i--) {
      const parentTable = this.tables[i]
      if (parentTable.has(key)) {
        const parentMethods = parentTable.get(key)!.info
        if (Array.isArray(parentMethods)) {
          for (const m of parentMethods) {
            if (
              m.typeDescriptor === info.typeDescriptor &&
              m.accessFlags & METHOD_FLAGS.ACC_FINAL &&
              m.className == info.parentClassName
            ) {
              throw new OverrideFinalMethodError(info.name)
            }
          }
        }
      }
    }

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

    // A dotted name (e.g. "Outer.Inner") may be a source-qualified reference
    // to a nested type, whose registered binary name joins segments with
    // '$' instead of '.' - try that before falling through to import/package
    // resolution (which treats dots as package separators instead).
    if (name.includes('.')) {
      key = generateSymbol(name.replace(/\./g, '$'), SymbolType.CLASS)
      if (root.has(key)) {
        return root.get(key)!.info as ClassInfo
      }
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

    // A dotted name (e.g. "Outer.Inner") may be a source-qualified reference
    // to a nested type, whose registered binary name joins segments with
    // '$' instead of '.' - try that before falling through to import/package
    // resolution (which treats dots as package separators instead). This is
    // also how a qualified-typed local variable/field resolves its own
    // member table when dispatching a method/field access on it.
    if (name.includes('.')) {
      key = generateSymbol(name.replace(/\./g, '$'), SymbolType.CLASS)
      for (let i = this.curIdx; i >= 0; i--) {
        const table = this.tables[i]
        if (table.has(key)) {
          return table.get(key)!.children
        }
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

  /** The name of the class whose member table is `table`, if it is a registered class scope. */
  private classNameOfTable(table: Table): string | undefined {
    for (const candidate of this.tables) {
      for (const node of candidate.values()) {
        if (node.children === table) {
          const name = (node.info as ClassInfo).name
          if (name !== undefined && this.hasClass(name)) return name
        }
      }
    }
    return undefined
  }

  private hasClass(name: string): boolean {
    try {
      this.queryClass(name)
      return true
    } catch (e) {
      return false
    }
  }

  /**
   * The member tables of the superclasses of `className`, nearest first (up to and including
   * `java/lang/Object`). The walk stops at a class the table does not know.
   */
  private superclassTables(className: string | undefined): Array<Table> {
    const tables: Array<Table> = []
    const visited = new Set<string>()
    let name = className
    while (name !== undefined && !visited.has(name)) {
      visited.add(name)
      let parent: string | undefined
      try {
        parent = this.queryClass(name).parentClassName
      } catch (e) {
        break
      }
      if (parent === undefined) break
      try {
        tables.push(this.getClassTable(parent))
      } catch (e) {
        break
      }
      name = parent
    }
    return tables
  }

  /**
   * Looks a member up in the table of a class and then in those of its superclasses (JLS 8.4.8:
   * a class inherits the non-private members of its superclass). For methods, every overload
   * visible in the hierarchy is returned, with a method overriding an inherited one hiding it.
   */
  private lookupMember(
    table: Table,
    className: string | undefined,
    key: Symbol,
    symbolType: SymbolType,
    // true when `table` is a superclass reached through `super`: its private members are not
    // accessible from the subclass either
    hideOwnPrivate = false
  ): SymbolInfo | undefined {
    const ACC_PRIVATE = 0x0002
    const inherited = this.superclassTables(className)

    if (symbolType === SymbolType.METHOD) {
      const merged: MethodInfos = []
      ;[table, ...inherited].forEach((candidate, depth) => {
        const node = candidate.get(key)
        if (node === undefined) return
        for (const method of node.info as MethodInfos) {
          if ((depth > 0 || hideOwnPrivate) && method.accessFlags & ACC_PRIVATE) continue
          if (merged.some(m => m.typeDescriptor === method.typeDescriptor)) continue
          merged.push(method)
        }
      })
      return merged.length > 0 ? merged : undefined
    }

    const own = table.get(key)
    if (
      own !== undefined &&
      !(hideOwnPrivate && (own.info as FieldInfo).accessFlags & ACC_PRIVATE)
    ) {
      return own.info
    }
    for (const candidate of inherited) {
      const node = candidate.get(key)
      if (node !== undefined && !((node.info as FieldInfo).accessFlags & ACC_PRIVATE)) {
        return node.info
      }
    }
    return undefined
  }

  /**
   * The first abstract method that the class `className` inherits without any class between
   * it and the declaring class (or the class itself) implementing it, if there is one
   * (JLS 8.1.1.1: a non-abstract class must implement every abstract method it inherits).
   * Only superclasses are considered because interfaces are not supported.
   */
  findUnimplementedAbstractMethod(className: string): MethodInfo | undefined {
    const ACC_PRIVATE = 0x0002
    const ACC_STATIC = 0x0008
    const ACC_ABSTRACT = 0x0400

    const chain: Array<Table> = []
    const visited = new Set<string>()
    let name: string | undefined = className
    while (name !== undefined && !visited.has(name)) {
      visited.add(name)
      try {
        chain.push(this.getClassTable(name))
        name = this.queryClass(name).parentClassName
      } catch (e) {
        break
      }
    }

    const methodsIn = (table: Table, methodName: string): MethodInfos => {
      const node = table.get(generateSymbol(methodName, SymbolType.METHOD))
      return node !== undefined && Array.isArray(node.info) ? (node.info as MethodInfos) : []
    }
    const parameterTypes = (descriptor: string) =>
      descriptor.slice(1, descriptor.indexOf(')')).match(/\[*(?:[BCDFIJSZ]|L[^;]+;)/g) ?? []
    // Generics are not supported, so an implementation must repeat the parameter types exactly
    const overrides = (abstractMethod: MethodInfo, candidate: MethodInfo) =>
      !(candidate.accessFlags & (ACC_ABSTRACT | ACC_STATIC | ACC_PRIVATE)) &&
      parameterTypes(abstractMethod.typeDescriptor).join() ===
        parameterTypes(candidate.typeDescriptor).join()

    for (let depth = 1; depth < chain.length; depth++) {
      for (const node of chain[depth].values()) {
        if (!Array.isArray(node.info)) continue
        for (const method of node.info as MethodInfos) {
          if (!(method.accessFlags & ACC_ABSTRACT)) continue
          const implemented = chain
            .slice(0, depth)
            .some(table => methodsIn(table, method.name).some(c => overrides(method, c)))
          if (!implemented) return method
        }
      }
    }
    return undefined
  }

  private querySymbol(name: string, symbolType: SymbolType): Array<SymbolInfo> {
    let curTable = this.getNewTable()
    let curClassName: string | undefined
    let startsAtSuper = false
    const symbolInfos: Array<SymbolInfo> = []

    const tokens = name.split('.')
    const len = tokens.length
    tokens.forEach((token, i) => {
      if (i === 0) {
        const key1 = generateSymbol(token, SymbolType.VARIABLE)
        let resolved = false
        for (let i = this.curIdx; i >= this.curClassIdx; i--) {
          if (this.tables[i].has(key1)) {
            const node = this.tables[i].get(key1)!
            token = (node.info as VariableInfo).typeName
            symbolInfos.push(node.info)
            resolved = true
            break
          }
        }
        if (!resolved && token !== 'this' && token !== 'super') {
          // not a local variable: a field of the current class or one it inherits (which hides
          // a class of the same name)
          const classTable = this.tables[this.curClassIdx]
          const field = this.lookupMember(
            classTable,
            this.classNameOfTable(classTable),
            generateSymbol(token, SymbolType.FIELD),
            SymbolType.FIELD
          ) as FieldInfo | undefined
          if (field !== undefined && len > 1) {
            symbolInfos.push(field)
            token = field.typeName
          }
        }

        if (token === 'this') {
          curTable = this.tables[this.curClassIdx]
          curClassName = this.classNameOfTable(curTable)
        } else if (token === 'super') {
          // members are looked up starting in the superclass, so `super.x` is the superclass's x
          // even if the current class declares its own x
          const parent = this.queryClass(
            this.classNameOfTable(this.tables[this.curClassIdx]) as string
          ).parentClassName as string
          curTable = this.getClassTable(parent)
          curClassName = parent
          startsAtSuper = true
        } else {
          curTable = this.getClassTable(token)
          curClassName = token
        }
      } else if (i < len - 1) {
        const key = generateSymbol(token, SymbolType.FIELD)
        const info = this.lookupMember(
          curTable,
          curClassName,
          key,
          SymbolType.FIELD,
          startsAtSuper && i === 1
        )
        if (info === undefined) {
          throw new SymbolCannotBeResolvedError(token, name)
        }
        symbolInfos.push(info)

        const typeName = (info as FieldInfo).typeName
        curTable = this.getClassTable(typeName)
        curClassName = typeName
      } else {
        const key = generateSymbol(token, symbolType)
        const info = this.lookupMember(
          curTable,
          curClassName,
          key,
          symbolType,
          startsAtSuper && i === 1
        )
        if (info === undefined) {
          throw new SymbolCannotBeResolvedError(token, name)
        }
        symbolInfos.push(info)
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

    // Methods inherited from superclasses, which includes those of java/lang/Object
    const currentClass = this.classNameOfTable(this.tables[this.curClassIdx])
    const inherited = this.lookupMember(
      this.tables[this.curClassIdx],
      currentClass,
      key2,
      SymbolType.METHOD
    ) as MethodInfos | undefined
    for (const methodInfo of inherited ?? []) {
      if (
        !(results as Array<MethodInfo>).some(
          r =>
            r.className === methodInfo.className && r.typeDescriptor === methodInfo.typeDescriptor
        )
      ) {
        results.push(methodInfo)
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

    // A field inherited from a superclass
    const classTable = this.tables[this.curClassIdx]
    const inherited = this.lookupMember(
      classTable,
      this.classNameOfTable(classTable),
      key2,
      SymbolType.FIELD
    )
    if (inherited !== undefined) {
      return [inherited as FieldInfo]
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
