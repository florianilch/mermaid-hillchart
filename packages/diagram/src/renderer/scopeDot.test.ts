import { describe, expect, it } from "vitest"

import type { Scope } from "../db.js"
import type { DotLayout } from "./scopeDot.js"
import { applyCollisionOffset, calculateDotLayout } from "./scopeDot.js"

const scope = {
  name: "Scope A",
  phase: "uphill",
  position: 40,
  inactive: false,
} satisfies Scope

const dotConfig = {
  radius: 8,
  strokeWidth: 2,
  leaderLength: 20,
  labelOffset: 8,
} as const

const collisionConfig = {
  threshold: 20,
  staggerAmount: 15,
} as const

const createDotLayout = ({ cx, cy }: { cx: number; cy: number }): DotLayout => ({
  cx,
  cy,
  radius: dotConfig.radius,
  label: {
    text: scope.name,
    x: cx + dotConfig.radius,
    y: cy,
    anchor: "start",
    leaderLine: {
      x1: cx,
      y1: cy,
      x2: cx + dotConfig.leaderLength,
      y2: cy,
    },
  },
  scope,
})

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

  describe("applyCollisionOffset", () => {
    it("moves the later colliding dot upward and keeps label geometry in sync", () => {
      const first = createDotLayout({
        cx: 100,
        cy: 80,
      })
      const second = createDotLayout({
        cx: 110,
        cy: 85,
      })

      applyCollisionOffset([first, second], collisionConfig)

      expect(first.cy).toBe(80)
      expect(second.cy).toBe(70)
      expect(second.label.y).toBe(70)
      expect(second.label.leaderLine.y1).toBe(70)
      expect(second.label.leaderLine.y2).toBe(70)
    })

    it("does not move dots when they do not collide", () => {
      const first = createDotLayout({
        cx: 100,
        cy: 80,
      })
      const second = createDotLayout({
        cx: 130,
        cy: 85,
      })

      applyCollisionOffset([first, second], collisionConfig)

      expect(first.cy).toBe(80)
      expect(first.label.y).toBe(80)
      expect(second.cy).toBe(85)
      expect(second.label.y).toBe(85)
    })

    it("uses x-order instead of input order when deciding which dot to stagger", () => {
      const rightmost = createDotLayout({
        cx: 110,
        cy: 85,
      })
      const leftmost = createDotLayout({
        cx: 100,
        cy: 80,
      })

      applyCollisionOffset([rightmost, leftmost], collisionConfig)

      expect(leftmost.cy).toBe(80)
      expect(rightmost.cy).toBe(70)
    })
  })
})
