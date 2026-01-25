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
          base: '#F4F6F8', // Slightly cooler grey for premium feel
          white: '#FFFFFF',
          text: '#2D3436', 
          muted: '#636e72',
          accent: '#6C5CE7',
          'accent-hover': '#5849BE',
          danger: '#FF7675',
          // Dark Mode Palette
          dark: {
            base: '#1E1E2E',
            surface: '#252538',
            text: '#EAEAEA',
            muted: '#A0A0B0',
            border: 'rgba(255,255,255,0.08)'
          }
        }
      },
      boxShadow: {
        'neu-flat': '12px 12px 24px rgba(163,177,198,0.3), -12px -12px 24px rgba(255,255,255,0.8)',
        'neu-pressed': 'inset 6px 6px 12px rgba(163,177,198,0.4), inset -6px -6px 12px rgba(255,255,255,1)',
        'neu-btn': '6px 6px 12px rgba(163,177,198,0.2), -6px -6px 12px rgba(255,255,255,0.9)',
        'neu-float': '0 20px 40px -10px rgba(0,0,0,0.15)',
        'glass-edge': 'inset 0 1px 0 0 rgba(255,255,255,0.4)', // The "Lip" shine at the top
        'dark-flat': '12px 12px 24px #10101a, -12px -12px 24px #2c2c42',
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
