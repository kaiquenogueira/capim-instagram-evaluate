/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        capim: {
          50: '#EEECFB', // Lightest Primary
          100: '#DED8F5',
          200: '#C5BBEF',
          300: '#AB9DE8', // Light Primary
          400: '#826BB8',
          500: '#59399E', // Primary Base
          600: '#4A2F83',
          700: '#3A2666', // Dark Primary
          800: '#2E1D53',
          900: '#221540', // Darkest Primary
          950: '#110A20',
        },
        lime: {
          50: '#F5FCCB', // Lightest Secondary
          100: '#ECF9A0',
          200: '#E3F680',
          300: '#D9F363', // Light Secondary
          400: '#BFDF35',
          500: '#A6CD15', // Secondary Base
          600: '#8AB010',
          700: '#50660C', // Dark Secondary
          800: '#40520A',
          900: '#33400F', // Darkest Secondary
        },
        neutral: {
          50: '#F5F5FA', // Background
          100: '#E9E9F2', // Lightest
          200: '#D1D1DB',
          300: '#BBB8CC', // Light
          400: '#9A98AA',
          500: '#79778C', // Medium
          600: '#5E5B6E',
          700: '#444152', // Dark
          800: '#32303C',
          900: '#201F26', // Darkest
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
