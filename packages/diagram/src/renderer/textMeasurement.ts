import { svgEl } from "./svgBuilder.js"

/** The calculated width and height of a text element. */
interface TextDimensions {
  width: number
  height: number
}

/** A mapping of CSS class names to an array of text strings to measure. */
type TextsByClass<K extends string> = Record<K, string[]>

/** A mapping of text strings to their calculated dimensions. */
type TextDimensionsByText = Record<string, TextDimensions>

/** A mapping of CSS class names to the dimensions of their respective texts. */
type TextDimensionsByClass<K extends string> = Record<K, TextDimensionsByText>

/** Internal reference linking a text string to its rendered SVG element. */
interface TextElementRef {
  text: string
  el: SVGTextElement
}

/**
 * Measures the width and height of SVG text elements by temporarily rendering them.
 * This ensures accurate dimensions based on the actual font, CSS, and layout engine.
 * It groups inputs by CSS class and deduplicates strings to minimize DOM operations.
 */
export function measureTextByClass<K extends string>(
  svg: SVGSVGElement,
  inputs: TextsByClass<K>,
): TextDimensionsByClass<K> {
  const doc = svg.ownerDocument

  // `visibility: hidden` prevents rendering while allowing getBBox() to calculate dimensions
  const group = svgEl(doc, "g", {
    style: "visibility: hidden;",
  })

  const elementsRecord = {} as Record<K, TextElementRef[]>

  // Mermaid injects the diagram's <style> block before drawing, so applying CSS classes
  // directly yields accurate measurements via getBBox().
  for (const key in inputs) {
    // Deduplicate texts per class to minimize DOM node creation
    const uniqueTexts = [...new Set(inputs[key])]
    elementsRecord[key] = uniqueTexts.map((text) => {
      const el = svgEl(doc, "text", {
        class: key,
      })
      el.textContent = text
      group.appendChild(el)
      return { text, el }
    })
  }

  svg.appendChild(group)

  try {
    const outputs = {} as TextDimensionsByClass<K>

    for (const key in inputs) {
      const measurements: TextDimensionsByText = {}
      for (const { text, el } of elementsRecord[key]) {
        const bbox = el.getBBox()
        measurements[text] = {
          width: bbox.width,
          height: bbox.height,
        }
      }
      outputs[key] = measurements
    }

    return outputs
  } finally {
    svg.removeChild(group)
  }
}
