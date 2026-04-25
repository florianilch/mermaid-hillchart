import type { ParseResult } from "langium"
import { describe, expect, it } from "vitest"

import type { HillChartDiagram, ScopeStatement } from "./generated/ast.js"
import { createHillChartServices } from "./index.js"

const parser = createHillChartServices().HillChart.parser.LangiumParser

const parse = (definition: string): ParseResult<HillChartDiagram> => {
  return parser.parse(definition)
}

const parseOk = (definition: string): HillChartDiagram => {
  const result = parse(definition)
  expect(result.lexerErrors).toHaveLength(0)
  expect(result.parserErrors).toHaveLength(0)
  return result.value
}

describe("DSL parser", () => {
  it("parses a complete document", () => {
    const ast = parseOk(`
      hillchart
        title Cycle 10 Progress
        accTitle: Cycle 10 accessibility title
        accDescr: Cycle 10 accessibility description

        uphill Research
        downhill Execution

        scope backend "Backend API": downhill 45 #3b82f6
        scope Migration: uphill 30 #ef4444 inactive
    `)

    expect(ast.title).toBe("Cycle 10 Progress")
    expect(ast.accTitle).toBe("Cycle 10 accessibility title")
    expect(ast.accDescr).toBe("Cycle 10 accessibility description")
    expect(ast.phaseUphill?.label).toBe("Research")
    expect(ast.phaseDownhill?.label).toBe("Execution")
    expect(ast.scopes).toHaveLength(2)
    expect(ast.scopes[0]).toMatchObject({
      id: "backend",
      name: "Backend API",
      phase: "downhill",
      position: 45,
      color: "#3b82f6",
      inactive: false,
    })
    expect(ast.scopes[1]).toMatchObject({
      name: "Migration",
      phase: "uphill",
      position: 30,
      color: "#ef4444",
      inactive: true,
    })
  })

  it("uses last write wins for title and phase labels", () => {
    const ast = parseOk(`
      hillchart
        title First title
        title Second title
        uphill "First uphill"
        uphill "Second uphill"
        downhill "First downhill"
        downhill "Second downhill"
        scope demo: uphill 20
    `)

    expect(ast.title).toBe("Second title")
    expect(ast.phaseUphill?.label).toBe("Second uphill")
    expect(ast.phaseDownhill?.label).toBe("Second downhill")
  })

  describe("scope syntax", () => {
    it.each<{
      name: string
      definition: string
      expected: Partial<ScopeStatement>
    }>([
      {
        name: "id + quoted name + colon",
        definition: `
          hillchart
            scope backend "Backend API": downhill 45
        `,
        expected: {
          id: "backend",
          name: "Backend API",
          phase: "downhill",
          position: 45,
          inactive: false,
        },
      },
      {
        name: "quoted name",
        definition: `
          hillchart
            scope "UI Design": uphill 80
        `,
        expected: {
          name: "UI Design",
          phase: "uphill",
          position: 80,
          inactive: false,
        },
      },
      {
        name: "no colon",
        definition: `
          hillchart
            scope Migration uphill 30
        `,
        expected: {
          name: "Migration",
          phase: "uphill",
          position: 30,
          inactive: false,
        },
      },
      {
        name: "color modifier",
        definition: `
          hillchart
            scope API: downhill 55 #3b82f6
        `,
        expected: {
          name: "API",
          phase: "downhill",
          position: 55,
          color: "#3b82f6",
          inactive: false,
        },
      },
      {
        name: "inactive modifier",
        definition: `
          hillchart
            scope Ops: uphill 25 inactive
        `,
        expected: {
          name: "Ops",
          phase: "uphill",
          position: 25,
          inactive: true,
        },
      },
      {
        name: "color + inactive modifiers",
        definition: `
          hillchart
            scope QA: downhill 75 #ef4444 inactive
        `,
        expected: {
          name: "QA",
          phase: "downhill",
          position: 75,
          color: "#ef4444",
          inactive: true,
        },
      },
    ])("parses $name", ({ definition, expected }) => {
      const ast = parseOk(definition)
      expect(ast.scopes).toHaveLength(1)
      expect(ast.scopes[0]).toMatchObject(expected)
    })
  })

  it("surfaces invalid input with diagnostics", () => {
    const result = parse(`
      title Broken
    `)

    expect(result.parserErrors.length + result.lexerErrors.length).toBeGreaterThan(0)
    expect(result.parserErrors[0]?.token.startLine).toBe(2)
    expect(result.parserErrors[0]?.token.startColumn).toBe(1)
  })

  it("accepts the entry keyword directly followed by a mermaid comment", () => {
    const ast = parseOk(`
      hillchart%% comment
        scope demo: uphill 20
    `)

    expect(ast.scopes).toHaveLength(1)
    expect(ast.scopes[0]).toMatchObject({
      name: "demo",
      phase: "uphill",
      position: 20,
      inactive: false,
    })
  })

  it("rejects non-boundary variants of the entry keyword", () => {
    const result = parse(`
      hillcharts
        scope demo: uphill 20
    `)

    expect(result.parserErrors.length + result.lexerErrors.length).toBeGreaterThan(0)
  })

  it("normalizes title and accessibility values", () => {
    const ast = parseOk(`
      hillchart
        title   Cycle   10   Progress
        accTitle:   Hillchart   accessibility   title
        accDescr {First   line
Second    line}
        scope demo: uphill 20
    `)

    expect(ast.title).toBe("Cycle 10 Progress")
    expect(ast.accTitle).toBe("Hillchart accessibility title")
    expect(ast.accDescr).toBe("First line\nSecond line")
  })
})
