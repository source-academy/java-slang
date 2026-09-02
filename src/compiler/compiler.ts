import { Class, ClassFile } from '../ClassFile/types'
import { AST } from '../ast/types/packages-and-modules'
import {
  ClassBodyDeclaration,
  ClassDeclaration,
  ConstructorDeclaration,
  EnumDeclaration,
  FieldDeclaration,
  MethodDeclaration
} from '../ast/types/classes'
import { AttributeInfo } from '../ClassFile/types/attributes'
import { FieldInfo } from '../ClassFile/types/fields'
import { MethodInfo } from '../ClassFile/types/methods'
import { ConstantPoolManager } from './constant-pool-manager'
import {
  generateClassAccessFlags,
  generateFieldAccessFlags,
  generateMethodAccessFlags
} from './compiler-utils'
import { SymbolTable } from './symbol-table'
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
  private enumOrdinals: Map<string, number>

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
    this.enumOrdinals = new Map()
  }

  compile(ast: AST) {
    this.setup()
    this.symbolTable.handleImports(ast.importDeclarations)
    const classFiles: Array<Class> = []
    const declarations = [
      ...ast.topLevelClassOrInterfaceDeclarations,
      ...ast.topLevelClassOrInterfaceDeclarations.flatMap(declaration =>
        declaration.kind === 'NormalClassDeclaration'
          ? this.getMemberEnums(declaration.classBody)
          : []
      )
    ]

    const compilationOrder = [
      ...declarations.filter(declaration => declaration.kind === 'EnumDeclaration'),
      ...declarations.filter(declaration => declaration.kind !== 'EnumDeclaration')
    ]

    declarations.forEach(decl => {
      const className = decl.typeIdentifier
      const parentClassName =
        decl.kind === 'EnumDeclaration'
          ? 'java/lang/Enum'
          : 'sclass' in decl && decl.sclass
            ? decl.sclass
            : 'java/lang/Object'
      const accessFlags =
        generateClassAccessFlags(decl.classModifier) |
        (decl.kind === 'EnumDeclaration' ? 0x4000 : 0)
      this.symbolTable.insertClassInfo({
        name: className,
        accessFlags: accessFlags,
        parentClassName: parentClassName
      })
      this.symbolTable.returnToRoot()
    })

    compilationOrder.forEach(decl => {
      this.resetClassFileState()
      if (decl.kind === 'EnumDeclaration') {
        const classFile = this.compileEnum(decl)
        classFiles.push({ classFile: classFile, className: this.className })
      } else {
        const classFile = this.compileClass(decl)
        classFiles.push({ classFile: classFile, className: this.className })
      }
    })

    return classFiles
  }

  private getMemberEnums(classBody: Array<ClassBodyDeclaration>): Array<EnumDeclaration> {
    return classBody.flatMap(declaration => {
      if (declaration.kind !== 'EnumDeclaration') return []
      return [
        declaration,
        ...this.getMemberEnums(declaration.enumBody.bodyMembers || [])
      ]
    })
  }

  private compileClass(classNode: ClassDeclaration): ClassFile {
    this.className = classNode.typeIdentifier
    const sclass = 'sclass' in classNode ? classNode.sclass : undefined
    this.parentClassName = sclass ? sclass : 'java/lang/Object'
    const accessFlags = generateClassAccessFlags(classNode.classModifier)
    this.symbolTable.extend()
    this.symbolTable.insertClassInfo({ name: this.className, accessFlags: accessFlags })

    const superClassIndex = this.constantPoolManager.indexClassInfo(this.parentClassName)
    const thisClassIndex = this.constantPoolManager.indexClassInfo(this.className)
    this.constantPoolManager.indexUtf8Info('Code')
    const classBody = 'classBody' in classNode ? classNode.classBody : []
    this.handleClassBody(classBody)

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

  private compileEnum(enumNode: any): ClassFile {
    this.className = enumNode.typeIdentifier
    this.parentClassName = 'java/lang/Enum'
    const accessFlags = generateClassAccessFlags(enumNode.classModifier) | 0x4000 // Add ACC_ENUM
    this.symbolTable.extend()
    this.symbolTable.insertClassInfo({ name: this.className, accessFlags: accessFlags })

    const superClassIndex = this.constantPoolManager.indexClassInfo(this.parentClassName)
    const thisClassIndex = this.constantPoolManager.indexClassInfo(this.className)
    this.constantPoolManager.indexUtf8Info('Code')

    // Handle enum constants and body members
    const enumBody = enumNode.enumBody
    const enumConstants = enumBody.constants || []
    const bodyMembers = enumBody.bodyMembers || []
    
    // Add enum constants as static fields
    enumConstants.forEach((constant: any, ordinal: number) => {
      const fieldDescriptor = 'L' + this.className + ';'
      this.fields.push({
        accessFlags: 0x0019, // public static final
        nameIndex: this.constantPoolManager.indexUtf8Info(constant.name),
        descriptorIndex: this.constantPoolManager.indexUtf8Info(fieldDescriptor),
        attributesCount: 0,
        attributes: []
      })
      this.symbolTable.insertFieldInfo({
        name: constant.name,
        accessFlags: 0x0019,
        parentClassName: this.className,
        typeName: this.className,
        typeDescriptor: fieldDescriptor,
        ordinal
      })
      this.enumOrdinals.set(constant.name, ordinal)
    })
    
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
      this.handleClassBody(bodyMembers)
    }
    
    // Add synthetic methods
    this.addEnumValuesMethod(enumConstants)
    this.addEnumValueOfMethod(enumConstants)
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

  private addEnumConstructor() {
    const bytecode = [
      0x19,
      0x00,
      0x19,
      0x01,
      0x15,
      0x02,
      0xb7
    ]
    const constructorRef = this.constantPoolManager.indexMethodrefInfo(
      'java/lang/Enum',
      '<init>',
      '(Ljava/lang/String;I)V'
    )
    bytecode.push((constructorRef >> 8) & 0xff, constructorRef & 0xff, 0xb1)
    const codeAttribute = this.createEnumCodeAttribute(bytecode, 3, 3)

    this.methods.push({
      accessFlags: 0x0002,
      nameIndex: this.constantPoolManager.indexUtf8Info('<init>'),
      descriptorIndex: this.constantPoolManager.indexUtf8Info('(Ljava/lang/String;I)V'),
      attributesCount: 1,
      attributes: [codeAttribute]
    })
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

  private addEnumValuesMethod(enumConstants: any[]) {
    // public static EnumClass[] values() { return $VALUES.clone(); }
    const nameIndex = this.constantPoolManager.indexUtf8Info('values')
    const descriptorIndex = this.constantPoolManager.indexUtf8Info('()[L' + this.className + ';')
    
    // Generate bytecode: getstatic $VALUES, invokevirtual clone, areturn
    const bytecode: number[] = []
    
    // getstatic $VALUES
    bytecode.push(0xb2) // getstatic
    const valuesFieldRef = this.constantPoolManager.indexFieldrefInfo(this.className, '$VALUES', '[L' + this.className + ';')
    bytecode.push((valuesFieldRef >> 8) & 0xff)
    bytecode.push(valuesFieldRef & 0xff)
    
    // invokevirtual Object.clone()
    bytecode.push(0xb6) // invokevirtual
    const cloneMethodRef = this.constantPoolManager.indexMethodrefInfo('java/lang/Object', 'clone', '()Ljava/lang/Object;')
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
    // Register in symbol table
    this.symbolTable.insertMethodInfo({
     name: 'values',
     accessFlags: 0x0009, // public static
     parentClassName: this.className,
     typeDescriptor: '()[L' + this.className + ';',
     className: this.className
    })
  }

  private addEnumValueOfMethod(enumConstants: any[]) {
    // public static EnumClass valueOf(String name) { return (EnumClass) Enum.valueOf(EnumClass.class, name); }
    const nameIndex = this.constantPoolManager.indexUtf8Info('valueOf')
    const descriptorIndex = this.constantPoolManager.indexUtf8Info('(Ljava/lang/String;)L' + this.className + ';')
    
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
    const valueOfRef = this.constantPoolManager.indexMethodrefInfo('java/lang/Enum', 'valueOf', '(Ljava/lang/Class;Ljava/lang/String;)Ljava/lang/Enum;')
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
    // Register in symbol table
    this.symbolTable.insertMethodInfo({
      name: 'valueOf',
      accessFlags: 0x0009, // public static
      parentClassName: this.className,
      typeDescriptor: '(Ljava/lang/String;)L' + this.className + ';',
      className: this.className
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

  private handleClassBody(classBody: Array<ClassBodyDeclaration>) {
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

    constructors.forEach(c => this.recordConstructorInfo(c))
    staticFields.forEach(f => this.recordFieldInfo(f))
    staticMethods.forEach(m => this.recordMethodInfo(m))

    nonStaticFields.forEach(f => this.recordFieldInfo(f))
    nonStaticMethods.forEach(m => this.recordMethodInfo(m))
    nonStaticMethods.forEach(m => this.compileMethod(m))
    staticMethods.forEach(m => this.compileMethod(m))
    constructors.forEach(c => this.compileConstructor(c))
  }

  private recordFieldInfo(fieldNode: FieldDeclaration) {
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
      this.symbolTable.insertFieldInfo({
        name: v.variableDeclaratorId,
        accessFlags: accessFlags,
        parentClassName: this.className,
        typeName: fullType,
        typeDescriptor: typeDescriptor
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

  private compileConstructor(constructor: ConstructorDeclaration) {
    const methodNode: MethodDeclaration = {
      kind: 'MethodDeclaration',
      methodModifier: constructor.constructorModifier,
      methodHeader: {
        identifier: '<init>',
        formalParameterList: constructor.constructorDeclarator.formalParameterList,
        result: 'void'
      },
      methodBody: constructor.constructorBody
    }

    this.compileMethod(methodNode)
  }
}
