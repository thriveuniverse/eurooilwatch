/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Dark energy-sector palette
        oil: {
          50:  '#f0f7ff',
          100: '#dfeeff',
          200: '#b8dcff',
          300: '#79bfff',
          400: '#329dff',
          500: '#0077e6',
          600: '#005dba',
          700: '#004a96',
          800: '#003d7a',
          900: '#0a1f3b',
          950: '#06111f',
        },
        status: {
          safe: '#22c55e',
          watch: '#f59e0b',
          warning: '#f97316',
          critical: '#ef4444',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
    },
  },
  plugins: [],
};
