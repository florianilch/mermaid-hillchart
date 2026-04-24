<h1 align="center">mermaid-hillchart</h1>

<p align="center">
  Publish Shape Up progress where you build, explain, and review the work.
  <br />
  In agent-driven workflows, agents report bet progress and momentum in the same text that tracks the work.
</p>

<p align="center">
  <a href="./packages/diagram/README.md">Core Manual</a> · <a href="./CONTRIBUTING.md">Contributing</a>
</p>

---

![Hill Chart example](./packages/diagram/example.png)

```
hillchart
  title Notifications
  scope "Email design": uphill 50
  scope "Email delivery": downhill 65
  scope "In-app menu": uphill 20
```

## Quickstart

```bash
npm install mermaid mermaid-hillchart
# or
pnpm add mermaid mermaid-hillchart
# or
yarn add mermaid mermaid-hillchart
```

```typescript
import mermaid from "mermaid"
import hillChart from "mermaid-hillchart"

await mermaid.registerExternalDiagrams([hillChart])
mermaid.initialize({
  startOnLoad: true,
  externalHillchart: {
    padding: 32,
  },
})
```

## Compatibility

- **Mermaid:** `^10.0.0 || ^11.0.0`
- **Host platform:** Must support external Mermaid diagrams. Native Markdown renderers on GitHub and GitLab usually do not load external plugins.

## Contributing

Interested in improving the parser or modifying the rendering engine? See [CONTRIBUTING.md](./CONTRIBUTING.md).

## License

This plugin is built for Mermaid.js, which is licensed under the MIT License.
This project is an independent plugin and is not affiliated with, endorsed by, or owned by the Mermaid.js team.
The code for this plugin is licensed under the MIT License.
