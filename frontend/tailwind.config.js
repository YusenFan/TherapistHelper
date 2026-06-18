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
        // Honey Sage palette
        'therapy-honey': '#E8A53C',
        'therapy-pollen': '#F6C667',
        'therapy-sage': '#8FB8A4',
        'therapy-mist': '#CFE2DE',
        'therapy-charcoal': '#2D2A26',
        'therapy-ink': '#5A5249',
        'therapy-cream': '#FAF6EE',
        'therapy-comb': '#F2E9D5',
        'therapy-berry': '#C0524A',

        // Back-compat aliases — existing classes keep working
        'therapy-coral': '#E8A53C', // → honey
        'therapy-navy': '#2D2A26',  // → charcoal
        'therapy-blue': '#CFE2DE',  // → mist
        'therapy-green': '#8FB8A4', // → sage
        'therapy-gray': '#FAF6EE',  // → cream
      },
      fontFamily: {
        'inter': ['Inter', 'sans-serif'],
      },
    },
  },
  plugins: [],
} 