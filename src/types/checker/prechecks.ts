import { Class, ClassType, EnumClass, ObjectClass } from '../types/classes'
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

      // Register any nested enum declarations found anywhere in the compilation unit
      const registerNestedEnums = (obj: any) => {
        if (!obj || typeof obj !== 'object') return
        if (Array.isArray(obj)) {
          obj.forEach(registerNestedEnums)
          return
        }
        if (obj.kind === 'EnumDeclaration') {
          try {
            const enumType = new EnumClass(obj.typeIdentifier.identifier)
            const err = frame.setType(obj.typeIdentifier.identifier, enumType, obj.typeIdentifier.location)
                  if (err instanceof Error) {
              // duplicate class — add as error
              typeCheckErrors.push(new DuplicateClassError(obj.location))
            }
          } catch (e) {
            // ignore
          }
          return
        }
        Object.keys(obj).forEach(k => registerNestedEnums(obj[k]))
      }
      node.topLevelClassOrInterfaceDeclarations.forEach(registerNestedEnums)

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
      const enumType = new EnumClass(node.typeIdentifier.identifier)
      const errors: TypeCheckerError[] = []
      if (errors.length > 0) return newResult(null, errors)
      const error = frame.setType(
        node.typeIdentifier.identifier,
        enumType,
        node.typeIdentifier.location
      )
      if (error instanceof Error) return newResult(null, [new DuplicateClassError(node.location)])
      return newResult(enumType)
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

      // Also process any nested enum declarations (e.g., enums declared inside methods)
      const processNestedEnums = (obj: any) => {
        if (!obj || typeof obj !== 'object') return
        if (Array.isArray(obj)) {
          obj.forEach(processNestedEnums)
          return
        }
        if (obj.kind === 'EnumDeclaration') {
          const res = addClassMethods(obj, frame)
          if (res.hasErrors) typeCheckErrors.push(...res.errors)
          return
        }
        Object.keys(obj).forEach(k => processNestedEnums(obj[k]))
      }
      node.topLevelClassOrInterfaceDeclarations.forEach(processNestedEnums)

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
    case 'EnumDeclaration': {
      const createMethodLocal = (
        node: ConstructorDeclaration | MethodDeclaration
      ): Method | TypeCheckerError => {
        const result = addClassMethods(node, frame)
        if (result.errors.length > 0) return result.errors[0]
        return result.currentType as Method
      }

      // Populate enum constants and any class-body declarations (fields/methods/constructors)
      const classType = frame.getType(node.typeIdentifier.identifier, node.typeIdentifier.location)
      if (classType instanceof TypeCheckerError) return newResult(null, [classType])
      if (!(classType instanceof ClassType)) throw new Error('enum type should be a ClassImpl')

      // Add enum constants as fields of the enum type
      const enumConstants = node.enumBody.enumConstantList?.enumConstants || []
      for (const constant of enumConstants) {
        const fieldError = classType.addField(constant.identifier.identifier, classType, constant.location)
        if (fieldError instanceof TypeCheckerError) return newResult(null, [fieldError])
      }

      // Process body declarations similar to class body
      const bodyDecls = node.enumBody.enumBodyDeclarations?.classBodyDeclaration || []
      for (const bodyNode of bodyDecls) {
        switch (bodyNode.kind) {
          case 'ConstructorDeclaration': {
            const constructorMethod = createMethodLocal(bodyNode)
            if (constructorMethod instanceof TypeCheckerError) return newResult(null, [constructorMethod])
            const error = classType.addConstructor(constructorMethod, bodyNode.location)
            if (error instanceof TypeCheckerError) return newResult(null, [error])
            break
          }
          case 'FieldDeclaration': {
            const fieldType = frame.getType(
              (bodyNode as any).unannType ? (bodyNode as any).unannType : (bodyNode as any).fieldType,
              bodyNode.location
            )
            if (fieldType instanceof TypeCheckerError) return newResult(null, [fieldType])
            for (const declarator of (bodyNode as any).variableDeclaratorList.variableDeclarators) {
              const fieldIdentifier = declarator.variableDeclaratorId.identifier
              const error = classType.addField(fieldIdentifier.identifier, fieldType, fieldIdentifier.location)
              if (error instanceof TypeCheckerError) return newResult(null, [error])
            }
            break
          }
          case 'MethodDeclaration': {
            const methodSignature = createMethodLocal(bodyNode)
            if (methodSignature instanceof TypeCheckerError) return newResult(null, [methodSignature])
            const methodName = (bodyNode).methodHeader.methodDeclarator.identifier
            const error = classType.addMethod(methodName.identifier, methodSignature, methodName.location)
            if (error instanceof TypeCheckerError) return newResult(null, [error])
            break
          }
        }
      }

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
      }
      return newResult(classType)
    }
    case 'EnumDeclaration': {
      const classType = frame.getType(node.typeIdentifier.identifier, node.typeIdentifier.location)
      if (classType instanceof Error) return newResult(null, [classType])
      if (!(classType instanceof ClassType)) throw new Error('enum type should be a ClassImpl')

      // Enums implicitly extend java.lang.Enum (represented here as 'Enum' in the type environment)
      const enumBase = frame.getType('Enum', node.typeIdentifier.location)
      if (enumBase instanceof Error) return newResult(null, [enumBase])
      if (!(enumBase instanceof ClassType)) throw new Error('Enum base should be a ClassImpl')
      classType.setParentClass(enumBase)
      return newResult(classType)
    }
    default:
      return OK_RESULT
  }
}
