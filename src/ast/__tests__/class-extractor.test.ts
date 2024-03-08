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

describe("extract multiple NormalClassDeclaration correctly", () => {
  it("extract multiple NormalClassDeclaration correctly", () => {
    const programStr = `
      class Parent {}
      public class Test {}
    `;
  
    const expectedAst: AST = {
      kind: "CompilationUnit",
      topLevelClassOrInterfaceDeclarations: [
        {
          kind: "NormalClassDeclaration",
          classModifier: [],
          typeIdentifier: "Parent",
          classBody: [],
        },
        {
          kind: "NormalClassDeclaration",
          classModifier: [
            "public",
          ],
          typeIdentifier: "Test",
          classBody: [],
        },
      ],
    };
  
    const ast = parse(programStr);
    expect(ast).toEqual(expectedAst);
  });

  it("extract multiple NormalClassDeclaration with superclass correctly", () => {
    const programStr = `
      class Parent {}
      public class Test extends Parent {}
    `;
  
    const expectedAst: AST = {
      kind: "CompilationUnit",
      topLevelClassOrInterfaceDeclarations: [
        {
          kind: "NormalClassDeclaration",
          classModifier: [],
          typeIdentifier: "Parent",
          classBody: [],
        },
        {
          kind: "NormalClassDeclaration",
          classModifier: [
            "public",
          ],
          typeIdentifier: "Test",
          sclass: "Parent",
          classBody: [],
        },
      ],
    };
  
    const ast = parse(programStr);
    expect(ast).toEqual(expectedAst);
  });
});
