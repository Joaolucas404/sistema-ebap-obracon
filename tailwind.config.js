/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        navy: {
          950: '#0A1633',
          900: '#10224D',
          800: '#16356B',
          700: '#1D4ED8'
        },
        ebap: {
          cyan: '#FFFFFF',
          blue: '#2563EB',
          red: '#ef4444',
          orange: '#f59e0b',
          yellow: '#f59e0b',
          indigo: '#6366F1'
        }
      },
      boxShadow: {
        glass: '0 22px 58px rgba(10,22,51,.34), inset 0 1px rgba(255,255,255,.08)',
        card: '0 16px 38px rgba(10,22,51,.24), inset 0 1px rgba(255,255,255,.08)',
        glow: '0 0 0 1px rgba(59,130,246,.18), 0 18px 45px rgba(37,99,235,.12)'
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
