/**
 * Decodes HTML entities in a string
 * Handles entities like &#x27; (apostrophe), &quot; (quote), &amp; (ampersand), etc.
 *
 * @param text - The text containing HTML entities
 * @returns The decoded text with actual characters
 *
 * @example
 * decodeHtmlEntities("J&#x27;aime") // Returns "J'aime"
 * decodeHtmlEntities("&lt;Hello&gt;") // Returns "<Hello>"
 */
export function decodeHtmlEntities(text: string | null | undefined): string {
  if (!text) return '';

  // Create a temporary textarea element to leverage browser's HTML decoding
  const textarea = document.createElement('textarea');
  textarea.innerHTML = text;
  let decoded = textarea.value;

  // Handle double-encoded entities by decoding again if the result changed
  // and still contains HTML entities
  while (decoded !== text && /&[#\w]+;/.test(decoded)) {
    text = decoded;
    textarea.innerHTML = decoded;
    decoded = textarea.value;
  }

  return decoded;
}

/**
 * Safely decodes HTML entities with fallback for server-side rendering
 * Use this if you need SSR compatibility
 */
export function decodeHtmlEntitiesSafe(text: string | null | undefined): string {
  if (!text) return '';

  // Check if we're in a browser environment
  if (typeof document !== 'undefined') {
    const textarea = document.createElement('textarea');
    textarea.innerHTML = text;
    return textarea.value;
  }

  // Fallback for SSR: manually decode common entities
  return text
    .replace(/&#x27;/g, "'")
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&#x2F;/g, '/')
    .replace(/&#47;/g, '/');
}
