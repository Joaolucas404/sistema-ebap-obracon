/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'Segoe UI', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'sans-serif']
      },
      colors: {
        navy: {
          950: 'rgb(var(--sig-color-bg) / <alpha-value>)',
          900: 'rgb(var(--sig-color-surface) / <alpha-value>)',
          800: 'rgb(var(--sig-color-surface-hover) / <alpha-value>)',
          700: 'rgb(var(--sig-color-primary-dark) / <alpha-value>)'
        },
        ebap: {
          cyan: 'rgb(var(--sig-color-text) / <alpha-value>)',
          blue: 'rgb(var(--sig-color-primary) / <alpha-value>)',
          red: 'rgb(var(--sig-color-critical) / <alpha-value>)',
          orange: 'rgb(var(--sig-color-warning) / <alpha-value>)',
          yellow: 'rgb(var(--sig-color-warning) / <alpha-value>)',
          indigo: 'rgb(var(--sig-color-maintenance) / <alpha-value>)'
        }
      },
      boxShadow: {
        glass: 'var(--sig-shadow-glass)',
        card: 'var(--sig-shadow-card)',
        glow: 'var(--sig-shadow-glow)'
      },
      keyframes: {
        softIn: {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' }
        }
      },
      animation: {
        softIn: 'softIn .28s ease-out both'
      }
    }
  },
  plugins: []
};
