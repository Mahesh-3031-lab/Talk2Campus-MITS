/**
 * security.ts
 * Client-side security utilities for Talk2Campus.
 */

// ─── Input Sanitization ───────────────────────────────────────────────────────

export function sanitizeText(input: string, maxLength = 2000): string {
  return input
    .slice(0, maxLength)
    .replace(/<[^>]*>/g, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+\s*=/gi, '')
    .replace(/[<>"'`]/g, c =>
      ({ '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;', '`': '&#96;' }[c] ?? c)
    )
    .trim();
}

export function sanitizeRollNumber(roll: string): string {
  return roll.replace(/[^a-zA-Z0-9]/g, '').slice(0, 20).toUpperCase();
}

export function isValidRollNumber(roll: string): boolean {
  return /^[0-9]{2}[A-Z][0-9]{2}[A-Z][0-9]{4}$/.test(roll.toUpperCase());
}

// ─── Rate Limiter ─────────────────────────────────────────────────────────────

interface RLEntry { count: number; windowStart: number }
const rlStore = new Map<string, RLEntry>();

export function checkRateLimit(
  key: string,
  limit: number,
  windowMs = 60_000
): boolean {
  const now = Date.now();
  const entry = rlStore.get(key);

  if (!entry || now - entry.windowStart > windowMs) {
    rlStore.set(key, { count: 1, windowStart: now });
    return true;
  }
  if (entry.count >= limit) return false;
  entry.count++;
  return true;
}

export function resetRateLimit(key: string): void {
  rlStore.delete(key);
}
