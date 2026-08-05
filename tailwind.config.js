/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        maroon: {
          50: '#FBF1F1',
          100: '#F5E0E0',
          200: '#E8BDBD',
          300: '#D69494',
          400: '#C26A6A',
          500: '#A84545',
          600: '#8B2E2E',
          700: '#7B1E1E',
          800: '#5E1414',
          900: '#4A0F0F',
          950: '#2E0808',
        },
        cream: {
          50: '#FFFEFB',
          100: '#FFF9F0',
          200: '#FFF2DC',
          300: '#FFE8C2',
          400: '#FFD99A',
          500: '#FFC571',
          600: '#F0A848',
          700: '#C8842F',
          800: '#9A6420',
          900: '#6E4815',
        },
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'system-ui', 'sans-serif'],
        hindi: ['"Noto Sans Devanagari"', 'system-ui', 'sans-serif'],
        display: ['"Playfair Display"', 'serif'],
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-out',
        'slide-up': 'slideUp 0.4s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [],
};
