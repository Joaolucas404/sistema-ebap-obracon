/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        navy: {
          950: '#020b1b',
          900: '#03162d',
          800: '#062246',
          700: '#0a2a54'
        },
        ebap: {
          cyan: '#22d3ee',
          blue: '#2563eb',
          green: '#22c55e',
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
