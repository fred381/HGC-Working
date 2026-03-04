/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx}",
  ],
  theme: {
    extend: {
      colors: {
        hgc: {
          50: '#f0f5ff',
          100: '#e0ebff',
          200: '#b8d4fe',
          300: '#7ab4fc',
          400: '#3a8ff8',
          500: '#1070e9',
          600: '#0456c8',
          700: '#0544a2',
          800: '#093a85',
          900: '#0d326e',
          950: '#091f49',
        }
      }
    },
  },
  plugins: [],
}
