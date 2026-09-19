import { create } from 'zustand';
import { persist } from 'zustand/middleware';

/** UI-facing client state (theme, accent, font size, sidebar, etc.) */

export type Theme = 'light' | 'dark' | 'system';
export type AccentColor = 'violet' | 'blue' | 'emerald' | 'rose' | 'amber' | 'cyan';
export type FontSize = 'sm' | 'md' | 'lg';

export const ACCENT_COLORS: Record<AccentColor, { label: string; hue: string; hex: string }> = {
  violet:  { label: 'Violet',  hue: '263', hex: '#7c3aed' },
  blue:    { label: 'Blue',    hue: '221', hex: '#2563eb' },
  emerald: { label: 'Emerald', hue: '160', hex: '#059669' },
  rose:    { label: 'Rose',    hue: '346', hex: '#e11d48' },
  amber:   { label: 'Amber',   hue: '38',  hex: '#d97706' },
  cyan:    { label: 'Cyan',    hue: '194', hex: '#0891b2' },
};

export const FONT_SIZE_MAP: Record<FontSize, string> = {
  sm: '14px',
  md: '16px',
  lg: '18px',
};

interface UiState {
  theme: Theme;
  accentColor: AccentColor;
  fontSize: FontSize;
  compactMode: boolean;
  sidebarOpen: boolean;
  commandPaletteOpen: boolean;
  unreadNotifications: number;
  aiChatOpen: boolean;
  setTheme: (theme: Theme) => void;
  setAccentColor: (accent: AccentColor) => void;
  setFontSize: (size: FontSize) => void;
  setCompactMode: (compact: boolean) => void;
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
  toggleCommandPalette: () => void;
  setCommandPaletteOpen: (open: boolean) => void;
  setUnreadNotifications: (count: number) => void;
  incrementUnread: () => void;
  toggleAiChat: () => void;
}

export const useUiStore = create<UiState>()(
  persist(
    (set) => ({
      theme: 'dark',
      accentColor: 'violet',
      fontSize: 'md',
      compactMode: false,
      sidebarOpen: false,
      commandPaletteOpen: false,
      unreadNotifications: 0,
      aiChatOpen: false,

      setTheme: (theme) => set({ theme }),
      setAccentColor: (accentColor) => set({ accentColor }),
      setFontSize: (fontSize) => set({ fontSize }),
      setCompactMode: (compactMode) => set({ compactMode }),
      toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
      setSidebarOpen: (sidebarOpen) => set({ sidebarOpen }),
      toggleCommandPalette: () => set((s) => ({ commandPaletteOpen: !s.commandPaletteOpen })),
      setCommandPaletteOpen: (commandPaletteOpen) => set({ commandPaletteOpen }),
      setUnreadNotifications: (unreadNotifications) => set({ unreadNotifications }),
      incrementUnread: () => set((s) => ({ unreadNotifications: s.unreadNotifications + 1 })),
      toggleAiChat: () => set((s) => ({ aiChatOpen: !s.aiChatOpen })),
    }),
    {
      name: 'devconnect-ui',
      // Persist ALL appearance + sidebar state to localStorage
      partialize: (s) => ({
        theme: s.theme,
        accentColor: s.accentColor,
        fontSize: s.fontSize,
        compactMode: s.compactMode,
        sidebarOpen: s.sidebarOpen,
      }) as UiState,
    }
  )
);

/**
 * Apply theme + accent color + font size to <html>.
 * Call this every time any of those values change.
 */
export function applyTheme(
  theme: Theme,
  accent: AccentColor = 'violet',
  fontSize: FontSize = 'md',
  compactMode = false
): void {
  const root = document.documentElement;
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  const dark = theme === 'dark' || (theme === 'system' && prefersDark);

  // Theme
  root.classList.toggle('dark', dark);
  root.style.colorScheme = dark ? 'dark' : 'light';

  // Accent color CSS variable
  const accentMeta = ACCENT_COLORS[accent] ?? ACCENT_COLORS.violet;
  root.style.setProperty('--accent-hue', accentMeta.hue);
  root.style.setProperty('--accent-hex', accentMeta.hex);

  // Font size
  root.style.fontSize = FONT_SIZE_MAP[fontSize] ?? '16px';

  // Compact mode
  root.classList.toggle('compact', compactMode);
}
