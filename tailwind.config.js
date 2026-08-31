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
        monke: {
          bg: '#0A0D14',
          card: '#121622',
          'card-hover': '#1A2030',
          border: 'rgba(255, 255, 255, 0.08)',
          'border-hover': 'rgba(247, 147, 26, 0.4)',
          gold: '#F7931A',
          orange: '#FF5C00',
          purple: '#A855F7',
          cyan: '#06B6D4',
          accent: '#FFB800',
        }
      },
      fontFamily: {
        mono: ['"JetBrains Mono"', '"Space Mono"', 'monospace', 'ui-monospace'],
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      boxShadow: {
        'glow-gold': '0 0 20px -3px rgba(247, 147, 26, 0.35)',
        'glow-orange': '0 0 20px -3px rgba(255, 92, 0, 0.35)',
        'glow-cyan': '0 0 20px -3px rgba(6, 182, 212, 0.35)',
        'glow-purple': '0 0 20px -3px rgba(168, 85, 247, 0.35)',
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'float': 'float 3s ease-in-out infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-6px)' },
        }
      }
    },
  },
  plugins: [],
}
