/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        gold: {
          DEFAULT: '#D4AF37',
          light: '#F4D06F',
          dark: '#B8860B',
        },
        bg: {
          DEFAULT: '#000000',
          card: '#0A0A0A',
          cardLight: '#111111',
        },
        text: {
          primary: '#FFFFFF',
          secondary: '#D4AF37',
          muted: '#888888',
        },
        border: {
          gold: 'rgba(212, 175, 55, 0.3)',
        },
        glass: {
          gold: 'rgba(212, 175, 55, 0.08)',
        },
      },
      fontFamily: {
        display: ['Playfair Display', 'serif'],
        body: ['DM Sans', 'sans-serif'],
      },
      backgroundImage: {
        'gold-gradient': 'linear-gradient(135deg, #F4D06F 0%, #D4AF37 50%, #B8860B 100%)',
        'gold-gradient-subtle': 'linear-gradient(145deg, #0A0A0A 0%, #111111 100%)',
      },
      boxShadow: {
        'gold-glow': '0 0 30px rgba(212, 175, 55, 0.5)',
        'gold-sm': '0 0 10px rgba(212, 175, 55, 0.3)',
      },
    },
  },
  plugins: [],
}
