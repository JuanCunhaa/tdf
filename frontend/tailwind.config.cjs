/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './index.html',
    './src/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        neon: {
          500: '#8b5cf6',
          600: '#7c3aed',
          700: '#6d28d9',
          800: '#5b21b6'
        },
        obsidian: '#0b0b0f',
        graphite: '#15151b',
        slate: {
          700: '#2a2a33',
          800: '#1b1b22',
          900: '#121218'
        }
      },
      fontFamily: {
        pixel: ['"Press Start 2P"', 'monospace']
      },
      boxShadow: {
        glow: '0 0 10px rgba(124,58,237,0.6), 0 0 30px rgba(124,58,237,0.4)'
      }
    },
  },
  plugins: [],
};
