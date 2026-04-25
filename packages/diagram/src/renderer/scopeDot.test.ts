import { describe, expect, it } from "vitest"

import type { Scope } from "../db.js"
import { calculateDotLayout } from "./scopeDot.js"

const scope = {
  name: "Scope A",
  phase: "uphill",
  position: 40,
} satisfies Scope

const dotConfig = {
  radius: 8,
  strokeWidth: 2,
  leaderLength: 20,
  labelOffset: 8,
} as const

describe("scopeDot geometry", () => {
  describe("calculateDotLayout", () => {
    const effectiveRadius = dotConfig.radius + dotConfig.strokeWidth / 2

    it.each([
      {
        name: "label stays right when it fits",
        x: 100,
        y: 50,
        maxX: 200,
        labelWidth: 40,
        expected: {
          x: 100 + effectiveRadius + dotConfig.leaderLength + dotConfig.labelOffset,
          anchor: "start",
          leaderLine: {
            x1: 100 + effectiveRadius,
            x2: 100 + effectiveRadius + dotConfig.leaderLength,
          },
        } as const,
      },
      {
        name: "label flips left at the boundary",
        x: 100,
        y: 50,
        maxX: 177,
        labelWidth: 40,
        expected: {
          x: 100 - effectiveRadius - dotConfig.leaderLength - dotConfig.labelOffset,
          anchor: "end",
          leaderLine: {
            x1: 100 - effectiveRadius,
            x2: 100 - effectiveRadius - dotConfig.leaderLength,
          },
        } as const,
      },
      {
        name: "label flips left on overflow",
        x: 170,
        y: 50,
        maxX: 200,
        labelWidth: 40,
        expected: {
          x: 170 - effectiveRadius - dotConfig.leaderLength - dotConfig.labelOffset,
          anchor: "end",
          leaderLine: {
            x1: 170 - effectiveRadius,
            x2: 170 - effectiveRadius - dotConfig.leaderLength,
          },
        } as const,
      },
    ])("$name", ({ x, y, maxX, labelWidth, expected }) => {
      const layout = calculateDotLayout(scope, {
        x,
        y,
        maxX,
        labelWidth,
        config: dotConfig,
      })

      expect(layout).toEqual({
        cx: x,
        cy: y,
        radius: dotConfig.radius,
        label: {
          text: scope.name,
          x: expected.x,
          y,
          anchor: expected.anchor,
          leaderLine: {
            x1: expected.leaderLine.x1,
            y1: y,
            x2: expected.leaderLine.x2,
            y2: y,
          },
        },
        scope,
      })
    })
  })
})
