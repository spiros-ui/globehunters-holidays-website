/**
 * Web Reference Number System
 * Generates unique reference numbers for search sessions
 * Format: GH-XXXXXX (e.g., GH-A3B7K9)
 */

// Characters used in reference numbers (avoiding confusing ones like 0/O, 1/I/L)
const CHARS = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";

/**
 * Generate a unique web reference number
 */
export function generateReferenceNumber(): string {
  const timestamp = Date.now().toString(36).toUpperCase();
  let random = "";
  for (let i = 0; i < 4; i++) {
    random += CHARS.charAt(Math.floor(Math.random() * CHARS.length));
  }
  // Take last 2 chars of timestamp + 4 random = 6 char reference
  const code = (timestamp.slice(-2) + random).slice(0, 6);
  return `GH-${code}`;
}

/**
 * Validate a reference number format
 */
export function isValidReferenceNumber(ref: string): boolean {
  return /^GH-[A-Z0-9]{6}$/i.test(ref);
}

/**
 * Session data structure stored with each reference number
 */
export interface SessionData {
  referenceNumber: string;
  createdAt: string;
  searchType: "flights" | "hotels" | "packages";
  searchParams: Record<string, string>;
  selectedItemId?: string;
  selectedItemData?: Record<string, unknown>;
  url: string;
}
