/**
 * Maps a horizontal position (0-100) to a vertical position (0-100)
 * using a sine-based bell curve to define the hill's shape.
 */
export function hillFn(x: number): number {
  return 50 * Math.sin((Math.PI / 50) * x - (1 / 2) * Math.PI) + 50
}

/**
 * Inverse of hillFn: Maps a vertical position (0-100) back to the
 * corresponding horizontal position (0-100) on the hill curve.
 */
export function hillFnInverse(y: number): number {
  const normalizedY = (y - 50) / 50
  if (normalizedY < -1 || normalizedY > 1) {
    throw new RangeError(`y must be in range [0, 100], got ${y.toString()}`)
  }
  return (25 * (2 * Math.asin(normalizedY) + Math.PI)) / Math.PI
}

/**
 * Generates the SVG path data (`d` attribute) for the hill curve,
 * scaled to fit within the provided bounding rectangle.
 */
function generateHillPath(rect: DOMRectReadOnly): string {
  const points: string[] = []

  for (let i = 0; i <= 100; i++) {
    const x = rect.x + (i / 100) * rect.width
    const y = rect.y + rect.height - (hillFn(i) / 100) * rect.height

    if (i === 0) {
      points.push(`M ${x.toFixed(2)} ${y.toFixed(2)}`)
    } else {
      points.push(`L ${x.toFixed(2)} ${y.toFixed(2)}`)
    }
  }

  return points.join(" ")
}

/**
 * Maps a scope's phase and relative progress (0-100) to absolute SVG coordinates
 * within the chart's bounding rectangle.
 */
function positionToCoords(
  phase: "uphill" | "downhill",
  position: number,
  rect: DOMRectReadOnly,
): { readonly x: number; readonly y: number } {
  // Normalize phase-specific progress to the global curve's X-axis (0-100)
  const normalizedX = phase === "uphill" ? (position / 100) * 50 : 50 + (position / 100) * 50

  const x = rect.x + (normalizedX / 100) * rect.width
  const y = rect.y + rect.height - (hillFn(normalizedX) / 100) * rect.height

  return { x, y }
}

/**
 * Encapsulates the mathematical layout of the hill, peak line, and scope
 * coordinates within a specific bounding box.
 */
export interface CurveGeometry {
  /**
   * Generates the SVG path data for the hill curve.
   * @returns The SVG path "d" attribute string
   */
  getCurvePath(): string

  /**
   * Calculates the coordinates for the peak divider line.
   * @returns The line coordinates defining the phase boundary
   */
  getPeakLine(): {
    readonly x1: number
    readonly y1: number
    readonly x2: number
    readonly y2: number
  }

  /**
   * Maps a scope's phase and position to absolute SVG coordinates.
   * @param phase - The scope's phase ("uphill" or "downhill")
   * @param position - The scope's progress within the phase (0-100)
   * @returns The absolute SVG coordinates for the scope marker
   */
  getScopeCoords(
    phase: "uphill" | "downhill",
    position: number,
  ): { readonly x: number; readonly y: number }
}

/**
 * Factory for curve geometry
 *
 * Encapsulates the mathematical layout of the hill, peak line, and scope
 * coordinates within a specific bounding box.
 */
export function createCurveGeometry(chartRect: DOMRectReadOnly): CurveGeometry {
  return {
    getCurvePath: () => generateHillPath(chartRect),
    getPeakLine: () => ({
      x1: chartRect.x + chartRect.width / 2,
      y1: chartRect.y,
      x2: chartRect.x + chartRect.width / 2,
      y2: chartRect.bottom,
    }),
    getScopeCoords: (phase: "uphill" | "downhill", position: number) =>
      positionToCoords(phase, position, chartRect),
  }
}
