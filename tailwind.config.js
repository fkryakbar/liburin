/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./public/**/*.{html,js}",
    "./src/**/*.{html,js,ts}"
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        holiday: '#ef4444',
        cuti: '#10b981',
        darkbg: '#0b0f19',
        cardbg: 'rgba(17, 24, 39, 0.75)'
      },
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'Inter', 'sans-serif'],
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      }
    },
  },
  plugins: [],
}
