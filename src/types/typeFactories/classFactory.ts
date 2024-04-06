import { Class, ClassImpl } from '../types/classes'
import { Frame } from '../checker/environment'
import {
  ConstructorDeclaration,
  MethodDeclaration,
  NormalClassDeclaration
} from '../ast/types/classes'
import { Method, MethodSignature } from '../types/methods'

type CreateMethod = (node: MethodDeclaration) => MethodSignature | Error
type CreateConstructor = (node: ConstructorDeclaration) => MethodSignature | Error

export const createClass = (
  node: NormalClassDeclaration,
  frame: Frame,
  createConstructor: CreateConstructor,
  createMethod: CreateMethod
): Class | Error => {
  const classType = new ClassImpl(node.typeIdentifier)
  frame.setType(node.typeIdentifier, classType)
  if (node.extendsTypeIdentifier) {
    const extendsType = frame.getType(node.extendsTypeIdentifier)
    if (extendsType instanceof Error) return extendsType
    if (!(extendsType instanceof ClassImpl)) throw new Error('class can only extend another class')
    classType.setParentClass(extendsType)
  }

  for (const bodyNode of node.classBody) {
    switch (bodyNode.kind) {
      case 'ConstructorDeclaration': {
        const methodSignature = createConstructor(bodyNode)
        if (methodSignature instanceof Error) return methodSignature
        const constructor = classType.accessConstructor()
        if (constructor) constructor.addOverload(methodSignature)
        else classType.setConstructor(new Method(methodSignature))
        break
      }
      case 'FieldDeclaration': {
        const fieldType = frame.getType(bodyNode.fieldType)
        if (fieldType instanceof Error) return fieldType
        for (const declarator of bodyNode.variableDeclaratorList) {
          const error = classType.setField(declarator.variableDeclaratorId, fieldType)
          if (error instanceof Error) return error
        }
        break
      }
      case 'MethodDeclaration': {
        const methodSignature = createMethod(bodyNode)
        if (methodSignature instanceof Error) return methodSignature
        if (!classType.hasMethod(bodyNode.methodHeader.identifier)) {
          classType.setMethod(bodyNode.methodHeader.identifier, new Method(methodSignature))
          break
        }
        const method = classType.accessMethod(bodyNode.methodHeader.identifier)
        if (method instanceof Error) throw new Error('method here should not be an error')
        method.addOverload(methodSignature)
        break
      }
    }
  }

  return classType
}
