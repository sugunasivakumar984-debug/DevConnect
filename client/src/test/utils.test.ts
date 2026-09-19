import { describe, expect, it } from 'vitest';
import {
  avatarGradient,
  availabilityLabel,
  formatDate,
  initials,
  mentorLabel,
  plural,
  validateImage,
} from '../lib/utils';

describe('client utils', () => {
  it('builds initials', () => {
    expect(initials('Ada Lovelace')).toBe('AL');
    expect(initials('')).toBe('?');
    expect(initials(null, 'D')).toBe('D');
  });

  it('returns a deterministic gradient for a seed', () => {
    expect(avatarGradient('ada')).toBe(avatarGradient('ada'));
    expect(avatarGradient('ada')).toMatch(/^from-/);
  });

  it('maps availability and mentor labels', () => {
    expect(availabilityLabel('open_to_work')).toBe('Open to work');
    expect(availabilityLabel(null)).toBe('Not specified');
    expect(mentorLabel('open_to_mentor')).toBe('Open to mentor');
  });

  it('formats dates safely', () => {
    expect(formatDate(null)).toBe('—');
    expect(formatDate('not-a-date')).toBe('—');
    expect(formatDate('2026-03-12T00:00:00.000Z')).toMatch(/2026/);
  });

  it('pluralizes nouns', () => {
    expect(plural(1, 'project')).toBe('1 project');
    expect(plural(3, 'project')).toBe('3 projects');
  });
});

describe('validateImage (2 MB cap)', () => {
  const makeFile = (type: string, size: number) =>
    new File([new Uint8Array(size)], 'file', { type });

  it('accepts a small PNG', () => {
    expect(validateImage(makeFile('image/png', 1024)).ok).toBe(true);
  });

  it('rejects files above 2 MB', () => {
    const result = validateImage(makeFile('image/png', 3 * 1024 * 1024));
    expect(result.ok).toBe(false);
    expect(result.error).toMatch(/2 MB/);
  });

  it('rejects non-image types', () => {
    expect(validateImage(makeFile('application/pdf', 100)).ok).toBe(false);
  });
});
