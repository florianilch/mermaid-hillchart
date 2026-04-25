import type { DiagramDB } from "mermaid/dist/diagram-api/types.js"

import { getConfig as getMermaidConfig } from "./mermaidUtils.js"
import { defaultConfig, type HillChartDiagramConfig } from "./renderer.js"

/**
 * Represents the core domain state of a Hill Chart diagram.
 * Populated by the parser and read by the renderer.
 */
export interface HillChartState {
  title: string
  accTitle: string
  accDescr: string
  uphillLabel: string
  downhillLabel: string
  scopes: Scope[]
}

/**
 * Represents a single work item or "dot" positioned on the hill curve.
 */
export interface Scope {
  id?: string
  name: string
  phase: "uphill" | "downhill"
  position: number // 0-100
  color?: string
}

/**
 * Returns a fresh, empty state object for a new diagram instance.
 */
const defaultState = (): HillChartState => ({
  title: "",
  uphillLabel: "Figuring things out",
  downhillLabel: "Making it happen",
  scopes: [],
  accTitle: "",
  accDescr: "",
})

/**
 * The internal memory store for the diagram lifecycle.
 * Acts as the single source of truth between the parsing and rendering phases.
 */
// This interface is declared locally instead of importing Mermaid's
// `DiagramDBBase<T>` to avoid a type-resolution issue related to the
// transitive `type-fest` dependency.
export interface HillChartDB extends DiagramDB {
  /**
   * Returns the merged Hill Chart config.
   *
   * Configure this external diagram via
   * `mermaid.initialize({ externalHillchart: ... })`.
   * Mermaid frontmatter and `%%{init}%%` cannot set Hill Chart-specific keys.
   */
  getConfig: () => HillChartDiagramConfig
  /** Resets the database to its initial empty state. Called by Mermaid before parsing a new diagram. */
  clear: () => void
  /** Sets the main title of the diagram. */
  setDiagramTitle: (title: string) => void
  /** Returns the main title of the diagram. */
  getDiagramTitle: () => string
  /** Sets the accessibility title for screen readers. */
  setAccTitle: (title: string) => void
  /** Returns the accessibility title. */
  getAccTitle: () => string
  /** Sets the accessibility description for screen readers. */
  setAccDescription: (description: string) => void
  /** Returns the accessibility description. */
  getAccDescription: () => string
  /** Sets the label for the uphill phase (left side). */
  setUphillLabel: (label: string) => void
  /** Sets the label for the downhill phase (right side). */
  setDownhillLabel: (label: string) => void
  /** Adds a new scope to the chart. */
  addScope: (scope: Scope) => void
  /** Returns a reference to the current state. */
  getState: () => HillChartState
}

/**
 * Factory function to create a new module-scoped database instance.
 * Mermaid expects a singleton-like DB object per diagram type.
 */
export const createDb = (): HillChartDB => {
  let state: HillChartState = defaultState()

  return {
    getConfig() {
      // Maintenance note: Mermaid preprocesses frontmatter and `%%{init}%%`
      // before external diagram code runs, and `sanitizeDirective` drops
      // unknown keys from Mermaid's built-in `configKeys` set.
      const hillChartSiteConfig = getMermaidConfig().externalHillchart
      return { ...defaultConfig, ...hillChartSiteConfig }
    },

    clear: () => {
      state = defaultState()
    },

    setDiagramTitle: (title) => {
      state.title = title
    },

    getDiagramTitle: () => state.title,

    setAccTitle: (title) => {
      state.accTitle = title
    },

    getAccTitle: () => state.accTitle,

    setAccDescription: (description) => {
      state.accDescr = description
    },

    getAccDescription: () => state.accDescr,

    setUphillLabel: (label) => {
      state.uphillLabel = label
    },

    setDownhillLabel: (label) => {
      state.downhillLabel = label
    },

    addScope: (scope) => {
      state.scopes.push(scope)
    },

    getState: () => state,
  }
}
