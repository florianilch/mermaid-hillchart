import type { ExternalDiagramDefinition } from "mermaid"

const id: ExternalDiagramDefinition["id"] = "hillchart"

/**
 * Defines the external diagram plugin for Mermaid.
 * Includes the detector regex to identify Hill Chart diagrams.
 */
const hillChart: ExternalDiagramDefinition = {
  id,
  detector: (text) => /^\s*hillchart/.test(text),
  loader: async () => {
    const { diagram } = await import("./diagram.js")
    return { id, diagram }
  },
}

export default hillChart
