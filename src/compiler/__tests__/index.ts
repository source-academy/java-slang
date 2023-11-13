import { printlnTest } from "./tests/println.test";
import { variableDeclarationTest } from "./tests/variableDeclaration.test";
import { arithmeticExpressionTest } from "./tests/arithmeticExpression.test";
import { ifElseTest } from "./tests/ifElse.test";
import { whileTest } from "./tests/while.test";
import { forTest } from "./tests/for.test";

describe("compiler tests", () => {
  printlnTest();
  variableDeclarationTest();
  arithmeticExpressionTest();
  ifElseTest();
  whileTest();
  forTest();
})