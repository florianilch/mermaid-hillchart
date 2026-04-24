export const SVG_NS = "http://www.w3.org/2000/svg"

/**
 * Creates an SVG element with the given attributes.
 */
export function svgEl<T extends keyof SVGElementTagNameMap>(
  doc: Document,
  tag: T,
  attrs: Record<string, string | number>,
): SVGElementTagNameMap[T] {
  const el = doc.createElementNS(SVG_NS, tag)
  for (const [k, v] of Object.entries(attrs)) {
    el.setAttribute(k, String(v))
  }
  return el
}

/**
 * Fluent builder for SVG DOM construction.
 * Wraps native DOM operations to simplify element creation and nesting.
 */
export class SVGBuilder {
  /** The root element being built */
  readonly el: SVGElement

  constructor(el: SVGElement) {
    this.el = el
  }

  /**
   * Static factory that creates a new SVG element and wraps it in a builder.
   */
  static create(
    doc: Document,
    tag: keyof SVGElementTagNameMap,
    attrs?: Record<string, string | number>,
  ): SVGBuilder {
    const el = svgEl(doc, tag, attrs ?? {})
    return new SVGBuilder(el)
  }

  /**
   * Static factory that wraps an existing SVGSVGElement.
   */
  static from(svg: SVGSVGElement): SVGBuilder {
    return new SVGBuilder(svg)
  }

  /**
   * Appends a new child element to the current context.
   */
  add(
    tag: keyof SVGElementTagNameMap,
    attrs: Record<string, string | number> = {},
    text?: string,
  ): this {
    const child = svgEl(this.el.ownerDocument, tag, attrs)
    if (text !== undefined) {
      child.textContent = text
    }
    this.el.appendChild(child)
    return this
  }

  /**
   * Appends a pre-constructed SVG element.
   */
  append(factory: () => SVGElement): this {
    const el = factory()
    this.el.appendChild(el)
    return this
  }
}
