import type { CstNode, GrammarAST, ValueType } from "langium"
import { DefaultValueConverter } from "langium"

const rulesRegexes: Record<string, RegExp> = {
  ACC_DESCR: /accDescr(?:[\t ]*:([^\n\r]*)|\s*{([^}]*)})/,
  ACC_TITLE: /accTitle[\t ]*:([^\n\r]*)/,
  TITLE: /title([\t ][^\n\r]*|)/,
}

/**
 * Value converter for the HillChart language.
 */
// Use a local value converter here to keep the plugin runtime dependency limited
// to Langium. Importing `@mermaid-js/parser` would also include Mermaid parser
// implementation code in the runtime bundle.
export class HillChartValueConverter extends DefaultValueConverter {
  protected override runConverter(
    rule: GrammarAST.AbstractRule,
    input: string,
    cstNode: CstNode,
  ): ValueType {
    const value = this.runMermaidCommonConverter(rule, input)

    if (value !== undefined) return value

    return super.runConverter(rule, input, cstNode)
  }

  private runMermaidCommonConverter(
    rule: GrammarAST.AbstractRule,
    input: string,
  ): ValueType | undefined {
    const regex = rulesRegexes[rule.name]
    if (regex === undefined) return undefined

    const match = regex.exec(input)
    if (match === null) return undefined

    if (match[1] !== undefined) {
      // Single-line TITLE, ACC_TITLE, or ACC_DESCR value.
      return match[1].trim().replace(/[\t ]{2,}/gm, " ")
    }

    if (match[2] !== undefined) {
      // Multiline ACC_DESCR block: normalize indentation and collapse whitespace.
      return match[2]
        .replace(/^\s*/gm, "")
        .replace(/\s+$/gm, "")
        .replace(/[\t ]{2,}/gm, " ")
        .replace(/[\n\r]{2,}/gm, "\n")
    }

    return undefined
  }
}
