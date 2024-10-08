import { Identifier } from '../ast/specificationTypes'
import {
  IllegalCombinationOfModifiersError,
  RepeatedModifierError,
  TypeCheckerError,
  TypeCheckerInternalError
} from '../errors'

export enum ModifierType {
  CLASS = 'class',
  METHOD = 'method',
  VARIABLE = 'variable'
}

export class Modifiers {
  private modifiers: Modifier[] = []
  public constructor() {}

  public addModifier(modifierType: ModifierType, identifier: Identifier): void | TypeCheckerError {
    const modifier = mapIdentifierToModifier(identifier)
    if (this.modifiers.includes(modifier)) return new RepeatedModifierError(identifier.location)
    const newModifiers = [...this.modifiers, modifier]
    if (hasMultipleAccessModifiers(newModifiers))
      return new IllegalCombinationOfModifiersError(identifier.location)

    if (modifierType === ModifierType.METHOD) {
      if (newModifiers.includes(Modifier.ABSTRACT)) {
        const blacklistedModifiers = [
          Modifier.PRIVATE,
          Modifier.STATIC,
          Modifier.FINAL,
          Modifier.NATIVE,
          Modifier.STRICTFP,
          Modifier.SYNCHRONIZED
        ]
        const hasBlacklisteModifiers =
          newModifiers.filter(modifier => blacklistedModifiers.includes(modifier)).length > 0
        if (hasBlacklisteModifiers)
          return new IllegalCombinationOfModifiersError(identifier.location)
      }

      if (newModifiers.includes(Modifier.NATIVE)) {
        if (newModifiers.includes(Modifier.STRICTFP))
          return new IllegalCombinationOfModifiersError(identifier.location)
      }
    }

    this.modifiers = newModifiers
  }

  public isEmpty(): boolean {
    return this.modifiers.length === 0
  }

  public isFinal(): boolean {
    return this.modifiers.includes(Modifier.FINAL)
  }

  public toString(): string {
    return this.modifiers.join(' ')
  }
}

enum Modifier {
  ABSTRACT = 'abstract',
  FINAL = 'final',
  NATIVE = 'native',
  PRIVATE = 'private',
  PROTECTED = 'protected',
  PUBLIC = 'public',
  STATIC = 'static',
  STRICTFP = 'strictfp',
  SYNCHRONIZED = 'synchronized'
}

const mapIdentifierToModifier = (identifier: Identifier): Modifier => {
  switch (identifier.identifier) {
    case 'abstract':
      return Modifier.ABSTRACT
    case 'final':
      return Modifier.FINAL
    case 'native':
      return Modifier.NATIVE
    case 'private':
      return Modifier.PRIVATE
    case 'protected':
      return Modifier.PROTECTED
    case 'public':
      return Modifier.PUBLIC
    case 'static':
      return Modifier.STATIC
    case 'strictfp':
      return Modifier.STRICTFP
    case 'synchronized':
      return Modifier.SYNCHRONIZED
    default:
      throw new TypeCheckerInternalError(`Unrecognised modifier ${identifier.identifier}`)
  }
}

const ACCESS_MODIFIERS = [Modifier.PRIVATE, Modifier.PROTECTED, Modifier.PUBLIC]
export const hasMultipleAccessModifiers = (modifiers: Modifier[]): boolean => {
  return modifiers.filter(modifier => ACCESS_MODIFIERS.includes(modifier)).length > 1
}
