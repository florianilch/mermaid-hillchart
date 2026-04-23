import type { GrammarAST, Stream, TokenBuilderOptions } from "langium"
import { DefaultTokenBuilder } from "langium"

const MERMAID_KEYWORD_BOUNDARY_SUFFIX = "(?:(?=%%)|(?!\\S))"
type TokenTypes = ReturnType<DefaultTokenBuilder["buildKeywordTokens"]>

/**
 * Configures the lexer for the Hill Chart DSL.
 */
// Use a local subclass here to keep the plugin runtime dependency limited to Langium.
// Importing `@mermaid-js/parser` would also include Mermaid parser implementation
// code in the runtime bundle.
export class HillChartTokenBuilder extends DefaultTokenBuilder {
  protected override buildKeywordTokens(
    rules: Stream<GrammarAST.AbstractRule>,
    terminalTokens: TokenTypes,
    options?: TokenBuilderOptions,
  ): TokenTypes {
    const tokenTypes = super.buildKeywordTokens(rules, terminalTokens, options)

    tokenTypes.forEach((tokenType): void => {
      if (tokenType.name === "hillchart" && tokenType.PATTERN instanceof RegExp) {
        // Preserve Mermaid's boundary rule for the diagram entry keyword:
        // allow `hillchart%% comment`, but reject `hillcharts`.
        tokenType.PATTERN = new RegExp(
          `${tokenType.PATTERN.source}${MERMAID_KEYWORD_BOUNDARY_SUFFIX}`,
          tokenType.PATTERN.flags,
        )
      }
    })

    return tokenTypes
  }
}
