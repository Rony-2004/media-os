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
          soft: 'hsl(var(--primary) / 0.12)',
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
      borderRadius: {
        '4xl': 'calc(var(--radius) + 1.25rem)',
        '3xl': 'calc(var(--radius) + 0.75rem)',
        '2xl': 'calc(var(--radius) + 0.375rem)',
        xl: 'var(--radius)',
        lg: 'calc(var(--radius) - 0.25rem)',
        md: 'calc(var(--radius) - 0.4rem)',
        sm: 'calc(var(--radius) - 0.55rem)',
      },
      boxShadow: {
        xs: '0 1px 2px hsl(var(--shadow-color) / 0.06)',
        soft: '0 1px 2px hsl(var(--shadow-color) / 0.05), 0 4px 12px -2px hsl(var(--shadow-color) / 0.06)',
        card: '0 1px 1px hsl(var(--shadow-color) / 0.04), 0 8px 24px -6px hsl(var(--shadow-color) / 0.10)',
        lift: '0 2px 4px hsl(var(--shadow-color) / 0.05), 0 18px 40px -12px hsl(var(--shadow-color) / 0.22)',
        pop: '0 24px 60px -18px hsl(var(--shadow-color) / 0.35)',
        glow: '0 0 0 1px hsl(var(--primary) / 0.28), 0 8px 32px -8px hsl(var(--primary) / 0.45)',
        'glow-lg': '0 0 0 1px hsl(var(--primary) / 0.3), 0 20px 70px -16px hsl(var(--primary) / 0.6)',
        inset: 'inset 0 1px 0 0 hsl(var(--hairline))',
      },
      backgroundImage: {
        'brand-gradient':
          'linear-gradient(135deg, hsl(var(--primary)) 0%, hsl(var(--brand-2)) 50%, hsl(var(--accent)) 100%)',
        'brand-sheen':
          'linear-gradient(120deg, transparent 20%, hsl(0 0% 100% / 0.35) 50%, transparent 80%)',
        'fade-border':
          'linear-gradient(90deg, transparent, hsl(var(--border)) 20%, hsl(var(--border)) 80%, transparent)',
      },
      transitionTimingFunction: {
        spring: 'cubic-bezier(0.16, 1, 0.3, 1)',
        snap: 'cubic-bezier(0.32, 0.72, 0, 1)',
      },
      keyframes: {
        'fade-in': {
          from: { opacity: '0', transform: 'translateY(8px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        'fade-in-scale': {
          from: { opacity: '0', transform: 'scale(0.97)' },
          to: { opacity: '1', transform: 'scale(1)' },
        },
        'slide-down': {
          from: { opacity: '0', transform: 'translateY(-8px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        'slide-in-right': {
          from: { opacity: '0', transform: 'translateX(12px)' },
          to: { opacity: '1', transform: 'translateX(0)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        drift: {
          '0%, 100%': { transform: 'translate3d(0,0,0) scale(1)' },
          '33%': { transform: 'translate3d(4%, -6%, 0) scale(1.08)' },
          '66%': { transform: 'translate3d(-5%, 4%, 0) scale(0.95)' },
        },
        shimmer: {
          '100%': { transform: 'translateX(100%)' },
        },
        'gradient-pan': {
          '0%, 100%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
        },
        'pulse-ring': {
          '0%': { boxShadow: '0 0 0 0 hsl(var(--success) / 0.5)' },
          '70%': { boxShadow: '0 0 0 6px hsl(var(--success) / 0)' },
          '100%': { boxShadow: '0 0 0 0 hsl(var(--success) / 0)' },
        },
        marquee: {
          from: { transform: 'translateX(0)' },
          to: { transform: 'translateX(-50%)' },
        },
        'bar-grow': {
          from: { transform: 'scaleY(0)' },
          to: { transform: 'scaleY(1)' },
        },
      },
      animation: {
        'fade-in': 'fade-in 420ms cubic-bezier(0.16, 1, 0.3, 1) both',
        'fade-in-scale': 'fade-in-scale 260ms cubic-bezier(0.16, 1, 0.3, 1) both',
        'slide-down': 'slide-down 200ms cubic-bezier(0.16, 1, 0.3, 1) both',
        'slide-in-right': 'slide-in-right 320ms cubic-bezier(0.16, 1, 0.3, 1) both',
        float: 'float 7s ease-in-out infinite',
        drift: 'drift 22s ease-in-out infinite',
        shimmer: 'shimmer 2.2s ease-in-out infinite',
        'gradient-pan': 'gradient-pan 8s ease infinite',
        'pulse-ring': 'pulse-ring 2s cubic-bezier(0.16, 1, 0.3, 1) infinite',
        marquee: 'marquee 38s linear infinite',
        'bar-grow': 'bar-grow 700ms cubic-bezier(0.16, 1, 0.3, 1) both',
      },
    },
  },
  plugins: [],
};

export default config;
