import { marked } from "marked";

export function markdownToDoc(markdown: string): string {
  const html = marked.parse(markdown);
  // Word can open an HTML document saved with a ".doc" extension.
  // This function returns that minimal HTML wrapper.
  return `<!DOCTYPE html><html><head><meta charset="utf-8"></head><body>${html}</body></html>`;
}
