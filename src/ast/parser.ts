import { parse as parseToCst } from "java-parser";

import { SyntaxError } from "../ec-evaluator/errors";
import { ASTExtractor } from "./astExtractor/ast-extractor";
import { AST } from "./types/packages-and-modules";

/**
 * Parse program string into Abstract Syntax Tree (AST).
 * @throws {SyntaxError} Throw error if program is syntactically invalid.
 */
export const parse = (programStr: string): AST => {
  try {
    const cst = parseToCst(programStr);
    const astExtractor = new ASTExtractor();
    const ast = astExtractor.extract(cst);
    return ast;
  } catch (e) {
    throw new SyntaxError(e);
  }
}
