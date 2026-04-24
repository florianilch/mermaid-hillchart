import type {
  DiagramDefinition as MermaidDiagramDefinition,
  ParserDefinition as MermaidParserDefinition,
} from "mermaid/dist/diagram-api/types.js"

import { createDb, type HillChartDB } from "./db.js"
import { injectUtils } from "./mermaidUtils.js"
import { createParser } from "./parser.js"
import { renderer } from "./renderer.js"
import { getStyles as styles } from "./styles.js"

/**
 * Extends Mermaid's base diagram definition to include our custom database type.
 */
type DiagramDefinition = MermaidDiagramDefinition & {
  db: HillChartDB
}

// Mermaid instantiates diagrams by accessing the `db` and `parser` properties
// on this object. We use getters to lazily initialize these components,
// ensuring they remain testable in isolation while satisfying Mermaid's
// module-scoped singleton expectations.
//
// see `Diagram.fromText` in Mermaid core

let db: HillChartDB | null = null
let parser: MermaidParserDefinition | null = null

/**
 * The diagram entry point. Wires together the parser, database, renderer,
 * and styles, registering the custom diagram type with Mermaid.
 */
export const diagram: DiagramDefinition = {
  get db() {
    db ??= createDb()
    return db
  },
  get parser() {
    parser ??= createParser(this.db)
    return parser
  },
  renderer,
  styles,
  injectUtils,
}
