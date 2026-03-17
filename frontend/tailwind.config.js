/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        void: '#000000',
        surface: 'rgba(0, 0, 0, 0.65)',
        'surface-hover': 'rgba(255, 255, 255, 0.08)',
        'hud-text': '#FFFFFF',
        'hud-secondary': '#8B8F96',
        'hud-dim': '#4A4D53',
        ok: '#00D26A',
        caution: '#F5A623',
        danger: '#FF3B30',
        info: '#3A8BFF',
        'hud-border': 'rgba(255, 255, 255, 0.08)',
        'hud-border-hover': 'rgba(255, 255, 255, 0.25)',
        'btn-bg': 'rgba(255, 255, 255, 0.06)',
        'btn-hover': 'rgba(255, 255, 255, 0.12)',
        'btn-active': 'rgba(255, 255, 255, 0.20)',
      },
      fontFamily: {
        sans: ['Inter', 'SF Pro Display', '-apple-system', 'sans-serif'],
        mono: ['JetBrains Mono', 'SF Mono', 'monospace'],
      },
      fontSize: {
        'hud-xs': ['11px', { lineHeight: '1.4' }],
        'hud-sm': ['13px', { lineHeight: '1.4' }],
        'hud-base': ['15px', { lineHeight: '1.5' }],
        'hud-lg': ['18px', { lineHeight: '1.3' }],
        'hud-xl': ['24px', { lineHeight: '1.2' }],
        'hud-2xl': ['32px', { lineHeight: '1.1' }],
        'hud-3xl': ['48px', { lineHeight: '1.0' }],
      },
      borderRadius: {
        'hud-panel': '12px',
        'hud-btn': '8px',
      },
      keyframes: {
        'pulse-border': {
          '0%, 100%': { borderColor: 'rgba(255, 59, 48, 0.6)' },
          '50%': { borderColor: 'rgba(255, 59, 48, 1.0)' },
        },
        'pulse-glow': {
          '0%, 100%': { boxShadow: '0 0 8px rgba(255, 59, 48, 0.2)' },
          '50%': { boxShadow: '0 0 20px rgba(255, 59, 48, 0.5)' },
        },
        'spin-ring': {
          '0%': { strokeDashoffset: '251.2' },
          '100%': { strokeDashoffset: '0' },
        },
        'fade-in-up': {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'log-slide': {
          '0%': { opacity: '0', transform: 'translateY(12px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        'pulse-border': 'pulse-border 2s ease-in-out infinite',
        'pulse-glow': 'pulse-glow 1.5s ease-in-out infinite',
        'spin-ring': 'spin-ring 3s linear infinite',
        'fade-in-up': 'fade-in-up 400ms ease-out',
        'log-slide': 'log-slide 200ms ease-out',
      },
    },
  },
  plugins: [],
};
