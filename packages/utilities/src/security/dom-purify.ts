// import DOMPurify from 'dompurify';
import { stripHtml } from "string-strip-html";
import DOMPurify from "dompurify";

// Configure DOMPurify with safe defaults for our application
const configureDOMPurify = () => {
  // Allow common HTML tags that are typically safe for content display
  const ALLOWED_TAGS = [
    "p",
    "div",
    "span",
    "br",
    "strong",
    "b",
    "em",
    "i",
    "u",
    "a",
    "ul",
    "ol",
    "li",
    "h1",
    "h2",
    "h3",
    "h4",
    "h5",
    "h6",
    "blockquote",
    "code",
    "pre",
    "img",
    "svg",
    "path",
    "g",
    "circle",
    "rect",
    "line",
    "polygon",
    "polyline",
    "text",
  ];

  // Allow safe attributes
  const ALLOWED_ATTR = [
    "href",
    "target",
    "rel",
    "src",
    "alt",
    "title",
    "width",
    "height",
    "class",
    "id",
    "style",
    "data-*",
    "aria-*",
    "role",
    // SVG attributes
    "viewBox",
    "xmlns",
    "fill",
    "stroke",
    "stroke-width",
    "stroke-linecap",
    "stroke-linejoin",
    "d",
    "cx",
    "cy",
    "r",
    "x",
    "y",
    "x1",
    "y1",
    "x2",
    "y2",
    "points",
    "transform",
  ];

  return {
    ALLOWED_TAGS,
    ALLOWED_ATTR,
    KEEP_CONTENT: true,
    ALLOW_DATA_ATTR: true,
    ALLOW_ARIA_ATTR: true,
    // Sanitize URLs to prevent javascript: and data: URLs (except for safe data URLs)
    ALLOWED_URI_REGEXP:
      /^(?:(?:(?:f|ht)tps?|mailto|tel|callto|sms|cid|xmpp|data:image\/(?:png|jpe?g|gif|webp|svg\+xml))|[^a-z]|[a-z+.-]+(?:[^a-z+.-:]|$))/i,
  };
};

/**
 * Sanitizes HTML content with default safe configuration
 * @param dirty - The HTML string to sanitize
 * @returns Sanitized HTML string
 */
export const sanitizeHtml = (dirty: string): string => {
  if (typeof window === "undefined") {
    // Server-side rendering: return empty string or implement server-side DOMPurify
    return dirty
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
      .replace(/on\w+="[^"]*"/gi, "")
      .replace(/javascript:/gi, "");
  }

  const config = configureDOMPurify();
  return DOMPurify.sanitize(dirty, config) as string;
};

/**
 * Sanitizes HTML content with strict configuration (more restrictive)
 * Use this for user-generated content that should have minimal formatting
 * @param dirty - The HTML string to sanitize
 * @returns Sanitized HTML string with minimal allowed tags
 */
export const sanitizeHtmlStrict = (dirty: string): string => {
  if (typeof window === "undefined") {
    return dirty
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
      .replace(/on\w+="[^"]*"/gi, "")
      .replace(/javascript:/gi, "");
  }

  return DOMPurify.sanitize(dirty, {
    ALLOWED_TAGS: ["p", "br", "strong", "b", "em", "i", "a"],
    ALLOWED_ATTR: ["href", "target", "rel"],
    KEEP_CONTENT: true,
    ALLOWED_URI_REGEXP:
      /^(?:(?:(?:f|ht)tps?|mailto|tel)|[^a-z]|[a-z+.-]+(?:[^a-z+.-:]|$))/i,
  }) as string;
};

/**
 * Strips all HTML tags and returns plain text
 * @param dirty - The HTML string to convert to plain text
 * @returns Plain text without HTML tags
 */
export const stripHtmlToText = (dirty: string): string => {
  if (typeof window === "undefined") {
    // Simple regex fallback for server-side
    return dirty
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
      .replace(/on\w+="[^"]*"/gi, "")
      .replace(/javascript:/gi, "");
  }

  return DOMPurify.sanitize(dirty, {
    ALLOWED_TAGS: [],
    KEEP_CONTENT: true,
  }) as string;
};

export const stripHtmlToTextClean = (dirty: string): string => {
  return stripHtml(dirty).result;
};

/**
 * Counts visible characters in an HTML string consistently across environments.
 * Strips HTML tags without adding inter-element spaces, then decodes common HTML
 * entities produced by rich-text editors (TipTap/ProseMirror).
 * Use this for character-limit validation so frontend and backend count identically.
 */
export const countHtmlTextLength = (html: string): number => {
  return html
    .replace(/<[^>]*>/g, "")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&nbsp;/g, " ")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .length;
};

/**
 * Safely encodes HTML special characters without double-encoding
 * Only encodes raw < and > characters, preserves existing HTML entities
 * @param text - The text to encode
 * @returns HTML-safe string with special characters encoded
 */
export const encodeHtmlSafe = (text: string): string => {
  if (!text || typeof text !== "string") {
    return "";
  }

  // Only encode < and > characters
  // Don't encode & to avoid double-encoding existing entities like &amp; or &lt;
  return text.replace(/</g, "&lt;").replace(/>/g, "&gt;");
};

const domPurifyUtils = {
  sanitizeHtml,
  sanitizeHtmlStrict,
  stripHtmlToText,
  stripHtmlToTextClean,
  countHtmlTextLength,
  encodeHtmlSafe,
};

export default domPurifyUtils;
