import type { MermaidConfig } from "mermaid"

import type { HillChartDiagramConfig } from "./renderer.js"

export type RuntimeConfig = MermaidConfig & {
  externalHillchart?: Partial<HillChartDiagramConfig>
}

const warning = (s: string) => {
  console.error("Log function was called before initialization", s)
}

/**
 * Log levels mirroring Mermaid's internal logging configuration.
 */
export const LEVELS = {
  trace: 0,
  debug: 1,
  info: 2,
  warn: 3,
  error: 4,
  fatal: 5,
} as const

/**
 * Type representing available log levels.
 */
export type LogLevel = keyof typeof LEVELS

/**
 * Logger instance bridged to Mermaid's internal logger.
 */
export const log: Record<keyof typeof LEVELS, typeof console.log> = {
  trace: warning,
  debug: warning,
  info: warning,
  warn: warning,
  error: warning,
  fatal: warning,
}

/**
 * Sets the log level for the bridged logger.
 */
export let setLogLevel: (level: keyof typeof LEVELS | number) => void

/**
 * Retrieves the global Mermaid configuration.
 */
export let getConfig: () => RuntimeConfig

/**
 * Sanitizes text input for security.
 */
export let sanitizeText: (str: string) => string

/**
 * Retrieves the common database shared across Mermaid diagrams.
 */
export let getCommonDb: () => Record<string, unknown>

/**
 * Injects Mermaid's internal utilities into this plugin during initialization.
 */
export const injectUtils = (
  _log: Record<keyof typeof LEVELS, typeof console.log>,
  _setLogLevel: typeof setLogLevel,
  _getConfig: typeof getConfig,
  _sanitizeText: typeof sanitizeText,
  _setupGraphViewbox: unknown,
  _getCommonDb: typeof getCommonDb,
) => {
  _log.info("Mermaid utils injected")
  log.trace = _log.trace
  log.debug = _log.debug
  log.info = _log.info
  log.warn = _log.warn
  log.error = _log.error
  log.fatal = _log.fatal
  setLogLevel = _setLogLevel
  getConfig = _getConfig
  sanitizeText = _sanitizeText
  getCommonDb = _getCommonDb
}
