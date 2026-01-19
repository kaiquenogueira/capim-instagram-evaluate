/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        capim: {
          50: '#F5F3FF', // Very light purple for backgrounds
          100: '#EDE9FE',
          200: '#DDD6FE',
          300: '#C4B5FD',
          400: '#A78BFA',
          500: '#8B5CF6',
          600: '#32205F', // Valhalla (Primary Brand Color)
          700: '#2E1D56',
          800: '#251745',
          900: '#1C1133',
          950: '#100A1F',
        }
      },
      fontFamily: {
        sans: ['var(--font-geist-sans)', 'Inter', 'Montserrat', 'sans-serif'],
      },
      animation: {
        'spin-slow': 'spin 3s linear infinite',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      }
    },
  },
  plugins: [],
}
