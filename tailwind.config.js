/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        navy: {
          950: '#061B42',
          900: '#0B2D6B',
          800: '#123D8A',
          700: '#164AA8'
        },
        ebap: {
          cyan: '#FFFFFF',
          blue: '#0B2D6B',
          green: '#17B33A',
          red: '#ef4444',
          orange: '#f97316',
          yellow: '#eab308'
        }
      },
      boxShadow: {
        glass: '0 24px 70px rgba(0,0,0,.45), inset 0 1px rgba(255,255,255,.08)',
        card: '0 18px 46px rgba(0,0,0,.28), inset 0 1px rgba(255,255,255,.08)',
        glow: '0 0 0 1px rgba(103,232,249,.16), 0 18px 55px rgba(34,211,238,.12)'
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
