import { defineConfig } from "tsdown"

export default defineConfig({
  platform: "browser",
  target: "esnext",
  sourcemap: true,
  outputOptions: { comments: { jsdoc: false } },
})
