import { ClassBodyDeclaration, ClassDeclaration } from '../ast/types/classes'
import { AST } from '../ast/types/packages-and-modules'
import { MainMethodNotFoundError, MultiplePublicClassesError, NoMainClassError } from './error'

const bodyDeclarationsOf = (decl: ClassDeclaration): Array<ClassBodyDeclaration> =>
  decl.kind === 'EnumDeclaration' ? decl.enumBody.bodyMembers ?? [] : decl.classBody

const declaresMainMethod = (decl: ClassDeclaration): boolean =>
  bodyDeclarationsOf(decl).some(
    d =>
      d.kind === 'MethodDeclaration' &&
      d.methodModifier.includes('public') &&
      d.methodModifier.includes('static') &&
      d.methodHeader.result === 'void' &&
      d.methodHeader.identifier === 'main' &&
      d.methodHeader.formalParameterList.length === 1 &&
      d.methodHeader.formalParameterList[0].unannType === 'String[]'
  )

/**
 * Picks the top-level class whose `public static void main(String[])` is the
 * program's entry point, returning its name.
 *
 * - Two or more public top-level classes: error (Java allows at most one public
 *   top-level type per file, as the file is named after it).
 * - Exactly one: it is the main class and must declare `main`; this stands in
 *   for the file name, which a source string does not have.
 * - None: the first top-level class, in source order, that declares `main`.
 *
 * Only top-level declarations are considered; nested types are ignored.
 */
export const findMainClass = (ast: AST): string => {
  const declarations = ast.topLevelClassOrInterfaceDeclarations
  const publicClasses = declarations.filter(decl => decl.classModifier.includes('public'))

  if (publicClasses.length > 1) {
    throw new MultiplePublicClassesError(publicClasses.map(decl => decl.typeIdentifier))
  }
  if (publicClasses.length === 1) {
    const [publicClass] = publicClasses
    if (!declaresMainMethod(publicClass)) {
      throw new MainMethodNotFoundError(publicClass.typeIdentifier)
    }
    return publicClass.typeIdentifier
  }

  const mainClass = declarations.find(declaresMainMethod)
  if (!mainClass) {
    throw new NoMainClassError()
  }
  return mainClass.typeIdentifier
}
