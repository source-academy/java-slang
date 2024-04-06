import { Class, ClassImpl, ObjectClass } from '../types/classes'
import { ConstructorDeclaration, MethodDeclaration } from '../ast/types/classes'
import { createClass } from '../typeFactories/classFactory'
import { createMethodSignature } from '../typeFactories/methodFactory'
import { CyclicInheritanceError } from '../errors'
import { MethodSignature } from '../types/methods'
import { Node } from '../ast/types'
import { Frame } from './environment'
import { newResult, OK_RESULT, Result } from '.'

export const addClassesToFrame = (node: Node, frame: Frame): Result => {
  switch (node.kind) {
    case 'CompilationUnit': {
      const errors: Error[] = []
      for (const classDeclaration of node.topLevelClassOrInterfaceDeclarations) {
        const result = addClassesToFrame(classDeclaration, frame)
        if (result.errors.length > 0) errors.push(...result.errors)
      }
      if (errors.length > 0) return newResult(null, errors)
      return OK_RESULT
    }
    case 'ConstructorDeclaration':
    case 'MethodDeclaration': {
      const methodSignature = createMethodSignature(frame, node)
      if (methodSignature instanceof Error) return newResult(null, [methodSignature])
      return newResult(methodSignature)
    }
    case 'NormalClassDeclaration': {
      const createMethod = (node: ConstructorDeclaration | MethodDeclaration) => {
        const result = addClassesToFrame(node, frame)
        if (result.errors.length > 0) return result.errors[0]
        return result.currentType as MethodSignature
      }

      const classType = createClass(node, frame, createMethod, createMethod)
      if (classType instanceof Error) return newResult(null, [classType])
      return newResult(classType)
    }
    default:
      return OK_RESULT
  }
}

export const resolveClassRelationships = (node: Node, frame: Frame): Result => {
  switch (node.kind) {
    case 'CompilationUnit': {
      const errors: Error[] = []
      for (const classDeclaration of node.topLevelClassOrInterfaceDeclarations) {
        const result = resolveClassRelationships(classDeclaration, frame)
        if (result.errors.length > 0) errors.push(...result.errors)
      }
      if (errors.length > 0) return newResult(null, errors)
      return OK_RESULT
    }
    case 'NormalClassDeclaration': {
      const classType = frame.getType(node.typeIdentifier)
      if (classType instanceof Error) return newResult(null, [classType])
      if (!(classType instanceof ClassImpl)) throw new Error('class type should be a ClassImpl')
      if (node.extendsTypeIdentifier) {
        const extendsType = frame.getType(node.extendsTypeIdentifier)
        if (extendsType instanceof Error) return newResult(null, [extendsType])
        if (!(extendsType instanceof ClassImpl))
          throw new Error('class can only extend another class')
        let type: Class = extendsType
        while (!(type instanceof ObjectClass)) {
          if (type === classType) return newResult(null, [new CyclicInheritanceError()])
          type = type.getParentClass()
        }
        classType.setParentClass(extendsType)
      }
      return newResult(classType)
    }
    default:
      return OK_RESULT
  }
}
