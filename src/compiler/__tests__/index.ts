import { printlnTest } from "./tests/println.test";
import { variableDeclarationTest } from "./tests/variableDeclaration.test";
import { arithmeticExpressionTest } from "./tests/arithmeticExpression.test";
import { ifElseTest } from "./tests/ifElse.test";
import { whileTest } from "./tests/while.test";
import { forTest } from "./tests/for.test";
import { unaryExpressionTest } from "./tests/unaryExpression.test";
import { methodInvocationTest } from "./tests/methodInvocation.test";
import { importTest } from "./tests/import.test";
import { arrayTest } from "./tests/array.test";
import { classTest } from "./tests/class.test";

describe("compiler tests", () => {
  printlnTest();
  variableDeclarationTest();
  arithmeticExpressionTest();
  unaryExpressionTest();
  ifElseTest();
  whileTest();
  forTest();
  methodInvocationTest();
  importTest();
  arrayTest();
  classTest();
})