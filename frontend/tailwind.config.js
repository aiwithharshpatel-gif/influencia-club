/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#7B2FFF',
          soft: '#A66FFF',
        },
        gold: {
          DEFAULT: '#F5A623',
          soft: '#FFD080',
        },
        bg: {
          DEFAULT: '#0A0014',
          card: '#120020',
        },
        muted: '#9B8CB0',
        border: 'rgba(123, 47, 255, 0.25)',
        glass: 'rgba(123, 47, 255, 0.08)',
      },
      fontFamily: {
        display: ['Playfair Display', 'serif'],
        body: ['DM Sans', 'sans-serif'],
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'purple-glow': 'linear-gradient(135deg, #7B2FFF 0%, #A66FFF 100%)',
      },
    },
  },
  plugins: [],
}
