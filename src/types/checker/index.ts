import { Type } from "../types";
import { CstNode } from "java-parser";
import { Node } from "../../ast/types/ast";

export type Result = {
  currentType: Type | null;
  errors: Error[];
};

export const coalesceResults = (nodes: CstNode[]): Result => {
  return nodes.reduce<Result>(
    (previousResult, node) => {
      const currentResult: Result = { currentType: null, errors: [] };
      return {
        currentType: null,
        errors: previousResult.errors.concat(...currentResult.errors),
      };
    },
    { currentType: null, errors: [] }
  );
};

export const check = (node: Node): any => {
  switch (node.kind) {
  }
};
