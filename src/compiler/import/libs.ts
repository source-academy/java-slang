import { ClassModifier, FieldModifier, MethodModifier } from "../../ast/types/classes";
import { rawLibInfo } from "./lib-info";

type RawClassInfo = {
  name: string,
  fields?: string[],
  methods?: string[],
};

interface PackageInfo {
  packageName: string,
  classes: Array<ClassInfo>,
};

interface ClassInfo {
  className: string,
  accessFlags: Array<ClassModifier>,
  fields: Array<FieldInfo>,
  methods: Array<MethodInfo>,
};

interface FieldInfo {
  fieldName: string,
  accessFlags: Array<FieldModifier>,
  typeName: string,
};

interface MethodInfo {
  methodName: string,
  accessFlags: Array<MethodModifier>,
  argsTypeName: Array<string>,
  returnTypeName: string,
};

export type LibInfo = Array<PackageInfo>;

const dotToSlash = (s: string) => {
  return s.replaceAll('.', '/');
};

function convertMethodInfo(m: string): MethodInfo {
  const tokens = m.split(' ');
  const l = tokens.length;
  const s = tokens[l - 1];
  const lcurly = s.indexOf('(');
  const rcurly = s.indexOf(')');
  return {
    methodName: s.substring(0, lcurly),
    accessFlags: tokens.slice(0, l - 2) as Array<MethodModifier>,
    argsTypeName: s.substring(lcurly + 1, rcurly).split(',').map(dotToSlash),
    returnTypeName: dotToSlash(tokens[l - 2]),
  }
}

function convertFieldInfo(f: string): FieldInfo {
  const tokens = f.split(' ');
  const l = tokens.length;
  return {
    fieldName: tokens[l - 1],
    accessFlags: tokens.slice(0, l - 2) as Array<FieldModifier>,
    typeName: dotToSlash(tokens[l - 2]),
  }
}

function convertClassInfo(c: RawClassInfo): ClassInfo {
  const tokens = c.name.split(' ');
  const l = tokens.length;
  return {
    className: dotToSlash(tokens[l - 1]),
    accessFlags: tokens.slice(0, l - 1) as Array<ClassModifier>,
    fields: c.fields?.map(convertFieldInfo) ?? [],
    methods: c.methods?.map(convertMethodInfo) ?? [],
  }
}

export const libraries: LibInfo = rawLibInfo.packages.map(p => {
  return {
    packageName: dotToSlash(p.name),
    classes: p.classes.map(c => convertClassInfo(c)),
  };
});
