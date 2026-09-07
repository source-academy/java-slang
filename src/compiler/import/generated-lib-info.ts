import { LibInfoMap } from './class-meta'
// eslint-disable-next-line @typescript-eslint/no-var-requires
import rawGeneratedLibInfo = require('./generated-lib-info.json')

/**
 * Descriptor-level metadata for the supported standard-library classes,
 * extracted from the `std-lib` class files by `build-lib-info.ts`.
 *
 * Regenerate with `yarn build:lib-info` after changing the seed list in
 * `lib-closure.ts` or bumping the `std-lib` classes.
 */
export const generatedLibInfo: LibInfoMap = rawGeneratedLibInfo as unknown as LibInfoMap

export default generatedLibInfo
