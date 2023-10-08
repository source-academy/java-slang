import { ClassFile } from "../ClassFile/types";
import { AST } from "../ast/types/packages-and-modules";
import { ClassDeclaration, MethodBody, MethodDeclaration } from "../ast/types/classes";
import { AttributeInfo, CodeAttribute, ExceptionHandler } from "../ClassFile/types/attributes";
import { FieldInfo } from "../ClassFile/types/fields";
import { MethodInfo } from "../ClassFile/types/methods";
import { ConstantPoolManager } from "./constant-pool-manager";
import { generateClassAccessFlags, generateMethodAccessFlags, generateMethodDescriptor } from "./compiler-utils";

const MAGIC = 0xcafebabe;
const MINOR_VERSION = 0;
const MAJOR_VERSION = 61;

export class Compiler {
  private constantPoolManager: ConstantPoolManager;
  private interfaces: Array<number>;
  private fields: Array<FieldInfo>;
  private methods: Array<MethodInfo>;
  private attributes: Array<AttributeInfo>;

  constructor() {
    this.constantPoolManager = new ConstantPoolManager();
    this.interfaces = [];
    this.fields = [];
    this.methods = [];
    this.attributes = [];
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
    const body = methodNode.methodBody;
    const methodName = header.identifier;
    const params = header.formalParameterList;

    const nameIndex = this.constantPoolManager.indexUtf8Info(methodName);
    const descriptor = generateMethodDescriptor(params, header.result);
    const descriptorIndex = this.constantPoolManager.indexUtf8Info(descriptor);

    const attributes: Array<AttributeInfo> = [];
    attributes.push(this.addCodeAttribute(body));
    this.methods.push({
      accessFlags: generateMethodAccessFlags(methodNode.methodModifier),
      nameIndex: nameIndex,
      descriptorIndex: descriptorIndex,
      attributesCount: attributes.length,
      attributes: attributes
    });
  }

  private addCodeAttribute(block: MethodBody): CodeAttribute {
    let maxStack = 0;
    let maxLocals = 1;
    const code: number[] = [];
    const exceptionTable: Array<ExceptionHandler> = [];
    const attributes: Array<AttributeInfo> = [];

    code.push(0xb1);
    const codeBuf = new Uint8Array(code).buffer;
    const dataView = new DataView(codeBuf);
    code.forEach((x, i) => dataView.setUint8(i, x));

    const attributeLength = 12 + code.length + 8 * exceptionTable.length +
      attributes.map(attr => attr.attributeLength + 6).reduce((acc, val) => acc + val, 0);
    return {
      attributeNameIndex: this.constantPoolManager.indexUtf8Info("Code"),
      attributeLength: attributeLength,
      maxStack: maxStack,
      maxLocals: maxLocals,
      codeLength: code.length,
      code: dataView,
      exceptionTableLength: exceptionTable.length,
      exceptionTable: exceptionTable,
      attributesCount: attributes.length,
      attributes: attributes
    }
  }
}
