import { defineConfig } from "tsdown"

export default defineConfig([
  {
    platform: "browser",
    target: "esnext",
    sourcemap: true,
    outputOptions: { comments: { jsdoc: false } },
    publint: true,
    attw: { profile: "esm-only" },
  },
])
