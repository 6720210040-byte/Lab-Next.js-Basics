// lib/sanitize.ts
import sanitizeHtml from 'sanitize-html';

export function cleanRichText(input: string) {
  return sanitizeHtml(input, {
    allowedTags: ['b', 'i', 'a'],
    allowedAttributes: { a: ['href'] },
  });
}
