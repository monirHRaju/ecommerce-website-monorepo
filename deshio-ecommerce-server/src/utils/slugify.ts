/**
 * Convert text to a URL-safe slug. Keeps unicode letters/numbers (e.g. Bangla)
 * and collapses everything else into single hyphens.
 */
export const slugify = (text: string): string =>
  text
    .toString()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[^\p{L}\p{N}]+/gu, '-')
    .replace(/^-+|-+$/g, '');

/** Escape user input before using it inside a RegExp. */
export const escapeRegex = (text: string): string =>
  text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
