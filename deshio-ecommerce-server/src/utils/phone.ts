import crypto from 'crypto';

/**
 * Normalizes a Bangladesh mobile number to local 11-digit format: 01XXXXXXXXX.
 * Accepts:
 *  - 01712345678
 *  - +8801712345678
 *  - 8801712345678
 *  - 1712345678
 *  - Numbers with spaces or hyphens (e.g. 01712-345678)
 * Returns null if invalid.
 */
export function normalizeBdPhone(raw: string | undefined | null): string | null {
  if (!raw || typeof raw !== 'string') return null;
  const digits = raw.replace(/[\s\-().+]/g, '');

  if (/^01[3-9]\d{8}$/.test(digits)) {
    return digits;
  }
  if (/^8801[3-9]\d{8}$/.test(digits)) {
    return digits.slice(2);
  }
  if (/^1[3-9]\d{8}$/.test(digits)) {
    return `0${digits}`;
  }
  return null;
}

/**
 * Converts a Bangladesh mobile number to 13-digit BulkSMSBD format: 8801XXXXXXXXX.
 * Returns null if invalid.
 */
export function toBulkSmsPhone(raw: string | undefined | null): string | null {
  const local = normalizeBdPhone(raw);
  return local ? `88${local}` : null;
}

/**
 * Generates a cryptographically random 6-digit numeric password (e.g. "482915").
 */
export function generateSimplePassword(): string {
  return String(crypto.randomInt(100000, 1000000));
}
