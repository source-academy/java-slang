import { parse } from "../parser";
import { AST } from "../types/packages-and-modules";

describe("extract NormalClassDeclaration correctly", () => {
  it("extract NormalClassDeclaration without ClassModifier correctly", () => {
    const programStr = `
      class Test {}
    `;
  
    const expectedAst: AST = {
      kind: "CompilationUnit",
      topLevelClassOrInterfaceDeclarations: [
        {
          kind: "NormalClassDeclaration",
          classModifier: [],
          typeIdentifier: "Test",
          classBody: [],
        },
      ],
    };
  
    const ast = parse(programStr);
    expect(ast).toEqual(expectedAst);
  });
  
  it("extract NormalClassDeclaration with ClassModifier correctly", () => {
    const programStr = `
      public static class Test {}
    `;
  
    const expectedAst: AST = {
      kind: "CompilationUnit",
      topLevelClassOrInterfaceDeclarations: [
        {
          kind: "NormalClassDeclaration",
          classModifier: [
            "public",
            "static",
          ],
          typeIdentifier: "Test",
          classBody: [],
        },
      ],
    };
  
    const ast = parse(programStr);
    expect(ast).toEqual(expectedAst);
  });
});
