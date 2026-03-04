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
          50:  '#F0F4FA',
          100: '#DEEAF7',
          200: '#BCCFE8',
          300: '#8AAED5',
          400: '#5A8BBF',
          500: '#3571B0',
          600: '#2563EB',
          700: '#1D4FD8',
          800: '#1E3A5F',
          900: '#152C49',
          950: '#0D1B2E',
        }
      }
    },
  },
  plugins: [],
}
