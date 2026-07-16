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
    // Attach a short snippet of the source to help with debugging frontend submissions
    try {
      const msg = typeof e === 'string' ? e : (e && e.message) ? e.message : String(e);
      const previewLen = 200;
      const preview = programStr
        ? (programStr.length <= previewLen ? programStr : programStr.slice(0, previewLen) + '\n...')
        : '';
      const enhanced = `${msg}\n--- source preview (${Math.min(programStr ? programStr.length : 0, previewLen)} chars) ---\n${preview}`;
      throw new SyntaxError(enhanced);
    } catch (inner) {
      // Fallback to original error if something goes wrong building the enhanced message
      throw new SyntaxError(e);
    }
  }
}
