/** Cross-platform helpers shared by server and client. */

/** Turn a title into a URL-safe slug. */
export function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

/** Estimate reading time in minutes (200 wpm, rounded up, min 1). */
export function readingTimeMinutes(content: string): number {
  const words = content.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.ceil(words / 200));
}

/** Build a consistent pagination object. */
export function paginate<T>(
  items: T[],
  page: number,
  pageSize: number,
  total: number
): {
  items: T[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
  hasMore: boolean;
} {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  return {
    items,
    page,
    pageSize,
    total,
    totalPages,
    hasMore: page < totalPages,
  };
}

/** Wrap a value in the standard API success envelope. */
export function apiSuccess<T>(data: T, message = 'OK') {
  return { success: true as const, data, message };
}

/** Wrap an error in the standard API failure envelope. */
export function apiFailure(message: string, code = 'ERROR', details?: unknown) {
  return { success: false as const, data: null, message, error: { code, details } };
}

/** Truncate text to a max length, appending an ellipsis when cut. */
export function truncate(text: string, max = 160): string {
  if (text.length <= max) return text;
  return text.slice(0, max - 1).trimEnd() + '\u2026';
}

/** Deterministic SHA-256 hex digest of a string (Web Crypto API). */
export async function sha256Hex(input: string): Promise<string> {
  const data = new TextEncoder().encode(input);
  const digest = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

/** Format a byte count as a short human string. */
export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/** Relative-time formatter ("3h ago") without external deps. */
export function timeAgo(date: string | Date): string {
  const then = typeof date === 'string' ? new Date(date) : date;
  const seconds = Math.floor((Date.now() - then.getTime()) / 1000);
  if (seconds < 60) return 'just now';
  const units: [number, string][] = [
    [60, 'm'],
    [3600, 'h'],
    [86400, 'd'],
    [604800, 'w'],
    [2592000, 'mo'],
    [31536000, 'y'],
  ];
  let value = seconds;
  let suffix = 's';
  for (const [boundary, label] of units) {
    if (seconds >= boundary) {
      value = Math.floor(seconds / boundary);
      suffix = label;
    }
  }
  return `${value}${suffix} ago`;
}

/** Group an array by a key selector. */
export function groupBy<T, K extends string | number>(
  items: T[],
  keyFn: (item: T) => K
): Record<K, T[]> {
  return items.reduce((acc, item) => {
    const key = keyFn(item);
    (acc[key] ||= []).push(item);
    return acc;
  }, {} as Record<K, T[]>);
}

/** Remove duplicate values from an array. */
export function unique<T>(items: T[]): T[] {
  return Array.from(new Set(items));
}

/** Clamp a number between min and max. */
export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

/** Sleep for a number of milliseconds (used by retry backoff). */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
