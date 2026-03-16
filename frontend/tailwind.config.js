/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        vault: {
          black:    '#0A0A0A',
          card:     '#1A1A1A',
          border:   '#2A2A2A',
          gold:     '#D4AF37',
          'gold-dim': '#9B7D1A',
          white:    '#FFFFFF',
          gray:     '#A0A0A0',
          red:      '#E53935',
          green:    '#43A047',
          amber:    '#FB8C00',
        },
      },
      fontFamily: {
        sans: ['Inter', 'Roboto', 'system-ui', 'sans-serif'],
      },
      animation: {
        'pulse-gold': 'pulse-gold 2s ease-in-out infinite',
        'fade-in':    'fade-in 0.4s ease-out',
        'slide-up':   'slide-up 0.4s ease-out',
      },
      keyframes: {
        'pulse-gold': {
          '0%, 100%': { boxShadow: '0 0 0 0 rgba(212, 175, 55, 0)' },
          '50%':      { boxShadow: '0 0 0 8px rgba(212, 175, 55, 0.15)' },
        },
        'fade-in':  { from: { opacity: '0' }, to: { opacity: '1' } },
        'slide-up': { from: { opacity: '0', transform: 'translateY(16px)' }, to: { opacity: '1', transform: 'translateY(0)' } },
      },
    },
  },
  plugins: [],
}
