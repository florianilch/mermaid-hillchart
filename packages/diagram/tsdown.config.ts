import { defineConfig } from "tsdown"

const sharedConfig = {
  platform: "browser",
  target: "esnext",
  sourcemap: true,
  outputOptions: { comments: { jsdoc: false } },
  publint: true,
  attw: { profile: "esm-only" },
} as const

export default defineConfig([
  {
    ...sharedConfig,
    outDir: "dist",
  },
  {
    ...sharedConfig,
    outDir: "dist/bundle",
    dts: false,
    sourcemap: false,
    deps: {
      alwaysBundle: ["langium"],
      // bundle build intentionally bundles transitive node_modules deps; disable onlyBundle warnings
      onlyBundle: false,
    },
  },
])
