// Jest stub for @repo/utilities/dom-purify
// Replaces the real implementation to avoid ESM-only transitive deps (string-strip-html, lodash-es, etc.)
export const encodeHtmlSafe = (input: string): string => input;
export const sanitizeHtml = (input: string): string => input;
