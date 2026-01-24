/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Outfit', 'sans-serif'],
      },
      colors: {
        neu: {
          base: '#EFEEEE', // Lighter, cleaner
          white: '#FFFFFF',
          text: '#2D3436', // Deep Charcoal
          muted: '#636e72',
          accent: '#6C5CE7', // Vivid Purple
          'accent-hover': '#5849BE',
          danger: '#FF7675',
        }
      },
      boxShadow: {
        'neu-flat': '12px 12px 24px #D1D9E6, -12px -12px 24px #FFFFFF',
        'neu-pressed': 'inset 8px 8px 16px #D1D9E6, inset -8px -8px 16px #FFFFFF',
        'neu-btn': '8px 8px 16px #D1D9E6, -8px -8px 16px #FFFFFF',
        'neu-float': '16px 16px 32px #D1D9E6, -16px -16px 32px #FFFFFF',
      },
      animation: {
        'float': 'float 6s ease-in-out infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        }
      }
    },
  },
  plugins: [],
}
