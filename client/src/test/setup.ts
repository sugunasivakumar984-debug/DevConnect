import '@testing-library/jest-dom';
import { vi } from 'vitest';

/** Minimal browser API stubs so components can mount in jsdom. */

Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

Object.defineProperty(window, 'scrollTo', { value: vi.fn(), writable: true });
Element.prototype.scrollIntoView = vi.fn();

// Silence the noisy env warning from the Supabase client during tests.
vi.stubEnv('VITE_SUPABASE_URL', 'http://localhost:54321');
vi.stubEnv('VITE_SUPABASE_ANON_KEY', 'test-anon-key');
vi.stubEnv('VITE_API_URL', 'http://localhost:5000');
