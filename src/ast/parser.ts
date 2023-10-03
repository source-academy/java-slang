import { parse as parseToCst } from "java-parser";

import { ASTExtractor } from "./astExtractor/ast-extractor";
import { AST } from "./types/packages-and-modules";

export const parse = (programStr: string): AST | null => {
  const cst = parseToCst(programStr);
  const astExtractor = new ASTExtractor();
  const ast = astExtractor.extract(cst);
  return ast;
}
