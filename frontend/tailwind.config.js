/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#f0f7ff',
          100: '#e0effe',
          200: '#b9dffd',
          300: '#7cc4fb',
          400: '#36a5f6',
          500: '#0c8ae7',
          600: '#006dc5',
          700: '#0157a0',
          800: '#064a84',
          900: '#0b3f6e',
        },
      },
    },
  },
  plugins: [],
};
