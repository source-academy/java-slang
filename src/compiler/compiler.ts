import { ClassFile } from "../ClassFile/types";
import { AST } from "../ast/types/packages-and-modules";
import { ClassDeclaration, MethodBody, MethodDeclaration, UnannType } from "../ast/types/classes";
import { AttributeType, CodeAttribute, ExceptionHandler } from "../ClassFile/types/attributes";
import { FieldType } from "../ClassFile/types/fields";
import { MethodType } from "../ClassFile/types/methods";
import { ConstantPoolManager } from "./constant-pool-manager";

const MAGIC = 0xcafebabe;
const MINOR_VERSION = 0;
const MAJOR_VERSION = 61;

let constantPoolManager: ConstantPoolManager = new ConstantPoolManager();
let interfaces: Array<string> = [];
let fields: Array<FieldType> = [];
let methods: Array<MethodType> = [];
let attributes: Array<AttributeType> = [];

function addUtf8Info(value: string) {
  return constantPoolManager.addUtf8Info({ value: value });
}

function addClassInfo(className: string) {
  return constantPoolManager.addClassInfo({
    name: { value: className }
  });
}

function addMethodrefInfo(className: string, methodName: string, descriptor: string) {
  return constantPoolManager.addMethodrefInfo({
    class: {
      name: { value: className, }
    },
    nameAndType: {
      name: { value: methodName },
      descriptor: { value: descriptor },
    }
  });
}

function addCodeAttribute(block: MethodBody): CodeAttribute {
  const maxStack = 0;
  const maxLocals = 1;
  const code = [];
  const exceptionTable: Array<ExceptionHandler> = [];
  const attributes: Array<AttributeType> = [];

  code.push(0xb1);
  const attributeLength = 12 + code.length + 8 * exceptionTable.length +
    attributes.map(attr => attr.attributeLength + 6).reduce((acc, val) => acc + val, 0);
  const codeBuf = new Uint8Array(code).buffer;
  const dataView = new DataView(codeBuf);
  code.forEach((x, i) => dataView.setUint8(i, x));
  return {
    attributeNameIndex: addUtf8Info("Code"),
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

function generateDescriptor(typeName: UnannType) {
  const typeMap = new Map([
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

  let dim = 0;
  let last = typeName.length;
  for (let i = typeName.length - 1; i >= 0; i--) {
    if (typeName[i] === '[') {
      dim++;
      last = i;
    }
  }

  typeName = typeName.slice(0, last);
  if (typeName === "String") {
    typeName = "java/lang/String";
  }
  return "[".repeat(dim) + (typeMap.has(typeName) ? typeMap.get(typeName) : 'L' + typeName + ';');
}

function compileMethod(methodNode: MethodDeclaration) {
  const header = methodNode.methodHeader;
  const body = methodNode.methodBody;
  const methodName = header.methodDeclarator.identifier;
  const params = header.methodDeclarator.formalParameterList;

  addUtf8Info(methodName);
  const descriptor = '(' + params.map(p => generateDescriptor(p.unannType)).join("") + ')'
    + generateDescriptor(header.result);
  addUtf8Info(descriptor);

  const attributes: Array<AttributeType> = [];
  attributes.push(addCodeAttribute(body));
  methods.push({
    accessFlags: 9,
    nameIndex: addUtf8Info(methodName),
    descriptorIndex: addUtf8Info(descriptor),
    attributesCount: attributes.length,
    attributes: attributes
  });
}

function compileClass(classNode: ClassDeclaration): ClassFile {
  constantPoolManager = new ConstantPoolManager();
  interfaces = [];
  fields = [];
  methods = [];
  attributes = [];

  const parentClassName = "java/lang/Object";
  const className = classNode.typeIdentifier;
  addMethodrefInfo(parentClassName, "<init>", "()V");
  addClassInfo(className);
  addUtf8Info("Code");
  classNode.classBody.forEach(m => compileMethod(m));

  const constantPool = constantPoolManager.getPool();
  return {
    magic: MAGIC,
    minorVersion: MINOR_VERSION,
    majorVersion: MAJOR_VERSION,
    constantPoolCount: constantPool.length + 1,
    constantPool: constantPool,
    accessFlags: 0x0001 | 0x0020,
    thisClass: addClassInfo(className),
    superClass: addClassInfo(parentClassName),
    interfacesCount: interfaces.length,
    interfaces: interfaces,
    fieldsCount: fields.length,
    fields: fields,
    methodsCount: methods.length,
    methods: methods,
    attributesCount: attributes.length,
    attributes: attributes
  };
}

export class Compiler {
  compile(ast: AST) {
    const classFiles: Array<ClassFile> = [];
    ast.forEach(x => classFiles.push(compileClass(x)));
    return classFiles[0];
  }
}
