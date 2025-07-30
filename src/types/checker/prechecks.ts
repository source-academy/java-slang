import { Class, ClassType, ObjectClass } from '../types/classes'
import { ConstructorDeclaration, MethodDeclaration, Node } from '../ast/specificationTypes'
import { createClassFieldsAndMethods } from '../typeFactories/classFactory'
import { createMethod } from '../typeFactories/methodFactory'
import { CyclicInheritanceError, DuplicateClassError, TypeCheckerError } from '../errors'
import { Method } from '../types/methods'
import { Frame } from './environment'
import { newResult, OK_RESULT, Result } from '.'

// const TOP_LEVEL_DECLARATION_MODIFIER_BLACKLIST = ['protected', 'private', 'static']

export const addClasses = (node: Node, frame: Frame): Result => {
  switch (node.kind) {
    case 'OrdinaryCompilationUnit': {
      const typeCheckErrors = node.topLevelClassOrInterfaceDeclarations
        .map(declaration => addClasses(declaration, frame))
        .reduce((errors, result) => (result.hasErrors ? [...errors, ...result.errors] : errors), [])
      return newResult(null, typeCheckErrors)
    }
    case 'NormalClassDeclaration': {
      const classType = new ClassType(node.typeIdentifier.identifier)
      const errors: TypeCheckerError[] = []
      // node.classModifiers.forEach(modifier => {
      //   if (!TOP_LEVEL_DECLARATION_MODIFIER_BLACKLIST.includes(modifier.identifier))
      //     classType.setModifier(modifier.identifier)
      //   errors.push(new ModifierNotAllowedHereError(modifier.location))
      // })
      if (errors.length > 0) return newResult(null, errors)
      const error = frame.setType(
        node.typeIdentifier.identifier,
        classType,
        node.typeIdentifier.location
      )
      if (error instanceof Error) return newResult(null, [new DuplicateClassError(node.location)])
      return newResult(classType)
    }
    case 'EnumDeclaration': {
      throw new Error('Not implemented')
    }
    case 'RecordDeclaration': {
      throw new Error('Not implemented')
    }
    case 'NormalInterfaceDeclaration': {
      throw new Error('Not implemented')
    }
    default:
      return OK_RESULT
  }
}

export const addClassMethods = (node: Node, frame: Frame): Result => {
  switch (node.kind) {
    case 'OrdinaryCompilationUnit': {
      const typeCheckErrors = node.topLevelClassOrInterfaceDeclarations
        .map(declaration => addClassMethods(declaration, frame))
        .reduce((errors, result) => (result.hasErrors ? [...errors, ...result.errors] : errors), [])
      return newResult(null, typeCheckErrors)
    }
    case 'ConstructorDeclaration':
    case 'MethodDeclaration': {
      const method = createMethod(frame, node)
      if (method instanceof TypeCheckerError) return newResult(null, [method])
      return newResult(method)
    }
    case 'NormalClassDeclaration': {
      const createMethod = (
        node: ConstructorDeclaration | MethodDeclaration
      ): Method | TypeCheckerError => {
        const result = addClassMethods(node, frame)
        if (result.errors.length > 0) return result.errors[0]
        return result.currentType as Method
      }
      const classType = createClassFieldsAndMethods(node, frame, createMethod, createMethod)
      if (classType instanceof TypeCheckerError) return newResult(null, [classType])
      return newResult(classType)
    }
    default:
      return OK_RESULT
  }
}

export const addClassParents = (node: Node, frame: Frame): Result => {
  switch (node.kind) {
    case 'OrdinaryCompilationUnit': {
      const typeCheckErrors = node.topLevelClassOrInterfaceDeclarations
        .map(declaration => addClassParents(declaration, frame))
        .reduce((errors, result) => (result.hasErrors ? [...errors, ...result.errors] : errors), [])
      return newResult(null, typeCheckErrors)
    }
    case 'NormalClassDeclaration': {
      const classType = frame.getType(node.typeIdentifier.identifier, node.typeIdentifier.location)
      if (classType instanceof Error) return newResult(null, [classType])
      if (!(classType instanceof ClassType)) throw new Error('class type should be a ClassImpl')
      if (node.typeIdentifier.identifier === 'Object') {
        return newResult(null)
      }
      if (node.classExtends) {
        const extendsType = frame.getType(
          node.classExtends.classType.typeIdentifier.identifier,
          node.classExtends.classType.typeIdentifier.location
        )
        if (extendsType instanceof Error) return newResult(null, [extendsType])
        if (!(extendsType instanceof ClassType))
          throw new Error('class can only extend another class')
        let type: Class = extendsType
        while (!(type instanceof ObjectClass)) {
          if (type === classType)
            return newResult(null, [
              new CyclicInheritanceError(node.classExtends.classType.location)
            ])
          type = type.getParentClass()
        }
        classType.setParentClass(extendsType)
      } else {
        const objectType = frame.getType('Object', { startOffset: -1, startLine: -1 })
        classType.setParentClass(objectType as ObjectClass)
      }

      return newResult(classType)
    }
    default:
      return OK_RESULT
  }
}
