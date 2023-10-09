import { ClassFile } from "../ClassFile/types";
import { AST } from "../ast/types/packages-and-modules";
import { ClassDeclaration, MethodDeclaration } from "../ast/types/classes";
import { AttributeInfo } from "../ClassFile/types/attributes";
import { FieldInfo } from "../ClassFile/types/fields";
import { MethodInfo } from "../ClassFile/types/methods";
import { ConstantPoolManager } from "./constant-pool-manager";
import {
  generateClassAccessFlags,
  generateFieldDescriptor,
  generateMethodAccessFlags,
  generateMethodDescriptor
} from "./compiler-utils";
import { SymbolTable, SymbolType } from "./symbol-table";
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

  constructor() {
    this.symbolTable = new SymbolTable();
    this.constantPoolManager = new ConstantPoolManager();
    this.interfaces = [];
    this.fields = [];
    this.methods = [];
    this.attributes = [];
    this.setup();
  }

  private setup() {
    this.symbolTable.insert("out", SymbolType.CLASS, {
      parentClassName: "java/lang/System",
      typeDescriptor: generateFieldDescriptor("java/io/PrintStream")
    });
    this.symbolTable.insert("println", SymbolType.CLASS, {
      parentClassName: "java/io/PrintStream",
      typeDescriptor: generateMethodDescriptor(["java/lang/String"], "void")
    });
  }

  compile(ast: AST) {
    const classFiles: Array<ClassFile> = [];
    ast.topLevelClassOrInterfaceDeclarations.forEach(x => classFiles.push(this.compileClass(x)));
    return classFiles[0];
  }

  private compileClass(classNode: ClassDeclaration): ClassFile {
    const parentClassName = "java/lang/Object";
    const className = classNode.typeIdentifier;
    this.constantPoolManager.indexMethodrefInfo(parentClassName, "<init>", "()V");
    const superClassIndex = this.constantPoolManager.indexClassInfo(parentClassName);
    const thisClassIndex = this.constantPoolManager.indexClassInfo(className);
    this.constantPoolManager.indexUtf8Info("Code");
    classNode.classBody.forEach(m => this.compileMethod(m));

    const constantPool = this.constantPoolManager.getPool();
    return {
      magic: MAGIC,
      minorVersion: MINOR_VERSION,
      majorVersion: MAJOR_VERSION,
      constantPoolCount: constantPool.length + 1,
      constantPool: constantPool,
      accessFlags: generateClassAccessFlags(classNode.classModifier),
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

  private compileMethod(methodNode: MethodDeclaration) {
    const header = methodNode.methodHeader;
    const methodName = header.identifier;
    const params = header.formalParameterList;

    const nameIndex = this.constantPoolManager.indexUtf8Info(methodName);
    const descriptor = generateMethodDescriptor(params.map(x => x.unannType), header.result);
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
}
