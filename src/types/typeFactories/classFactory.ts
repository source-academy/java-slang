import { Class, ClassType } from '../types/classes'
import { Frame } from '../checker/environment'
import {
  ConstructorDeclaration,
  MethodDeclaration,
  NormalClassDeclaration
} from '../ast/specificationTypes'
import { Method } from '../types/methods'
import { unannTypeToString } from '../ast/utils'
import { TypeCheckerError } from '../errors'

type CreateMethod = (node: MethodDeclaration) => Method | TypeCheckerError
type CreateConstructor = (node: ConstructorDeclaration) => Method | TypeCheckerError

export const createClassFieldsAndMethods = (
  node: NormalClassDeclaration,
  frame: Frame,
  createConstructor: CreateConstructor,
  createMethod: CreateMethod
): Class | TypeCheckerError => {
  const classType = frame.getType(node.typeIdentifier.identifier, node.typeIdentifier.location)
  if (classType instanceof TypeCheckerError) throw new Error('expected class type to be retrieved')
  if (!(classType instanceof ClassType)) throw new Error('expected class type to be retrieved')

  for (const bodyNode of node.classBody.classBodyDeclarations) {
    switch (bodyNode.kind) {
      case 'ConstructorDeclaration': {
        const constructorMethod = createConstructor(bodyNode)
        if (constructorMethod instanceof TypeCheckerError) return constructorMethod
        const error = classType.addConstructor(constructorMethod, bodyNode.location)
        if (error instanceof TypeCheckerError) return error
        break
      }
      case 'FieldDeclaration': {
        const fieldType = frame.getType(
          unannTypeToString(bodyNode.unannType),
          bodyNode.unannType.location
        )
        if (fieldType instanceof TypeCheckerError) return fieldType
        for (const declarator of bodyNode.variableDeclaratorList.variableDeclarators) {
          const fieldIdentifier = declarator.variableDeclaratorId.identifier
          const error = classType.addField(
            fieldIdentifier.identifier,
            fieldType,
            fieldIdentifier.location
          )
          if (error instanceof TypeCheckerError) return error
        }
        break
      }
      case 'MethodDeclaration': {
        const methodSignature = createMethod(bodyNode)
        if (methodSignature instanceof TypeCheckerError) return methodSignature
        const methodName = bodyNode.methodHeader.methodDeclarator.identifier
        const error = classType.addMethod(
          methodName.identifier,
          methodSignature,
          methodName.location
        )
        if (error instanceof TypeCheckerError) return error
        break
      }
    }
  }

  return classType
}
