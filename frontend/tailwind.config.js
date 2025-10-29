/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Nu Brand Colors
        nu: {
          blue: '#2952FF',  // Primary Blue - RGB: 41, 82, 255
          green: '#00D07E', // Primary Green - RGB: 0, 208, 126
        },
        // Dark Navy + Cyan - Crypto Native Theme
        navy: {
          50: '#f0f4f8',
          100: '#d9e2ec',
          500: '#3b5066',
          600: '#243a52',
          700: '#0f2027',
          800: '#001f54',  // Dark Navy
          900: '#001233',
        },
        cyan: {
          50: '#ecfeff',
          100: '#cffafe',
          200: '#a5f3fc',
          300: '#67e8f9',
          400: '#22d3ee',
          500: '#06b6d4',  // Primary Cyan
          600: '#0891b2',
          700: '#0e7490',
        },
        primary: {
          50: '#ecfeff',
          100: '#cffafe',
          500: '#06b6d4',
          600: '#0891b2',
          700: '#001f54',
        },
      },
    },
  },
  plugins: [],
};
