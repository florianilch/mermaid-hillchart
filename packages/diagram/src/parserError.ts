import type { ParseResult } from "mermaid-hillchart-dsl"

const formatLocationPart = (value: number | undefined): string => {
  return typeof value === "number" && !Number.isNaN(value) ? String(value) : "?"
}

const formatLexerError = (error: ParseResult<unknown>["lexerErrors"][number]): string => {
  const line = formatLocationPart(error.line)
  const column = formatLocationPart(error.column)

  return `Lexer error on line ${line}, column ${column}: ${error.message}`
}

const formatParserError = (error: ParseResult<unknown>["parserErrors"][number]): string => {
  const line = formatLocationPart(error.token.startLine)
  const column = formatLocationPart(error.token.startColumn)

  return `Parse error on line ${line}, column ${column}: ${error.message}`
}

/**
 * Formats Langium parser failures into a single error that Mermaid can surface.
 */
export class HillChartParseError extends Error {
  constructor(readonly result: ParseResult<unknown>) {
    const issues = [
      ...result.lexerErrors.map(formatLexerError),
      ...result.parserErrors.map(formatParserError),
    ]

    super(issues.length > 0 ? `Parsing failed:\n${issues.join("\n")}` : "Parsing failed.")

    this.name = "HillChartParseError"
    Object.setPrototypeOf(this, new.target.prototype)
  }
}
