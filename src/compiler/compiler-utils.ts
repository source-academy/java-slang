import { ACCESS_FLAGS } from "../ClassFile/types";
import { FIELD_FLAGS } from "../ClassFile/types/fields";
import { METHOD_FLAGS } from "../ClassFile/types/methods";
import { ClassModifier, MethodModifier } from "../ast/types/classes";

const classAccessFlagMap = new Map([
  ["public", ACCESS_FLAGS.ACC_PUBLIC],
  ["final", ACCESS_FLAGS.ACC_FINAL],
  ["abstract", ACCESS_FLAGS.ACC_ABSTRACT],
]);

export function generateClassAccessFlags(modifiers: Array<ClassModifier>) {
  let flag = ACCESS_FLAGS.ACC_SUPER;

  modifiers.forEach(m => {
    const value = classAccessFlagMap.get(m) ?? 0;
    flag |= value;
  });

  return flag;
}

const fieldAccessFlagMap = new Map([
  ["public", FIELD_FLAGS.ACC_PUBLIC],
  ["protected", FIELD_FLAGS.ACC_PROTECTED],
  ["private", FIELD_FLAGS.ACC_PRIVATE],
  ["static", FIELD_FLAGS.ACC_STATIC],
  ["final", FIELD_FLAGS.ACC_FINAL],
  ["transient", FIELD_FLAGS.ACC_TRANSIENT],
  ["volatile", FIELD_FLAGS.ACC_VOLATILE],
]);

export function generateFieldAccessFlags(modifiers: Array<MethodModifier>) {
  let flag = 0;

  modifiers.forEach(m => {
    const value = fieldAccessFlagMap.get(m) ?? 0;
    flag |= value;
  });

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
