import { Node } from '../ast/types'
import { createClass } from '../typeFactories/classFactory'
import { MethodSignature } from '../types/methods'
import { ConstructorDeclaration, MethodDeclaration } from '../ast/types/classes'
import { createMethodSignature } from '../typeFactories/methodFactory'
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
