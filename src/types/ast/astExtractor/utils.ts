import { Location } from '../types/ast'

export const getLocation = (object: Location): Location => ({
  startLine: object.startLine,
  startOffset: object.startOffset,
  endColumn: object.endColumn,
  endLine: object.endLine,
  endOffset: object.endOffset,
  startColumn: object.startColumn
})
