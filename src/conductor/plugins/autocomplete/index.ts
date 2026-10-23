import { AutoCompleteEntry, SyntaxHighlightData, WEB_PLUGIN_ID } from '@sourceacademy/common-autocomplete'
import { IRunnerPlugin } from '@sourceacademy/conductor/runner'
import { BaseAutoCompleteRunnerPlugin } from '@sourceacademy/runner-autocomplete'
import { computeCompletions } from './completions'
import javaMode from './mode'

export default class AutoCompletePlugin extends BaseAutoCompleteRunnerPlugin {
  get mode(): SyntaxHighlightData {
    return javaMode()
  }

  autocomplete(code: string, row: number, column: number): AutoCompleteEntry[] {
    return computeCompletions(code, row, column)
  }
}

/** Registers Java's autocomplete + syntax-highlighting plugin and tells the host to load its web-side counterpart. */
export function registerAutoCompletePlugin(conductor: IRunnerPlugin): void {
  conductor.registerPlugin(AutoCompletePlugin)
  void conductor.hostLoadPlugin(WEB_PLUGIN_ID)
}
