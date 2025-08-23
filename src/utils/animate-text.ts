// Reference https://github.com/bytedance/deer-flow/blob/main/web/src/core/rehype/rehype-split-words-into-spans.ts
import type { Element, ElementContent, Root } from "hast";
import type { BuildVisitor } from "unist-util-visit";
import { visit } from "unist-util-visit";

export function animateText(locale: string = "zh") {
  return (tree: Root) => {
    if (tree) {
      visit(tree, "element", ((node: Element) => {
        if (
          ["p", "h1", "h2", "h3", "h4", "h5", "h6", "li", "strong"].includes(node.tagName) &&
          node.children
        ) {
          const newChildren: Array<ElementContent> = [];
          node.children.forEach((child) => {
            if (child.type === "text") {
              const segmenter = new Intl.Segmenter(locale, {
                granularity: "word",
              });
              const segments = segmenter.segment(child.value);
              const words = Array.from(segments)
                .map((segment) => segment.segment)
                .filter(Boolean);
              words.forEach((word: string) => {
                newChildren.push({
                  type: "element",
                  tagName: "span",
                  properties: {
                    className: "animate-fade-in",
                  },
                  children: [{ type: "text", value: word }],
                });
              });
            } else {
              newChildren.push(child);
            }
          });
          node.children = newChildren;
        }
      }) as BuildVisitor<Root, "element">);
    }
  };
}
