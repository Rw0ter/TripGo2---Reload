/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{js,jsx,ts,tsx}', './components/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        primary: '#386641',
        // eco 绿色低碳调色板（与 constants/colors.ts 同源）
        eco: {
          dark: '#1B4332',
          mid: '#2D6A4F',
          DEFAULT: '#40916C',
          light: '#52B788',
          accent: '#95D5B2',
          pale: '#D8F3DC',
          cream: '#F7FAF5',
          earth: '#DDA15E',
        },
      },
    },
  },
  plugins: [],
};
