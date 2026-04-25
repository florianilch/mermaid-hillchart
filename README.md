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

## 🚀 30-Second Quickstart

If you are using Mermaid via a CDN or script tag, you can drop in the standalone bundle immediately:

```html
<body>
  <pre class="mermaid">
    hillchart
      title Notifications
      scope "Email design": uphill 50
      scope "Email delivery": downhill 65
      scope "In-app menu": uphill 20
  </pre>
  <script type="module">
    import mermaid from "https://cdn.jsdelivr.net/npm/mermaid@11/dist/mermaid.esm.min.mjs"
    import hillChart from "https://cdn.jsdelivr.net/npm/mermaid-hillchart@0.4.0/dist/bundle/index.js"

    await mermaid.registerExternalDiagrams([hillChart])
    mermaid.initialize({ startOnLoad: true })
  </script>
</body>
```

_(Using a bundler? See the [bundler setup guide](./packages/diagram/README.md#using-with-a-bundler).)_

## Compatibility

- **Mermaid:** `^10.0.0 || ^11.0.0`
- **Host platform:** Must support external Mermaid diagrams. Native Markdown renderers on GitHub and GitLab usually do not load external plugins.

## Contributing

Interested in improving the parser or modifying the rendering engine? See [CONTRIBUTING.md](./CONTRIBUTING.md).

## License

MIT licensed. This project is an independent Mermaid.js plugin and is not affiliated with, endorsed by, or owned by the Mermaid.js team.
