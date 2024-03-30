import { UnannType } from "../ast/types/classes";
import { DECLARED_BUT_NOT_YET_ASSIGNED, GLOBAL_FRAME, OBJECT_FRAME } from "./constants";
import * as errors from "./errors";
import {
  Class,
  Closure,
  ControlItem,
  Name,
  Object,
  StashItem,
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
  private _objects: Object[] = [];

  constructor() {
    const node = new EnvNode(GLOBAL_FRAME);
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

  extendEnv(fromEnv: EnvNode, name: string) {
    // Create new environemnt.
    const node = new EnvNode(name);
    node.parent = fromEnv;
    fromEnv.addChild(node);

    // Set current environment.
    this._current = node;
  }

  createObj(c: Class): Object {
    // Create new environment.
    const node = new EnvNode(OBJECT_FRAME);

    // Create new object.
    const obj = {
      kind: "Object",
      frame: node,
      class: c,
    } as Object;

    // Add to objects arr.
    this._objects.push(obj);

    // Set current environment.
    this._current = node;

    return obj;
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
