import type { BaseDiagramConfig } from "mermaid/dist/config.type.js"
import type { DiagramRenderer } from "mermaid/dist/diagram-api/types.js"

import type { HillChartDB } from "./db.js"
import { getConfig, log } from "./mermaidUtils.js"
import { createCurveGeometry } from "./renderer/hillCurve.js"
import type { DotLayout } from "./renderer/scopeDot.js"
import { calculateDotLayout } from "./renderer/scopeDot.js"
import { SVGBuilder } from "./renderer/svgBuilder.js"
import { measureTextByClass } from "./renderer/textMeasurement.js"
import { getThemeVariables, STYLE_CONFIG } from "./styles.js"

/**
 * Public configuration API for the Hill Chart diagram.
 */
export interface HillChartDiagramConfig extends BaseDiagramConfig {
  width: number
  height: number
  padding: number
}

/**
 * Default configuration values for the Hill Chart diagram.
 * These are user-configurable via Mermaid's configuration API.
 */
export const defaultConfig: HillChartDiagramConfig = {
  // The 2:1 width-to-height ratio (e.g., 600x300) is chosen to give the curve a
  // natural hill shape rather than a steep spike or flat bump.
  width: 600,
  height: 300,
  padding: 32,
}

/**
 * Internal layout constants for the rendering engine to control the geometry
 * and spatial calculations.
 */
const LAYOUT_CONFIG = {
  dot: {
    radius: 8,
    strokeWidth: STYLE_CONFIG.dot.strokeWidth,
    leaderLength: 20,
    labelOffset: 8,
  } as const,
  titleChartGap: 16,
  chartPhaseLabelGap: 16,
} as const

/**
 * Retrieves the correct root document, handling Mermaid's sandbox iframe mode.
 */
function resolveDocument(id: string): Document {
  const { securityLevel } = getConfig()
  if (securityLevel === "sandbox") {
    const iframe = document.querySelector<HTMLIFrameElement>("iframe#i" + id)
    return iframe?.contentWindow?.document ?? document
  }
  return document
}

/**
 * The main rendering engine for the Hill Chart diagram.
 *
 * Unlike diagrams that rely on dynamic layout engines (e.g., Dagre), the Hill Chart
 * uses a "known layout" approach with a fixed mathematical coordinate system.
 * Because JavaScript owns the geometry and CSS owns the presentation, the rendering
 * lifecycle must strictly separate measurement, geometric calculation, and DOM construction
 * to ensure accurate placement and collision resolution before any elements are drawn.
 */
export const renderer: DiagramRenderer = {
  draw: (_text, id, _version, diagram) => {
    log.info("rendering hill chart diagram")

    const doc = resolveDocument(id)
    const svg = doc.querySelector<SVGSVGElement>(`svg#${id}`)
    if (!svg) {
      log.error(`SVG element with id "${id}" not found`)
      return
    }

    // The Mermaid draw API types the database as a non-generic base DiagramDB;
    // casting to HillChartDB to utilize our database implementation instead.
    const db = diagram.db as HillChartDB
    const state = db.getState()

    const diagramConfig = db.getConfig()
    const mermaidConfig = getConfig()
    const themeVariables = getThemeVariables(mermaidConfig)

    const builder = SVGBuilder.from(svg)

    // Pre-measure text dimensions for accurate geometry calculations.
    const measurements = measureTextByClass(svg, {
      hillchart__title: state.title ? [state.title] : [],
      "hillchart__phase-label": [state.uphillLabel, state.downhillLabel],
      hillchart__label: state.scopes.map((s) => s.name),
    })

    const titleHeight = state.title ? (measurements.hillchart__title[state.title]?.height ?? 0) : 0
    const phaseLabelHeight = Math.max(
      measurements["hillchart__phase-label"][state.uphillLabel]?.height ?? 0,
      measurements["hillchart__phase-label"][state.downhillLabel]?.height ?? 0,
    )

    // Position chart bottom above phase labels to prevent clipping.
    const bottomY = diagramConfig.height - diagramConfig.padding - phaseLabelHeight

    const chartY =
      diagramConfig.padding + (state.title ? titleHeight + LAYOUT_CONFIG.titleChartGap : 0)

    const chartRect = new DOMRectReadOnly(
      diagramConfig.padding,
      chartY,
      diagramConfig.width - diagramConfig.padding * 2,
      bottomY - chartY - LAYOUT_CONFIG.chartPhaseLabelGap,
    )

    const curveGeometry = createCurveGeometry(chartRect)

    // Transform domain state into spatial coordinates for all dots
    const dotLayouts: DotLayout[] = state.scopes.map((scope) => {
      const { x, y } = curveGeometry.getScopeCoords(scope.phase, scope.position)

      return calculateDotLayout(scope, {
        x,
        y,
        maxX: chartRect.right,
        labelWidth: measurements.hillchart__label[scope.name]?.width ?? 0,
        config: LAYOUT_CONFIG.dot,
      })
    })

    // The curve geometry is the single source of truth for all spatial calculations.
    if (state.title) {
      builder.add(
        "text",
        {
          x: "50%",
          y: diagramConfig.padding,
          class: "hillchart__title",
        },
        state.title,
      )
    }

    const hillPath = curveGeometry.getCurvePath()
    builder.add("path", {
      d: hillPath,
      class: "hillchart__curve",
    })

    const peakLine = curveGeometry.getPeakLine()
    builder.add("line", {
      x1: peakLine.x1.toFixed(2),
      y1: peakLine.y1.toFixed(2),
      x2: peakLine.x2.toFixed(2),
      y2: peakLine.y2.toFixed(2),
      class: "hillchart__peak",
    })

    const uphillGroupBuilder = SVGBuilder.create(doc, "g")
    const downhillGroupBuilder = SVGBuilder.create(doc, "g")

    if (state.uphillLabel.trim()) {
      uphillGroupBuilder.add(
        "text",
        {
          x: "25%",
          y: bottomY,
          class: "hillchart__phase-label",
        },
        state.uphillLabel,
      )
    }

    if (state.downhillLabel.trim()) {
      downhillGroupBuilder.add(
        "text",
        {
          x: "75%",
          y: bottomY,
          class: "hillchart__phase-label",
        },
        state.downhillLabel,
      )
    }

    for (const [index, dot] of dotLayouts.entries()) {
      const currentBuilder =
        dot.scope.phase === "uphill" ? uphillGroupBuilder : downhillGroupBuilder

      const colorIndex = index % themeVariables.THEME_COLOR_LIMIT

      const scopeGroupBuilder = SVGBuilder.create(doc, "g", {
        class: [
          "hillchart-scope",
          `hillchart-scope--color-${String(colorIndex)}`,
          ...(dot.scope.id ? [`hillchart-scope--id-${dot.scope.id}`] : []),
          ...(dot.scope.inactive ? ["hillchart-scope--inactive"] : []),
        ].join(" "),
      })

      if (dot.scope.color) {
        // Set CSS variable for explicit colors to allow overwrites in CSS
        scopeGroupBuilder.el.style.setProperty("--mermaid-hillchart-scope-color", dot.scope.color)
      }

      scopeGroupBuilder.add("circle", {
        cx: dot.cx.toFixed(2),
        cy: dot.cy.toFixed(2),
        r: dot.radius,
        class: "hillchart-scope__dot",
      })

      scopeGroupBuilder.add("line", {
        x1: dot.label.leaderLine.x1.toFixed(2),
        y1: dot.label.leaderLine.y1.toFixed(2),
        x2: dot.label.leaderLine.x2.toFixed(2),
        y2: dot.label.leaderLine.y2.toFixed(2),
        class: "hillchart-scope__leader-line",
      })
      scopeGroupBuilder.add(
        "text",
        {
          x: dot.label.x.toFixed(2),
          y: dot.label.y.toFixed(2),
          class: `hillchart__label ${dot.label.anchor === "start" ? "hillchart__label--align-start" : "hillchart__label--align-end"}`,
        },
        dot.label.text,
      )

      currentBuilder.append(() => scopeGroupBuilder.el)
    }

    builder.append(() => uphillGroupBuilder.el)
    builder.append(() => downhillGroupBuilder.el)

    // Unlike layout-engine diagrams that measure the rendered SVG, we use fixed
    // dimensions so we set viewBox directly.
    configureSvgDimensions(
      svg,
      diagramConfig.width,
      diagramConfig.height,
      diagramConfig.useMaxWidth ?? true,
    )
  },
}

/**
 * Configures the SVG element's dimensions and responsiveness.
 */
function configureSvgDimensions(
  svg: SVGSVGElement,
  width: number,
  height: number,
  useMaxWidth: boolean,
) {
  svg.setAttribute("viewBox", `0 0 ${width.toString()} ${height.toString()}`)

  if (useMaxWidth) {
    svg.setAttribute("width", "100%")
    svg.setAttribute("style", `max-width: ${width.toString()}px;`)
  } else {
    svg.setAttribute("width", width.toString())
    svg.setAttribute("height", height.toString())
  }
}
