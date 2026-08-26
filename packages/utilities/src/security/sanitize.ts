import { sanitizeHtml } from "./dom-purify.js";

/**
 * Helper function to sanitize HTML content
 * Removes any potential XSS content and trims whitespace
 */
export const sanitizeHtmlContent = (text: string): string => {
  return sanitizeHtml(text).trim();
};

/**
 * XSS validation - check for HTML/script tags and other security threats
 * Returns error message if unsafe, null if safe
 */
export const validateXSS = (value: string): string | null => {
  // Block any angle bracket (< or >) to prevent HTML tags
  if (value.includes("<") || value.includes(">")) {
    return "*HTML or script tags are not allowed.";
  }

  // Check for common XSS patterns
  const xssPatterns = [
    /javascript:/i,
    /on\w+\s*=/i, // onload=, onclick=, etc.
    /script/i,
    /iframe/i,
    /object/i,
    /embed/i,
    /onerror/i,
    /onload/i,
  ];

  for (const pattern of xssPatterns) {
    if (pattern.test(value)) {
      return "*Potentially unsafe content detected.";
    }
  }

  return null;
};
