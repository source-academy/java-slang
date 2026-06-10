import { initialise } from './runner'
// @ts-expect-error — __EVALUATOR__ is replaced at build time by bundlers
import { __EVALUATOR__ } from './index'

initialise(__EVALUATOR__)
