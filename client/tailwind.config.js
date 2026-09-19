import typography from '@tailwindcss/typography';

/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Legacy brand (kept for backward compat with any remaining usages)
        brand: {
          50: '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
          800: '#1e40af',
          900: '#1e3a8a',
          950: '#172554',
        },
        // Apple system colors
        apple: {
          blue:   '#007AFF',
          purple: '#AF52DE',
          green:  '#34C759',
          orange: '#FF9500',
          red:    '#FF3B30',
          pink:   '#FF2D55',
          teal:   '#5AC8FA',
          indigo: '#5856D6',
          yellow: '#FFCC00',
          gray: {
            1: '#8E8E93',
            2: '#AEAEB2',
            3: '#C7C7CC',
            4: '#D1D1D6',
            5: '#E5E5EA',
            6: '#F2F2F7',
          },
        },
        // Semantic label colors (Apple HIG)
        label: {
          primary:   '#1D1D1F',
          secondary: '#6E6E73',
          tertiary:  '#86868B',
          quaternary:'#ADADB8',
        },
        // Semantic fills
        fill: {
          primary:   'rgba(120,120,128,0.20)',
          secondary: 'rgba(120,120,128,0.16)',
          tertiary:  'rgba(118,118,128,0.12)',
          quaternary:'rgba(116,116,128,0.08)',
        },
        // Semantic backgrounds
        bg: {
          primary:   '#FFFFFF',
          secondary: '#F2F2F7',
          tertiary:  '#FFFFFF',
        },
        // Separator
        separator: 'rgba(60,60,67,0.12)',
      },

      fontFamily: {
        sans: [
          '-apple-system',
          'BlinkMacSystemFont',
          '"SF Pro Display"',
          '"SF Pro Text"',
          'Inter',
          '"Helvetica Neue"',
          'sans-serif',
        ],
        mono: [
          '"SF Mono"',
          '"JetBrains Mono"',
          'Menlo',
          'Monaco',
          '"Courier New"',
          'monospace',
        ],
      },

      borderRadius: {
        'card':    '24px',
        'card-lg': '32px',
        'modal':   '28px',
        'pill':    '9999px',
        'btn':     '14px',
        'input':   '14px',
      },

      boxShadow: {
        // Apple glass levels
        'glass':        '0 1px 2px rgba(0,0,0,0.03), 0 8px 24px rgba(0,0,0,0.06), inset 0 1px 0 rgba(255,255,255,0.9)',
        'glass-hover':  '0 16px 40px rgba(0,0,0,0.09), inset 0 1px 0 rgba(255,255,255,0.95)',
        'glass-subtle': '0 1px 2px rgba(0,0,0,0.04)',
        'modal':        '0 24px 64px rgba(0,0,0,0.12)',
        'level-1':      '0 1px 2px rgba(0,0,0,0.04)',
        'level-2':      '0 4px 12px rgba(0,0,0,0.05), 0 1px 2px rgba(0,0,0,0.03)',
        'level-3':      '0 12px 32px rgba(0,0,0,0.08)',
        'level-4':      '0 24px 64px rgba(0,0,0,0.12)',
        // Accent glows
        'accent-blue':   '0 4px 14px rgba(0,122,255,0.25)',
        'accent-blue-lg':'0 8px 24px rgba(0,122,255,0.35)',
        'accent-purple': '0 4px 14px rgba(175,82,222,0.25)',
        'focus-ring':    '0 0 0 4px rgba(0,122,255,0.15)',
      },

      backdropBlur: {
        'glass':        '30px',
        'glass-strong': '40px',
        'glass-nav':    '20px',
        'modal-bg':     '8px',
      },

      backgroundImage: {
        // Apple accent gradients
        'apple-blue':       'linear-gradient(135deg, #007AFF 0%, #5AC8FA 100%)',
        'apple-purple':     'linear-gradient(135deg, #AF52DE 0%, #FF2D55 100%)',
        'apple-orange':     'linear-gradient(135deg, #FF9500 0%, #FF2D55 100%)',
        'apple-green':      'linear-gradient(135deg, #34C759 0%, #5AC8FA 100%)',
        // Ambient washes
        'ambient-top':      'radial-gradient(ellipse at top, rgba(0,122,255,0.07), transparent 60%)',
        'ambient-bottom-r': 'radial-gradient(ellipse at bottom right, rgba(175,82,222,0.06), transparent 60%)',
        'ambient-bottom-l': 'radial-gradient(ellipse at bottom left, rgba(255,149,0,0.04), transparent 60%)',
        // Shimmer
        'shimmer':          'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.7) 50%, transparent 100%)',
      },

      transitionTimingFunction: {
        'apple':  'cubic-bezier(0.4, 0, 0.2, 1)',
        'bouncy': 'cubic-bezier(0.34, 1.56, 0.64, 1)',
        'smooth': 'cubic-bezier(0.25, 0.46, 0.45, 0.94)',
      },

      transitionDuration: {
        'micro':   '150ms',
        'fast':    '250ms',
        'default': '350ms',
        'slow':    '500ms',
        'page':    '600ms',
      },

      keyframes: {
        // Core entrance
        fadeRise: {
          from: { opacity: '0', transform: 'translateY(20px) scale(0.99)' },
          to:   { opacity: '1', transform: 'translateY(0)    scale(1)'    },
        },
        fadeRiseSm: {
          from: { opacity: '0', transform: 'translateY(8px)' },
          to:   { opacity: '1', transform: 'translateY(0)'   },
        },
        fadeIn: {
          from: { opacity: '0' },
          to:   { opacity: '1' },
        },
        // Shimmer for skeletons
        shimmer: {
          '0%':   { backgroundPosition: '-1000px 0' },
          '100%': { backgroundPosition:  '1000px 0' },
        },
        // Ambient float
        float: {
          '0%,100%': { transform: 'translateY(0)'   },
          '50%':     { transform: 'translateY(-8px)' },
        },
        // Breathing (status dots, online indicators)
        breathe: {
          '0%,100%': { transform: 'scale(1)'    },
          '50%':     { transform: 'scale(1.15)' },
        },
        // Background drift (ambient washes)
        drift: {
          '0%,100%': { transform: 'translate(0, 0) scale(1)'       },
          '50%':     { transform: 'translate(2%, 2%) scale(1.05)'   },
        },
        driftAlt: {
          '0%,100%': { transform: 'translate(0, 0) scale(1)'       },
          '50%':     { transform: 'translate(-2%, 1%) scale(1.04)'  },
        },
        // Like / heart bounce
        heartBounce: {
          '0%':   { transform: 'scale(1)'   },
          '40%':  { transform: 'scale(1.3)' },
          '70%':  { transform: 'scale(0.95)'},
          '100%': { transform: 'scale(1)'   },
        },
        // Bell swing on notification
        bellSwing: {
          '0%,100%': { transform: 'rotate(0deg)'   },
          '20%':     { transform: 'rotate(15deg)'  },
          '40%':     { transform: 'rotate(-15deg)' },
          '60%':     { transform: 'rotate(10deg)'  },
          '80%':     { transform: 'rotate(-5deg)'  },
        },
        // Typing dots
        dotBounce: {
          '0%,80%,100%': { transform: 'translateY(0)'    },
          '40%':          { transform: 'translateY(-6px)' },
        },
        // Pulse ring (for endorsements, etc.)
        pulseRing: {
          '0%':   { transform: 'scale(1)',   opacity: '0.6' },
          '100%': { transform: 'scale(1.6)', opacity: '0'   },
        },
        // Slide in from right (toasts)
        slideInRight: {
          from: { transform: 'translateX(120%)', opacity: '0' },
          to:   { transform: 'translateX(0)',    opacity: '1' },
        },
        slideOutRight: {
          from: { transform: 'translateX(0)',    opacity: '1' },
          to:   { transform: 'translateX(120%)', opacity: '0' },
        },
        // Modal entrance
        modalIn: {
          from: { opacity: '0', transform: 'scale(0.94) translateY(12px)' },
          to:   { opacity: '1', transform: 'scale(1)    translateY(0)'    },
        },
        // Progress bar shimmer
        progressShimmer: {
          '0%':   { backgroundPosition: '200% 0' },
          '100%': { backgroundPosition: '-200% 0'},
        },
        // Shake for validation errors
        shake: {
          '0%,100%': { transform: 'translateX(0)'   },
          '20%':     { transform: 'translateX(-6px)' },
          '40%':     { transform: 'translateX(6px)'  },
          '60%':     { transform: 'translateX(-4px)' },
          '80%':     { transform: 'translateX(4px)'  },
        },
        // Number count up (handled in JS but included here for reference)
        countUp: {
          from: { opacity: '0', transform: 'translateY(8px)'  },
          to:   { opacity: '1', transform: 'translateY(0)'    },
        },
        // Subtle CTA pulse (for empty states)
        subtlePulse: {
          '0%,100%': { boxShadow: '0 4px 14px rgba(0,122,255,0.25)' },
          '50%':     { boxShadow: '0 4px 22px rgba(0,122,255,0.45)' },
        },
      },

      animation: {
        'fade-rise':     'fadeRise 600ms cubic-bezier(0.25, 0.46, 0.45, 0.94) both',
        'fade-rise-sm':  'fadeRiseSm 350ms cubic-bezier(0.25, 0.46, 0.45, 0.94) both',
        'fade-in':       'fadeIn 300ms ease-out both',
        'shimmer':       'shimmer 1.8s infinite linear',
        'float':         'float 6s ease-in-out infinite',
        'breathe':       'breathe 2s ease-in-out infinite',
        'drift':         'drift 12s ease-in-out infinite',
        'drift-alt':     'driftAlt 14s ease-in-out infinite',
        'heart-bounce':  'heartBounce 400ms cubic-bezier(0.34, 1.56, 0.64, 1)',
        'bell-swing':    'bellSwing 600ms cubic-bezier(0.34, 1.56, 0.64, 1)',
        'dot-bounce-1':  'dotBounce 1.2s ease-in-out infinite 0ms',
        'dot-bounce-2':  'dotBounce 1.2s ease-in-out infinite 150ms',
        'dot-bounce-3':  'dotBounce 1.2s ease-in-out infinite 300ms',
        'pulse-ring':    'pulseRing 1s ease-out forwards',
        'slide-in-right':'slideInRight 400ms cubic-bezier(0.34, 1.56, 0.64, 1) both',
        'slide-out-right':'slideOutRight 300ms cubic-bezier(0.4, 0, 0.2, 1) both',
        'modal-in':      'modalIn 400ms cubic-bezier(0.34, 1.56, 0.64, 1) both',
        'shake':         'shake 400ms cubic-bezier(0.36, 0.07, 0.19, 0.97)',
        'subtle-pulse':  'subtlePulse 3s ease-in-out infinite',
        // Legacy
        'slide-up':      'fadeRise 300ms ease-out',
        'pulse-slow':    'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
    },
  },
  plugins: [typography],
};
