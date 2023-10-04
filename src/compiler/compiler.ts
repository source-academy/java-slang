import { ClassFile } from "../ClassFile/types";
import { AST } from "../ast/types/packages-and-modules";
import { ClassDeclaration, MethodBody, MethodDeclaration } from "../ast/types/classes";
import { AttributeInfo, CodeAttribute, ExceptionHandler } from "../ClassFile/types/attributes";
import { FieldInfo } from "../ClassFile/types/fields";
import { MethodInfo } from "../ClassFile/types/methods";
import { ConstantPoolManager } from "./constant-pool-manager";
import { generateClassAccessFlags, generateFieldDescriptor, generateMethodAccessFlags, generateMethodDescriptor } from "./compiler-utils";

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
    ast.forEach(x => classFiles.push(this.compileClass(x)));
    return classFiles[0];
  }

  private compileClass(classNode: ClassDeclaration): ClassFile {
    const parentClassName = "java/lang/Object";
    const className = classNode.typeIdentifier;
    this.addMethodrefInfo(parentClassName, "<init>", "()V");
    const superClassIndex = this.addClassInfo(parentClassName);
    const thisClassIndex = this.addClassInfo(className);
    this.addUtf8Info("Code");
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

  private addUtf8Info(value: string) {
    return this.constantPoolManager.addUtf8Info({ value: value });
  }

  private addClassInfo(className: string) {
    return this.constantPoolManager.addClassInfo({
      name: { value: className }
    });
  }

  private addStringInfo(string: string) {
    return this.constantPoolManager.addStringInfo({
      string: { value: string }
    })
  }

  private addFieldrefInfo(className: string, fieldName: string, descriptor: string) {
    return this.constantPoolManager.addFieldrefInfo({
      class: {
        name: { value: className, }
      },
      nameAndType: {
        name: { value: fieldName },
        descriptor: { value: descriptor },
      }
    });
  }

  private addMethodrefInfo(className: string, methodName: string, descriptor: string) {
    return this.constantPoolManager.addMethodrefInfo({
      class: {
        name: { value: className, }
      },
      nameAndType: {
        name: { value: methodName },
        descriptor: { value: descriptor },
      }
    });
  }

  private compileMethod(methodNode: MethodDeclaration) {
    const header = methodNode.methodHeader;
    const body = methodNode.methodBody;
    const methodName = header.methodDeclarator.identifier;
    const params = header.methodDeclarator.formalParameterList;

    const nameIndex = this.addUtf8Info(methodName);
    const descriptor = generateMethodDescriptor(params, header.result);
    const descriptorIndex = this.addUtf8Info(descriptor);

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
    const code = [];
    const exceptionTable: Array<ExceptionHandler> = [];
    const attributes: Array<AttributeInfo> = [];

    const out = this.addFieldrefInfo(
      "java/lang/System", "out", generateFieldDescriptor("PrintStream"));
    const println = this.addMethodrefInfo(
      "java/io/PrintStream", "println", generateMethodDescriptor([{ unannType: "String", variableDeclaratorId: "" }], "void"));
    const str = this.addStringInfo("I am Hello world!");
    {
      let stackSize = 0;
      code.push(0xb2, 0, out);
      stackSize++;
      code.push(0x12, str);
      stackSize++;
      code.push(0xb6, 0, println);
      maxStack = Math.max(maxStack, stackSize);
    }

    code.push(0xb1);
    const codeBuf = new Uint8Array(code).buffer;
    const dataView = new DataView(codeBuf);
    code.forEach((x, i) => dataView.setUint8(i, x));

    const attributeLength = 12 + code.length + 8 * exceptionTable.length +
      attributes.map(attr => attr.attributeLength + 6).reduce((acc, val) => acc + val, 0);
    return {
      attributeNameIndex: this.addUtf8Info("Code"),
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
