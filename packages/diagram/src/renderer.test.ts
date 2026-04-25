import type { MermaidConfig } from "mermaid"
import type { Diagram } from "mermaid/dist/Diagram.js"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { createDb, type HillChartDB } from "./db.js"
import { injectUtils } from "./mermaidUtils.js"
import { renderer } from "./renderer.js"
import { measureTextByClass } from "./renderer/textMeasurement.js"
import type { HillChartStyleOptions } from "./styles.js"

type TestMermaidConfig = MermaidConfig & {
  externalHillchart?: Record<string, unknown>
  themeVariables: HillChartStyleOptions
}

type ConfigOverrides = Omit<Partial<TestMermaidConfig>, "themeVariables"> & {
  themeVariables?: Partial<HillChartStyleOptions>
}

vi.mock(import("./renderer/textMeasurement.js"), async (importOriginal) => {
  const actual = await importOriginal()

  return {
    ...actual,
    measureTextByClass: vi.fn<typeof actual.measureTextByClass>(actual.measureTextByClass),
  }
})

const testTheme: HillChartStyleOptions = {
  fontFamily: '"trebuchet ms", verdana, arial, sans-serif',
  fontSize: "16px",
  textColor: "#333",
  titleColor: "#333",
  background: "white",
  primaryColor: "#ECECFF",
  primaryTextColor: "#131300",
  primaryBorderColor: "hsl(240, 60%, 86.2745098039%)",
  secondaryColor: "#ffffde",
  secondaryTextColor: "#000021",
  secondaryBorderColor: "hsl(60, 60%, 83.5294117647%)",
  tertiaryColor: "hsl(80, 100%, 96.2745098039%)",
  tertiaryTextColor: "rgb(6.3333333334, 0, 19.0000000001)",
  tertiaryBorderColor: "hsl(80, 60%, 86.2745098039%)",
  mainBkg: "#ECECFF",
  lineColor: "#333333",
  border2: "#aaaa33",
  edgeLabelBackground: "rgba(232,232,232, 0.8)",
  labelBackground: "rgba(232,232,232, 0.8)",
  THEME_COLOR_LIMIT: 12,
  cScale0: "hsl(240, 100%, 76.2745098039%)",
  cScale1: "hsl(60, 100%, 73.5294117647%)",
  cScale2: "hsl(80, 100%, 76.2745098039%)",
  cScale3: "hsl(270, 100%, 76.2745098039%)",
  cScale4: "hsl(300, 100%, 76.2745098039%)",
  cScale5: "hsl(330, 100%, 76.2745098039%)",
  cScale6: "hsl(0, 100%, 76.2745098039%)",
  cScale7: "hsl(30, 100%, 76.2745098039%)",
  cScale8: "hsl(90, 100%, 76.2745098039%)",
  cScale9: "hsl(150, 100%, 76.2745098039%)",
  cScale10: "hsl(180, 100%, 76.2745098039%)",
  cScale11: "hsl(210, 100%, 76.2745098039%)",
}

const renderWithDb = async (db: HillChartDB, id = "hillchart"): Promise<SVGSVGElement> => {
  document.body.innerHTML = `<svg id="${id}"></svg>`
  // Mermaid's draw API accepts a Diagram with non-generic DiagramDB, so
  // tests cast our concrete HillChartDB.
  await renderer.draw("", id, "1.0", {
    db,
  } as unknown as Diagram)

  const svg = document.querySelector<SVGSVGElement>(`svg#${id}`)
  if (!svg) {
    throw new Error(`Expected rendered SVG root for #${id}`)
  }

  return svg
}

describe("renderer", () => {
  const getConfigMock = vi.fn<() => TestMermaidConfig>()
  const mockedMeasureTextByClass = vi.mocked(measureTextByClass)

  const mockTextMeasurements = ({
    title = { width: 120, height: 24 },
    phaseLabel = { width: 80, height: 12 },
    label = { width: 64, height: 12 },
  }) => {
    mockedMeasureTextByClass.mockImplementation((_svg, inputs) => {
      const titleTexts = inputs["hillchart__title"] ?? []
      const phaseLabelTexts = inputs["hillchart__phase-label"] ?? []
      const labelTexts = inputs["hillchart__label"] ?? []

      return {
        hillchart__title: Object.fromEntries(titleTexts.map((text) => [text, title])),
        "hillchart__phase-label": Object.fromEntries(
          phaseLabelTexts.map((text) => [text, phaseLabel]),
        ),
        hillchart__label: Object.fromEntries(labelTexts.map((text) => [text, label])),
      }
    })
  }

  const mockConfig = (configOverrides: ConfigOverrides = {}) => {
    getConfigMock.mockReset()
    getConfigMock.mockReturnValue({
      securityLevel: "loose",
      look: "classic",
      ...configOverrides,
      themeVariables: {
        ...testTheme,
        ...configOverrides.themeVariables,
      },
    })

    // Mermaid injects these module-level utilities at runtime for external
    // diagrams, so the unit test mirrors that wiring instead of vi.mock()-ing
    // the whole module.
    injectUtils(
      {
        trace: vi.fn<typeof console.log>(),
        debug: vi.fn<typeof console.log>(),
        info: vi.fn<typeof console.log>(),
        warn: vi.fn<typeof console.log>(),
        error: vi.fn<typeof console.log>(),
        fatal: vi.fn<typeof console.log>(),
      },
      vi.fn(),
      getConfigMock,
      vi.fn((value: string) => value),
      vi.fn(),
      vi.fn(() => ({})),
    )
  }

  beforeEach(() => {
    mockConfig()
    mockedMeasureTextByClass.mockClear()
  })

  describe("root svg contract", () => {
    it.each([
      {
        name: "defaults to responsive sizing",
        config: {},
        expected: {
          viewBox: "0 0 600 300",
          width: "100%",
          height: null,
          style: "max-width: 600px;",
        },
      },
      {
        name: "uses configured responsive sizing",
        config: { width: 800, height: 400 },
        expected: {
          viewBox: "0 0 800 400",
          width: "100%",
          height: null,
          style: "max-width: 800px;",
        },
      },
      {
        name: "uses fixed sizing when max width is disabled",
        config: {
          width: 640,
          height: 320,
          useMaxWidth: false,
        },
        expected: {
          viewBox: "0 0 640 320",
          width: "640",
          height: "320",
          style: null,
        },
      },
    ])("$name", async ({ config, expected }) => {
      mockConfig({ externalHillchart: config })

      const svg = await renderWithDb(createDb())

      expect({
        viewBox: svg.getAttribute("viewBox"),
        width: svg.getAttribute("width"),
        height: svg.getAttribute("height"),
        style: svg.getAttribute("style"),
      }).toEqual(expected)
    })
  })

  describe("chart chrome", () => {
    it("renders the classic hillchart chrome, including one scope group as a representative scope contract", async () => {
      const db = createDb()
      db.setDiagramTitle("Cycle 1")
      db.setUphillLabel("Discovery")
      db.setDownhillLabel("Delivery")
      db.addScope({
        name: "Search",
        phase: "uphill",
        position: 30,
        inactive: false,
      })

      const svg = await renderWithDb(db)
      const scopeGroup = svg.querySelector<SVGGElement>(".hillchart-scope")

      expect(svg.querySelector(".hillchart__title")?.textContent).toBe("Cycle 1")
      expect(
        Array.from(svg.querySelectorAll(".hillchart__phase-label")).map(
          (label) => label.textContent,
        ),
      ).toEqual(["Discovery", "Delivery"])
      expect(svg.querySelector(".hillchart__curve")?.tagName).toBe("path")
      expect(svg.querySelector(".hillchart__peak")?.tagName).toBe("line")
      expect(scopeGroup).not.toBeNull()
      expect(scopeGroup?.querySelector(".hillchart-scope__dot")?.tagName).toBe("circle")
      expect(scopeGroup?.querySelector(".hillchart-scope__leader-line")?.tagName).toBe("line")
      expect(scopeGroup?.querySelector(".hillchart__label")?.textContent).toBe("Search")
    })

    it.each([
      {
        name: "blank uphill label",
        uphill: "",
        downhill: "Delivery",
        expected: [{ text: "Delivery", x: "75%" }],
      },
      {
        name: "whitespace uphill label",
        uphill: "   ",
        downhill: "Delivery",
        expected: [{ text: "Delivery", x: "75%" }],
      },
      {
        name: "blank downhill label",
        uphill: "Discovery",
        downhill: "",
        expected: [{ text: "Discovery", x: "25%" }],
      },
      {
        name: "whitespace downhill label",
        uphill: "Discovery",
        downhill: "   ",
        expected: [{ text: "Discovery", x: "25%" }],
      },
      {
        name: "both labels blank or whitespace",
        uphill: "",
        downhill: "   ",
        expected: [],
      },
    ])("omits $name", async ({ uphill, downhill, expected }) => {
      const db = createDb()
      db.setUphillLabel(uphill)
      db.setDownhillLabel(downhill)

      const svg = await renderWithDb(db)

      expect(
        Array.from(svg.querySelectorAll(".hillchart__phase-label")).map((label) => ({
          text: label.textContent,
          x: label.getAttribute("x"),
        })),
      ).toEqual(expected)
    })

    it("shifts chart geometry downward when title measurement height increases", async () => {
      mockConfig({
        externalHillchart: { padding: 32 },
      })

      const db = createDb()
      db.setDiagramTitle("Foobar")
      db.addScope({
        name: "Scope A",
        phase: "uphill",
        position: 20,
        inactive: false,
      })

      mockTextMeasurements({
        title: { width: 120, height: 0 },
      })
      const compactTitleSvg = await renderWithDb(db, "compact-title")

      mockTextMeasurements({
        title: { width: 120, height: 24 },
      })
      const tallTitleSvg = await renderWithDb(db, "tall-title")

      const compactPeakY = Number(
        compactTitleSvg.querySelector<SVGLineElement>(".hillchart__peak")?.getAttribute("y1"),
      )
      const tallPeakY = Number(
        tallTitleSvg.querySelector<SVGLineElement>(".hillchart__peak")?.getAttribute("y1"),
      )

      expect(tallPeakY - compactPeakY).toBe(24)
    })
  })

  describe("scope rendering", () => {
    it("assigns renderer-owned scope classes and applies an explicit color override", async () => {
      const db = createDb()
      db.addScope({
        id: "backend",
        name: "Backend",
        phase: "uphill",
        position: 20,
        inactive: false,
        color: "#ff00aa",
      })
      db.addScope({
        name: "Ops",
        phase: "downhill",
        position: 65,
        inactive: true,
      })

      const svg = await renderWithDb(db)
      const scopeGroups = Array.from(svg.querySelectorAll<SVGGElement>(".hillchart-scope"))

      expect(scopeGroups).toHaveLength(2)
      expect(Array.from(scopeGroups[0]?.classList ?? [])).toEqual([
        "hillchart-scope",
        "hillchart-scope--color-0",
        "hillchart-scope--id-backend",
      ])
      expect(scopeGroups[0]?.getAttribute("style")).toContain(
        "--mermaid-hillchart-scope-color: #ff00aa;",
      )
      expect(Array.from(scopeGroups[1]?.classList ?? [])).toEqual([
        "hillchart-scope",
        "hillchart-scope--color-1",
        "hillchart-scope--inactive",
      ])
    })

    it("flips a work-item label when measured width would overflow the chart", async () => {
      mockTextMeasurements({
        label: { width: 120, height: 12 },
      })

      const db = createDb()
      db.addScope({
        name: "Scope A",
        phase: "downhill",
        position: 60,
        inactive: false,
      })

      const svg = await renderWithDb(db)
      const scopeGroup = svg.querySelector<SVGGElement>(".hillchart-scope")
      const label = scopeGroup?.querySelector<SVGTextElement>(".hillchart__label")
      const leaderLine = scopeGroup?.querySelector<SVGLineElement>(".hillchart-scope__leader-line")

      expect(Array.from(label?.classList ?? [])).toEqual([
        "hillchart__label",
        "hillchart__label--align-end",
      ])
      expect(Number(leaderLine?.getAttribute("x2"))).toBeLessThan(
        Number(leaderLine?.getAttribute("x1")),
      )
    })

    it("renders the hand-drawn branch contract", async () => {
      mockConfig({
        look: "handDrawn",
        handDrawnSeed: 1,
      })

      const db = createDb()
      db.addScope({
        name: "Uphill Scope",
        phase: "uphill",
        position: 20,
        inactive: false,
      })
      db.addScope({
        name: "Downhill Scope",
        phase: "downhill",
        position: 60,
        inactive: false,
      })

      const svg = await renderWithDb(db)

      expect(svg.querySelectorAll(".hillchart-scope")).toHaveLength(2)
      expect(
        Array.from(svg.querySelectorAll(".hillchart__label"))
          .map((label) => label.textContent)
          .sort(),
      ).toEqual(["Downhill Scope", "Uphill Scope"])
      expect(svg.querySelector(".hillchart__curve")).toBeNull()
      expect(svg.querySelector(".hillchart__peak")).toBeNull()
      expect(svg.querySelector(".hillchart-scope__dot")).toBeNull()
      expect(svg.querySelector(".hillchart-scope__leader-line")).toBeNull()
      expect(svg.outerHTML).toContain('stroke-dasharray="4 4"')
    })
  })
})
