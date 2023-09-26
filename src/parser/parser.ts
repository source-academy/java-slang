import * as peggy from "peggy";
import { javaPegGrammar } from "./grammar";

const parser = peggy.generate(javaPegGrammar, {
  allowedStartRules: ["CompilationUnit"],
});

export function parse(input: string) {
  const ast = parser.parse(input);
  return ast;
}
