export type AST = Array<ClassNode>;

export type Modifiers = Array<string>;

export type ClassNode = {
  type: "class";
  modifiers: Modifiers;
  name: string;
  body: {
    methods: Array<MethodNode>;
  }
};

export type Param = {
  typeName: string;
  argName: string;
};

export type MethodNode = {
  type: "method";
  modifiers: Modifiers;
  name: string;
  returnType: string;
  params: Array<Param>;
  body: Array<string>;
};
