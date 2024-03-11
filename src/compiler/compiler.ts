import { ClassFile } from "../ClassFile/types";
import { AST } from "../ast/types/packages-and-modules";
import { ClassBodyDeclaration, ClassDeclaration, ConstructorDeclaration, FieldDeclaration, MethodDeclaration } from "../ast/types/classes";
import { AttributeInfo } from "../ClassFile/types/attributes";
import { FieldInfo } from "../ClassFile/types/fields";
import { MethodInfo } from "../ClassFile/types/methods";
import { ConstantPoolManager } from "./constant-pool-manager";
import {
  generateClassAccessFlags,
  generateFieldAccessFlags,
  generateMethodAccessFlags,
} from "./compiler-utils";
import { SymbolTable } from "./symbol-table";
import { generateCode } from "./code-generator";

const MAGIC = 0xcafebabe;
const MINOR_VERSION = 0;
const MAJOR_VERSION = 61;

export class Compiler {
  private symbolTable: SymbolTable;
  private constantPoolManager: ConstantPoolManager;
  private interfaces: Array<number>;
  private fields: Array<FieldInfo>;
  private methods: Array<MethodInfo>;
  private attributes: Array<AttributeInfo>;
  private className: string;

  constructor() {
    this.setup();
  }

  private setup() {
    this.constantPoolManager = new ConstantPoolManager();
    this.interfaces = [];
    this.fields = [];
    this.methods = [];
    this.attributes = [];
    this.symbolTable = new SymbolTable();
  }

  compile(ast: AST) {
    this.setup();
    this.symbolTable.handleImports(ast.importDeclarations);
    const classFiles: Array<ClassFile> = [];
    ast.topLevelClassOrInterfaceDeclarations.forEach(x => classFiles.push(this.compileClass(x)));
    return classFiles[0];
  }

  private compileClass(classNode: ClassDeclaration): ClassFile {
    const parentClassName = "java/lang/Object";
    this.className = classNode.typeIdentifier;
    const accessFlags = generateClassAccessFlags(classNode.classModifier);
    this.symbolTable.insertClassInfo({ name: this.className, accessFlags: accessFlags });
    this.constantPoolManager.indexMethodrefInfo(parentClassName, "<init>", "()V");

    const superClassIndex = this.constantPoolManager.indexClassInfo(parentClassName);
    const thisClassIndex = this.constantPoolManager.indexClassInfo(this.className);
    this.constantPoolManager.indexUtf8Info("Code");
    this.handleClassBody(classNode.classBody);

    const constantPool = this.constantPoolManager.getPool();
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
    };
  }

  private handleClassBody(classBody: Array<ClassBodyDeclaration>) {
    const staticFields: Array<FieldDeclaration> = [];
    const nonStaticFields: Array<FieldDeclaration> = [];
    const staticMethods: Array<MethodDeclaration> = [];
    const nonStaticMethods: Array<MethodDeclaration> = [];
    const constructors: Array<ConstructorDeclaration> = [];

    classBody.forEach(d => {
      if (d.kind === "FieldDeclaration") {
        if (d.fieldModifier.includes("static")) {
          staticFields.push(d);
        } else {
          nonStaticFields.push(d);
        }
      } else if (d.kind === "MethodDeclaration") {
        if (d.methodModifier.includes("static")) {
          staticMethods.push(d);
        } else {
          nonStaticMethods.push(d);
        }
      } else if (d.kind === "ConstructorDeclaration") {
        constructors.push(d);
      }
    });

    // insert default constructor
    if (constructors.length === 0) {
      constructors.push({
        kind: "ConstructorDeclaration",
        constructorModifier: ["public"],
        constructorDeclarator: {
          identifier: this.className,
          formalParameterList: []
        },
        constructorBody: {
          kind: "Block",
          blockStatements: [],
        }
      })
    }

    constructors.forEach(c => this.recordConstructorInfo(c));
    staticFields.forEach(f => this.recordFieldInfo(f));
    staticMethods.forEach(m => this.recordMethodInfo(m));
    staticMethods.forEach(m => this.compileMethod(m));

    nonStaticFields.forEach(f => this.recordFieldInfo(f));
    nonStaticMethods.forEach(m => this.recordMethodInfo(m));
    nonStaticMethods.forEach(m => this.compileMethod(m));
    constructors.forEach(c => this.compileConstructor(c));
  }

  private recordFieldInfo(fieldNode: FieldDeclaration) {
    const accessFlags = generateFieldAccessFlags(fieldNode.fieldModifier);
    const type = fieldNode.unannType;
    fieldNode.variableDeclaratorList.forEach(v => {
      const fullType = type + v.dims;
      const typeDescriptor = this.symbolTable.generateFieldDescriptor(fullType);
      this.fields.push({
        accessFlags: accessFlags,
        nameIndex: this.constantPoolManager.indexUtf8Info(v.variableDeclaratorId),
        descriptorIndex: this.constantPoolManager.indexUtf8Info(typeDescriptor),
        attributesCount: 0,
        attributes: []
      });
      this.symbolTable.insertFieldInfo({
        name: v.variableDeclaratorId,
        accessFlags: accessFlags,
        parentClassName: this.className,
        typeName: fullType,
        typeDescriptor: typeDescriptor,
      })
    });
  }

  private recordMethodInfo(methodNode: MethodDeclaration) {
    const header = methodNode.methodHeader;
    const methodName = header.identifier;
    const paramsType = header.formalParameterList.map(x => x.unannType);
    const resultType = header.result;

    const descriptor = this.symbolTable.generateMethodDescriptor(paramsType, resultType);
    this.symbolTable.insertMethodInfo({
      name: methodName,
      accessFlags: generateMethodAccessFlags(methodNode.methodModifier),
      parentClassName: this.className,
      typeDescriptor: descriptor
    });
  }

  private recordConstructorInfo(constructor: ConstructorDeclaration) {
    const declarator = constructor.constructorDeclarator;
    const paramsType = declarator.formalParameterList.map(x => x.unannType);
    const descriptor = this.symbolTable.generateMethodDescriptor(paramsType, "void");

    this.symbolTable.insertMethodInfo({
      name: "<init>",
      accessFlags: generateMethodAccessFlags(constructor.constructorModifier),
      parentClassName: "java/lang/Object",
      typeDescriptor: descriptor
    });
  }

  private compileMethod(methodNode: MethodDeclaration) {
    const header = methodNode.methodHeader;
    const methodName = header.identifier;
    const paramsType = header.formalParameterList.map(x => x.unannType);
    const resultType = header.result;

    const nameIndex = this.constantPoolManager.indexUtf8Info(methodName);
    const descriptor = this.symbolTable.generateMethodDescriptor(paramsType, resultType);
    const descriptorIndex = this.constantPoolManager.indexUtf8Info(descriptor);

    const attributes: Array<AttributeInfo> = [];
    attributes.push(generateCode(this.symbolTable, this.constantPoolManager, methodNode));

    this.methods.push({
      accessFlags: generateMethodAccessFlags(methodNode.methodModifier),
      nameIndex: nameIndex,
      descriptorIndex: descriptorIndex,
      attributesCount: attributes.length,
      attributes: attributes
    });
  }

  private compileConstructor(constructor: ConstructorDeclaration) {
    const methodNode: MethodDeclaration = {
      kind: "MethodDeclaration",
      methodModifier: constructor.constructorModifier,
      methodHeader: {
        identifier: "<init>",
        formalParameterList: constructor.constructorDeclarator.formalParameterList,
        result: "void",
      },
      methodBody: constructor.constructorBody
    };

    this.compileMethod(methodNode);
  }
}
