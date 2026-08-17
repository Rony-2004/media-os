import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: ['class'],
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        surface: {
          DEFAULT: 'hsl(var(--surface))',
          raised: 'hsl(var(--surface-2))',
          sunken: 'hsl(var(--surface-3))',
        },
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        success: {
          DEFAULT: 'hsl(var(--success))',
          foreground: 'hsl(var(--success-foreground))',
        },
        warning: {
          DEFAULT: 'hsl(var(--warning))',
          foreground: 'hsl(var(--warning-foreground))',
        },
        info: {
          DEFAULT: 'hsl(var(--info))',
          foreground: 'hsl(var(--info-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
      },
      fontFamily: {
        sans: ['var(--font-sans)', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        mono: ['var(--font-mono)', 'ui-monospace', 'SFMono-Regular', 'monospace'],
      },
      // Crisp, industrial geometry — nothing rounder than 16px.
      borderRadius: {
        sm: '2px',
        DEFAULT: '4px',
        md: '4px',
        lg: '6px',
        xl: '8px',
        '2xl': '12px',
        '3xl': '16px',
        '4xl': '20px',
      },
      // Elevation is carried by borders, not shadows. These stay near-flat.
      boxShadow: {
        xs: '0 1px 1px hsl(var(--shadow-color) / 0.04)',
        soft: '0 1px 2px hsl(var(--shadow-color) / 0.05)',
        card: '0 1px 2px hsl(var(--shadow-color) / 0.04)',
        lift: '0 2px 8px -2px hsl(var(--shadow-color) / 0.10)',
        pop: '0 8px 32px -8px hsl(var(--shadow-color) / 0.28)',
        glow: '0 0 0 1px hsl(var(--primary) / 0.35)',
        'glow-lg': '0 0 0 1px hsl(var(--primary) / 0.45)',
        inset: 'inset 0 0 0 0 transparent',
      },
      backgroundImage: {
        // Kept as a named token, now a flat signal fill rather than a gradient.
        'brand-gradient': 'linear-gradient(hsl(var(--primary)), hsl(var(--primary)))',
        'fade-border':
          'linear-gradient(90deg, transparent, hsl(var(--border)) 15%, hsl(var(--border)) 85%, transparent)',
      },
      transitionTimingFunction: {
        spring: 'cubic-bezier(0.16, 1, 0.3, 1)',
        snap: 'cubic-bezier(0.32, 0.72, 0, 1)',
      },
      keyframes: {
        'fade-in': {
          from: { opacity: '0', transform: 'translateY(6px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        'fade-in-scale': {
          from: { opacity: '0', transform: 'scale(0.98)' },
          to: { opacity: '1', transform: 'scale(1)' },
        },
        'slide-down': {
          from: { opacity: '0', transform: 'translateY(-6px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-6px)' },
        },
        shimmer: {
          '100%': { transform: 'translateX(100%)' },
        },
        'pulse-ring': {
          '0%': { boxShadow: '0 0 0 0 hsl(var(--primary) / 0.55)' },
          '70%': { boxShadow: '0 0 0 5px hsl(var(--primary) / 0)' },
          '100%': { boxShadow: '0 0 0 0 hsl(var(--primary) / 0)' },
        },
        marquee: {
          from: { transform: 'translateX(0)' },
          to: { transform: 'translateX(-50%)' },
        },
        'bar-grow': {
          from: { transform: 'scaleY(0)' },
          to: { transform: 'scaleY(1)' },
        },
        'caret-blink': {
          '0%, 45%': { opacity: '1' },
          '50%, 95%': { opacity: '0' },
        },
      },
      animation: {
        'fade-in': 'fade-in 380ms cubic-bezier(0.16, 1, 0.3, 1) both',
        'fade-in-scale': 'fade-in-scale 220ms cubic-bezier(0.16, 1, 0.3, 1) both',
        'slide-down': 'slide-down 180ms cubic-bezier(0.16, 1, 0.3, 1) both',
        float: 'float 6s ease-in-out infinite',
        // Retired: the aurora blobs this drove are gone. Kept as a no-op so any
        // stale reference cannot reintroduce motion.
        drift: 'none',
        'gradient-pan': 'none',
        shimmer: 'shimmer 2s ease-in-out infinite',
        'pulse-ring': 'pulse-ring 2.4s cubic-bezier(0.16, 1, 0.3, 1) infinite',
        marquee: 'marquee 40s linear infinite',
        'bar-grow': 'bar-grow 600ms cubic-bezier(0.16, 1, 0.3, 1) both',
        'caret-blink': 'caret-blink 1.2s steps(1) infinite',
      },
    },
  },
  plugins: [],
};

export default config;
