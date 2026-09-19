import {
  AVAILABILITY_LABELS,
  MENTOR_MODE_LABELS,
  formatBytes,
  timeAgo,
} from '@devconnect/shared';

export { formatBytes, timeAgo };

/** Tailwind class combiner (no dependency). */
export function cn(...classes: (string | false | null | undefined)[]): string {
  return classes.filter(Boolean).join(' ');
}

export function availabilityLabel(value?: string | null): string {
  return AVAILABILITY_LABELS[value ?? ''] ?? 'Not specified';
}

export function mentorLabel(value?: string | null): string {
  return MENTOR_MODE_LABELS[value ?? ''] ?? 'Not specified';
}

/** Initials for avatar fallbacks. */
export function initials(name?: string | null, fallback = '?'): string {
  if (!name) return fallback;
  const parts = name.trim().split(/\s+/).slice(0, 2);
  return parts.map((p) => p[0]?.toUpperCase() ?? '').join('') || fallback;
}

/** Deterministic gradient for a user (used when no avatar image exists). */
export function avatarGradient(seed: string): string {
  const gradients = [
    'from-indigo-500 to-purple-500',
    'from-emerald-500 to-teal-500',
    'from-rose-500 to-orange-500',
    'from-sky-500 to-blue-600',
    'from-fuchsia-500 to-pink-500',
    'from-amber-500 to-red-500',
    'from-cyan-500 to-emerald-500',
  ];
  let hash = 0;
  for (let i = 0; i < seed.length; i += 1) hash = (hash * 31 + seed.charCodeAt(i)) % 997;
  return gradients[hash % gradients.length];
}

/** Format a date as "12 Mar 2026". */
export function formatDate(value?: string | Date | null): string {
  if (!value) return '—';
  const d = typeof value === 'string' ? new Date(value) : value;
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
}

/** mm:ss style duration from seconds. */
export function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

/** Copy text to the clipboard, returning success. */
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

/** Trigger a browser download for a Blob or URL. */
export function downloadFile(data: Blob | string, filename: string): void {
  const url = typeof data === 'string' ? data : URL.createObjectURL(data);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  if (typeof data !== 'string') URL.revokeObjectURL(url);
}

/** Validate an image file client-side before uploading (type + 2 MB cap). */
export function validateImage(file: File): { ok: boolean; error?: string } {
  const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
  if (!allowed.includes(file.type)) {
    return { ok: false, error: 'Only JPEG, PNG, WEBP and GIF images are allowed.' };
  }
  if (file.size > 2 * 1024 * 1024) {
    return { ok: false, error: `Image is ${formatBytes(file.size)} — the maximum is 2 MB.` };
  }
  return { ok: true };
}

/** Debounce a function. */
export function debounce<T extends (...args: never[]) => void>(fn: T, ms = 300): T {
  let timer: ReturnType<typeof setTimeout>;
  return ((...args: Parameters<T>) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), ms);
  }) as T;
}

/** Pluralize a noun based on count. */
export function plural(count: number, singular: string, pluralForm = `${singular}s`): string {
  return `${count} ${count === 1 ? singular : pluralForm}`;
}
