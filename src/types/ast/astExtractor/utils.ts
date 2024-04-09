import { Location } from '../types'

export const getLocation = (object: Location): Location => ({
  startLine: object.startLine,
  startOffset: object.startOffset,
  endColumn: object.endColumn,
  endLine: object.endLine,
  endOffset: object.endOffset,
  startColumn: object.startColumn
})
