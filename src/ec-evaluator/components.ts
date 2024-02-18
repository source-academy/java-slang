import { DECLARED_BUT_NOT_YET_ASSIGNED } from "./constants";
import * as errors from "./errors";
import { Closure, ControlItem, Name, StashItem, Value, VarValue, Variable } from "./types";
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
    const node = new EnvNode("Test");
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

  declareVariable(name: Name) {
    const variable: Variable = {
      kind: "Variable",
      name,
      value: DECLARED_BUT_NOT_YET_ASSIGNED,
    } as Variable;
    this._current.setVariable(name, variable);
  }

  defineVariable(name: Name, value: VarValue) {
    const variable = {
      kind: "Variable",
      name,
      value,
    } as Variable;
    this._current.setVariable(name, variable);
  }

  getVariable(name: Name): Variable {
    return this._current.getVariable(name);
  }

  getValue(name: Name): VarValue {
    return this._current.getValue(name);
  }

  defineMethod(name: Name, value: Closure) {
    this._current.setMethod(name, value);
  }

  getMethod(name: Name): Closure {
    return this._current.getMethod(name);
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

  setMethod(name: Name, value: Closure) {
    if (this._frame.has(name)) {
      throw new errors.MethodRedeclarationError(name);
    }
    this._frame.set(name, value);
  }

  getMethod(name: Name): Closure {
    if (this._frame.has(name)) {
      return this._frame.get(name) as Closure;
    }
    if (this._parent) {
      return this._parent.getMethod(name);
    }
    throw new errors.UndeclaredMethodError(name);
  }

  setVariable(name: Name, value: Variable) {
    if (this._frame.has(name)) {
      throw new errors.VariableRedeclarationError(name);
    }
    this._frame.set(name, value);
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

  getValue(name: Name): string {
    if (this._frame.has(name)) {
      // Variables must be definitely assigned prior to access
      if ((this._frame.get(name) as Variable).value === DECLARED_BUT_NOT_YET_ASSIGNED) {
        throw new errors.UnassignedVariableError(name);
      }
      return (this._frame.get(name) as Variable).value;
    }
    if (this._parent) {
      return this._parent.getValue(name);
    }
    throw new errors.UndeclaredVariableError(name);
  }
}

export class Frame extends Map<Name, Value> {}