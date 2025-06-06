import { markdownToDoc } from './markdown';
import { describe, it, expect } from 'vitest';

describe('markdownToDoc', () => {
  it('wraps parsed HTML in a doc structure', () => {
    const doc = markdownToDoc('# Hello');
    expect(doc.startsWith('<!DOCTYPE html>')).toBe(true);
    expect(doc).toContain('<h1 id="hello">Hello</h1>');
  });
});
