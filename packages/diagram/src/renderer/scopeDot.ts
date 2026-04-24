import type { Scope } from "../db.js"

/**
 * Configuration for the geometric layout of a scope dot.
 */
export interface DotGeometryConfig {
  radius: number
  strokeWidth: number
  leaderLength: number
  labelOffset: number
}

/**
 * Represents the calculated geometric layout of a scope dot and its label.
 */
export interface DotLayout {
  cx: number
  cy: number
  radius: number
  label: {
    text: string
    x: number
    y: number
    anchor: "start" | "end"
    leaderLine: {
      x1: number
      y1: number
      x2: number
      y2: number
    }
  }
  scope: Scope
}

/**
 * Options required to calculate a dot layout.
 */
export interface DotLayoutOptions {
  x: number
  y: number
  maxX: number
  labelWidth: number
  config: DotGeometryConfig
}

/**
 * Calculates the geometric layout of a scope dot and its label.
 *
 * Ensures the label is positioned on the right by default, but flips to the left
 * if it would otherwise overflow the chart's boundary.
 */
export function calculateDotLayout(scope: Scope, options: DotLayoutOptions): DotLayout {
  const { x, y, maxX, labelWidth, config } = options

  // Visual radius includes half the stroke width since SVG strokes are centered
  const effectiveRadius = config.radius + config.strokeWidth / 2

  const labelOnRight =
    x + effectiveRadius + config.leaderLength + config.labelOffset + labelWidth < maxX
  const labelX = labelOnRight
    ? x + effectiveRadius + config.leaderLength + config.labelOffset
    : x - effectiveRadius - config.leaderLength - config.labelOffset

  const leaderEndX = labelOnRight
    ? x + effectiveRadius + config.leaderLength
    : x - effectiveRadius - config.leaderLength

  return {
    cx: x,
    cy: y,
    radius: config.radius,
    label: {
      text: scope.name,
      x: labelX,
      y: y,
      anchor: labelOnRight ? "start" : "end",
      leaderLine: {
        x1: labelOnRight ? x + effectiveRadius : x - effectiveRadius,
        y1: y,
        x2: leaderEndX,
        y2: y,
      },
    },
    scope: scope,
  }
}
