import { LibInfoMap } from './class-meta'
// `./generated-lib-info.json` is a JSON module: under `module: commonjs` (the
// main build, no `esModuleInterop`) a namespace import gives the raw parsed
// JSON directly; under real ESM (the Conductor evaluator build/tests) it's
// nested under `.default` instead. Handle both, same as compiler/index.ts's
// `peggy` import.
import * as rawGeneratedLibInfoNs from './generated-lib-info.json'

/**
 * Descriptor-level metadata for the supported standard-library classes,
 * extracted from the JDK class tree by `build-lib-info.ts`.
 *
 * Regenerate with `yarn build:lib-info` after changing the seed list in
 * `lib-closure.ts` or bumping the JDK class tree.
 */
const rawGeneratedLibInfo =
  (rawGeneratedLibInfoNs as unknown as { default?: unknown }).default ?? rawGeneratedLibInfoNs

export const generatedLibInfo: LibInfoMap = rawGeneratedLibInfo as unknown as LibInfoMap

export default generatedLibInfo
