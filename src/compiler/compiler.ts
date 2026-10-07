import { Class, ClassFile } from '../ClassFile/types'
import { AST } from '../ast/types/packages-and-modules'
import {
  ClassBodyDeclaration,
  ClassDeclaration,
  ConstructorDeclaration,
  EnumDeclaration,
  FieldDeclaration,
  MethodDeclaration,
  NormalClassDeclaration
} from '../ast/types/classes'
import { AttributeInfo } from '../ClassFile/types/attributes'
import { FieldInfo } from '../ClassFile/types/fields'
import { MethodInfo } from '../ClassFile/types/methods'
import { ConstructNotSupportedError } from './error'
import { ConstantPoolManager } from './constant-pool-manager'
import {
  generateClassAccessFlags,
  generateFieldAccessFlags,
  generateMethodAccessFlags
} from './compiler-utils'
import { SymbolTable, Table } from './symbol-table'
import { generateCode } from './code-generator'

const MAGIC = 0xcafebabe
const MINOR_VERSION = 0
const MAJOR_VERSION = 52

export class Compiler {
  private symbolTable: SymbolTable
  private constantPoolManager: ConstantPoolManager
  private interfaces: Array<number>
  private fields: Array<FieldInfo>
  private methods: Array<MethodInfo>
  private attributes: Array<AttributeInfo>
  private className: string
  private parentClassName: string

  constructor() {
    this.setup()
  }

  private setup() {
    this.symbolTable = new SymbolTable()
  }

  private resetClassFileState() {
    this.constantPoolManager = new ConstantPoolManager()
    this.interfaces = []
    this.fields = []
    this.methods = []
    this.attributes = []
  }

  compile(ast: AST) {
    this.setup()
    this.symbolTable.handleImports(ast.importDeclarations)
    const topLevelDeclarations = ast.topLevelClassOrInterfaceDeclarations
    const memberDeclarations = topLevelDeclarations.flatMap(declaration =>
      declaration.kind === 'NormalClassDeclaration'
        ? this.getMemberTypes(declaration.classBody, declaration.typeIdentifier)
        : []
    )
    const declarations = [...topLevelDeclarations, ...memberDeclarations]
    const compilationOrder = [...memberDeclarations, ...topLevelDeclarations]

    // Pass 0: register every class's identity (name/parent/isEnum) up
    // front, so a type name resolves via queryClass(...) regardless of
    // declaration order.
    declarations.forEach(decl => {
      const className = decl.typeIdentifier
      const parentClassName = 'sclass' in decl && decl.sclass ? decl.sclass : 'java/lang/Object'
      const accessFlags = generateClassAccessFlags(decl.classModifier)
      // Nested types are registered under both their simple name (so
      // unqualified references from within the compilation unit resolve) and
      // their qualified binary name (so a descriptor like `LOuter$Inner;`
      // can be resolved back to this class's info via queryClass(...)).
      const simpleName = className.split('$').pop() as string
      this.symbolTable.insertClassInfo(
        {
          name: className,
          accessFlags: accessFlags,
          parentClassName: parentClassName,
          isEnum: decl.kind === 'EnumDeclaration'
        },
        [simpleName, className]
      )
      this.symbolTable.returnToRoot()
    })

    // Pass 1: register every class's own members (fields, methods,
    // constructors, enum constants and synthetic members) with no bytecode
    // generated yet. This makes member resolution order-independent: a
    // sibling declared later in the same scope is already fully visible by
    // the time pass 2 generates any bytecode that might reference it.
    const classScopes = new Map<(typeof declarations)[number], Table>()
    compilationOrder.forEach(decl => {
      const scope =
        decl.kind === 'EnumDeclaration'
          ? this.registerEnumSignature(decl)
          : this.registerClassSignature(decl)
      classScopes.set(decl, scope)
    })

    // Pass 2: generate the actual bytecode for every class, re-entering
    // each class's own member scope registered in pass 1.
    const compiled = new Map<(typeof declarations)[number], Class>()
    compilationOrder.forEach(decl => {
      this.resetClassFileState()
      this.symbolTable.restoreClassScope(classScopes.get(decl) as Table)
      const classFile =
        decl.kind === 'EnumDeclaration'
          ? this.generateEnumClassFile(decl)
          : this.generateClassFile(decl)
      compiled.set(decl, { classFile: classFile, className: this.className })
    })

    // Return in declaration order (top-level types first, then member enums) so
    // the entry class stays at index 0 regardless of compilation order.
    return declarations.map(decl => compiled.get(decl) as Class)
  }

  /**
   * Flattens nested enum and static nested class declarations out of a class
   * body, rewriting each `typeIdentifier` to its JVM binary name
   * (`Outer$Inner`, `Outer$Middle$Inner`, ...) so the rest of the compiler can
   * treat them exactly like top-level declarations.
   */
  private getMemberTypes(
    classBody: Array<ClassBodyDeclaration>,
    enclosingBinaryName: string
  ): Array<EnumDeclaration | NormalClassDeclaration> {
    return classBody.flatMap(declaration => {
      if (declaration.kind === 'EnumDeclaration') {
        const qualified = {
          ...declaration,
          typeIdentifier: enclosingBinaryName + '$' + declaration.typeIdentifier
        }
        return [
          qualified,
          ...this.getMemberTypes(qualified.enumBody.bodyMembers || [], qualified.typeIdentifier)
        ]
      }
      if (declaration.kind === 'NormalClassDeclaration') {
        if (!declaration.classModifier.includes('static')) {
          throw new ConstructNotSupportedError('non-static nested class')
        }
        const qualified = {
          ...declaration,
          typeIdentifier: enclosingBinaryName + '$' + declaration.typeIdentifier
        }
        return [qualified, ...this.getMemberTypes(qualified.classBody, qualified.typeIdentifier)]
      }
      return []
    })
  }

  /**
   * Pass 1 for a class: registers its own member signatures (fields,
   * methods, constructors) in a fresh scope, with no bytecode generated.
   * Returns that scope so pass 2 can re-enter it via restoreClassScope.
   */
  private registerClassSignature(classNode: ClassDeclaration): Table {
    this.className = classNode.typeIdentifier
    const sclass = 'sclass' in classNode ? classNode.sclass : undefined
    this.parentClassName = sclass ? sclass : 'java/lang/Object'
    const accessFlags = generateClassAccessFlags(classNode.classModifier)
    this.symbolTable.extend()
    const scope = this.symbolTable.insertClassInfo({ name: this.className, accessFlags }, [
      this.className.split('$').pop() as string,
      this.className
    ])
    const classBody = 'classBody' in classNode ? classNode.classBody : []
    this.registerClassBodyMembers(classBody)
    return scope
  }

  /**
   * Pass 2 for a class: generates its bytecode, assuming its own scope has
   * already been restored (via restoreClassScope) and every other class's
   * members are already registered, regardless of declaration order.
   */
  private generateClassFile(classNode: ClassDeclaration): ClassFile {
    this.className = classNode.typeIdentifier
    const sclass = 'sclass' in classNode ? classNode.sclass : undefined
    this.parentClassName = sclass ? sclass : 'java/lang/Object'
    const accessFlags = generateClassAccessFlags(classNode.classModifier)

    const superClassIndex = this.constantPoolManager.indexClassInfo(this.parentClassName)
    const thisClassIndex = this.constantPoolManager.indexClassInfo(this.className)
    this.constantPoolManager.indexUtf8Info('Code')
    const classBody = 'classBody' in classNode ? classNode.classBody : []
    this.generateClassBody(classBody)

    const constantPool = this.constantPoolManager.getPool()
    return {
      magic: MAGIC,
      minorVersion: MINOR_VERSION,
      majorVersion: MAJOR_VERSION,
      constantPoolCount: this.constantPoolManager.getSize(),
      constantPool: constantPool,
      accessFlags: accessFlags,
      thisClass: thisClassIndex,
      superClass: superClassIndex,
      interfacesCount: this.interfaces.length,
      interfaces: this.interfaces,
      fieldsCount: this.fields.length,
      fields: this.fields,
      methodsCount: this.methods.length,
      methods: this.methods,
      attributesCount: this.attributes.length,
      attributes: this.attributes
    }
  }

  /**
   * Pass 1 for an enum: registers its constants, inherited/synthetic Enum
   * methods, and any explicit body members, with no bytecode generated.
   */
  private registerEnumSignature(enumNode: any): Table {
    this.className = enumNode.typeIdentifier
    this.parentClassName = 'java/lang/Enum'
    const accessFlags = generateClassAccessFlags(enumNode.classModifier) | 0x4000 // ACC_ENUM
    this.symbolTable.extend()
    const scope = this.symbolTable.insertClassInfo({ name: this.className, accessFlags }, [
      this.className.split('$').pop() as string,
      this.className
    ])

    const enumConstants = enumNode.enumBody.constants || []
    enumConstants.forEach((constant: any, ordinal: number) => {
      this.symbolTable.insertFieldInfo({
        name: constant.name,
        accessFlags: 0x0019,
        parentClassName: this.className,
        typeName: this.className,
        typeDescriptor: 'L' + this.className + ';',
        ordinal
      })
    })

    // name(), ordinal(), compareTo() etc. are inherited from java.lang.Enum;
    // register the ones reachable from Source programs so calls resolve.
    this.registerInheritedEnumMethods()
    this.registerEnumSyntheticMethodSignatures()

    const bodyMembers = enumNode.enumBody.bodyMembers || []
    if (bodyMembers.length > 0) {
      this.registerClassBodyMembers(bodyMembers)
    }
    return scope
  }

  /**
   * Pass 2 for an enum: generates its bytecode, assuming its own scope has
   * already been restored and every other class's members are registered.
   */
  private generateEnumClassFile(enumNode: any): ClassFile {
    this.className = enumNode.typeIdentifier
    // Generated enums genuinely extend java.lang.Enum: the constructor chains to
    // Enum.<init>(String, int) and name()/ordinal()/compareTo() are inherited.
    this.parentClassName = 'java/lang/Enum'
    const accessFlags = generateClassAccessFlags(enumNode.classModifier) | 0x4000 // ACC_ENUM

    const superClassIndex = this.constantPoolManager.indexClassInfo(this.parentClassName)
    const thisClassIndex = this.constantPoolManager.indexClassInfo(this.className)
    this.constantPoolManager.indexUtf8Info('Code')

    const enumBody = enumNode.enumBody
    const enumConstants = enumBody.constants || []
    const bodyMembers = enumBody.bodyMembers || []

    this.buildEnumConstantFields(enumConstants)

    // Add synthetic $VALUES field (private static final)
    const valuesFieldDescriptor = '[L' + this.className + ';'
    this.fields.push({
      accessFlags: 0x001a, // private static final
      nameIndex: this.constantPoolManager.indexUtf8Info('$VALUES'),
      descriptorIndex: this.constantPoolManager.indexUtf8Info(valuesFieldDescriptor),
      attributesCount: 0,
      attributes: []
    })

    if (bodyMembers.length === 0) {
      this.addEnumConstructor()
    } else {
      this.generateClassBody(bodyMembers)
    }

    // Add synthetic methods
    this.addEnumValuesMethod()
    this.addEnumValueOfMethod()
    this.addEnumStaticInitializer(enumConstants)

    const constantPool = this.constantPoolManager.getPool()
    return {
      magic: MAGIC,
      minorVersion: MINOR_VERSION,
      majorVersion: MAJOR_VERSION,
      constantPoolCount: this.constantPoolManager.getSize(),
      constantPool: constantPool,
      accessFlags: accessFlags,
      thisClass: thisClassIndex,
      superClass: superClassIndex,
      interfacesCount: this.interfaces.length,
      interfaces: this.interfaces,
      fieldsCount: this.fields.length,
      fields: this.fields,
      methodsCount: this.methods.length,
      methods: this.methods,
      attributesCount: this.attributes.length,
      attributes: this.attributes
    }
  }

  /** Builds the enum constants' field-table entries (pass 2; no symbol-table work - that's pass 1's job). */
  private buildEnumConstantFields(enumConstants: any[]) {
    enumConstants.forEach((constant: any) => {
      this.fields.push({
        accessFlags: 0x0019, // public static final
        nameIndex: this.constantPoolManager.indexUtf8Info(constant.name),
        descriptorIndex: this.constantPoolManager.indexUtf8Info('L' + this.className + ';'),
        attributesCount: 0,
        attributes: []
      })
    })
  }

  /** Registers values()/valueOf()'s signatures (pass 1); their bytecode is emitted in pass 2. */
  private registerEnumSyntheticMethodSignatures() {
    this.symbolTable.insertMethodInfo({
      name: 'values',
      accessFlags: 0x0009, // public static
      parentClassName: this.className,
      typeDescriptor: '()[L' + this.className + ';',
      className: this.className
    })
    this.symbolTable.insertMethodInfo({
      name: 'valueOf',
      accessFlags: 0x0009, // public static
      parentClassName: this.className,
      typeDescriptor: '(Ljava/lang/String;)L' + this.className + ';',
      className: this.className
    })
  }

  private addEnumConstructor() {
    // <init>(String name, int ordinal) { super(name, ordinal); }
    const superInitRef = this.constantPoolManager.indexMethodrefInfo(
      'java/lang/Enum',
      '<init>',
      '(Ljava/lang/String;I)V'
    )
    const bytecode = [
      0x19,
      0x00, // aload_0  (this)
      0x19,
      0x01, // aload_1  (name)
      0x15,
      0x02, // iload_2  (ordinal)
      0xb7,
      (superInitRef >> 8) & 0xff,
      superInitRef & 0xff, // invokespecial java/lang/Enum.<init>(String,I)V
      0xb1 // return
    ]
    const codeAttribute = this.createEnumCodeAttribute(bytecode, 3, 3)

    this.methods.push({
      accessFlags: 0x0002, // private
      nameIndex: this.constantPoolManager.indexUtf8Info('<init>'),
      descriptorIndex: this.constantPoolManager.indexUtf8Info('(Ljava/lang/String;I)V'),
      attributesCount: 1,
      attributes: [codeAttribute]
    })
  }

  /**
   * Registers the java.lang.Enum instance methods that Source programs can call
   * on an enum value. No bytecode is generated - the methods are inherited; the
   * symbol-table entries just let `enumValue.ordinal()` / `.name()` resolve.
   * The method owner is the enum class so `invokevirtual` dispatches correctly.
   */
  private registerInheritedEnumMethods() {
    const inherited: Array<[string, string]> = [
      ['name', '()Ljava/lang/String;'],
      ['ordinal', '()I'],
      ['compareTo', '(Ljava/lang/Enum;)I'],
      ['toString', '()Ljava/lang/String;']
    ]
    for (const [name, typeDescriptor] of inherited) {
      this.symbolTable.insertMethodInfo({
        name,
        accessFlags: 0x0001, // public
        parentClassName: this.className,
        typeDescriptor,
        className: this.className
      })
    }
  }

  private createEnumCodeAttribute(bytecode: number[], maxStack: number, maxLocals: number): any {
    return {
      attributeNameIndex: this.constantPoolManager.indexUtf8Info('Code'),
      attributeLength: 12 + bytecode.length,
      maxStack,
      maxLocals,
      codeLength: bytecode.length,
      code: new DataView(new Uint8Array(bytecode).buffer),
      exceptionTableLength: 0,
      exceptionTable: [],
      attributesCount: 0,
      attributes: []
    }
  }

  private addEnumValuesMethod() {
    // public static EnumClass[] values() { return $VALUES.clone(); }
    // (its signature is already registered in pass 1, by registerEnumSyntheticMethodSignatures)
    const nameIndex = this.constantPoolManager.indexUtf8Info('values')
    const descriptorIndex = this.constantPoolManager.indexUtf8Info('()[L' + this.className + ';')

    // Generate bytecode: getstatic $VALUES, invokevirtual clone, areturn
    const bytecode: number[] = []

    // getstatic $VALUES
    bytecode.push(0xb2) // getstatic
    const valuesFieldRef = this.constantPoolManager.indexFieldrefInfo(
      this.className,
      '$VALUES',
      '[L' + this.className + ';'
    )
    bytecode.push((valuesFieldRef >> 8) & 0xff)
    bytecode.push(valuesFieldRef & 0xff)

    // invokevirtual Object.clone()
    bytecode.push(0xb6) // invokevirtual
    const cloneMethodRef = this.constantPoolManager.indexMethodrefInfo(
      'java/lang/Object',
      'clone',
      '()Ljava/lang/Object;'
    )
    bytecode.push((cloneMethodRef >> 8) & 0xff)
    bytecode.push(cloneMethodRef & 0xff)

    // checkcast to array type
    bytecode.push(0xc0) // checkcast
    const arrayTypeRef = this.constantPoolManager.indexClassInfo('[L' + this.className + ';')
    bytecode.push((arrayTypeRef >> 8) & 0xff)
    bytecode.push(arrayTypeRef & 0xff)

    // areturn
    bytecode.push(0xb0)

    const codeAttribute: any = {
      attributeNameIndex: this.constantPoolManager.indexUtf8Info('Code'),
      attributeLength: 12 + bytecode.length,
      maxStack: 1,
      maxLocals: 0,
      codeLength: bytecode.length,
      code: new DataView(new Uint8Array(bytecode).buffer),
      exceptionTableLength: 0,
      exceptionTable: [],
      attributesCount: 0,
      attributes: []
    }

    this.methods.push({
      accessFlags: 0x0009, // public static
      nameIndex: nameIndex,
      descriptorIndex: descriptorIndex,
      attributesCount: 1,
      attributes: [codeAttribute]
    })
  }

  private addEnumValueOfMethod() {
    // public static EnumClass valueOf(String name) { return (EnumClass) Enum.valueOf(EnumClass.class, name); }
    // (its signature is already registered in pass 1, by registerEnumSyntheticMethodSignatures)
    const nameIndex = this.constantPoolManager.indexUtf8Info('valueOf')
    const descriptorIndex = this.constantPoolManager.indexUtf8Info(
      '(Ljava/lang/String;)L' + this.className + ';'
    )

    const bytecode: number[] = []

    // ldc EnumClass.class
    bytecode.push(0x12) // ldc
    const classRefIndex = this.constantPoolManager.indexClassInfo(this.className)
    bytecode.push(classRefIndex & 0xff)

    // aload_0 (String name parameter)
    bytecode.push(0x19)
    bytecode.push(0x00)

    // invokestatic java/lang/Enum.valueOf(Ljava/lang/Class;Ljava/lang/String;)Ljava/lang/Enum;
    bytecode.push(0xb8) // invokestatic
    const valueOfRef = this.constantPoolManager.indexMethodrefInfo(
      'java/lang/Enum',
      'valueOf',
      '(Ljava/lang/Class;Ljava/lang/String;)Ljava/lang/Enum;'
    )
    bytecode.push((valueOfRef >> 8) & 0xff)
    bytecode.push(valueOfRef & 0xff)

    // checkcast to enum type
    bytecode.push(0xc0) // checkcast
    bytecode.push((classRefIndex >> 8) & 0xff)
    bytecode.push(classRefIndex & 0xff)

    // areturn
    bytecode.push(0xb0)

    const codeAttribute: any = {
      attributeNameIndex: this.constantPoolManager.indexUtf8Info('Code'),
      attributeLength: 12 + bytecode.length,
      maxStack: 2,
      maxLocals: 1,
      codeLength: bytecode.length,
      code: new DataView(new Uint8Array(bytecode).buffer),
      exceptionTableLength: 0,
      exceptionTable: [],
      attributesCount: 0,
      attributes: []
    }

    this.methods.push({
      accessFlags: 0x0009, // public static
      nameIndex: nameIndex,
      descriptorIndex: descriptorIndex,
      attributesCount: 1,
      attributes: [codeAttribute]
    })
  }

  private addEnumStaticInitializer(enumConstants: any[]) {
    const nameIndex = this.constantPoolManager.indexUtf8Info('<clinit>')
    const descriptorIndex = this.constantPoolManager.indexUtf8Info('()V')
    const bytecode: number[] = []
    const enumClassRef = this.constantPoolManager.indexClassInfo(this.className)
    const constructorRef = this.constantPoolManager.indexMethodrefInfo(
      this.className,
      '<init>',
      '(Ljava/lang/String;I)V'
    )
    const emitInteger = (value: number) => {
      if (value <= 5) bytecode.push(0x03 + value)
      else bytecode.push(0x10, value)
    }
    const emitLdc = (constantPoolIndex: number) => {
      bytecode.push(0x13, (constantPoolIndex >> 8) & 0xff, constantPoolIndex & 0xff)
    }

    enumConstants.forEach((constant, ordinal) => {
      bytecode.push(0xbb, (enumClassRef >> 8) & 0xff, enumClassRef & 0xff, 0x59)
      emitLdc(this.constantPoolManager.indexStringInfo(constant.name))
      emitInteger(ordinal)
      bytecode.push(0xb7, (constructorRef >> 8) & 0xff, constructorRef & 0xff)
      const fieldRef = this.constantPoolManager.indexFieldrefInfo(
        this.className,
        constant.name,
        `L${this.className};`
      )
      bytecode.push(0xb3, (fieldRef >> 8) & 0xff, fieldRef & 0xff)
    })

    emitInteger(enumConstants.length)
    bytecode.push(0xbd, (enumClassRef >> 8) & 0xff, enumClassRef & 0xff)
    enumConstants.forEach((constant, ordinal) => {
      bytecode.push(0x59)
      emitInteger(ordinal)
      const fieldRef = this.constantPoolManager.indexFieldrefInfo(
        this.className,
        constant.name,
        `L${this.className};`
      )
      bytecode.push(0xb2, (fieldRef >> 8) & 0xff, fieldRef & 0xff, 0x53)
    })
    const valuesFieldRef = this.constantPoolManager.indexFieldrefInfo(
      this.className,
      '$VALUES',
      `[L${this.className};`
    )
    bytecode.push(0xb3, (valuesFieldRef >> 8) & 0xff, valuesFieldRef & 0xff, 0xb1)
    const codeAttribute = this.createEnumCodeAttribute(bytecode, 4, 0)

    this.methods.push({
      accessFlags: 0x0008, // static
      nameIndex: nameIndex,
      descriptorIndex: descriptorIndex,
      attributesCount: 1,
      attributes: [codeAttribute]
    })
  }

  /**
   * Splits a class body into its member kinds, synthesising the default
   * constructor if none was declared. Shared by both passes so they agree
   * on exactly which members exist (in particular, the same synthetic
   * default constructor) without either pass depending on the other.
   */
  private partitionClassBody(classBody: Array<ClassBodyDeclaration>) {
    const staticFields: Array<FieldDeclaration> = []
    const nonStaticFields: Array<FieldDeclaration> = []
    const staticMethods: Array<MethodDeclaration> = []
    const nonStaticMethods: Array<MethodDeclaration> = []
    const constructors: Array<ConstructorDeclaration> = []

    classBody.forEach(d => {
      if (d.kind === 'FieldDeclaration') {
        if (d.fieldModifier.includes('static')) {
          staticFields.push(d)
        } else {
          nonStaticFields.push(d)
        }
      } else if (d.kind === 'MethodDeclaration') {
        if (d.methodModifier.includes('static')) {
          staticMethods.push(d)
        } else {
          nonStaticMethods.push(d)
        }
      } else if (d.kind === 'ConstructorDeclaration') {
        constructors.push(d)
      }
    })

    // insert default constructor
    if (constructors.length === 0) {
      constructors.push({
        kind: 'ConstructorDeclaration',
        constructorModifier: ['public'],
        constructorDeclarator: {
          identifier: this.className,
          formalParameterList: []
        },
        constructorBody: {
          kind: 'Block',
          blockStatements: []
        }
      })
    }

    return { staticFields, nonStaticFields, staticMethods, nonStaticMethods, constructors }
  }

  /** Pass 1 for a class body: registers every member's signature, no bytecode. */
  private registerClassBodyMembers(classBody: Array<ClassBodyDeclaration>) {
    const { staticFields, nonStaticFields, staticMethods, nonStaticMethods, constructors } =
      this.partitionClassBody(classBody)

    constructors.forEach(c => this.recordConstructorInfo(c))
    staticFields.forEach(f => this.registerFieldSignature(f))
    nonStaticFields.forEach(f => this.registerFieldSignature(f))
    staticMethods.forEach(m => this.recordMethodInfo(m))
    nonStaticMethods.forEach(m => this.recordMethodInfo(m))
  }

  /** Pass 2 for a class body: generates every member's bytecode. */
  private generateClassBody(classBody: Array<ClassBodyDeclaration>) {
    const { staticFields, nonStaticFields, staticMethods, nonStaticMethods, constructors } =
      this.partitionClassBody(classBody)

    staticFields.forEach(f => this.buildFieldEntry(f))
    nonStaticFields.forEach(f => this.buildFieldEntry(f))
    nonStaticMethods.forEach(m => this.compileMethod(m))
    staticMethods.forEach(m => this.compileMethod(m))
    this.compileStaticFieldInitializers(staticFields)
    constructors.forEach(c => this.compileConstructor(c, nonStaticFields))
  }

  /**
   * Builds synthetic `f = expr;` assignment statements from each field's
   * initialiser, in declaration order. Instance-field targets are qualified
   * as `this.f` - the Assignment code generator only emits the ALOAD_0
   * needed before PUTFIELD when it sees that prefix; a bare name silently
   * skips loading the receiver.
   */
  private buildFieldInitializerStatements(
    fields: Array<FieldDeclaration>,
    qualifyWithThis: boolean = false
  ): any[] {
    const blockStatements: any[] = []
    for (const field of fields) {
      for (const declarator of field.variableDeclaratorList) {
        if (declarator.variableInitializer === undefined) continue
        const name = qualifyWithThis
          ? 'this.' + declarator.variableDeclaratorId
          : declarator.variableDeclaratorId
        blockStatements.push({
          kind: 'ExpressionStatement',
          stmtExp: {
            kind: 'Assignment',
            left: { kind: 'ExpressionName', name },
            operator: '=',
            right: declarator.variableInitializer
          }
        })
      }
    }
    return blockStatements
  }

  /**
   * Emits a `<clinit>` that runs the initialiser expression of each static
   * field, in declaration order (`static T f = expr;` -> `f = expr;`).
   */
  private compileStaticFieldInitializers(staticFields: Array<FieldDeclaration>) {
    const blockStatements = this.buildFieldInitializerStatements(staticFields)
    if (blockStatements.length === 0) return

    this.compileMethod({
      kind: 'MethodDeclaration',
      methodModifier: ['static'],
      methodHeader: { identifier: '<clinit>', formalParameterList: [], result: 'void' },
      methodBody: { kind: 'Block', blockStatements }
    } as unknown as MethodDeclaration)
  }

  /** Pass 1: registers a field's signature in the symbol table only. */
  private registerFieldSignature(fieldNode: FieldDeclaration) {
    const accessFlags = generateFieldAccessFlags(fieldNode.fieldModifier)
    const type = fieldNode.fieldType
    fieldNode.variableDeclaratorList.forEach(v => {
      const fullType = type + (v.dims ?? '')
      const typeDescriptor = this.symbolTable.generateFieldDescriptor(fullType)
      this.symbolTable.insertFieldInfo({
        name: v.variableDeclaratorId,
        accessFlags: accessFlags,
        parentClassName: this.className,
        typeName: fullType,
        typeDescriptor: typeDescriptor
      })
    })
  }

  /** Pass 2: builds a field's class-file field-table entry. */
  private buildFieldEntry(fieldNode: FieldDeclaration) {
    const accessFlags = generateFieldAccessFlags(fieldNode.fieldModifier)
    const type = fieldNode.fieldType
    fieldNode.variableDeclaratorList.forEach(v => {
      const fullType = type + (v.dims ?? '')
      const typeDescriptor = this.symbolTable.generateFieldDescriptor(fullType)
      this.fields.push({
        accessFlags: accessFlags,
        nameIndex: this.constantPoolManager.indexUtf8Info(v.variableDeclaratorId),
        descriptorIndex: this.constantPoolManager.indexUtf8Info(typeDescriptor),
        attributesCount: 0,
        attributes: []
      })
    })
  }

  private recordMethodInfo(methodNode: MethodDeclaration) {
    const header = methodNode.methodHeader
    const methodName = header.identifier
    const paramsType = header.formalParameterList.map(x => x.unannType)
    const resultType = header.result

    const descriptor = this.symbolTable.generateMethodDescriptor(paramsType, resultType)
    this.symbolTable.insertMethodInfo({
      name: methodName,
      accessFlags: generateMethodAccessFlags(methodNode.methodModifier),
      parentClassName: this.parentClassName,
      typeDescriptor: descriptor,
      className: this.className
    })
  }

  private recordConstructorInfo(constructor: ConstructorDeclaration) {
    const declarator = constructor.constructorDeclarator
    const paramsType = declarator.formalParameterList.map(x => x.unannType)
    const descriptor = this.symbolTable.generateMethodDescriptor(paramsType, 'void')

    this.symbolTable.insertMethodInfo({
      name: '<init>',
      accessFlags: generateMethodAccessFlags(constructor.constructorModifier),
      parentClassName: this.parentClassName,
      typeDescriptor: descriptor,
      className: this.className
    })
  }

  private compileMethod(methodNode: MethodDeclaration) {
    const header = methodNode.methodHeader
    const methodName = header.identifier
    const paramsType = header.formalParameterList.map(x => x.unannType)
    const resultType = header.result

    const nameIndex = this.constantPoolManager.indexUtf8Info(methodName)
    const descriptor = this.symbolTable.generateMethodDescriptor(paramsType, resultType)
    const descriptorIndex = this.constantPoolManager.indexUtf8Info(descriptor)

    const attributes: Array<AttributeInfo> = []
    attributes.push(
      generateCode(this.symbolTable, this.constantPoolManager, this.className, methodNode)
    )

    this.methods.push({
      accessFlags: generateMethodAccessFlags(methodNode.methodModifier),
      nameIndex: nameIndex,
      descriptorIndex: descriptorIndex,
      attributesCount: attributes.length,
      attributes: attributes
    })
  }

  private compileConstructor(
    constructor: ConstructorDeclaration,
    instanceFields: Array<FieldDeclaration> = []
  ) {
    // Instance field initialisers run at the start of every constructor body
    // (right after the implicit super() call that generateCode() emits),
    // mirroring how compileStaticFieldInitializers seeds <clinit>.
    const fieldInitializers = this.buildFieldInitializerStatements(instanceFields, true)
    const methodNode: MethodDeclaration = {
      kind: 'MethodDeclaration',
      methodModifier: constructor.constructorModifier,
      methodHeader: {
        identifier: '<init>',
        formalParameterList: constructor.constructorDeclarator.formalParameterList,
        result: 'void'
      },
      methodBody: {
        kind: 'Block',
        blockStatements: [...fieldInitializers, ...constructor.constructorBody.blockStatements]
      }
    }

    this.compileMethod(methodNode)
  }
}
