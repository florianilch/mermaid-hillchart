import type { HillChartDiagram, LangiumParser, ParseResult } from "mermaid-hillchart-dsl"
import type { ParserDefinition as MermaidParserDefinition } from "mermaid/dist/diagram-api/types.js"

import type { HillChartDB, Scope } from "./db.js"
import { HillChartParseError } from "./parserError.js"

export type AstParser = (text: string) => Promise<HillChartDiagram>

/**
 * Extended parser definition to support asynchronous parsing required by Langium.
 */
type AsyncParserDefinition = Omit<MermaidParserDefinition, "parse"> & {
  parse: (text: string) => Promise<void>
}

const createAstParser = (): AstParser => {
  let langiumParser: LangiumParser | null = null

  return async (text) => {
    if (!langiumParser) {
      const { createHillChartServices } = await import("mermaid-hillchart-dsl")
      langiumParser = createHillChartServices().HillChart.parser.LangiumParser
    }

    const result: ParseResult<HillChartDiagram> = langiumParser.parse(text)
    if (result.lexerErrors.length > 0 || result.parserErrors.length > 0)
      throw new HillChartParseError(result)

    return result.value
  }
}

const defaultAstParser = createAstParser()

/**
 * Normalizes phase aliases to canonical phase values.
 */
function normalizePhase(phase: string): Scope["phase"] {
  switch (phase) {
    case "up":
    case "uphill":
      return "uphill"
    case "down":
    case "downhill":
      return "downhill"
    default:
      throw new Error("Unknown phase")
  }
}

/**
 * Maps the generated AST into domain concepts and populates the diagram database.
 */
function populateDb(ast: HillChartDiagram, db: HillChartDB): void {
  if (ast.title) db.setDiagramTitle(ast.title)
  if (ast.accTitle) db.setAccTitle(ast.accTitle)
  if (ast.accDescr) db.setAccDescription(ast.accDescr)

  for (const scope of ast.scopes) {
    db.addScope({
      ...(scope.id !== undefined && {
        id: scope.id,
      }),
      name: scope.name,
      phase: normalizePhase(scope.phase),
      position: scope.position,
      ...(scope.color !== undefined && {
        color: scope.color,
      }),
      inactive: scope.inactive,
    })
  }

  if (ast.phaseUphill?.label) db.setUphillLabel(ast.phaseUphill.label)
  if (ast.phaseDownhill?.label) db.setDownhillLabel(ast.phaseDownhill.label)
}

/**
 * Creates the parser instance for Mermaid, wiring together the Langium AST generation
 * and the database population.
 */
export const createParser = (
  db: HillChartDB,
  astParser: AstParser = defaultAstParser,
): AsyncParserDefinition => {
  return {
    parse: async (text) => {
      const ast = await astParser(text)
      populateDb(ast, db)
    },
  }
}
