/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './index.html',
    './src/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        emerald: {
          600: '#1f8b4c',
          700: '#16623a',
          800: '#114a2b'
        },
        obsidian: '#0f1317',
        stone: {
          700: '#3d3d3d',
          800: '#2b2b2b',
          900: '#1e1e1e'
        }
      },
      fontFamily: {
        pixel: ['"Press Start 2P"', 'monospace']
      },
      boxShadow: {
        block: '0 0 0 2px #16623a, 4px 4px 0 0 #0b3b22'
      }
    },
  },
  plugins: [],
};

