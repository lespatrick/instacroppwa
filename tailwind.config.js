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
        ios: {
          bg: '#000000',
          card: '#1c1c1e',
          cardGlass: 'rgba(28, 28, 30, 0.75)',
          secondary: '#2c2c2e',
          tertiary: '#3a3a3c',
          separator: 'rgba(84, 84, 88, 0.45)',
          blue: '#0a84ff',
          yellow: '#ffd60a',
          pink: '#ff375f',
          green: '#30d158',
          orange: '#ff9f0a',
          label: '#ffffff',
          secondaryLabel: '#8e8e93',
          tertiaryLabel: '#48484a',
        },
        studio: {
          950: '#000000',
          900: '#121214',
          850: '#1c1c1e',
          800: '#2c2c2e',
          700: '#3a3a3c',
          600: '#48484a',
          500: '#636366',
          400: '#8e8e93',
          300: '#aeaeb2',
          200: '#c7c7cc',
          100: '#ffffff',
        },
        ig: {
          pink: '#E1306C',
          purple: '#833AB4',
          orange: '#F56040',
          yellow: '#FCAF45',
          blue: '#3897F0',
        },
        accent: {
          DEFAULT: '#0a84ff',
          hover: '#0071e3',
          glow: 'rgba(10, 132, 255, 0.3)',
        }
      },
      fontFamily: {
        sans: ['-apple-system', 'BlinkMacSystemFont', 'SF Pro Display', 'SF Pro Text', 'Inter', 'system-ui', 'sans-serif'],
        mono: ['SF Mono', 'JetBrains Mono', 'Menlo', 'Monaco', 'monospace'],
      },
      boxShadow: {
        'ios-sheet': '0 -4px 30px rgba(0, 0, 0, 0.8)',
        'ios-card': '0 8px 32px rgba(0, 0, 0, 0.6)',
        'glow-ig': '0 0 25px -5px rgba(225, 48, 108, 0.35)',
      },
      animation: {
        'fade-in': 'fadeIn 0.18s ease-out',
        'ios-pop': 'iosPop 0.25s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        iosPop: {
          '0%': { opacity: '0', transform: 'scale(0.96)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        }
      }
    },
  },
  plugins: [],
}
