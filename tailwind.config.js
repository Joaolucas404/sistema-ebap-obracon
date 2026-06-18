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
        glass: '0 24px 70px rgba(0,0,0,.45), inset 0 1px rgba(255,255,255,.08)'
      }
    }
  },
  plugins: []
};
