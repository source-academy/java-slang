import { Class, ClassImpl } from '../types/classes'
import { Frame } from '../checker/environment'
import {
  ConstructorDeclaration,
  MethodDeclaration,
  NormalClassDeclaration
} from '../ast/specificationTypes'
import { Method, MethodSignature } from '../types/methods'
import { unannTypeToString } from '../ast/utils'
import { TypeCheckerError } from '../errors'

type CreateMethod = (node: MethodDeclaration) => MethodSignature | TypeCheckerError
type CreateConstructor = (node: ConstructorDeclaration) => MethodSignature | TypeCheckerError

export const createClassFieldsAndMethods = (
  node: NormalClassDeclaration,
  frame: Frame,
  createConstructor: CreateConstructor,
  createMethod: CreateMethod
): Class | TypeCheckerError => {
  const classType = frame.getType(node.typeIdentifier.identifier, node.typeIdentifier.location)
  if (classType instanceof TypeCheckerError) throw new Error('expected class type to be retrieved')
  if (!(classType instanceof ClassImpl)) throw new Error('expected class type to be retrieved')

  for (const bodyNode of node.classBody.classBodyDeclarations) {
    switch (bodyNode.kind) {
      case 'ConstructorDeclaration': {
        const methodSignature = createConstructor(bodyNode)
        if (methodSignature instanceof TypeCheckerError) return methodSignature
        const constructor = classType.accessConstructor()
        if (constructor) constructor.addOverload(methodSignature, bodyNode.location)
        else classType.setConstructor(new Method(methodSignature))
        break
      }
      case 'FieldDeclaration': {
        const fieldType = frame.getType(
          unannTypeToString(bodyNode.unannType),
          bodyNode.unannType.location
        )
        if (fieldType instanceof TypeCheckerError) return fieldType
        for (const declarator of bodyNode.variableDeclaratorList.variableDeclarators) {
          const error = classType.setField(
            declarator.variableDeclaratorId.identifier.identifier,
            fieldType
          )
          if (error instanceof TypeCheckerError) return error
        }
        break
      }
      case 'MethodDeclaration': {
        const methodSignature = createMethod(bodyNode)
        if (methodSignature instanceof TypeCheckerError) return methodSignature
        const methodName = bodyNode.methodHeader.methodDeclarator.identifier.identifier
        if (!classType.hasMethod(methodName)) {
          classType.setMethod(methodName, new Method(methodSignature))
          break
        }
        const method = classType.accessMethod(
          methodName,
          bodyNode.methodHeader.methodDeclarator.identifier.location
        )
        if (method instanceof TypeCheckerError)
          throw new Error('method here should not be an error')
        method.addOverload(methodSignature, bodyNode.location)
        break
      }
    }
  }

  return classType
}
