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
        'therapy-blue': '#A8DADC',
        'therapy-green': '#B5DDC4',
        'therapy-gray': '#F4F4F9',
        'therapy-navy': '#2C3E50',
        'therapy-coral': '#E9967A',
      },
      fontFamily: {
        'inter': ['Inter', 'sans-serif'],
      },
    },
  },
  plugins: [],
} 