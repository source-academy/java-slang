import { Class, ClassFile } from '../ClassFile/types'
import { AST } from '../ast/types/packages-and-modules'
import {
  ClassBodyDeclaration,
  ClassDeclaration,
  ConstructorDeclaration,
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
    const classFiles: Array<Class> = []

    ast.topLevelClassOrInterfaceDeclarations.forEach(decl => {
      const className = decl.typeIdentifier
      const parentClassName = (decl.kind === 'EnumDeclaration' ? 'java/lang/Enum' : 
                               ('sclass' in decl && decl.sclass) ? decl.sclass : 'java/lang/Object')
      const accessFlags = generateClassAccessFlags(decl.classModifier)
      this.symbolTable.insertClassInfo({
        name: className,
        accessFlags: accessFlags,
        parentClassName: parentClassName
      })
      this.symbolTable.returnToRoot()
    })

    ast.topLevelClassOrInterfaceDeclarations.forEach(decl => {
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
    const bodyMembers = enumBody.bodyMembers || []
    this.handleClassBody(bodyMembers)
    
    // TODO: Add synthetic enum fields and methods
    // Add $VALUES array field
    // Add ordinal, name, toString, values, valueOf methods
    
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
