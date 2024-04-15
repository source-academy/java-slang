import { IToken } from 'java-parser'
import { Identifier, Location } from './specificationTypes'

export const getLocation = (object: Location): Location => ({
  startLine: object.startLine,
  startOffset: object.startOffset,
  endColumn: object.endColumn,
  endLine: object.endLine,
  endOffset: object.endOffset,
  startColumn: object.startColumn
})

export const getIdentifier = (object: IToken): Identifier => ({
  kind: 'Identifier',
  identifier: object.image,
  location: getLocation(object)
})
