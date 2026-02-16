/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: { 
      // 1. COLORI BRAND
      colors: {
        'brand-sky': '#00a8e8',
        'brand-stone': '#1a1a1a',
        'brand-glacier': '#f8fafc',
      },

      // 2. TIPOGRAFIA (Montserrat come principale, Inter per i dati)
      fontFamily: {
        sans: ['Montserrat', 'Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        inter: ['Inter', 'sans-serif'],
      },

      // 3. ANIMAZIONI (Per App.tsx e i Modali)
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        shake: {
          '0%, 100%': { transform: 'translateX(0)' },
          '25%': { transform: 'translateX(-5px)' },
          '75%': { transform: 'translateX(5px)' },
        }
      },
      animation: {
        fadeIn: 'fadeIn 0.5s ease-out forwards',
        shake: 'shake 0.3s ease-in-out',
      },

      // 4. SPACING PERSONALIZZATO
      spacing: {
        'xs': '0.5rem',
        'sm': '1rem',
        'md': '1.5rem',
        'lg': '2rem',
        'xl': '3rem',
        '2xl': '4rem',
      },

      // 5. BORDORADIUS (Per l'effetto Glass-Card della Tessera)
      borderRadius: {
        'xs': '0.375rem',
        'sm': '0.5rem',
        'md': '0.75rem',
        'lg': '1rem',
        'xl': '1.5rem',
        '2xl': '2rem',
        '3xl': '2.5rem',
        '4xl': '3.5rem', // Extra arrotondato per i bottoni hero
      },
    },
  },
  plugins: [],
};