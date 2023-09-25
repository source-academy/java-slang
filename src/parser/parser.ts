import * as peggy from "peggy";
import { javaPegGrammar } from "./grammar";

const parser = peggy.generate(javaPegGrammar, {
  allowedStartRules: ["CompilationUnit"],
});

export function parse(input: string) {
  console.log(input);
  return parser.parse(input);
}
