import mermaid from "mermaid"
import hillChart from "mermaid-hillchart"
import type { RuntimeConfig } from "mermaid-hillchart"
import { beforeEach, describe, expect, it } from "vitest"

// Register the diagram so Mermaid injects its runtime utilities for the
// external diagram. Use `lazyLoad: false` so the diagram is available before
// the tests render against the public Mermaid API.
await mermaid.registerExternalDiagrams([hillChart], { lazyLoad: false })

/**
 * Sets Mermaid configuration.
 */
const setMermaidConfig = (config?: RuntimeConfig) => {
  mermaid.initialize({ securityLevel: "loose", ...config })
}

const minimalDefinition = `
  hillchart
    title T
    uphill U
    downhill D
    scope "S": uphill 20
    scope "R": downhill 70
`

const renderHillChart = async (definition: string, config?: RuntimeConfig) => {
  setMermaidConfig(config)
  return mermaid.render("hillchart", definition)
}

const parseSvg = (svg: string) => new DOMParser().parseFromString(svg, "image/svg+xml")

describe("hillchart Mermaid integration", () => {
  beforeEach(() => {
    // Mermaid config is global, so reset it between tests to prevent
    // `themeVariables` or `externalHillchart` settings from leaking across cases.
    setMermaidConfig({})
  })

  it("registers and renders a minimal valid hillchart definition", async () => {
    const { svg } = await renderHillChart(minimalDefinition)
    const doc = parseSvg(svg)

    expect(doc.querySelector("svg#hillchart")).toBeTruthy()
    expect(doc.querySelector(".hillchart__title")?.textContent).toBe("T")
    expect(doc.querySelector(".hillchart-scope")).toBeTruthy()
  })

  it("propagates accessibility metadata into the rendered SVG", async () => {
    const { svg } = await renderHillChart(`
      hillchart
        title Visible chart title
        accTitle: Hillchart accessibility title
        accDescr: Hillchart accessibility description
        scope demo: uphill 20
    `)
    const doc = parseSvg(svg)

    expect(doc.querySelector("title")?.textContent).toBe("Hillchart accessibility title")
    expect(doc.querySelector("desc")?.textContent).toBe("Hillchart accessibility description")
    expect(doc.querySelector(".hillchart__title")?.textContent).toBe("Visible chart title")
  })

  it("injects styles and honors a theme override", async () => {
    const { svg } = await renderHillChart(minimalDefinition, {
      themeVariables: {
        titleColor: "#123456",
      },
    })
    const doc = parseSvg(svg)
    const style = doc.querySelector("style")?.textContent ?? ""

    expect(style).toContain(".hillchart__title")
    expect(style).toContain("--mermaid-hillchart-title-color")
    expect(style).toMatch(
      /\.hillchart__title\s*\{[^}]*fill:\s*var\(--mermaid-hillchart-title-color,\s*#123456\)/s,
    )
  })

  it("reads plugin config from Mermaid initialization", async () => {
    const { svg } = await renderHillChart(minimalDefinition, {
      externalHillchart: {
        width: 800,
        height: 400,
      },
    })
    const doc = parseSvg(svg)
    const root = doc.querySelector("svg#hillchart")

    expect(root?.getAttribute("viewBox")).toBe("0 0 800 400")
    expect(root?.getAttribute("width")).toBe("100%")
  })

  it("surfaces invalid definitions as Mermaid render errors", async () => {
    const renderPromise = renderHillChart(
      `
        hillchart
          title"Broken"
      `,
    )

    await expect(renderPromise).rejects.toThrow(/Parsing failed/)
  })
})
