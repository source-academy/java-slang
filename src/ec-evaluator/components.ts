import { ConstructorDeclaration, MethodDeclaration, UnannType } from "../ast/types/classes";
import { DECLARED_BUT_NOT_YET_ASSIGNED } from "./constants";
import * as errors from "./errors";
import {
  Class,
  Closure,
  ControlItem,
  Name,
  StashItem,
  Type,
  Value,
  VarValue,
  Variable,
} from "./types";
import { Stack } from "./utils";

/**
 * Components of CSE Machine.
 */
export class Control extends Stack<ControlItem> {};
export class Stash extends Stack<StashItem> {};

export class Environment {
  private _global: EnvNode;
  private _current: EnvNode;

  constructor() {
    const node = new EnvNode("global");
    this._global = node;
    this._current = node;
  }

  get global() {
    return this._global;
  }

  get current() {
    return this._current;
  }

  set current(node: EnvNode) {
    this._current = node;
  }

  extendEnv(fromEnv: EnvNode, name: string = "object") {
    // Create new environemnt.
    const node = new EnvNode(name);
    node.parent = fromEnv;
    fromEnv.addChild(node);

    // Set current environment.
    this._current = node;
  }

  restoreEnv(toEnv: EnvNode) {
    this._current = toEnv;
  }

  declareVariable(name: Name, type: UnannType) {
    const variable: Variable = {
      kind: "Variable",
      type,
      name,
      value: DECLARED_BUT_NOT_YET_ASSIGNED,
    } as Variable;
    this._current.setVariable(name, variable);
  }

  defineVariable(name: Name, type: UnannType, value: VarValue) {
    const variable = {
      kind: "Variable",
      type,
      name,
      value,
    } as Variable;
    this._current.setVariable(name, variable);
  }

  getName(name: Name): Variable | Class {
    return this._current.getName(name);
  }

  getVariable(name: Name): Variable {
    return this._current.getVariable(name);
  }

  defineMtdOrCon(name: Name, method: Closure) {
    this._current.setMtdOrCon(name, method);
  }

  defineClass(name: Name, c: Class) {
    this._global.setClass(name, c);
  }

  getClass(name: Name): Class {
    return this._global.getClass(name);
  }
};

// Frame with metadata, e.g., parent/children, name.
export class EnvNode {
  private _frame: Frame = new Frame();
  private _parent: EnvNode;
  private _children: EnvNode[] = [];

  constructor(readonly name: string) {}

  get frame() {
    return this._frame;
  }

  get parent(): EnvNode {
    return this._parent;
  }

  set parent(parent: EnvNode) {
    this._parent = parent;
  }

  get children() {
    return this._children;
  }

  addChild(child: EnvNode) {
    this._children.push(child);
  }

  setVariable(name: Name, value: Variable) {
    if (this._frame.has(name)) {
      throw new errors.VariableRedeclarationError(name);
    }
    this._frame.set(name, value);
  }

  getName(name: Name): Variable | Class {
    if (this._frame.has(name)) {
      return this._frame.get(name) as Variable | Class;
    }
    if (this._parent) {
      return this._parent.getName(name);
    }
    throw new errors.UndeclaredNameError(name);
  }

  getVariable(name: Name): Variable {
    if (this._frame.has(name)) {
      return this._frame.get(name) as Variable;
    }
    if (this._parent) {
      return this._parent.getVariable(name);
    }
    throw new errors.UndeclaredVariableError(name);
  }

  setMtdOrCon(name: Name, value: Closure) {
    if (this._frame.has(name)) {
      throw new errors.MtdOrConRedeclarationError(name);
    }
    this._frame.set(name, value);
  }

  resOverload(name: string, argTypes: Type[]): Closure {
    const closures: Closure[] = [];
    for (const [closureName, closure] of this._frame.entries()) {
      // Methods contains parantheses and must have return type.
      if (closureName.includes(name + "(") && closureName[closureName.length - 1] !== ")") {
        closures.push(closure as Closure);
      }
    }

    let resolved: Closure | undefined;
    for (const closure of closures) {
      const params = (closure.mtdOrCon as MethodDeclaration).methodHeader.formalParameterList;
        
      if (argTypes.length != params.length) continue;
      
      let match = true;
      for (let i = 0; i < argTypes.length; i++) {
        match &&= (params[i].unannType === argTypes[i].type);
        if (!match) break; // short circuit
      }
      
      if (match) {
        resolved = closure;
        break;
      }
    }

    if (!resolved) {
      throw new errors.ResOverloadError(name, argTypes);
    }

    return resolved;
  }

  resConOverload(name: string, argTypes: Type[]): Closure {
    const closures: Closure[] = [];
    for (const [closureName, closure] of this._frame.entries()) {
      // Constructors contains parantheses and do not have return type.
      if (closureName.includes(name + "(") && closureName[closureName.length - 1] === ")") {
        closures.push(closure as Closure);
      }
    }

    let resolved: Closure | undefined;
    for (const closure of closures) {
      const params = (closure.mtdOrCon as ConstructorDeclaration).constructorDeclarator.formalParameterList;
        
      if (argTypes.length != params.length) continue;
      
      let match = true;
      for (let i = 0; i < argTypes.length; i++) {
        match &&= (params[i].unannType === argTypes[i].type);
        if (!match) break; // short circuit
      }
      
      if (match) {
        resolved = closure;
        break;
      }
    }

    if (!resolved) {
      throw new errors.ResConOverloadError(name, argTypes);
    }

    return resolved;
  }

  setClass(name: Name, value: Class) {
    if (this._frame.has(name)) {
      throw new errors.ClassRedeclarationError(name);
    }
    this._frame.set(name, value);
  }

  getClass(name: Name): Class {
    if (this._frame.has(name)) {
      return this._frame.get(name) as Class;
    }
    if (this._parent) {
      return this._parent.getClass(name);
    }
    throw new errors.UndeclaredClassError(name);
  }
}

export class Frame extends Map<Name, Value> {}
