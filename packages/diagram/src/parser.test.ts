import type { HillChartDiagram } from "mermaid-hillchart-dsl"
import { afterEach, describe, expect, it, vi } from "vitest"

import { createDb } from "./db.js"
import { createParser, type AstParser } from "./parser.js"

// Filter fields for fixture.
// Langium AST nodes include internal `$...` metadata fields that tests do not use.
type LangiumFixture<T> =
  T extends Array<infer U>
    ? Array<LangiumFixture<U>>
    : T extends object
      ? {
          [K in keyof T as K extends `$${string}` ? never : K]: LangiumFixture<T[K]>
        }
      : T

type AstFixture = LangiumFixture<HillChartDiagram>

const parseWithAstFixture = async (astFixture: AstFixture, definition = "mocked definition") => {
  const astParser = vi.fn<AstParser>().mockResolvedValue(astFixture as HillChartDiagram)

  const db = createDb()
  await createParser(db, astParser).parse(definition)

  return { state: db.getState(), astParser }
}

const parseWithDsl = async (definition: string) => {
  const db = createDb()
  await createParser(db).parse(definition)

  return { state: db.getState() }
}

afterEach(() => {
  vi.clearAllMocks()
})

describe("parser to DB state", () => {
  describe("with injected AST parser", () => {
    it("forwards raw definition text to the DSL parser", async () => {
      const { astParser } = await parseWithAstFixture({ scopes: [] }, "definition from caller")

      expect(astParser).toHaveBeenCalledTimes(1)
      expect(astParser).toHaveBeenCalledWith("definition from caller")
    })

    it("maps parsed AST fields into diagram DB state", async () => {
      const ast: AstFixture = {
        title: "Cycle 10 Progress",
        accTitle: "Cycle 10 accessibility title",
        accDescr: "Cycle 10 accessibility description",
        phaseUphill: {
          phase: "uphill",
          label: "Research",
        },
        phaseDownhill: {
          phase: "downhill",
          label: "Execution",
        },
        scopes: [
          {
            id: "backend",
            name: "Backend API",
            phase: "up",
            position: 45,
            color: "#3b82f6",
            inactive: true,
          },
          {
            name: "Migration",
            phase: "downhill",
            position: 30,
            inactive: false,
          },
        ],
      }

      const { state } = await parseWithAstFixture(ast)
      expect(state).toEqual({
        title: "Cycle 10 Progress",
        accTitle: "Cycle 10 accessibility title",
        accDescr: "Cycle 10 accessibility description",
        uphillLabel: "Research",
        downhillLabel: "Execution",
        scopes: [
          {
            id: "backend",
            name: "Backend API",
            phase: "uphill",
            position: 45,
            color: "#3b82f6",
            inactive: true,
          },
          {
            name: "Migration",
            phase: "downhill",
            position: 30,
            inactive: false,
          },
        ],
      })
    })

    it("falls back to DB defaults when AST omits optional fields", async () => {
      const ast: AstFixture = {
        scopes: [
          {
            name: "demo",
            phase: "uphill",
            position: 20,
            inactive: false,
          },
        ],
      }

      const { state } = await parseWithAstFixture(ast)

      expect(state).toEqual({
        title: "",
        accTitle: "",
        accDescr: "",
        uphillLabel: "Figuring things out",
        downhillLabel: "Making it happen",
        scopes: [
          {
            name: "demo",
            phase: "uphill",
            position: 20,
            inactive: false,
          },
        ],
      })
    })

    it.each([
      {
        phase: "up",
        expected: "uphill",
      },
      {
        phase: "uphill",
        expected: "uphill",
      },
      {
        phase: "down",
        expected: "downhill",
      },
      {
        phase: "downhill",
        expected: "downhill",
      },
    ] as const)("normalizes $phase to $expected for DB state", async ({ phase, expected }) => {
      const ast: AstFixture = {
        scopes: [
          {
            name: "demo",
            phase,
            position: 20,
            inactive: false,
          },
        ],
      }

      const { state } = await parseWithAstFixture(ast)

      expect(state.scopes).toHaveLength(1)
      expect(state.scopes[0]?.phase).toBe(expected)
    })
  })

  describe("with real DSL parser", () => {
    it("parses a minimal valid definition", async () => {
      const { state } = await parseWithDsl(`
        hillchart
          title Cycle 10 Progress
          scope demo: down 70
      `)

      expect(state).toEqual({
        title: "Cycle 10 Progress",
        accTitle: "",
        accDescr: "",
        uphillLabel: "Figuring things out",
        downhillLabel: "Making it happen",
        scopes: [
          {
            name: "demo",
            phase: "downhill",
            position: 70,
            inactive: false,
          },
        ],
      })
    })

    it("surfaces invalid input as a parser error", async () => {
      const parsePromise = parseWithDsl(`
        title Broken
      `)

      await expect(parsePromise).rejects.toMatchObject({
        name: "HillChartParseError",
      })
      await expect(parsePromise).rejects.toThrow("Parsing failed:")
      await expect(parsePromise).rejects.toThrow(/line 2, column 1/i)
    })
  })
})
