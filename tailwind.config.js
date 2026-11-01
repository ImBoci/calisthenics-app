/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        retro: {
          // Light Mode (Day)
          day: {
            bg: '#F9F6F0',
            surface: '#FFFFFF',
            card: '#FFFFFF',
            cardAlt: '#F4EFEA',
            border: '#E2D7CC',
            borderStrong: '#4A3728',
            text: '#4A3728',
            textMuted: '#7D6552',
            accent: '#7A9A7A',
            accentHover: '#688668',
            accentSoft: '#E9EFE8',
          },
          // Dark Mode (Night)
          night: {
            bg: '#1C1917',
            surface: '#2D2623',
            card: '#2D2623',
            cardAlt: '#231E1B',
            border: '#3F3530',
            borderStrong: '#61534A',
            text: '#E7E5E4',
            textMuted: '#A8A29E',
            accent: '#8DA382',
            accentHover: '#9EB493',
            accentSoft: '#293326',
          }
        }
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'Outfit', 'Inter', 'sans-serif'],
      },
      spacing: {
        'safe-top': 'env(safe-area-inset-top)',
        'safe-bottom': 'env(safe-area-inset-bottom)',
      }
    },
  },
  plugins: [],
};

