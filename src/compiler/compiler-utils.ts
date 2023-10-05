import { ACCESS_FLAGS } from "../ClassFile/types";
import { METHOD_FLAGS } from "../ClassFile/types/methods";
import { ClassModifier, FormalParameter, MethodModifier, UnannType } from "../ast/types/classes";

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

export function generateFieldDescriptor(typeName: UnannType) {
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
  } else if (typeName === "System") {
    typeName = "java/lang/System";
  } else if (typeName === "PrintStream") {
    typeName = "java/io/PrintStream";
  }
  return "[".repeat(dim) + (typeMap.has(typeName) ? typeMap.get(typeName) : 'L' + typeName + ';');
}

export function generateMethodDescriptor(params: Array<FormalParameter>, result: string) {
  const paramsDescriptor = params.map(p => generateFieldDescriptor(p.unannType)).join(",");
  const resultDescriptor = generateFieldDescriptor(result);

  return '(' + paramsDescriptor + ')' + resultDescriptor;
}

export function generateClassAccessFlags(modifiers: Array<ClassModifier>) {
  let flag = ACCESS_FLAGS.ACC_SUPER;

  if (modifiers.includes("public")) {
    flag |= ACCESS_FLAGS.ACC_PUBLIC;
  }
  if (modifiers.includes("final")) {
    flag |= ACCESS_FLAGS.ACC_FINAL;
  }
  if (modifiers.includes("abstract")) {
    flag |= ACCESS_FLAGS.ACC_ABSTRACT;
  }

  return flag;
}

const methodAccessFlagMap = new Map([
  ["public", METHOD_FLAGS.ACC_PUBLIC],
  ["protected", METHOD_FLAGS.ACC_PROTECTED],
  ["private", METHOD_FLAGS.ACC_PRIVATE],
  ["static", METHOD_FLAGS.ACC_STATIC],
  ["final", METHOD_FLAGS.ACC_FINAL],
  ["synchronized", METHOD_FLAGS.ACC_SYNCHRONIZED],
  ["native", METHOD_FLAGS.ACC_NATIVE],
  ["abstract", METHOD_FLAGS.ACC_ABSTRACT],
  ["strictfp", METHOD_FLAGS.ACC_STRICT]
]);

export function generateMethodAccessFlags(modifiers: Array<MethodModifier>) {
  let flag = 0;

  modifiers.forEach(m => {
    const value = methodAccessFlagMap.get(m) ?? 0;
    flag |= value;
  });

  return flag;
}
