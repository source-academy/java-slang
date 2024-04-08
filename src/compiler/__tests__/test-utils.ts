import { inspect } from "util";
import { Compiler } from "../compiler";
import { BinaryWriter } from "../binary-writer";
import { AST } from "../../ast/types/packages-and-modules";
import { execSync } from "child_process";

import * as peggy from "peggy";
import * as fs from "fs";

export type testCase = {
  comment: string,
  program: string,
  expectedLines: string[],
}

const debug = false;
const pathToTestDir = "./src/compiler/__tests__/";
const javaPegGrammar = fs.readFileSync('./src/compiler/__tests__/main.pegjs', 'utf-8');
const parser = peggy.generate(javaPegGrammar, {
  allowedStartRules: ["CompilationUnit"],
});
const compiler = new Compiler();
const binaryWriter = new BinaryWriter();

export function runTest(program: string, expectedLines: string[]) {
  const ast = parser.parse(program);
  expect(ast).not.toBeNull();

  if (debug) {
    console.log(inspect(ast, false, null, true));
  }

  const classFile = compiler.compile(ast as AST);
  binaryWriter.writeBinary(classFile, pathToTestDir);

  const prevDir = process.cwd();
  process.chdir(pathToTestDir);
  execSync("java -noverify Main > output.log 2> err.log");

  // ignore difference between \r\n and \n
  const actualLines = fs.readFileSync("./output.log", 'utf-8').split(/\r?\n/).slice(0, -1);
  process.chdir(prevDir);

  expect(actualLines).toStrictEqual(expectedLines);
}

describe("compiler's test utils", () => {
  it("Prevent jest from complaining", () => { });
});