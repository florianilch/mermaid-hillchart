import type { MermaidConfig } from "mermaid"
import type { DiagramStylesProvider } from "mermaid/dist/diagram-api/types.js"

/**
 * Visual styling constants for the Hill Chart to control the appearance (stroke
 * widths, opacity, etc.). For geometric/layout constants, see renderer.ts.
 */
export const STYLE_CONFIG = {
  curve: {
    strokeWidth: 2,
  },
  dot: {
    strokeWidth: 1,
    inactiveOpacity: 0.4,
  },
} as const

/**
 * Defines the required Mermaid theme variables and custom color scales
 * used for styling the Hill Chart diagram.
 */
export interface HillChartStyleOptions {
  fontFamily: string
  fontSize: string | number
  textColor: string

  titleColor?: string

  background: string
  primaryColor: string
  primaryTextColor?: string
  primaryBorderColor?: string

  secondaryColor?: string
  secondaryTextColor?: string
  secondaryBorderColor?: string

  tertiaryColor?: string
  tertiaryTextColor?: string
  tertiaryBorderColor?: string

  mainBkg?: string
  lineColor: string
  border2?: string

  edgeLabelBackground?: string
  labelBackground?: string

  THEME_COLOR_LIMIT: number
  [key: `cScale${number}`]: string | undefined
}

/**
 * Generates the CSS styles for the Hill Chart diagram, incorporating Mermaid theme variables.
 */
export const getStyles: DiagramStylesProvider = (options: HillChartStyleOptions): string => {
  // Handle both numeric and unit-based fontSize values from Mermaid config.
  const baseFontSize = parseInt(String(options.fontSize || "16"), 10)

  return `
    .hillchart__curve {
      stroke: var(--mermaid-hillchart-curve-color, ${options.lineColor});
      fill: none;
      stroke-width: ${STYLE_CONFIG.curve.strokeWidth.toFixed(0)}px;
    }

    .hillchart__peak {
      stroke: var(--mermaid-hillchart-peak-color, ${options.lineColor});
      stroke-width: ${STYLE_CONFIG.curve.strokeWidth.toFixed(0)}px;
      stroke-dasharray: 4, 4;
    }

    .hillchart__title {
      font-size: ${(baseFontSize * 1.125).toFixed(1)}px;
      font-weight: 600;
      fill: var(--mermaid-hillchart-title-color, ${options.titleColor ?? options.textColor});
      font-family: ${options.fontFamily};
      text-anchor: middle;
      dominant-baseline: hanging;
    }

    .hillchart__phase-label {
      font-size: ${baseFontSize.toFixed(1)}px;
      fill: var(--mermaid-hillchart-phase-label-color, currentColor);
      opacity: 0.7;
      text-anchor: middle;
      dominant-baseline: hanging;
    }

    .hillchart__label {
      font-size: ${baseFontSize.toFixed(1)}px;
      fill: var(--mermaid-hillchart-label-color, currentColor);
      dominant-baseline: middle;
    }

    .hillchart__label--align-start { text-anchor: start; }
    .hillchart__label--align-end { text-anchor: end; }

    .hillchart-scope__dot {
      stroke: var(--mermaid-hillchart-dot-stroke-color, ${options.background});
      stroke-width: ${STYLE_CONFIG.dot.strokeWidth.toFixed(0)}px;
      fill: var(--mermaid-hillchart-scope-color);
    }

    .hillchart-scope__leader-line {
      stroke-width: ${STYLE_CONFIG.dot.strokeWidth.toFixed(0)}px;
      stroke: var(--mermaid-hillchart-scope-color);
    }

    .hillchart-scope--inactive .hillchart-scope__dot {
      fill: rgba(from var(--mermaid-hillchart-scope-color) r g b / ${STYLE_CONFIG.dot.inactiveOpacity.toFixed(2)});
    }

    .hillchart-scope--inactive .hillchart-scope__leader-line {
      stroke: rgba(from var(--mermaid-hillchart-scope-color) r g b / ${STYLE_CONFIG.dot.inactiveOpacity.toFixed(2)});
    }

    ${generateScopeStyles(options)}
  `
}

/**
 * Generates CSS custom properties for scope colors.
 * Each scope class sets a `--hillchart-scope-color` variable.
 */
function generateScopeStyles(options: HillChartStyleOptions): string {
  let styles = ""
  for (let i = 0; i < options.THEME_COLOR_LIMIT; i++) {
    const color = options[`cScale${i}`] ?? options.primaryColor
    styles += `.hillchart-scope.hillchart-scope--color-${String(i)} { --mermaid-hillchart-scope-color: ${color}; }`
  }
  return styles
}

/**
 * Type guard to safely extract theme variables from Mermaid config.
 * Mermaid's themeVariables is typed as `any`, so we validate and cast it to our
 * interface.
 * @see https://mermaid.js.org/config/theming.html#theme-variables
 */
export function getThemeVariables(config: MermaidConfig): HillChartStyleOptions {
  if (typeof config.themeVariables !== "object" || config.themeVariables === null) {
    throw new Error(
      "Mermaid themeVariables is not an object. Ensure Mermaid is properly initialized with a theme.",
    )
  }
  return config.themeVariables as HillChartStyleOptions
}
